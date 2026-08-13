import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { bootOnce } from './boot-once';

if (bootOnce('lenis')) {
    bootLenis();
}

function bootLenis(): void {
    const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return;

    const restoreY =
        typeof window.__restoreScrollY === 'number' && window.__restoreScrollY > 0
            ? window.__restoreScrollY
            : 0;

    const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1.2,
        ...(restoreY > 0 ? { syncTouch: true } : {}),
    });

    window.__lenis = lenis;

    if (restoreY > 0) {
        lenis.scrollTo(restoreY, { immediate: true });
    }

    if (typeof window.__applyScrollRestore === 'function') {
        window.__applyScrollRestore(true);
    } else {
        document.documentElement.classList.remove('scroll-pending');
        window.__scrollRestoreDone = true;
        window.dispatchEvent(new CustomEvent('scrollrestore:done'));
    }

    lenis.on('scroll', () => {
        try {
            sessionStorage.setItem(
                '__restoreScroll',
                JSON.stringify({
                    path: location.pathname + location.search,
                    y: lenis.scroll,
                }),
            );
        } catch {
            /* ignore */
        }
    });

    document.addEventListener(
        'click',
        (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const a = target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (!id || id === '#') return;
            const el = document.querySelector(id);
            if (!(el instanceof HTMLElement)) return;
            e.preventDefault();
            window.__lenis?.scrollTo(el, { offset: -20, duration: 1.2 });
        },
        true,
    );

    document.addEventListener('astro:after-swap', () => {
        const instance = window.__lenis;
        if (!instance) return;
        instance.resize();
        instance.scrollTo(0, { immediate: true });
    });
}
