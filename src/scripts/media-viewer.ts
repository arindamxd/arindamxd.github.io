/**
 * Fullscreen view-only overlay for images, PDFs, and plain text.
 *
 * Markup contract:
 * - Trigger: [data-media-viewer][data-src] (optional data-title, data-kind, data-media-id)
 * - A wrapped <img> is enough for project screenshots (currentSrc is reused)
 * - Overlay: created in JS and mounted on document.body (survives ClientRouter)
 * - Deep link: `?media=<id>` or `#<id>` (id = file basename, e.g. ace-award)
 *
 * This hides download/print chrome and blocks save shortcuts while open.
 * It is not DRM — the file is still fetched by the browser.
 */
import "./pdf-polyfill";
import { animate } from "motion";
import { bootOnce } from "./boot-once";
import { revealCredentialsContaining } from "./credentials-accordion";
import { clearMotionStyles, easeOut, springSoft } from "./motion-tokens";

const ROOT_ID = "media-viewer-root";
const IMAGE_EXT = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "avif",
    "svg",
    "bmp",
    "ico",
]);
const TEXT_EXT = new Set(["txt", "md", "csv", "json", "xml", "html", "css"]);

type MediaKind = "image" | "pdf" | "text" | "unsupported";

let lastTrigger: HTMLElement | null = null;
let closing = false;
let open = false;
let opening = false;
let loadToken = 0;
let abort: AbortController | null = null;
let skeletonTimer = 0;

function reducedMotion(): boolean {
    return Boolean(
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
}

function lockScroll(lock: boolean): void {
    document.body.classList.toggle("media-viewer-open", lock);
    const lenis = window.__lenis as { stop?: () => void; start?: () => void } | undefined;
    if (lock) lenis?.stop?.();
    else lenis?.start?.();
}

function ensureRoot(): HTMLElement {
    let root = document.getElementById(ROOT_ID);
    if (root && !root.querySelector("[data-media-viewer-status-label]")) {
        root.remove();
        root = null;
    }
    if (root) return root;

    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "media-viewer";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Document preview");
    root.hidden = true;
    root.innerHTML = `
        <div class="media-viewer-scrim" data-media-viewer-scrim></div>
        <div class="media-viewer-stage" data-lenis-prevent data-media-viewer-stage>
            <div class="media-viewer-skeleton" data-media-viewer-skeleton hidden aria-hidden="true"></div>
            <div class="media-viewer-frame" data-media-viewer-frame></div>
            <div class="media-viewer-shield" data-media-viewer-shield aria-hidden="true"></div>
        </div>
        <div class="media-viewer-status" data-media-viewer-status hidden role="status" aria-live="polite">
            <span class="media-viewer-status-dot" aria-hidden="true"></span>
            <span class="media-viewer-status-copy">
                <span class="media-viewer-status-label" data-media-viewer-status-label></span>
                <span class="media-viewer-status-title" data-media-viewer-status-title hidden></span>
            </span>
        </div>
        <button type="button" class="media-viewer-close" data-media-viewer-close aria-label="Close preview">
            <span class="media-viewer-close-icon" aria-hidden="true"></span>
        </button>
    `;
    document.body.appendChild(root);
    return root;
}

function rootEl(): HTMLElement | null {
    return document.getElementById(ROOT_ID);
}

function queryEl(root: HTMLElement, selector: string): HTMLElement | null {
    const el = root.querySelector(selector);
    return el instanceof HTMLElement ? el : null;
}

function extensionOf(src: string): string {
    try {
        const path = new URL(src, window.location.origin).pathname;
        const match = path.match(/\.([a-z0-9]+)$/i);
        return (match?.[1] || "").toLowerCase();
    } catch {
        return "";
    }
}

function kindOf(src: string, explicit: string): MediaKind {
    if (explicit === "image" || explicit === "pdf" || explicit === "text") {
        return explicit;
    }
    const ext = extensionOf(src);
    if (ext === "pdf") return "pdf";
    if (IMAGE_EXT.has(ext)) return "image";
    if (TEXT_EXT.has(ext)) return "text";
    return "unsupported";
}

function resolveSrc(raw: string): URL | null {
    try {
        const url = new URL(raw, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return url;
    } catch {
        return null;
    }
}

function stageContentBox(root: HTMLElement): { width: number; height: number } {
    const stage = queryEl(root, "[data-media-viewer-stage]");
    if (!stage) return { width: 720, height: 640 };
    const style = getComputedStyle(stage);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    return {
        width: Math.max(240, Math.min(1100, stage.clientWidth - padX)),
        height: Math.max(240, stage.clientHeight - padY),
    };
}

function clearSkeletonTimer(): void {
    if (!skeletonTimer) return;
    window.clearTimeout(skeletonTimer);
    skeletonTimer = 0;
}

function setBusy(
    root: HTMLElement,
    state: "loading" | "error" | "ready",
    detail = "",
): void {
    const status = queryEl(root, "[data-media-viewer-status]");
    const label = queryEl(root, "[data-media-viewer-status-label]");
    const caption = queryEl(root, "[data-media-viewer-status-title]");
    const skeleton = queryEl(root, "[data-media-viewer-skeleton]");
    clearSkeletonTimer();

    if (state === "ready") {
        root.removeAttribute("aria-busy");
        if (status) {
            status.hidden = true;
            status.classList.remove("is-error");
        }
        if (skeleton) skeleton.hidden = true;
        return;
    }

    if (state === "error") {
        root.removeAttribute("aria-busy");
        if (skeleton) skeleton.hidden = true;
        if (status) {
            status.hidden = false;
            status.classList.add("is-error");
        }
        if (label) label.textContent = detail || "Couldn’t open this file.";
        if (caption) {
            caption.hidden = true;
            caption.textContent = "";
        }
        return;
    }

    root.setAttribute("aria-busy", "true");
    if (status) {
        status.hidden = false;
        status.classList.remove("is-error");
    }
    if (label) label.textContent = "Opening";
    if (caption) {
        caption.textContent = detail;
        caption.hidden = !detail;
    }
    if (skeleton) {
        skeleton.hidden = true;
        skeletonTimer = window.setTimeout(() => {
            skeletonTimer = 0;
            if (open && !closing) skeleton.hidden = false;
        }, 160);
    }
}

function clearFrame(root: HTMLElement): void {
    const frame = queryEl(root, "[data-media-viewer-frame]");
    if (frame) frame.replaceChildren();
}

function cancelLoad(): void {
    loadToken += 1;
    abort?.abort();
    abort = null;
    clearSkeletonTimer();
}

function openOverlay(root: HTMLElement, title: string): void {
    const scrim = queryEl(root, "[data-media-viewer-scrim]");
    const stage = queryEl(root, "[data-media-viewer-stage]");
    if (scrim) clearMotionStyles(scrim);
    if (stage) clearMotionStyles(stage);

    root.setAttribute("aria-label", title ? `${title} preview` : "Document preview");
    root.hidden = false;
    root.classList.add("is-open");
    open = true;
    lockScroll(true);

    const closeBtn = queryEl(root, "[data-media-viewer-close]");
    closeBtn?.focus();

    if (reducedMotion()) {
        if (scrim) clearMotionStyles(scrim);
        if (stage) clearMotionStyles(stage);
        return;
    }

    if (scrim) {
        void animate(scrim, { opacity: [0, 1] }, { duration: 0.22, ease: easeOut }).then(() => {
            clearMotionStyles(scrim);
        });
    }
    if (stage) {
        void animate(
            stage,
            { opacity: [0, 1], y: [28, 0], scale: [0.96, 1] },
            springSoft,
        ).then(() => {
            clearMotionStyles(stage);
        });
    }
}

function triggerSrc(trigger: HTMLElement): string {
    const data = trigger.dataset.src?.trim() || "";
    if (data) return data;
    const img = trigger.querySelector("img");
    if (img instanceof HTMLImageElement) {
        return img.getAttribute("src") || img.currentSrc || img.src || "";
    }
    return "";
}

function imageHref(trigger: HTMLElement, fallback: URL): string {
    const img = trigger.querySelector("img");
    if (img instanceof HTMLImageElement) {
        return img.currentSrc || img.src || fallback.href;
    }
    return fallback.href;
}

async function fillFrame(
    root: HTMLElement,
    src: URL,
    kind: MediaKind,
    title: string,
    token: number,
    signal: AbortSignal,
    trigger: HTMLElement,
): Promise<boolean> {
    const frame = queryEl(root, "[data-media-viewer-frame]");
    if (!frame) return false;

    if (kind === "unsupported") return false;

    if (kind === "image") {
        const img = new Image();
        img.className = "media-viewer-img";
        img.alt = title;
        img.draggable = false;
        img.decoding = "async";
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("image"));
            img.src = imageHref(trigger, src);
        });
        if (token !== loadToken) return false;
        frame.appendChild(img);
        return true;
    }

    const data = await readSameOriginBytes(src.href, signal);
    if (token !== loadToken) return false;

    if (kind === "text") {
        const text = new TextDecoder().decode(data);
        const pre = document.createElement("pre");
        pre.className = "media-viewer-text";
        pre.textContent = text;
        frame.appendChild(pre);
        return true;
    }

    const { renderPdfPages } = await loadPdfRenderer();
    if (token !== loadToken) return false;
    await renderPdfPages(frame, data, signal, stageContentBox(root));
    return token === loadToken;
}

function isAbort(error: unknown): boolean {
    if (error instanceof DOMException && error.name === "AbortError") return true;
    return error instanceof Error && error.name === "AbortError";
}

function errorDetail(error: unknown): string {
    if (error instanceof Error) {
        const msg = error.message.trim();
        if (msg && msg.length <= 140) return msg;
    }
    return "Couldn’t open this file.";
}

async function readSameOriginBytes(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    try {
        const response = await fetch(url, { signal, credentials: "omit" });
        if (!response.ok) throw new Error(`Couldn’t fetch file (${response.status})`);
        return await response.arrayBuffer();
    } catch (error) {
        if (isAbort(error) || signal.aborted) throw error;
        return readBytesViaXhr(url, signal);
    }
}

function readBytesViaXhr(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        const onAbort = (): void => xhr.abort();
        signal.addEventListener("abort", onAbort, { once: true });
        xhr.onload = () => {
            signal.removeEventListener("abort", onAbort);
            if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof ArrayBuffer) {
                resolve(xhr.response);
                return;
            }
            reject(new Error(`Couldn’t fetch file (${xhr.status || 0})`));
        };
        xhr.onerror = () => {
            signal.removeEventListener("abort", onAbort);
            reject(new Error("Couldn’t fetch file"));
        };
        xhr.onabort = () => {
            signal.removeEventListener("abort", onAbort);
            reject(new DOMException("Aborted", "AbortError"));
        };
        xhr.send();
    });
}

async function loadPdfRenderer(): Promise<typeof import("./media-viewer-pdf")> {
    try {
        return await import("./media-viewer-pdf");
    } catch {
        await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 400);
        });
        return await import("./media-viewer-pdf");
    }
}

async function openFrom(trigger: HTMLElement): Promise<void> {
    const src = resolveSrc(triggerSrc(trigger));
    if (!src || open || closing || opening) return;
    opening = true;

    const inner = trigger.querySelector("img");
    const title =
        trigger.dataset.title?.trim() ||
        (inner instanceof HTMLImageElement ? inner.alt.trim() : "") ||
        "";
    const kind = kindOf(src.href, trigger.dataset.kind?.trim() || "");
    const alreadyReady =
        kind === "image" &&
        inner instanceof HTMLImageElement &&
        inner.complete &&
        inner.naturalWidth > 0;
    const root = ensureRoot();
    const token = ++loadToken;

    abort?.abort();
    abort = new AbortController();
    lastTrigger = trigger;
    clearFrame(root);
    if (alreadyReady) setBusy(root, "ready");
    else setBusy(root, "loading", title);
    openOverlay(root, title);

    try {
        const ok = await fillFrame(root, src, kind, title, token, abort.signal, trigger);
        if (token !== loadToken) return;
        if (!ok) {
            setBusy(root, "error", "This file type can’t be previewed.");
            return;
        }
        setBusy(root, "ready");
    } catch (error) {
        if (token !== loadToken) return;
        if (isAbort(error)) return;
        console.warn("[media-viewer]", error);
        clearFrame(root);
        setBusy(root, "error", errorDetail(error));
    } finally {
        if (token === loadToken) opening = false;
    }
}

function finishClose(): void {
    cancelLoad();
    const root = rootEl();
    if (root) {
        root.hidden = true;
        root.classList.remove("is-open");
        const scrim = queryEl(root, "[data-media-viewer-scrim]");
        const stage = queryEl(root, "[data-media-viewer-stage]");
        if (scrim) clearMotionStyles(scrim);
        if (stage) clearMotionStyles(stage);
        clearFrame(root);
        setBusy(root, "ready");
        root.setAttribute("aria-label", "Document preview");
    }
    lockScroll(false);
    open = false;
    closing = false;
    const trigger = lastTrigger;
    lastTrigger = null;
    trigger?.focus();
}

function closeViewer(): void {
    if (!open || closing) return;
    closing = true;
    cancelLoad();

    const root = rootEl();
    if (!root || reducedMotion()) {
        finishClose();
        return;
    }

    const scrim = queryEl(root, "[data-media-viewer-scrim]");
    const stage = queryEl(root, "[data-media-viewer-stage]");
    const exits: Promise<unknown>[] = [];
    if (scrim) {
        exits.push(
            animate(scrim, { opacity: 0 }, { duration: 0.18, ease: easeOut }).then(() => undefined),
        );
    }
    if (stage) {
        exits.push(
            animate(
                stage,
                { opacity: 0, y: 16, scale: 0.98 },
                { duration: 0.18, ease: easeOut },
            ).then(() => undefined),
        );
    }

    void Promise.all(exits).then(() => finishClose());
}

function onDocumentClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest("[data-media-viewer]");
    if (trigger instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        void openFrom(trigger);
        return;
    }

    if (!open) return;

    if (target.closest("[data-media-viewer-close]")) {
        event.preventDefault();
        closeViewer();
        return;
    }

    const root = rootEl();
    if (!root || !root.contains(target)) return;
    if (!(event instanceof MouseEvent)) return;

    const frame = queryEl(root, "[data-media-viewer-frame]");
    if (frame) {
        const box = frame.getBoundingClientRect();
        const onDocument =
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom;
        if (onDocument) return;
    }

    closeViewer();
}

function isSaveShortcut(event: KeyboardEvent): boolean {
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) return false;
    const key = event.key.toLowerCase();
    return key === "s" || key === "p";
}

function onKeydown(event: KeyboardEvent): void {
    if (!open) return;
    if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        return;
    }
    if (isSaveShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
    }
}

function onContextMenu(event: Event): void {
    if (!open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    const root = rootEl();
    if (root && root.contains(target)) {
        event.preventDefault();
    }
}

function resetForNavigation(): void {
    closing = false;
    open = false;
    opening = false;
    lastTrigger = null;
    cancelLoad();
    lockScroll(false);
    const root = rootEl();
    if (!root) return;
    root.hidden = true;
    root.classList.remove("is-open");
    const scrim = queryEl(root, "[data-media-viewer-scrim]");
    const stage = queryEl(root, "[data-media-viewer-stage]");
    if (scrim) clearMotionStyles(scrim);
    if (stage) clearMotionStyles(stage);
    clearFrame(root);
    setBusy(root, "ready");
}

function mediaIdFromSrc(src: string): string {
    try {
        const path = new URL(src, window.location.origin).pathname;
        const base = path.split("/").pop() || "";
        const dot = base.lastIndexOf(".");
        return (dot > 0 ? base.slice(0, dot) : base).toLowerCase();
    } catch {
        return "";
    }
}

function requestedMediaId(): string {
    const fromQuery = new URLSearchParams(window.location.search).get("media")?.trim() || "";
    if (fromQuery) return fromQuery.toLowerCase();
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return "";
    if (hash.toLowerCase().startsWith("media=")) return hash.slice(6).toLowerCase();
    return hash.toLowerCase();
}

function findMediaTrigger(id: string): HTMLElement | null {
    const byAttr = document.querySelector(`[data-media-id="${CSS.escape(id)}"]`);
    if (byAttr instanceof HTMLElement) return byAttr;
    for (const el of document.querySelectorAll("[data-media-viewer]")) {
        if (!(el instanceof HTMLElement)) continue;
        const explicit = el.dataset.mediaId?.trim().toLowerCase() || "";
        if (explicit === id) return el;
        if (mediaIdFromSrc(triggerSrc(el)) === id) return el;
    }
    return null;
}

function scrollTriggerSection(trigger: HTMLElement): void {
    const section = trigger.closest("section");
    if (!(section instanceof HTMLElement)) return;
    const offset = window.matchMedia("(max-width: 609.98px)").matches ? 80 : 20;
    const lenis = window.__lenis;
    if (lenis) {
        lenis.scrollTo(section, { offset: -offset, immediate: true });
        return;
    }
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "auto" });
}

function afterScrollRestore(fn: () => void): void {
    let ran = false;
    const run = (): void => {
        if (ran) return;
        ran = true;
        window.removeEventListener("scrollrestore:done", run);
        fn();
    };
    if (window.__scrollRestoreDone) {
        run();
        return;
    }
    window.addEventListener("scrollrestore:done", run);
    window.setTimeout(run, 400);
}

function tryOpenFromLocation(): void {
    if (open || closing) return;
    const id = requestedMediaId();
    if (!id) return;
    const trigger = findMediaTrigger(id);
    if (!trigger || trigger.closest("#credentials-preview")) return;
    revealCredentialsContaining(trigger);
    // Overlay is body-mounted — do not wait on scroll restore or the dialog never opens.
    void openFrom(trigger);
    afterScrollRestore(() => {
        if (!open) return;
        scrollTriggerSection(trigger);
    });
}

if (bootOnce("media-viewer")) {
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onContextMenu, true);
    ensureRoot();
    document.addEventListener("astro:page-load", () => {
        closing = false;
        if (!open) ensureRoot();
        tryOpenFromLocation();
    });
    document.addEventListener("astro:before-swap", resetForNavigation);
    window.addEventListener("hashchange", tryOpenFromLocation);
    window.addEventListener("popstate", tryOpenFromLocation);
    tryOpenFromLocation();
}
