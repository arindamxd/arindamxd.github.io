/**
 * Credentials section — exclusive accordion (one panel open).
 */
import { bootOnce } from "./boot-once";

function setCredentialsOpen(item: Element, open: boolean): void {
    item.setAttribute("data-open", open ? "true" : "false");
    const btn = item.querySelector(".credentials-trigger");
    if (btn instanceof HTMLButtonElement) {
        btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    const panel = item.querySelector(".credentials-panel");
    if (panel instanceof HTMLElement) {
        if (open) panel.removeAttribute("inert");
        else panel.setAttribute("inert", "");
    }
}

/** Expand the group that contains `el` so a deep-linked file row is not inert. */
export function revealCredentialsContaining(el: Element): void {
    const item = el.closest(".credentials-item");
    const root = item?.closest("[data-credentials-accordion]");
    if (!item || !(root instanceof HTMLElement)) return;
    const items = [...root.querySelectorAll(".credentials-item")];
    items.forEach((other) => {
        setCredentialsOpen(other, other === item);
    });
}

function bindCredentialsAccordion(root: HTMLElement): void {
    if (root.dataset.bound === "true") return;
    root.dataset.bound = "true";

    const items = [...root.querySelectorAll(".credentials-item")];

    items.forEach((item) => {
        const trigger = item.querySelector(".credentials-trigger");
        if (!(trigger instanceof HTMLButtonElement)) return;

        trigger.addEventListener("click", () => {
            const willOpen = item.getAttribute("data-open") !== "true";
            items.forEach((other) => {
                setCredentialsOpen(other, other === item && willOpen);
            });
        });
    });
}

function initCredentialsAccordions(): void {
    document
        .querySelectorAll<HTMLElement>("[data-credentials-accordion]")
        .forEach(bindCredentialsAccordion);
}

if (bootOnce("credentials-accordion")) {
    document.addEventListener("astro:page-load", initCredentialsAccordions);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCredentialsAccordions, {
            once: true,
        });
    } else {
        initCredentialsAccordions();
    }
}
