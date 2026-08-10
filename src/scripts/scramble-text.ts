/**
 * Shared Keel-style scramble text helpers.
 * Opt-in only — call bindScrambleHover / wrapElement explicitly.
 * (Available-for word cycle uses these from available-text.ts.)
 */

export const SCRAMBLE_CHARS = '0+-*|{}`/()$&';
/** Disable hover scramble on small viewports (Keel). Available-for auto-cycle ignores this. */
export const NO_SCRAMBLE_MQ = '(max-width: 1080px)';
/** True hover (mouse/trackpad) — not sticky touch hover. */
export const FINE_HOVER_MQ = '(hover: hover) and (pointer: fine)';
export const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

export interface PlayScrambleOptions {
    onComplete?: () => void;
    allowMobile?: boolean;
}

export type ScrambleVariantColors = {
    bg: string;
    fg: string;
};

const timersByEl = new WeakMap<Element, number[]>();
const boundTriggers = new WeakSet<Element>();

export function prefersReducedMotion(): boolean {
    return window.matchMedia(REDUCED_MOTION_MQ).matches;
}

/** Desktop hover/focus scramble: wide viewport + fine pointer + motion OK */
export function canScramble(): boolean {
    return (
        !window.matchMedia(NO_SCRAMBLE_MQ).matches &&
        window.matchMedia(FINE_HOVER_MQ).matches &&
        !prefersReducedMotion()
    );
}

/** Touch / coarse UI: scramble on tap (width gate does not apply). */
export function canTapScramble(): boolean {
    return !window.matchMedia(FINE_HOVER_MQ).matches && !prefersReducedMotion();
}

export function randomScrambleChar(): string {
    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]!;
}

function escapeHtml(ch: string): string {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return ch;
}

/** Build inner HTML of scramble char spans for a plain string (no HTML). */
export function wrapWordsHtml(text: string): string {
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

function isTransparent(bg: string): boolean {
    return (
        !bg ||
        bg === 'transparent' ||
        bg === 'rgba(0, 0, 0, 0)' ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)$/i.test(bg)
    );
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
    const m = String(color).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (!m) return null;
    return { r: +m[1]!, g: +m[2]!, b: +m[3]! };
}

function relativeLuminance(color: string): number {
    const rgb = parseRgb(color);
    if (!rgb) return 0;
    const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

export function resolveScrambleBg(host: Element): string {
    let found: string | null = null;
    let node: Element | null = host;
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
export const SCRAMBLE_VARIANTS: Record<string, ScrambleVariantColors | null> = {
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
function readScrambleAttr(el: Element | null, name: string): string {
    if (!(el instanceof Element)) return '';
    return el.getAttribute(`data-scramble-${name}`)?.trim() || '';
}

/** Map short tokens to CSS values; anything else passes through as-is. */
function resolveScrambleColorToken(value: string): string {
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

function scrambleAttrSource(host: Element): Element | null {
    if (!(host instanceof Element)) return null;
    return host.closest('[data-scramble]') || host;
}

function resolveScrambleVariant(
    source: Element | null,
    host: Element,
): ScrambleVariantColors | null {
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
export function resolveScrambleVars(host: Element): { bg: string; fg: string } {
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

export function applyScrambleVars(host: Element): void {
    if (!(host instanceof HTMLElement)) return;
    const { bg, fg } = resolveScrambleVars(host);
    host.style.setProperty('--scramble-bg', bg);
    if (fg) host.style.setProperty('--scramble-fg', fg);
    else host.style.removeProperty('--scramble-fg');
}

function clearTimers(el: Element): void {
    const list = timersByEl.get(el);
    if (!list) return;
    list.forEach(clearTimeout);
    timersByEl.delete(el);
}

function storeTimer(el: Element, id: number): void {
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
export function wrapElement(el: HTMLElement): HTMLElement {
    if (!el || el.dataset.scrambleWrapped === 'true') return el;
    if (el.querySelector(':scope > .scramble-host, .scramble-char')) {
        el.dataset.scrambleWrapped = 'true';
        const host = el.querySelector('.scramble-host');
        return host instanceof HTMLElement ? host : el;
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
export function playScramble(
    el: Element | null | undefined,
    { onComplete, allowMobile = false }: PlayScrambleOptions = {},
): void {
    const allowed = allowMobile ? !prefersReducedMotion() : canScramble();
    if (!el || !allowed) {
        onComplete?.();
        return;
    }

    clearTimers(el);

    const randoms = [...el.querySelectorAll('.scramble-random')];
    randoms.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
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
        if (!(node instanceof HTMLElement)) return;
        const showAt = i * 50;
        const hideAt = 150 + i * 50;
        storeTimer(
            el,
            window.setTimeout(() => {
                node.style.opacity = '1';
            }, showAt),
        );
        storeTimer(
            el,
            window.setTimeout(() => {
                node.style.opacity = '0';
            }, hideAt),
        );
    });

    const doneAt = 150 + (randoms.length - 1) * 50 + 80;
    storeTimer(
        el,
        window.setTimeout(() => onComplete?.(), doneAt),
    );
}

export function stopScramble(el: Element | null | undefined): void {
    if (!el) return;
    clearTimers(el);
    el.querySelectorAll('.scramble-random').forEach((node) => {
        if (node instanceof HTMLElement) node.style.opacity = '0';
    });
}

/** Opt-in: bind hover/focus (desktop) + pointerdown tap (touch) scramble. */
export function bindScrambleHover(
    trigger: Element | null | undefined,
    hosts: Element | (Element | null | undefined)[] | null | undefined,
): void {
    if (!trigger || boundTriggers.has(trigger)) return;
    const targets = (Array.isArray(hosts) ? hosts : [hosts]).filter(
        (t): t is Element => Boolean(t),
    );
    if (targets.length === 0) return;

    boundTriggers.add(trigger);
    trigger.classList.add('scramble-on-hover');

    const playHover = () => {
        if (!canScramble()) return;
        targets.forEach((t) => playScramble(t));
    };

    /** Touch taps are intermittent via synthetic mouseenter — drive scramble from pointerdown. */
    const playTap = (event: Event) => {
        if (!canTapScramble()) return;
        if (event instanceof PointerEvent && event.pointerType === 'mouse') return;
        targets.forEach((t) => playScramble(t, { allowMobile: true }));
    };

    trigger.addEventListener('mouseenter', playHover);
    trigger.addEventListener('focus', playHover);
    trigger.addEventListener('pointerdown', playTap);
}

/**
 * Opt-in helper: wrap text in `textEl` (or trigger) and scramble on trigger hover.
 */
export function enableScrambleOn(
    trigger: Element | null | undefined,
    textEl: Element | null | undefined = trigger,
): void {
    if (!trigger || !textEl) return;
    if (!(textEl instanceof HTMLElement)) return;
    const host = wrapElement(textEl);
    bindScrambleHover(trigger, host);
}

/** Prefer an inner text node (p/span) so button chrome / icons stay untouched. */
function resolveTextHost(trigger: Element): Element {
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
export function initMarkedScrambles(root: ParentNode = document): void {
    root.querySelectorAll('[data-scramble]').forEach((trigger) => {
        if (boundTriggers.has(trigger)) return;
        enableScrambleOn(trigger, resolveTextHost(trigger));
    });
}

function bootMarked(): void {
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
