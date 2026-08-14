/**
 * Fullscreen image preview for project body screenshots (not the hero banner).
 *
 * Markup contract:
 * - Trigger: button[data-project-lightbox] wrapping the <img>
 * - Overlay: created in JS and mounted on document.body (survives ClientRouter)
 */
import { animate } from "motion";
import { bootOnce } from "./boot-once";
import { clearMotionStyles, easeOut, springSoft } from "./motion-tokens";

const ROOT_ID = "project-lightbox-root";

let lastTrigger: HTMLElement | null = null;
let closing = false;
let open = false;

function reducedMotion(): boolean {
    return Boolean(
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
}

function lockScroll(lock: boolean): void {
    document.body.classList.toggle("project-lightbox-open", lock);
    const lenis = window.__lenis as { stop?: () => void; start?: () => void } | undefined;
    if (lock) lenis?.stop?.();
    else lenis?.start?.();
}

function ensureRoot(): HTMLElement {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "project-lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Image preview");
    root.hidden = true;
    root.innerHTML = `
        <div class="project-lightbox-scrim" data-project-lightbox-scrim></div>
        <div class="project-lightbox-stage">
            <img class="project-lightbox-img" alt="" />
        </div>
        <button type="button" class="project-lightbox-close" data-project-lightbox-close aria-label="Close image preview">
            <span class="project-lightbox-close-icon" aria-hidden="true"></span>
        </button>
    `;
    document.body.appendChild(root);
    return root;
}

function rootEl(): HTMLElement | null {
    return document.getElementById(ROOT_ID);
}

function scrimEl(root: HTMLElement): HTMLElement | null {
    const el = root.querySelector("[data-project-lightbox-scrim]");
    return el instanceof HTMLElement ? el : null;
}

function stageEl(root: HTMLElement): HTMLElement | null {
    const el = root.querySelector(".project-lightbox-stage");
    return el instanceof HTMLElement ? el : null;
}

function previewImg(root: HTMLElement): HTMLImageElement | null {
    const el = root.querySelector(".project-lightbox-img");
    return el instanceof HTMLImageElement ? el : null;
}

function openFrom(trigger: HTMLElement): void {
    const img = trigger.querySelector("img");
    if (!(img instanceof HTMLImageElement)) return;
    if (open || closing) return;

    const root = ensureRoot();
    const preview = previewImg(root);
    if (preview) {
        preview.src = img.currentSrc || img.src;
        preview.alt = img.alt || "";
    }

    lastTrigger = trigger;
    const scrim = scrimEl(root);
    const stage = stageEl(root);
    if (scrim) clearMotionStyles(scrim);
    if (stage) clearMotionStyles(stage);

    root.hidden = false;
    root.classList.add("is-open");
    open = true;
    lockScroll(true);

    const closeBtn = root.querySelector("[data-project-lightbox-close]");
    if (closeBtn instanceof HTMLElement) closeBtn.focus();

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

function finishClose(): void {
    const root = rootEl();
    if (root) {
        root.hidden = true;
        root.classList.remove("is-open");
        const scrim = scrimEl(root);
        const stage = stageEl(root);
        if (scrim) clearMotionStyles(scrim);
        if (stage) clearMotionStyles(stage);
        const preview = previewImg(root);
        if (preview) {
            preview.removeAttribute("src");
            preview.alt = "";
        }
    }
    lockScroll(false);
    open = false;
    closing = false;
    const trigger = lastTrigger;
    lastTrigger = null;
    trigger?.focus();
}

function closeLightbox(): void {
    if (!open || closing) return;
    closing = true;

    const root = rootEl();
    if (!root || reducedMotion()) {
        finishClose();
        return;
    }

    const scrim = scrimEl(root);
    const stage = stageEl(root);
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

    const trigger = target.closest("[data-project-lightbox]");
    if (trigger instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        openFrom(trigger);
        return;
    }

    if (target.closest("[data-project-lightbox-close]")) {
        event.preventDefault();
        closeLightbox();
        return;
    }

    if (open && target.closest("[data-project-lightbox-scrim]")) {
        closeLightbox();
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && open) {
        event.preventDefault();
        closeLightbox();
    }
}

function resetForNavigation(): void {
    closing = false;
    open = false;
    lastTrigger = null;
    lockScroll(false);
    const root = rootEl();
    if (!root) return;
    root.hidden = true;
    root.classList.remove("is-open");
    const scrim = scrimEl(root);
    const stage = stageEl(root);
    if (scrim) clearMotionStyles(scrim);
    if (stage) clearMotionStyles(stage);
}

if (bootOnce("project-lightbox")) {
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown);
    ensureRoot();
    document.addEventListener("astro:page-load", () => {
        // Keep a single body-mounted overlay across ClientRouter visits.
        closing = false;
        if (!open) ensureRoot();
    });
    document.addEventListener("astro:before-swap", resetForNavigation);
}
