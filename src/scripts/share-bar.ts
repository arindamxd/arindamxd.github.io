/**
 * Share menu — hover on fine pointer; tap-to-toggle on touch; copy link.
 */
import { bootOnce } from "./boot-once";

const OPEN = "is-open";
const COPIED_MS = 1600;

function isTouchUi(): boolean {
    return window.matchMedia("(hover: none)").matches;
}

async function copyText(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        return false;
    }
}

function setCopied(root: HTMLElement, copied: boolean): void {
    root.classList.toggle("is-copied", copied);
    const label = root.querySelector("[data-share-copy-label]");
    if (label) label.textContent = copied ? "Copied" : "Copy link";
    const status = root.querySelector("[data-share-status]");
    if (status) status.textContent = copied ? "Link copied" : "";
}

function setOpen(root: HTMLElement, open: boolean): void {
    root.classList.toggle(OPEN, open);
    const trigger = root.querySelector("[data-share-trigger]");
    if (trigger instanceof HTMLButtonElement) {
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
}

function closeAll(except?: Element | null): void {
    document.querySelectorAll(`.share-bar.${OPEN}`).forEach((el) => {
        if (el === except || !(el instanceof HTMLElement)) return;
        setOpen(el, false);
        setCopied(el, false);
    });
}

function bindShareBar(root: HTMLElement): void {
    if (root.dataset.bound === "true") return;
    root.dataset.bound = "true";

    const url = root.dataset.shareUrl || "";
    const trigger = root.querySelector<HTMLButtonElement>("[data-share-trigger]");
    const copyBtn = root.querySelector<HTMLButtonElement>("[data-share-copy]");
    let copiedTimer = 0;

    trigger?.addEventListener("click", () => {
        if (!isTouchUi()) return;
        const next = !root.classList.contains(OPEN);
        closeAll(next ? root : null);
        setOpen(root, next);
    });

    trigger?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setOpen(root, false);
            setCopied(root, false);
            return;
        }
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const next = !root.classList.contains(OPEN);
        closeAll(next ? root : null);
        setOpen(root, next);
    });

    copyBtn?.addEventListener("click", () => {
        if (!url) return;
        void copyText(url).then((ok) => {
            if (!ok) return;
            setCopied(root, true);
            window.clearTimeout(copiedTimer);
            copiedTimer = window.setTimeout(() => {
                setCopied(root, false);
                if (isTouchUi()) setOpen(root, false);
            }, COPIED_MS);
        });
    });
}

function onPointerDownOutside(event: Event): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    const bar = target instanceof Element ? target.closest(".share-bar") : null;
    if (bar) return;
    closeAll();
}

function initShareBars(): void {
    document.querySelectorAll<HTMLElement>("[data-share-bar]").forEach(bindShareBar);
}

if (bootOnce("share-bar")) {
    document.addEventListener("astro:page-load", initShareBars);
    document.addEventListener("pointerdown", onPointerDownOutside, true);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAll();
    });
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initShareBars, { once: true });
    } else {
        initShareBars();
    }
}
