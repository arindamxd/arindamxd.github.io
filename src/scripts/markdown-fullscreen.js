/**
 * Fullscreen Markdown docs viewer.
 *
 * Markup contract:
 * - Trigger:  any element with data-md-doc="<id>"
 * - Panel:    MarkdownDocPanel with matching id → [data-md-doc-panel="<id>"]
 * - Optional: class "md-doc-trigger" for inline code-link styling
 */

/** @type {HTMLElement | null} */
let activePanel = null;
/** @type {HTMLElement | null} */
let lastTrigger = null;
let escBound = false;

function closeActive() {
    if (!(activePanel instanceof HTMLElement)) return;
    activePanel.hidden = true;
    document.body.classList.remove('tools-md-fullscreen-open');
    const trigger = lastTrigger;
    activePanel = null;
    lastTrigger = null;
    trigger?.focus?.();
}

/**
 * @param {string} id
 * @param {HTMLElement | null} trigger
 */
function openPanel(id, trigger) {
    const panel = document.querySelector(`[data-md-doc-panel="${CSS.escape(id)}"]`);
    if (!(panel instanceof HTMLElement)) return;

    if (activePanel && activePanel !== panel) {
        activePanel.hidden = true;
    }

    activePanel = panel;
    lastTrigger = trigger;
    panel.hidden = false;
    document.body.classList.add('tools-md-fullscreen-open');

    const body = panel.querySelector('.tools-md-fullscreen-body');
    if (body instanceof HTMLElement) body.scrollTop = 0;

    const closeBtn = panel.querySelector('[data-md-doc-close]');
    if (closeBtn instanceof HTMLElement) closeBtn.focus();
}

function initMarkdownDocs() {
    document.querySelectorAll('[data-md-doc]').forEach((el) => {
        if (!(el instanceof HTMLElement) || el.dataset.mdDocBound === '1') return;
        el.dataset.mdDocBound = '1';

        el.addEventListener('click', (event) => {
            const id = el.getAttribute('data-md-doc');
            if (!id) return;
            event.preventDefault();
            openPanel(id, el);
        });

        if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
            if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            el.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                const id = el.getAttribute('data-md-doc');
                if (!id) return;
                event.preventDefault();
                openPanel(id, el);
            });
        }
    });

    document.querySelectorAll('[data-md-doc-close]').forEach((btn) => {
        if (!(btn instanceof HTMLElement) || btn.dataset.mdDocCloseBound === '1') return;
        btn.dataset.mdDocCloseBound = '1';
        btn.addEventListener('click', closeActive);
    });

    if (!escBound) {
        escBound = true;
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && activePanel && !activePanel.hidden) {
                event.preventDefault();
                closeActive();
            }
        });
    }
}

initMarkdownDocs();
document.addEventListener('astro:page-load', initMarkdownDocs);
