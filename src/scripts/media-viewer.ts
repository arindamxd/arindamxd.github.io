/**
 * Fullscreen view-only overlay for images, PDFs, and plain text.
 *
 * Markup contract:
 * - Trigger: [data-media-viewer][data-src] (optional data-title, data-kind)
 * - A wrapped <img> is enough for project screenshots (currentSrc is reused)
 * - Overlay: created in JS and mounted on document.body (survives ClientRouter)
 *
 * This hides download/print chrome and blocks save shortcuts while open.
 * It is not DRM — the file is still fetched by the browser.
 */
import { animate } from "motion";
import { bootOnce } from "./boot-once";
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

    const response = await fetch(src.href, {
        signal,
        credentials: "same-origin",
        cache: "force-cache",
    });
    if (!response.ok) throw new Error("fetch");
    if (token !== loadToken) return false;

    if (kind === "text") {
        const text = await response.text();
        if (token !== loadToken) return false;
        const pre = document.createElement("pre");
        pre.className = "media-viewer-text";
        pre.textContent = text;
        frame.appendChild(pre);
        return true;
    }

    const data = await response.arrayBuffer();
    if (token !== loadToken) return false;
    const { renderPdfPages } = await import("./media-viewer-pdf");
    if (token !== loadToken) return false;
    await renderPdfPages(frame, data, signal, stageContentBox(root));
    return token === loadToken;
}

async function openFrom(trigger: HTMLElement): Promise<void> {
    const src = resolveSrc(triggerSrc(trigger));
    if (!src || open || closing) return;

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
        if (error instanceof DOMException && error.name === "AbortError") return;
        clearFrame(root);
        setBusy(root, "error");
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

if (bootOnce("media-viewer")) {
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onContextMenu, true);
    ensureRoot();
    document.addEventListener("astro:page-load", () => {
        closing = false;
        if (!open) ensureRoot();
    });
    document.addEventListener("astro:before-swap", resetForNavigation);
}
