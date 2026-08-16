/**
 * Production inspect deterrent: desktop context menu + DevTools / view-source
 * shortcuts. Skipped in `astro dev` and on localhost (including `astro preview`).
 *
 * Not DRM — the browser menu can still open DevTools.
 */
import { bootOnce } from "./boot-once";

function isLocalHost(): boolean {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function allowInspect(): boolean {
    return import.meta.env.DEV || isLocalHost();
}

function isFinePointer(): boolean {
    return Boolean(
        window.matchMedia &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
}

function isInspectShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    if (key === "f12") return true;

    const ctrl = event.ctrlKey;
    const meta = event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    const inspectorKey = key === "i" || key === "j" || key === "c" || key === "k";

    if ((ctrl || meta) && shift && inspectorKey) return true;
    if ((ctrl || meta) && alt && (inspectorKey || key === "u")) return true;
    if (ctrl && !meta && !shift && !alt && key === "u") return true;
    return false;
}

function onKeydown(event: KeyboardEvent): void {
    if (!isInspectShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
}

function onContextMenu(event: Event): void {
    if (!isFinePointer()) return;
    event.preventDefault();
}

if (bootOnce("inspect-guard") && !allowInspect()) {
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
}
