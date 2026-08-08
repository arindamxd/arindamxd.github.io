/**
 * Shared Keel-style scramble text helpers.
 * Opt-in only — call bindScrambleHover / wrapElement explicitly.
 * (Available-for word cycle uses these from available-text.js.)
 */

export const SCRAMBLE_CHARS = '0+-*|{}`/()$&';
/** Disable hover scramble on small viewports (Keel). Available-for auto-cycle ignores this. */
export const NO_SCRAMBLE_MQ = '(max-width: 1080px)';
export const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

const timersByEl = new WeakMap();
const boundTriggers = new WeakSet();

export function prefersReducedMotion() {
    return window.matchMedia(REDUCED_MOTION_MQ).matches;
}

/** Hover scramble: desktop + motion OK */
export function canScramble() {
    return !window.matchMedia(NO_SCRAMBLE_MQ).matches && !prefersReducedMotion();
}

export function randomScrambleChar() {
    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function escapeHtml(ch) {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return ch;
}

/** Build inner HTML of scramble char spans for a plain string (no HTML). */
export function wrapWordsHtml(text) {
    const words = String(text).replace(/[^\S ]+/g, ' ').trim().split(' ').filter(Boolean);
    return words
        .map(
            (word) =>
                `<span class="scramble-word">${Array.from(word)
                    .map(
                        (ch) =>
                            `<span class="scramble-char"><span class="scramble-random" aria-hidden="true">${randomScrambleChar()}</span><span class="scramble-main">${escapeHtml(ch)}</span></span>`,
                    )
                    .join('')}</span>`,
        )
        .join('&nbsp;');
}

function isTransparent(bg) {
    return (
        !bg ||
        bg === 'transparent' ||
        bg === 'rgba(0, 0, 0, 0)' ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)$/i.test(bg)
    );
}

function parseRgb(color) {
    const m = String(color).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3] };
}

function relativeLuminance(color) {
    const rgb = parseRgb(color);
    if (!rgb) return 0;
    const toLin = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

export function resolveScrambleBg(host) {
    let found = null;
    let node = host;
    while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (!isTransparent(bg)) {
            found = bg;
            break;
        }
        node = node.parentElement;
    }

    if (!found) {
        found =
            getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() ||
            '#ffffff';
    }

    // Light text sitting on a light surface usually means the real fill is a
    // sibling layer (e.g. Resume on primary) — fall back to brand primary.
    const textColor = getComputedStyle(host).color;
    if (relativeLuminance(textColor) > 0.72 && relativeLuminance(found) > 0.72) {
        const primary = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-primary')
            .trim();
        if (primary) return primary;
    }

    return found;
}

/** Named presets: data-scramble-variant="primary|auto|light|dark" */
export const SCRAMBLE_VARIANTS = {
    /** Brand primary block + white glyphs */
    primary: {
        bg: 'var(--color-primary, var(--color-surface))',
        fg: '#ffffff',
    },
    /** Light-theme surface block + dark glyphs */
    light: {
        bg: '#ffffff',
        fg: '#171717',
    },
    /** Dark-theme surface block + light glyphs */
    dark: {
        bg: '#222222',
        fg: '#f5f5f5',
    },
    /** Match surrounding surface (default). */
    auto: null,
};

/** Optional overrides: data-scramble-bg / data-scramble-fg / data-scramble-variant. */
function readScrambleAttr(el, name) {
    if (!(el instanceof Element)) return '';
    return el.getAttribute(`data-scramble-${name}`)?.trim() || '';
}

/** Map short tokens to CSS values; anything else passes through as-is. */
function resolveScrambleColorToken(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    switch (raw.toLowerCase()) {
        case 'primary':
            return 'var(--color-primary, var(--color-surface))';
        case 'surface':
            return 'var(--color-surface, var(--color-bg))';
        case 'bg':
        case 'background':
            return 'var(--color-bg)';
        case 'text':
            return 'var(--color-text)';
        case 'white':
            return '#ffffff';
        case 'black':
            return '#171717';
        default:
            return raw;
    }
}

function scrambleAttrSource(host) {
    if (!(host instanceof Element)) return null;
    return host.closest('[data-scramble]') || host;
}

function resolveScrambleVariant(source, host) {
    const name = (
        readScrambleAttr(source, 'variant') ||
        readScrambleAttr(host, 'variant') ||
        'auto'
    ).toLowerCase();
    if (!name || name === 'auto') return null;
    return SCRAMBLE_VARIANTS[name] || null;
}

/**
 * Resolve block + glyph colors.
 * Priority: explicit bg/fg attrs → variant preset → auto bg (no fg).
 */
export function resolveScrambleVars(host) {
    const source = scrambleAttrSource(host);
    const variant = resolveScrambleVariant(source, host);

    const bgToken =
        readScrambleAttr(source, 'bg') ||
        readScrambleAttr(host, 'bg');
    const fgToken =
        readScrambleAttr(source, 'fg') ||
        readScrambleAttr(host, 'fg');

    const bg =
        resolveScrambleColorToken(bgToken) ||
        variant?.bg ||
        resolveScrambleBg(host);
    const fg =
        resolveScrambleColorToken(fgToken) ||
        variant?.fg ||
        '';

    return { bg, fg };
}

export function applyScrambleVars(host) {
    if (!(host instanceof Element)) return;
    const { bg, fg } = resolveScrambleVars(host);
    host.style.setProperty('--scramble-bg', bg);
    if (fg) host.style.setProperty('--scramble-fg', fg);
    else host.style.removeProperty('--scramble-fg');
}

function clearTimers(el) {
    const list = timersByEl.get(el);
    if (!list) return;
    list.forEach(clearTimeout);
    timersByEl.delete(el);
}

function storeTimer(el, id) {
    let list = timersByEl.get(el);
    if (!list) {
        list = [];
        timersByEl.set(el, list);
    }
    list.push(id);
}

/**
 * Wrap an element's text with scramble markup (opt-in helper).
 * For <a>/<button>, nests an inner span so layout classes stay intact.
 */
export function wrapElement(el) {
    if (!el || el.dataset.scrambleWrapped === 'true') return el;
    if (el.querySelector(':scope > .scramble-host, .scramble-char')) {
        el.dataset.scrambleWrapped = 'true';
        return el.querySelector('.scramble-host') || el;
    }

    const text = el.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) return el;

    if (el.matches('a, button')) {
        const span = document.createElement('span');
        span.className = 'scramble-host';
        span.innerHTML = wrapWordsHtml(text);
        span.dataset.scrambleWrapped = 'true';
        el.textContent = '';
        el.appendChild(span);
        el.dataset.scrambleWrapped = 'true';
        applyScrambleVars(span);
        return span;
    }

    el.innerHTML = wrapWordsHtml(text);
    el.dataset.scrambleWrapped = 'true';
    el.classList.add('scramble-host');
    applyScrambleVars(el);
    return el;
}

/** Flash random glyph blocks over scramble chars (Keel timing). */
export function playScramble(el, { onComplete, allowMobile = false } = {}) {
    const allowed = allowMobile ? !prefersReducedMotion() : canScramble();
    if (!el || !allowed) {
        onComplete?.();
        return;
    }

    clearTimers(el);

    const randoms = [...el.querySelectorAll('.scramble-random')];
    randoms.forEach((node) => {
        node.textContent = randomScrambleChar();
        node.style.opacity = '0';
    });

    if (randoms.length === 0) {
        onComplete?.();
        return;
    }

    if (el instanceof Element) {
        applyScrambleVars(el);
    }

    randoms.forEach((node, i) => {
        const showAt = i * 50;
        const hideAt = 150 + i * 50;
        storeTimer(
            el,
            setTimeout(() => {
                node.style.opacity = '1';
            }, showAt),
        );
        storeTimer(
            el,
            setTimeout(() => {
                node.style.opacity = '0';
            }, hideAt),
        );
    });

    const doneAt = 150 + (randoms.length - 1) * 50 + 80;
    storeTimer(
        el,
        setTimeout(() => onComplete?.(), doneAt),
    );
}

export function stopScramble(el) {
    if (!el) return;
    clearTimers(el);
    el.querySelectorAll('.scramble-random').forEach((node) => {
        node.style.opacity = '0';
    });
}

/** Opt-in: bind mouseenter/focus scramble on a trigger for one or more hosts. */
export function bindScrambleHover(trigger, hosts) {
    if (!trigger || boundTriggers.has(trigger)) return;
    const targets = (Array.isArray(hosts) ? hosts : [hosts]).filter(Boolean);
    if (targets.length === 0) return;

    boundTriggers.add(trigger);
    trigger.classList.add('scramble-on-hover');

    const play = () => {
        if (!canScramble()) return;
        targets.forEach((t) => playScramble(t));
    };

    trigger.addEventListener('mouseenter', play);
    trigger.addEventListener('focus', play);
}

/**
 * Opt-in helper: wrap text in `textEl` (or trigger) and scramble on trigger hover.
 * @param {Element} trigger
 * @param {Element} [textEl]
 */
export function enableScrambleOn(trigger, textEl = trigger) {
    if (!trigger || !textEl) return;
    const host = wrapElement(textEl);
    bindScrambleHover(trigger, host);
}

/** Prefer an inner text node (p/span) so button chrome / icons stay untouched. */
function resolveTextHost(trigger) {
    const marked = trigger.querySelector('[data-scramble-text]');
    if (marked) return marked;

    const candidate = [...trigger.querySelectorAll('p, span')].find((el) => {
        if (el.closest('svg')) return false;
        if (el.querySelector('img, svg, .scramble-char')) return false;
        return !!el.textContent?.replace(/\s+/g, ' ').trim();
    });

    return candidate || trigger;
}

/**
 * Enable scramble only on elements explicitly marked with [data-scramble].
 */
export function initMarkedScrambles(root = document) {
    root.querySelectorAll('[data-scramble]').forEach((trigger) => {
        if (boundTriggers.has(trigger)) return;
        enableScrambleOn(trigger, resolveTextHost(trigger));
    });
}

function bootMarked() {
    initMarkedScrambles();
}

if (typeof document !== 'undefined') {
    // ClientRouter soft navigations replace page DOM — re-bind [data-scramble]
    // on every page-load (same pattern as available-text / reveal / count-up).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootMarked);
    } else {
        bootMarked();
    }
    document.addEventListener('astro:page-load', bootMarked);
}
