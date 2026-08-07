// Scroll reveal for section blocks (IntersectionObserver)
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function run() {
        const nodes = document.querySelectorAll('[data-reveal]');
        if (!nodes.length) return;

        if (reduced || !('IntersectionObserver' in window)) {
            nodes.forEach((el) => {
                el.classList.add('is-revealed');
                el.classList.remove('reveal-prep');
            });
            return;
        }

        nodes.forEach((el) => el.classList.add('reveal-prep'));

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            },
            { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
        );

        nodes.forEach((el) => io.observe(el));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
