/**
 * /tools/markdown — live Markdown → HTML preview
 */
import { marked } from 'marked';

const STORAGE_KEY = 'tools-markdown-draft-v1';

const SAMPLE = `# Markdown preview

Paste or open a \`.md\` file to render **GitHub-flavored** Markdown.

## Lists

- First item
- Second item with \`inline code\`

1. Ordered one
2. Ordered two

## Quote & code

> Notes and callouts land in a blockquote.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}\`;
}
\`\`\`

## Table

| Tool | Role |
| --- | --- |
| Author | Draft blog / project content |
| Markdown | Live preview |

---

[Back to tools](/tools)
`;

marked.setOptions({
    gfm: true,
    breaks: false,
});

function init() {
    const root = document.getElementById('tools-markdown');
    if (!root || root.dataset.toolsReady === '1') return;
    root.dataset.toolsReady = '1';

    const source = document.getElementById('md-source');
    const preview = document.getElementById('md-preview');
    const fileInput = document.getElementById('md-file');
    const filenameEl = document.getElementById('md-filename');
    const fullscreen = document.getElementById('md-fullscreen');
    const fullscreenBody = document.getElementById('md-fullscreen-body');
    if (!(source instanceof HTMLTextAreaElement) || !(preview instanceof HTMLElement)) return;

    let lastHtml = '';

    function setFilename(name) {
        if (filenameEl) filenameEl.textContent = name || '';
    }

    function emptyPreviewHtml() {
        return '<p class="tools-md-empty">Preview appears here.</p>';
    }

    function render() {
        const text = source.value;
        try {
            localStorage.setItem(STORAGE_KEY, text);
        } catch (_) {}

        if (!text.trim()) {
            lastHtml = '';
            preview.innerHTML = emptyPreviewHtml();
            if (fullscreenBody) fullscreenBody.innerHTML = emptyPreviewHtml();
            return;
        }

        try {
            lastHtml = marked.parse(text, { async: false });
            preview.innerHTML = lastHtml;
            if (fullscreenBody && fullscreen && !fullscreen.hidden) {
                fullscreenBody.innerHTML = lastHtml;
            }
        } catch (err) {
            lastHtml = '';
            const message = err instanceof Error ? err.message : 'Failed to parse Markdown';
            const errorHtml = `<p class="tools-md-empty">${message}</p>`;
            preview.innerHTML = errorHtml;
            if (fullscreenBody) fullscreenBody.innerHTML = errorHtml;
        }
    }

    function openFullscreen() {
        if (!(fullscreen instanceof HTMLElement) || !(fullscreenBody instanceof HTMLElement)) return;
        fullscreenBody.innerHTML = lastHtml || emptyPreviewHtml();
        fullscreen.hidden = false;
        document.body.classList.add('tools-md-fullscreen-open');
        fullscreenBody.scrollTop = 0;
    }

    function closeFullscreen() {
        if (!(fullscreen instanceof HTMLElement)) return;
        fullscreen.hidden = true;
        document.body.classList.remove('tools-md-fullscreen-open');
    }

    function loadDraft() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved != null && saved !== '') {
                source.value = saved;
            }
        } catch (_) {}
    }

    root.querySelectorAll('[data-md-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-md-action');
            if (action === 'sample') {
                source.value = SAMPLE;
                setFilename('');
                if (fileInput instanceof HTMLInputElement) fileInput.value = '';
                render();
                return;
            }
            if (action === 'clear') {
                source.value = '';
                setFilename('');
                if (fileInput instanceof HTMLInputElement) fileInput.value = '';
                render();
                return;
            }
            if (action === 'fullscreen') {
                openFullscreen();
                return;
            }
            if (action === 'close-fullscreen') {
                closeFullscreen();
                return;
            }
            if (action === 'copy-html') {
                if (!lastHtml) return;
                try {
                    await navigator.clipboard.writeText(lastHtml);
                    const prev = btn.textContent;
                    btn.textContent = 'Copied';
                    setTimeout(() => {
                        btn.textContent = prev;
                    }, 1200);
                } catch (_) {}
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!(fullscreen instanceof HTMLElement) || fullscreen.hidden) return;
        closeFullscreen();
    });

    if (fileInput instanceof HTMLInputElement) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                source.value = typeof reader.result === 'string' ? reader.result : '';
                setFilename(file.name);
                render();
            };
            reader.readAsText(file);
        });
    }

    source.addEventListener('input', render);

    function syncBoxHeights() {
        const boxes = root.querySelectorAll('.tools-md-box');
        if (!boxes.length) return;
        const h = Math.round(Math.min(window.innerHeight * 0.7, 720));
        root.style.setProperty('--md-box-h', `${h}px`);
        boxes.forEach((box) => {
            if (!(box instanceof HTMLElement)) return;
            box.style.height = `${h}px`;
            box.style.minHeight = `${h}px`;
            box.style.maxHeight = `${h}px`;
        });
    }

    syncBoxHeights();
    window.addEventListener('resize', syncBoxHeights);

    loadDraft();
    render();
}

init();
document.addEventListener('astro:page-load', init);
