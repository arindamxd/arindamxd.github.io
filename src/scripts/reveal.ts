// Scroll / load reveal — spring fade-up on every page (design-system §12.2.2)
import { animate, inView, stagger } from "motion";
import { bootOnce } from "./boot-once";
import { clearMotionStyles, springSoft, staggerList } from "./motion-tokens";

(function () {
    if (!bootOnce("reveal")) return;
    const reduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stopInView: (() => void) | null = null;
    let stopLoops: (() => void) | null = null;

    document.addEventListener("astro:after-swap", () => {
        stopInView?.();
        stopInView = null;
        stopLoops?.();
        stopLoops = null;
    });

    function restoreY(): number {
        return typeof window.__restoreScrollY === "number" ? window.__restoreScrollY : 0;
    }

    function isBelowFold(el: Element): boolean {
        return el.getBoundingClientRect().top > window.innerHeight * 0.98;
    }

    function staggerKids(el: Element): Element[] {
        return [...el.querySelectorAll(".skill-chip > :first-child, .cms-item")];
    }

    function settle(el: Element): void {
        el.classList.add("is-revealed", "reveal-instant");
        el.classList.remove("reveal-prep", "is-revealing");
        clearMotionStyles(el);
        staggerKids(el).forEach(clearMotionStyles);
    }

    function prep(el: Element): void {
        el.classList.remove("is-revealed", "reveal-instant");
        el.classList.add("reveal-prep");
    }

    function play(el: Element, delay = 0): void {
        if (!(el instanceof HTMLElement)) return;
        if (el.classList.contains("is-revealed") && !el.classList.contains("reveal-prep")) {
            return;
        }
        if (el.classList.contains("is-revealing")) return;
        el.classList.add("is-revealing");
        el.classList.remove("reveal-instant");

        const kids = staggerKids(el);
        if (el.hasAttribute("data-reveal-stagger") && kids.length) {
            const playback = animate(
                kids,
                { opacity: [0, 1], y: [14, 0] },
                { ...springSoft, delay: stagger(staggerList) },
            );
            void playback.then(() => {
                el.classList.add("is-revealed");
                el.classList.remove("reveal-prep", "is-revealing");
                kids.forEach(clearMotionStyles);
            });
            return;
        }

        const playback = animate(
            el,
            { opacity: [0, 1], y: [40, 0] },
            { ...springSoft, delay },
        );
        void playback.then(() => {
            el.classList.add("is-revealed");
            el.classList.remove("reveal-prep", "is-revealing");
            clearMotionStyles(el);
        });
    }

    function ensureScrollShown(): void {
        if (typeof window.__applyScrollRestore === "function") {
            window.__applyScrollRestore(true);
        } else {
            const y = restoreY();
            if (y > 0) {
                window.scrollTo(0, y);
                if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
            }
            document.documentElement.classList.remove("scroll-pending");
        }
    }

    /** Pause looping CSS (brand marquee) when offscreen or the tab is hidden. */
    function armLooping(): void {
        stopLoops?.();
        stopLoops = null;
        const tracks = [...document.querySelectorAll(".logo-track, .design-marquee-track")];
        if (!tracks.length) return;

        const onscreen = new Set<Element>();

        const apply = (): void => {
            const hidden = document.hidden;
            for (const el of tracks) {
                el.classList.toggle("is-paused", hidden || !onscreen.has(el));
            }
        };

        document.addEventListener("visibilitychange", apply);

        if (reduced || !("IntersectionObserver" in window)) {
            tracks.forEach((el) => onscreen.add(el));
            apply();
            stopLoops = () => {
                document.removeEventListener("visibilitychange", apply);
            };
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) onscreen.add(entry.target);
                    else onscreen.delete(entry.target);
                }
                apply();
            },
            { root: null, rootMargin: "80px 0px", threshold: 0 },
        );
        tracks.forEach((el) => io.observe(el));
        apply();

        stopLoops = () => {
            io.disconnect();
            document.removeEventListener("visibilitychange", apply);
        };
    }

    function run(): void {
        ensureScrollShown();
        armLooping();

        const nodes = [...document.querySelectorAll("[data-reveal]")];
        if (!nodes.length) return;

        stopInView?.();
        stopInView = null;

        document.documentElement.classList.add("js-motion");

        if (reduced) {
            nodes.forEach(settle);
            return;
        }

        const pending: Element[] = [];
        const visible: Element[] = [];

        // Measure first, then mutate — avoid layout thrash on home
        for (const el of nodes) {
            if (el.classList.contains("is-revealed") && !el.classList.contains("reveal-prep")) {
                continue;
            }
            if (isBelowFold(el)) pending.push(el);
            else visible.push(el);
        }

        visible.forEach(settle);
        pending.forEach(prep);

        if (pending.length) {
            stopInView = inView(
                pending,
                (element) => {
                    play(element);
                },
                { amount: 0.12, margin: "0px 0px -6% 0px" },
            );
        }
    }

    function arm(): void {
        const go = (): void => {
            if (
                document.documentElement.classList.contains("scroll-pending") &&
                restoreY() > 0 &&
                !window.__scrollRestoreDone
            ) {
                window.addEventListener("scrollrestore:done", go, { once: true });
                window.setTimeout(go, 400);
                return;
            }
            if (!reduced && !window.__pageEnterStarted) {
                window.addEventListener("pageenter:start", () => requestAnimationFrame(run), {
                    once: true,
                });
                window.setTimeout(() => {
                    if (!window.__pageEnterStarted) run();
                }, 900);
                return;
            }
            requestAnimationFrame(() => requestAnimationFrame(run));
        };
        go();
    }

    document.addEventListener("astro:page-load", arm);
    if (document.readyState !== "loading") arm();
})();
