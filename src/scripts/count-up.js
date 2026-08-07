// Count-up numbers when they enter the viewport (Framer counter parity)
(function () {
    const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animate(el) {
        if (el.dataset.countDone === '1') return;
        el.dataset.countDone = '1';

        const to = Number(el.getAttribute('data-count-to'));
        if (!Number.isFinite(to)) return;

        const suffix = el.getAttribute('data-count-suffix') || '';
        const prefix = el.getAttribute('data-count-prefix') || '';
        const duration = Number(el.getAttribute('data-count-duration') || 1200);

        if (reduced) {
            el.textContent = `${prefix}${to}${suffix}`;
            return;
        }

        const start = performance.now();
        const from = 0;

        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(from + (to - from) * eased);
            el.textContent = `${prefix}${value}${suffix}`;
            if (t < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    function inView(el) {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.92 && r.bottom > window.innerHeight * 0.08;
    }

    function run() {
        const nodes = [...document.querySelectorAll('[data-count-to]')];
        if (!nodes.length) return;

        if (!('IntersectionObserver' in window) || reduced) {
            nodes.forEach(animate);
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            },
            { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.2 },
        );

        nodes.forEach((el) => {
            if (inView(el)) animate(el);
            else io.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
