/**
 * Single layout entry so ClientRouter cannot drop individual scripts
 * (theme.ts was missing after multi-page visits).
 *
 * Core motion/theme always load. Page widgets load when their DOM exists.
 */
import { bootOnce } from './boot-once';
import './page-transition';
import './theme';
import './image-fallback';
import './scramble-text';
import './reveal';
import './smooth-scroll';

function loadPageWidgets(): void {
    if (document.querySelector('.available-text-container')) {
        void import('./available-text');
    }
    if (document.querySelector('#progressBarsContainer')) {
        void import('./testimonial-slider');
    }
    if (document.querySelector('.skill-chip')) {
        void import('./skill-tooltips');
    }
    if (document.querySelector('[data-count-to]')) {
        void import('./count-up');
    }
    if (document.querySelector('[data-credentials-accordion]')) {
        void import('./credentials-accordion');
    }
    if (document.querySelector('[data-project-lightbox]')) {
        void import('./project-lightbox');
    }
}

if (bootOnce('site-client-widgets')) {
    document.addEventListener('astro:page-load', loadPageWidgets);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPageWidgets, { once: true });
    } else {
        loadPageWidgets();
    }
}
