// Count-up numbers when they enter the viewport
import { bootOnce } from './boot-once';

(function () {
    if (!bootOnce('count-up')) return;
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

        const restoreMid =
            typeof window.__restoreScrollY === 'number' && window.__restoreScrollY > 80;
        const settleNow: HTMLElement[] = [];
        const playNow: HTMLElement[] = [];
        const watch: HTMLElement[] = [];

        for (const el of nodes) {
            if (el.dataset.countDone === '1') continue;
            const r = el.getBoundingClientRect();
            const above = r.bottom < 0;
            const shown = r.top < window.innerHeight * 0.98 && r.bottom > 0;
            if (restoreMid) {
                if (above || shown) settleNow.push(el);
                else watch.push(el);
                continue;
            }
            if (above) settleNow.push(el);
            else if (shown) playNow.push(el);
            else watch.push(el);
        }

        settleNow.forEach(settle);
        playNow.forEach(animate);
        watch.forEach((el) => observer.observe(el));
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
