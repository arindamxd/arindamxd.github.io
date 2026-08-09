// Count-up numbers when they enter the viewport
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io: IntersectionObserver | null = null;

    function readMeta(el: HTMLElement): {
        to: number;
        suffix: string;
        prefix: string;
        duration: number;
    } {
        const to = Number(el.getAttribute('data-count-to'));
        const suffix = el.getAttribute('data-count-suffix') || '';
        const prefix = el.getAttribute('data-count-prefix') || '';
        const duration = Number(el.getAttribute('data-count-duration') || 1200);
        return { to, suffix, prefix, duration };
    }

    function settle(el: HTMLElement): void {
        if (el.dataset.countDone === '1') return;
        el.dataset.countDone = '1';
        const { to, suffix, prefix } = readMeta(el);
        if (!Number.isFinite(to)) return;
        el.textContent = `${prefix}${to}${suffix}`;
    }

    function animate(el: HTMLElement): void {
        if (el.dataset.countDone === '1') return;
        el.dataset.countDone = '1';

        const { to, suffix, prefix, duration } = readMeta(el);
        if (!Number.isFinite(to)) return;

        if (reduced) {
            el.textContent = `${prefix}${to}${suffix}`;
            return;
        }

        const start = performance.now();
        const from = 0;

        function frame(now: number): void {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(from + (to - from) * eased);
            el.textContent = `${prefix}${value}${suffix}`;
            if (t < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    function isFullyAbove(el: Element): boolean {
        return el.getBoundingClientRect().bottom < 0;
    }

    function inView(el: Element): boolean {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.98 && r.bottom > 0;
    }

    function run(): void {
        if (io) {
            io.disconnect();
            io = null;
        }

        const nodes = [...document.querySelectorAll('[data-count-to]')].filter(
            (el): el is HTMLElement => el instanceof HTMLElement,
        );
        if (!nodes.length) return;

        nodes.forEach((el) => {
            if (el.dataset.countPage !== location.pathname) {
                delete el.dataset.countDone;
                el.dataset.countPage = location.pathname;
            }
        });

        if (!('IntersectionObserver' in window) || reduced) {
            nodes.forEach(settle);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const target = entry.target;
                    if (!(target instanceof HTMLElement)) continue;
                    animate(target);
                    observer.unobserve(target);
                }
            },
            { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.05 },
        );
        io = observer;

        nodes.forEach((el) => {
            if (el.dataset.countDone === '1') return;
            // Mid-page reload: show final value (do not replay)
            if (typeof window.__restoreScrollY === 'number' && window.__restoreScrollY > 80) {
                if (isFullyAbove(el) || inView(el)) settle(el);
                else observer.observe(el);
                return;
            }
            if (isFullyAbove(el)) settle(el);
            else if (inView(el)) animate(el);
            else observer.observe(el);
        });
    }

    function arm(): void {
        if (
            document.documentElement.classList.contains('scroll-pending') &&
            typeof window.__restoreScrollY === 'number' &&
            window.__restoreScrollY > 0 &&
            !window.__scrollRestoreDone
        ) {
            window.addEventListener('scrollrestore:done', () => requestAnimationFrame(run), {
                once: true,
            });
            window.setTimeout(run, 400);
            return;
        }
        requestAnimationFrame(() => requestAnimationFrame(run));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arm);
    } else {
        arm();
    }
    document.addEventListener('astro:page-load', arm);
    window.addEventListener('scrollrestore:done', arm);
    window.addEventListener('load', run);
})();
