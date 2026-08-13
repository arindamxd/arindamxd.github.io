/**
 * /tools hub — search / filter tool list
 */
import { bootOnce } from './boot-once';
function initToolsHub(): void {
    const rootEl = document.getElementById('tools-hub');
    const inputEl = document.getElementById('tools-hub-search');
    const clearBtn = document.getElementById('tools-hub-clear');
    const empty = document.getElementById('tools-hub-empty');
    if (!rootEl || !(inputEl instanceof HTMLInputElement)) return;
    const root = rootEl;
    const input = inputEl;

    // Drop previous listeners when Astro re-runs this after a transition
    if (root._toolsHubAbort instanceof AbortController) {
        root._toolsHubAbort.abort();
    }
    const ac = new AbortController();
    root._toolsHubAbort = ac;
    const { signal } = ac;

    function applyFilter(): void {
        const q = input.value.trim().toLowerCase();
        const terms = q.split(/\s+/).filter(Boolean);
        let visible = 0;

        root.querySelectorAll('.tools-hub-link').forEach((link) => {
            if (!(link instanceof HTMLElement)) return;
            const hay = (link.getAttribute('data-tool-search') || '').toLowerCase();
            const show = terms.length === 0 || terms.every((term: string) => hay.includes(term));
            link.toggleAttribute('hidden', !show);
            if (show) visible += 1;
        });

        if (empty) empty.toggleAttribute('hidden', visible > 0);
        if (clearBtn) clearBtn.toggleAttribute('hidden', q.length === 0);
    }

    input.addEventListener('input', applyFilter, { signal });
    input.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape' && input.value) {
                event.preventDefault();
                input.value = '';
                applyFilter();
                input.focus();
            }
        },
        { signal }
    );

    if (clearBtn) {
        clearBtn.addEventListener(
            'click',
            () => {
                input.value = '';
                applyFilter();
                input.focus();
            },
            { signal }
        );
    }

    applyFilter();
}

if (bootOnce('tools-hub')) {
    initToolsHub();
    document.addEventListener('astro:page-load', initToolsHub);
}
