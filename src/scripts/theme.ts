// Theme toggle — light ↔ dark slide in circular button
(function () {
    const STORAGE_KEY = 'theme';

    type Theme = 'dark' | 'light';

    function getTheme(): Theme {
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
    }

    function toggleTheme(): void {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    function bind(): void {
        document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
            btn.addEventListener('click', toggleTheme);
        });
        syncChrome(getTheme());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
