// Hero appear — badge hinge feel (after page loader)
import { bootOnce } from './boot-once';

(function () {
    if (!bootOnce('hero-appear')) return;
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;
    let waitingForLoader = false;
    let swapped = false;

    document.addEventListener('astro:after-swap', () => {
        swapped = true;
    });

    function settle(el: Element): void {
        el.classList.remove('is-appearing');
        el.classList.add('is-settled');
    }

    function run(): void {
        if (started) return;
        started = true;

        const targets = [
            ...document.querySelectorAll(
                '.appear-hero-card, .appear-hero-tie, .appear-fade-up, .appear-fade-up-sm',
            ),
        ];

        document.documentElement.classList.add('js-motion');

        if (!targets.length) return;

        // Mid-page reload — skip hero entrance (user isn't at the top)
        const midRestore =
            typeof window.__restoreScrollY === 'number' && window.__restoreScrollY > 80;

        if (reduced || midRestore || swapped) {
            targets.forEach(settle);
            return;
        }

        targets.forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            el.classList.remove('is-settled');
            el.classList.add('is-appearing');
            const onEnd = (ev: Event) => {
                if (ev.target !== el) return;
                el.removeEventListener('animationend', onEnd);
                settle(el);
            };
            el.addEventListener('animationend', onEnd);
        });

        window.setTimeout(() => {
            targets.forEach((el) => {
                if (!el.classList.contains('is-settled')) settle(el);
            });
        }, 1500);
    }

    function arm(): void {
        started = false;
        document.documentElement.classList.add('js-motion');

        if (
            window.__pageLoaderDone ||
            document.documentElement.classList.contains('is-loaded') ||
            !document.getElementById('page-loader')
        ) {
            run();
            return;
        }

        if (!waitingForLoader) {
            waitingForLoader = true;
            window.addEventListener(
                'pageloader:done',
                () => {
                    waitingForLoader = false;
                    started = false;
                    run();
                },
                { once: true },
            );
        }
    }

    document.addEventListener('astro:page-load', arm);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arm);
    } else {
        arm();
    }
})();
