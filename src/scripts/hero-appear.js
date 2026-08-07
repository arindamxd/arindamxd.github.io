// Hero appear — Framer badge hinge feel
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function settle(el) {
        el.classList.remove('is-appearing');
        el.classList.add('is-settled');
    }

    function run() {
        const targets = [
            ...document.querySelectorAll(
                '.appear-hero-card, .appear-hero-tie, .appear-fade-up, .appear-fade-up-sm',
            ),
        ];

        document.documentElement.classList.add('js-motion');

        if (reduced) {
            targets.forEach(settle);
            return;
        }

        // Start immediately — animation fill-mode:both applies the from-keyframe
        // (no appear-prep hide that can stick if the module loads late).
        targets.forEach((el) => {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
