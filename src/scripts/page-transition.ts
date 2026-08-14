/**
 * Page enter without View Transition snapshots (frost glass freeze).
 * Nav stays. Leave: dissolve up. Enter (reload + in-site): Motion spring rise + blur.
 *
 * First paint: BaseLayout CSS-holds `.page-shell` via `is-page-entering`.
 * This module plays `springPage` for reload and ClientRouter.
 * Mid-page reload keeps full height (`is-page-restore`) so scroll restore is not clamped,
 * then plays the same spring without blur.
 */
import { animate } from "motion";
import { bootOnce } from "./boot-once";
import { clearMotionStyles, springPage } from "./motion-tokens";

const LEAVE_MS = 160;
const ENTER_WAIT_MS = 400;

type PrepEvent = Event & {
    loader?: () => Promise<void>;
};

type ViewTransitionLike = {
    skipTransition?: () => void;
    ready?: Promise<unknown>;
    finished?: Promise<unknown>;
    updateCallbackDone?: Promise<unknown>;
};

type SwapEvent = Event & {
    newDocument?: Document;
    viewTransition?: ViewTransitionLike;
};

function isSkippedTransition(err: unknown): boolean {
    const name =
        err && typeof err === "object" && "name" in err ? String(err.name) : "";
    const msg = err instanceof Error ? err.message : String(err ?? "");
    return name === "AbortError" && msg.includes("Transition was skipped");
}

/** Native VT snapshots freeze nav glass — skip, and don't leak AbortError to the console. */
function skipViewTransition(vt?: ViewTransitionLike): void {
    if (!vt) return;
    const ignore = (err: unknown) => {
        if (!isSkippedTransition(err)) console.error(err);
    };
    void vt.ready?.catch(ignore);
    void vt.finished?.catch(ignore);
    void vt.updateCallbackDone?.catch(ignore);
    try {
        vt.skipTransition?.();
    } catch (err) {
        if (!isSkippedTransition(err)) console.error(err);
    }
}

if (bootOnce("page-transition")) {
    window.__pageEnterBound = true;

    const reduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let skipNextLoadEnter = false;
    let enterWaitTimer = 0;
    let shellObserver: MutationObserver | null = null;

    const shell = (): HTMLElement | null => document.querySelector(".page-shell");

    function shellHasContent(el: HTMLElement | null): boolean {
        if (!el) return false;
        for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
            if (n.tagName !== "SCRIPT") return true;
        }
        return false;
    }

    function stopWaiting(): void {
        window.clearTimeout(enterWaitTimer);
        enterWaitTimer = 0;
        shellObserver?.disconnect();
        shellObserver = null;
    }

    function clearEnter(): void {
        const root = document.documentElement;
        const el = shell();
        root.classList.remove(
            "is-page-leaving",
            "is-page-entering",
            "is-page-ready",
            "is-page-restore",
            "is-scroll-hold",
        );
        root.classList.remove("scroll-pending");
        el?.classList.remove("page-shell--from", "page-shell--in");
        if (el) {
            for (const a of el.getAnimations()) {
                if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) continue;
                a.cancel();
            }
            clearMotionStyles(el);
        }
    }

    function isMidPageRestore(): boolean {
        return typeof window.__restoreScrollY === "number" && window.__restoreScrollY > 0;
    }

    function skipEnterPose(): void {
        stopWaiting();
        window.__pageEnterStarted = true;
        uncoverEnterHold();
        clearEnter();
        if (typeof window.__applyScrollRestore === "function") {
            window.__applyScrollRestore(true);
        }
        window.dispatchEvent(new CustomEvent("pageenter:start"));
    }

    function uncoverEnterHold(): void {
        const root = document.documentElement;
        root.classList.remove("is-scroll-hold", "scroll-pending");
    }

    function pinEnterPose(el: HTMLElement): void {
        // Inline opacity so lifting scroll-pending cannot paint a full-opacity frame.
        el.style.setProperty("opacity", "0");
        void el.getBoundingClientRect();
    }

    function playEnter(): void {
        const root = document.documentElement;
        const el = shell();
        if (window.__pageEnterStarted) return;
        if (reduced) {
            skipEnterPose();
            return;
        }
        if (!el || !shellHasContent(el)) return;
        window.__pageEnterStarted = true;
        stopWaiting();
        const mid = isMidPageRestore();
        if (typeof window.__applyScrollRestore === "function") {
            window.__applyScrollRestore(false);
        }
        for (const a of el.getAnimations()) {
            if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) continue;
            a.cancel();
        }
        root.classList.remove("is-page-leaving");
        root.classList.add("is-page-entering");
        root.classList.toggle("is-page-restore", mid);
        el.classList.add("page-shell--from");
        el.classList.remove("page-shell--in");
        pinEnterPose(el);
        uncoverEnterHold();

        const keyframes = mid
            ? { opacity: [0, 1], y: [32, 0] }
            : {
                  opacity: [0, 1],
                  y: [32, 0],
                  filter: ["blur(6px)", "blur(0px)"],
              };

        const start = (): void => {
            const node = shell();
            if (!node) return;
            const playback = animate(node, keyframes, springPage);
            window.dispatchEvent(new CustomEvent("pageenter:start"));
            void playback.then(() => {
                const done = shell();
                document.documentElement.classList.remove(
                    "is-page-leaving",
                    "is-page-entering",
                    "is-page-ready",
                    "is-page-restore",
                    "is-scroll-hold",
                );
                done?.classList.remove("page-shell--from", "page-shell--in");
                requestAnimationFrame(() => {
                    if (done) clearMotionStyles(done);
                });
            });
        };
        requestAnimationFrame(start);
    }

    function pageShown(): boolean {
        if (
            document.documentElement.classList.contains("scroll-pending") &&
            !window.__scrollRestoreDone
        ) {
            return false;
        }
        if (
            document.documentElement.classList.contains("is-loading") &&
            !window.__pageLoaderDone
        ) {
            return false;
        }
        return true;
    }

    function observeEmptyShell(tryPlay: () => void): void {
        const el = shell();
        if (!el || shellObserver) return;
        shellObserver = new MutationObserver(() => {
            if (shellHasContent(el)) {
                shellObserver?.disconnect();
                shellObserver = null;
                tryPlay();
            }
        });
        shellObserver.observe(el, { childList: true });
    }

    function scheduleEnter(): void {
        const tryPlay = (): void => {
            if (window.__pageEnterStarted) {
                stopWaiting();
                return;
            }
            if (!reduced && (!pageShown() || !shellHasContent(shell()))) {
                window.addEventListener("scrollrestore:done", tryPlay, { once: true });
                window.addEventListener("pageloader:done", tryPlay, { once: true });
                if (!shellHasContent(shell())) observeEmptyShell(tryPlay);
                window.clearTimeout(enterWaitTimer);
                enterWaitTimer = window.setTimeout(tryPlay, ENTER_WAIT_MS);
                return;
            }
            playEnter();
        };
        tryPlay();
    }

    function armLoadEnter(): void {
        if (skipNextLoadEnter) {
            skipNextLoadEnter = false;
            return;
        }
        if (window.__pageEnterStarted) return;
        scheduleEnter();
    }

    document.addEventListener("astro:before-preparation", (event) => {
        if (reduced) return;
        const ev = event as PrepEvent;
        const original = ev.loader;
        document.documentElement.classList.add("is-page-leaving");
        document.documentElement.classList.remove("is-page-entering", "is-page-ready", "is-page-restore", "is-scroll-hold");
        if (typeof original !== "function") return;
        ev.loader = async () => {
            await Promise.all([
                original(),
                new Promise<void>((resolve) => {
                    window.setTimeout(resolve, LEAVE_MS);
                }),
            ]);
        };
    });

    window.addEventListener("unhandledrejection", (event) => {
        if (isSkippedTransition(event.reason)) event.preventDefault();
    });

    document.addEventListener("astro:before-swap", (event) => {
        const ev = event as SwapEvent;
        skipViewTransition(ev.viewTransition);
        const next = ev.newDocument?.documentElement;
        if (!next) return;
        next.classList.remove("is-page-leaving", "is-page-ready", "is-page-restore", "is-scroll-hold");
        if (!reduced) {
            next.classList.add("is-page-entering");
            next.querySelector(".page-shell")?.classList.add("page-shell--from");
        }
    });

    document.addEventListener("astro:after-swap", () => {
        skipNextLoadEnter = true;
        window.__pageEnterStarted = false;
        scheduleEnter();
    });

    document.addEventListener("astro:page-load", armLoadEnter);
    if (document.readyState !== "loading") {
        armLoadEnter();
    }
}
