// Scroll reveal:
// - Hero uses separate appear script (load only)
// - Mid-page sections: fade-up once when scrolled into view
// - Mid-page RELOAD: show in-view content immediately (no re-hide / no intro flash)
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io = null;

    function restoreY() {
        return typeof window.__restoreScrollY === 'number' ? window.__restoreScrollY : 0;
    }

    function isBelowFold(el) {
        return el.getBoundingClientRect().top > window.innerHeight * 0.98;
    }

    function settle(el) {
        el.classList.add('is-revealed', 'reveal-instant');
        el.classList.remove('reveal-prep');
    }

    function prep(el) {
        el.classList.remove('is-revealed', 'reveal-instant');
        el.classList.add('reveal-prep');
    }

    function reveal(el) {
        el.classList.remove('reveal-instant');
        void el.offsetWidth;
        el.classList.add('is-revealed');
    }

    function ensureScrollShown() {
        if (typeof window.__applyScrollRestore === 'function') {
            window.__applyScrollRestore(true);
        } else {
            const y = restoreY();
            if (y > 0) {
                window.scrollTo(0, y);
                if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
            }
            document.documentElement.classList.remove('scroll-pending');
        }
    }

    function run() {
        ensureScrollShown();

        const nodes = [...document.querySelectorAll('[data-reveal]')];
        if (!nodes.length) return;

        if (io) {
            io.disconnect();
            io = null;
        }

        document.documentElement.classList.add('js-motion');

        // Mid-page reload: content is already "appeared" — never re-prep / flicker
        if (reduced || restoreY() > 80 || !('IntersectionObserver' in window)) {
            nodes.forEach(settle);
            return;
        }

        // Fresh visit at top: animate only what's in view; observe the rest
        const pending = [];
        document.documentElement.classList.add('reveal-boot');

        nodes.forEach((el) => {
            if (el.classList.contains('is-revealed') && !el.classList.contains('reveal-prep')) {
                return;
            }
            if (isBelowFold(el)) {
                prep(el);
                pending.push(el);
            } else {
                // In / above viewport on first paint — settle without hiding first
                settle(el);
            }
        });

        io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    reveal(entry.target);
                    io.unobserve(entry.target);
                }
            },
            { root: null, rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
        );
        pending.forEach((el) => io.observe(el));

        requestAnimationFrame(() => {
            document.documentElement.classList.remove('reveal-boot');
        });
    }

    function arm() {
        // Wait until scroll-pending is cleared when restoring mid-page
        if (
            document.documentElement.classList.contains('scroll-pending') &&
            restoreY() > 0 &&
            !window.__scrollRestoreDone
        ) {
            window.addEventListener('scrollrestore:done', run, { once: true });
            window.setTimeout(run, 400);
            return;
        }
        requestAnimationFrame(() => requestAnimationFrame(run));
    }

    document.addEventListener('astro:page-load', arm);
    window.addEventListener('scrollrestore:done', () => requestAnimationFrame(run));
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arm);
    } else {
        arm();
    }
})();
