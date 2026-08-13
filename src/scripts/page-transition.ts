/**
 * Page change without View Transition snapshots (frost glass freeze).
 * Nav stays. Old content dissolves up; the next page rises in and sharpens.
 */
import { bootOnce } from './boot-once';

const LEAVE_MS = 200;
const ENTER_MS = 480;

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

    const shell = (): HTMLElement | null => document.querySelector('.page-shell');

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
                    window.setTimeout(resolve, LEAVE_MS);
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
        if (!reduced) {
            next.classList.add('is-page-entering');
            next.querySelector('.page-shell')?.classList.add('page-shell--from');
        }
    });

    document.addEventListener('astro:after-swap', () => {
        const root = document.documentElement;
        const el = shell();
        root.classList.remove('is-page-leaving');
        if (reduced) {
            root.classList.remove('is-page-entering', 'is-page-ready');
            el?.classList.remove('page-shell--from', 'page-shell--in');
            return;
        }
        root.classList.add('is-page-entering');
        el?.classList.add('page-shell--from');
        el?.classList.remove('page-shell--in');
        requestAnimationFrame(() => {
            void (el ?? root).offsetHeight;
            requestAnimationFrame(() => {
                root.classList.add('is-page-ready');
                root.classList.remove('is-page-entering');
                el?.classList.add('page-shell--in');
                el?.classList.remove('page-shell--from');
                const done = (): void => {
                    root.classList.remove('is-page-ready');
                    el?.classList.remove('page-shell--in');
                };
                el?.addEventListener('transitionend', done, { once: true });
                window.setTimeout(done, ENTER_MS + 80);
            });
        });
    });
}
