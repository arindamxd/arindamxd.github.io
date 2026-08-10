// Theme toggle — light ↔ dark slide in circular button
(function () {
    const STORAGE_KEY = 'theme';
    /** Ignore duplicate activations within the slide animation window */
    const TOGGLE_LOCK_MS = 320;

    type Theme = 'dark' | 'light';

    let lockedUntil = 0;

    function getTheme(): Theme {
        const attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') return attr;
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    function syncChrome(theme: Theme): void {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', theme === 'dark' ? '#222222' : '#171717');
        }

        document.documentElement.setAttribute('data-theme', theme);

        document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
            btn.setAttribute(
                'aria-label',
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
            );
        });
    }

    function applyTheme(theme: Theme): void {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore quota / private mode */
        }
        syncChrome(theme);
        // Notify React islands (contributions calendar, etc.) without relying on MutationObserver alone
        window.dispatchEvent(
            new CustomEvent('themechange', { detail: { theme } }),
        );
    }

    function toggleTheme(): void {
        const now = performance.now();
        if (now < lockedUntil) return;
        lockedUntil = now + TOGGLE_LOCK_MS;
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    // Delegation survives ClientRouter swaps + late-mounted /design preview toggles.
    // Hit target is the <button> itself — decorative track/clip use pointer-events: none.
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (!target.closest('[data-theme-toggle]')) return;
        toggleTheme();
    });

    function sync(): void {
        syncChrome(getTheme());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sync);
    } else {
        sync();
    }
    document.addEventListener('astro:page-load', sync);
})();
