import { bootOnce } from './boot-once';

if (bootOnce('lenis')) {
    void bootLenis();
}

function revealRestoredScroll(): void {
    if (typeof window.__applyScrollRestore === 'function') {
        window.__applyScrollRestore(true);
        return;
    }
    if (!document.documentElement.classList.contains('is-scroll-hold')) {
        document.documentElement.classList.remove('scroll-pending');
    }
    window.__scrollRestoreDone = true;
    window.dispatchEvent(new CustomEvent('scrollrestore:done'));
}

function hashNavOffset(): number {
    return window.matchMedia('(max-width: 609.98px)').matches ? 80 : 20;
}

function bindHashLinks(smooth: boolean): void {
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
            const offset = -hashNavOffset();
            const instance = window.__lenis;
            if (instance) {
                instance.scrollTo(el, { offset, duration: 1.2 });
                return;
            }
            const top = el.getBoundingClientRect().top + window.scrollY + offset;
            window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        },
        true,
    );
}

async function bootLenis(): Promise<void> {
    const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (reduced || coarse) {
        bindHashLinks(!reduced);
        revealRestoredScroll();
        return;
    }

    const [{ default: Lenis }] = await Promise.all([
        import('lenis'),
        import('lenis/dist/lenis.css'),
    ]);

    const restoreY =
        typeof window.__restoreScrollY === 'number' && window.__restoreScrollY > 0
            ? window.__restoreScrollY
            : 0;

    const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        ...(restoreY > 0 ? { syncTouch: true } : {}),
    });

    window.__lenis = lenis;

    if (restoreY > 0) {
        lenis.scrollTo(restoreY, { immediate: true });
    }

    revealRestoredScroll();

    let scrollSaveTimer = 0;
    lenis.on('scroll', () => {
        window.clearTimeout(scrollSaveTimer);
        scrollSaveTimer = window.setTimeout(() => {
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
        }, 120);
    });

    bindHashLinks(true);

    document.addEventListener('astro:after-swap', () => {
        const instance = window.__lenis;
        if (!instance) return;
        instance.resize();
        instance.scrollTo(0, { immediate: true });
    });
}
