/**
 * Page fade without the View Transition snapshot (that freeze + frost glass).
 * Nav stays put; body content eases out while the next page fetches, then eases in.
 */
import { bootOnce } from './boot-once';

const FADE_MS = 140;

type PrepEvent = Event & {
    loader?: () => Promise<void>;
};

type SwapEvent = Event & {
    newDocument?: Document;
    viewTransition?: { skipTransition?: () => void };
};

if (bootOnce('page-transition')) {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('astro:before-preparation', (event) => {
        if (reduced) return;
        const ev = event as PrepEvent;
        const original = ev.loader;
        document.documentElement.classList.add('is-page-leaving');
        document.documentElement.classList.remove('is-page-entering', 'is-page-ready');
        if (typeof original !== 'function') return;
        ev.loader = async () => {
            await Promise.all([
                original(),
                new Promise<void>((resolve) => {
                    window.setTimeout(resolve, FADE_MS);
                }),
            ]);
        };
    });

    document.addEventListener('astro:before-swap', (event) => {
        const ev = event as SwapEvent;
        ev.viewTransition?.skipTransition?.();
        const next = ev.newDocument?.documentElement;
        if (!next) return;
        next.classList.remove('is-page-leaving', 'is-page-ready');
        if (!reduced) next.classList.add('is-page-entering');
    });

    document.addEventListener('astro:after-swap', () => {
        const root = document.documentElement;
        root.classList.remove('is-page-leaving');
        if (reduced) {
            root.classList.remove('is-page-entering', 'is-page-ready');
            return;
        }
        root.classList.add('is-page-entering');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                root.classList.add('is-page-ready');
                root.classList.remove('is-page-entering');
                window.setTimeout(() => {
                    root.classList.remove('is-page-ready');
                }, FADE_MS + 40);
            });
        });
    });

    document.addEventListener('astro:page-load', () => {
        document.documentElement.classList.remove('is-page-leaving', 'is-page-entering');
    });
}
