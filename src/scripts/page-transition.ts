/**
 * Page enter without View Transition snapshots (frost glass freeze).
 * Nav stays. Leave: dissolve up. Enter (reload + in-site): spring rise + blur.
 *
 * First load: inline WAAPI in BaseLayout can win before this module parses.
 * ClientRouter: after-swap always runs playEnter. Both paths share `__pageEnterStarted`.
 */
import { animate } from "motion";
import { bootOnce } from "./boot-once";
import { clearMotionStyles, springPage } from "./motion-tokens";

const LEAVE_MS = 160;

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
    let loadEnterDone = false;

    const shell = (): HTMLElement | null => document.querySelector(".page-shell");

    function shellHasContent(el: HTMLElement | null): boolean {
        if (!el) return false;
        for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
            if (n.tagName !== "SCRIPT") return true;
        }
        return false;
    }

    function clearEnter(): void {
        const root = document.documentElement;
        const el = shell();
        root.classList.remove("is-page-leaving", "is-page-entering", "is-page-ready");
        el?.classList.remove("page-shell--from", "page-shell--in");
        if (el) {
            for (const a of el.getAnimations()) {
                if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) continue;
                a.cancel();
            }
            clearMotionStyles(el);
        }
    }

    function playEnter(): void {
        const root = document.documentElement;
        const el = shell();
        if (reduced) {
            clearEnter();
            window.__pageEnterStarted = true;
            window.dispatchEvent(new CustomEvent("pageenter:start"));
            return;
        }
        if (!el || !shellHasContent(el)) return;
        if (window.__pageEnterStarted) return;
        window.__pageEnterStarted = true;
        for (const a of el.getAnimations()) {
            if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) continue;
            a.cancel();
        }
        root.classList.remove("is-page-leaving");
        root.classList.add("is-page-entering");
        el.classList.add("page-shell--from");
        el.classList.remove("page-shell--in");

        const playback = animate(
            el,
            {
                opacity: [0, 1],
                y: [32, 0],
                filter: ["blur(6px)", "blur(0px)"],
            },
            springPage,
        );
        window.dispatchEvent(new CustomEvent("pageenter:start"));
        void playback.then(() => {
            const node = shell();
            document.documentElement.classList.remove(
                "is-page-leaving",
                "is-page-entering",
                "is-page-ready",
            );
            node?.classList.remove("page-shell--from", "page-shell--in");
            requestAnimationFrame(() => {
                if (node) clearMotionStyles(node);
            });
        });
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

    function armLoadEnter(): void {
        if (skipNextLoadEnter) {
            skipNextLoadEnter = false;
            return;
        }
        if (window.__pageEnterStarted) {
            loadEnterDone = true;
            return;
        }
        const tryPlay = (): void => {
            if (skipNextLoadEnter || loadEnterDone || window.__pageEnterStarted) return;
            if (!pageShown() || !shellHasContent(shell())) {
                window.addEventListener("scrollrestore:done", tryPlay, { once: true });
                window.addEventListener("pageloader:done", tryPlay, { once: true });
                window.setTimeout(tryPlay, 400);
                return;
            }
            loadEnterDone = true;
            playEnter();
        };
        tryPlay();
    }

    document.addEventListener("astro:before-preparation", (event) => {
        if (reduced) return;
        const ev = event as PrepEvent;
        const original = ev.loader;
        document.documentElement.classList.add("is-page-leaving");
        document.documentElement.classList.remove("is-page-entering", "is-page-ready");
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
        next.classList.remove("is-page-leaving", "is-page-ready");
        if (!reduced) {
            next.classList.add("is-page-entering");
            next.querySelector(".page-shell")?.classList.add("page-shell--from");
        }
    });

    document.addEventListener("astro:after-swap", () => {
        skipNextLoadEnter = true;
        window.__pageEnterStarted = false;
        playEnter();
    });

    document.addEventListener("astro:page-load", armLoadEnter);
    if (document.readyState !== "loading") {
        armLoadEnter();
    }
}
