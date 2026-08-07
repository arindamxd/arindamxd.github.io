import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced) {
    const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1.2,
    });

    // Expose for debugging / future anchor hooks
    window.__lenis = lenis;

    // Smooth in-page anchors
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

    // Keep Lenis in sync after Astro view transitions
    document.addEventListener('astro:after-swap', () => {
        lenis.resize();
        lenis.scrollTo(0, { immediate: true });
    });
}
