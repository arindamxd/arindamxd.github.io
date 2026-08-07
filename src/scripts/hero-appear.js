// Hero appear — Framer badge hinge feel (after page loader)
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;
    let waitingForLoader = false;

    function settle(el) {
        el.classList.remove('is-appearing');
        el.classList.add('is-settled');
    }

    function run() {
        if (started) return;
        started = true;

        const targets = [
            ...document.querySelectorAll(
                '.appear-hero-card, .appear-hero-tie, .appear-fade-up, .appear-fade-up-sm',
            ),
        ];

        document.documentElement.classList.add('js-motion');

        if (!targets.length) return;

        if (reduced) {
            targets.forEach(settle);
            return;
        }

        targets.forEach((el) => {
            el.classList.remove('is-settled');
            el.classList.add('is-appearing');
            const onEnd = (ev) => {
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

    function arm() {
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
