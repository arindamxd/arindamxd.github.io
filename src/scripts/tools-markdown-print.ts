/**
 * Isolated print/PDF sheet for /tools/markdown full-page preview.
 * Prints a dedicated document (iframe) so Chrome's live print preview
 * cannot snap back to the dark app chrome.
 */

const FRAME_ID = 'tools-md-print-frame';

const LIGHT = {
    bg: '#ffffff',
    text: '#171717',
    muted: '#5c5c5c',
    surface: '#f4f4f4',
    border: '#d0d0d0',
    primary: '#2a29ff',
    scheme: 'light',
} as const;

const DARK = {
    bg: '#222222',
    text: '#f5f5f5',
    muted: '#b4b4b4',
    surface: '#2a2a2a',
    border: '#3a3a3a',
    primary: '#6b6aff',
    scheme: 'dark',
} as const;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function sheetCss(theme: 'light' | 'dark'): string {
    const t = theme === 'dark' ? DARK : LIGHT;
    return `
@font-face {
    font-family: Manrope;
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/assets/fonts/Manrope.woff2') format('woff2');
}
@font-face {
    font-family: 'Fragment Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/assets/fonts/FragmentMono.woff2') format('woff2');
}

:root {
    color-scheme: ${t.scheme};
    --bg: ${t.bg};
    --text: ${t.text};
    --muted: ${t.muted};
    --surface: ${t.surface};
    --border: ${t.border};
    --primary: ${t.primary};
}

* { box-sizing: border-box; }

/* @page custom properties are ignored in Chrome — use the hex.
   Zero paper margin so the sheet color is not a white frame;
   inset lives on body padding instead. */
@page {
    margin: 0;
    size: auto;
    background: ${t.bg};
}

html {
    margin: 0;
    min-height: 100%;
    background: ${t.bg};
    color-scheme: ${t.scheme};
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
}

html::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    background: ${t.bg};
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
}

body {
    margin: 0;
    min-height: 100%;
    padding: 12mm 14mm;
    background: ${t.bg};
    color: var(--text);
    font-family: Manrope, 'Segoe UI', system-ui, sans-serif;
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.45;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    /* Bleed into Chrome's print-dialog margins so the paper is not a white frame */
    box-shadow: 0 0 0 100vmax ${t.bg};
}

article {
    max-width: none;
    background: ${t.bg};
}

article > :first-child { margin-top: 0; }
article > :last-child { margin-bottom: 0; }

h1, h2, h3, h4 {
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1.25;
    page-break-after: avoid;
    break-after: avoid;
}

h1 { font-size: 18pt; margin: 0 0 10pt; }
h2 { font-size: 13pt; margin: 16pt 0 6pt; }
h3 { font-size: 11.5pt; margin: 14pt 0 5pt; }
h4 { font-size: 10.5pt; margin: 12pt 0 4pt; }

p, ul, ol, blockquote, pre, table {
    margin: 0 0 8pt;
}

ul, ol { padding-left: 1.2em; }
li + li { margin-top: 0.2em; }

a {
    color: var(--primary);
    text-decoration: underline;
    text-underline-offset: 2px;
}

blockquote {
    margin-left: 0;
    padding: 2pt 0 2pt 10pt;
    border-left: 3px solid var(--border);
    color: var(--muted);
}

code {
    font-family: 'Fragment Mono', ui-monospace, monospace;
    font-size: 8.5pt;
    font-weight: 400;
    letter-spacing: 0;
    padding: 0.05em 0.3em;
    border-radius: 3pt;
    background: var(--surface);
    border: 1px solid var(--border);
}

pre {
    overflow: visible;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    border-radius: 6pt;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 8pt 10pt;
}

pre code {
    padding: 0;
    border: 0;
    background: transparent;
    font-size: 8pt;
    line-height: 1.45;
}

table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8.5pt;
    line-height: 1.35;
    page-break-inside: auto;
    break-inside: auto;
}

thead { display: table-header-group; }
tfoot { display: table-footer-group; }
tr { page-break-inside: auto; break-inside: auto; }

th, td {
    border: 1px solid var(--border);
    padding: 4pt 6pt;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
    word-break: break-word;
}

th {
    background: var(--surface);
    font-weight: 600;
}

hr {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 12pt 0;
}

img {
    max-width: 100%;
    height: auto;
}

.empty {
    color: var(--muted);
    font-style: italic;
}
`.trim();
}

function buildSrcdoc(theme: 'light' | 'dark', title: string, bodyHtml: string): string {
    const htmlClass = theme === 'dark' ? ' class="dark"' : '';
    return `<!DOCTYPE html>
<html lang="en"${htmlClass}>
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="${theme}">
<title>${escapeHtml(title)}</title>
<style>${sheetCss(theme)}</style>
</head>
<body>
<article>${bodyHtml}</article>
</body>
</html>`;
}

function waitForAssets(doc: Document): Promise<void> {
    const fontReady =
        doc.fonts && typeof doc.fonts.ready.then === 'function'
            ? doc.fonts.ready.catch(() => undefined)
            : Promise.resolve();

    const images = Array.from(doc.images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
        });
    });

    return Promise.all([fontReady, ...images]).then(() => undefined);
}

export function printMarkdownHtml(options: {
    html: string;
    title: string;
    theme: 'light' | 'dark';
}): void {
    document.getElementById(FRAME_ID)?.remove();

    const title = options.title.trim() || 'Markdown preview';
    const bodyHtml = options.html.trim() || '<p class="empty">Nothing to print.</p>';

    const iframe = document.createElement('iframe');
    iframe.id = FRAME_ID;
    iframe.title = 'Print preview';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
        'position:absolute;left:-10000px;top:0;width:8.5in;height:11in;border:0;opacity:0;pointer-events:none;';

    let started = false;
    const onReady = (): void => {
        if (started) return;
        const frameWin = iframe.contentWindow;
        const doc = iframe.contentDocument;
        if (!frameWin || !doc?.body?.querySelector('article')) return;
        started = true;

        const cleanup = (): void => {
            iframe.remove();
            frameWin.removeEventListener('afterprint', cleanup);
        };

        void waitForAssets(doc).then(() => {
            window.setTimeout(() => {
                frameWin.addEventListener('afterprint', cleanup);
                frameWin.focus();
                frameWin.print();
            }, 50);
        });
    };

    iframe.addEventListener('load', onReady);
    iframe.srcdoc = buildSrcdoc(options.theme, title, bodyHtml);
    document.body.appendChild(iframe);
}
