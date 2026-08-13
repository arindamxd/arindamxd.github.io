/**
 * Page enter without View Transition snapshots (frost glass freeze).
 * Nav stays. Leave: dissolve up. Enter (reload + in-site): spring rise + blur.
 */
import { animate } from "motion";
import { bootOnce } from "./boot-once";
import { clearMotionStyles, springPage } from "./motion-tokens";

const LEAVE_MS = 160;

type PrepEvent = Event & {
    loader?: () => Promise<void>;
};

type SwapEvent = Event & {
    newDocument?: Document;
    viewTransition?: { skipTransition?: () => void };
};

if (bootOnce("page-transition")) {
    window.__pageEnterBound = true;

    const reduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let skipNextLoadEnter = false;
    let loadEnterDone = false;

    const shell = (): HTMLElement | null => document.querySelector(".page-shell");

    function clearEnter(): void {
        const root = document.documentElement;
        const el = shell();
        root.classList.remove("is-page-leaving", "is-page-entering", "is-page-ready");
        el?.classList.remove("page-shell--from", "page-shell--in");
        if (el) clearMotionStyles(el);
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
        if (!el) return;
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
        window.__pageEnterStarted = true;
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
            if (!pageShown() || !shell()) {
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

    document.addEventListener("astro:before-swap", (event) => {
        const ev = event as SwapEvent;
        ev.viewTransition?.skipTransition?.();
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
