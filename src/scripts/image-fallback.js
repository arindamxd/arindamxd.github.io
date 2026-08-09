/**
 * Swap broken <img> tags for gallery placeholders (media shell or project logo mark).
 * Capture-phase so it runs even when handlers aren't on the element.
 */
const MEDIA_PH = '/assets/resources/design-media-placeholder.svg';
const LOGO_PH = '/assets/resources/design-logo-placeholder.svg';

const PLACEHOLDER_RE = /design-(media|logo)-placeholder/;

function isPlaceholderSrc(src) {
    return typeof src === 'string' && PLACEHOLDER_RE.test(src);
}

function fallbackFor(img) {
    if (img.closest('.project-logo')) return LOGO_PH;
    return MEDIA_PH;
}

function applyImageFallback(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.imgFallback === '1') return;

    img.dataset.imgFallback = '1';
    img.removeAttribute('srcset');
    img.sizes = '';

    const src = img.getAttribute('src') || img.currentSrc || '';

    // Placeholder asset itself failed — paint via CSS shell only
    if (isPlaceholderSrc(src)) {
        img.classList.add('design-media-ph');
        img.removeAttribute('src');
        img.alt = '';
        return;
    }

    const next = fallbackFor(img);
    if (next === MEDIA_PH) img.classList.add('design-media-ph');
    img.alt = img.alt || '';
    img.src = next;
}

function recoverBrokenImages(root = document) {
    root.querySelectorAll('img').forEach((img) => {
        if (img.dataset.imgFallback === '1') return;
        // Failed or empty decoded frame
        if (img.complete && img.naturalWidth === 0 && (img.getAttribute('src') || img.currentSrc)) {
            applyImageFallback(img);
        }
    });
}

function onError(event) {
    const t = event.target;
    if (t instanceof HTMLImageElement) applyImageFallback(t);
}

function bind() {
    document.addEventListener('error', onError, true);
    recoverBrokenImages();
}

bind();
document.addEventListener('astro:page-load', () => recoverBrokenImages());
document.addEventListener('astro:after-swap', () => recoverBrokenImages());
