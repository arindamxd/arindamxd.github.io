import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced) {
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
        // Start at restored offset so Lenis doesn't paint from 0
        ...(restoreY > 0 ? { syncTouch: true } : {}),
    });

    window.__lenis = lenis;

    if (restoreY > 0) {
        lenis.scrollTo(restoreY, { immediate: true });
    }

    // Uncover page only after Lenis is at the restored offset
    if (typeof window.__applyScrollRestore === 'function') {
        window.__applyScrollRestore(true);
    } else {
        document.documentElement.classList.remove('scroll-pending');
        window.__scrollRestoreDone = true;
        window.dispatchEvent(new CustomEvent('scrollrestore:done'));
    }

    // Persist scroll while Lenis is driving it
    lenis.on('scroll', () => {
        try {
            sessionStorage.setItem(
                '__restoreScroll',
                JSON.stringify({
                    path: location.pathname + location.search,
                    y: lenis.scroll,
                }),
            );
        } catch (e) {}
    });

    document.addEventListener(
        'click',
        (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (!id || id === '#') return;
            const el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            lenis.scrollTo(el, { offset: -20, duration: 1.2 });
        },
        true,
    );

    document.addEventListener('astro:after-swap', () => {
        lenis.resize();
        lenis.scrollTo(0, { immediate: true });
    });
}
