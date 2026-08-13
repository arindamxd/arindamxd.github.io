/**
 * Skill chip tooltips: hover on fine pointers; tap-to-toggle on touch.
 * CSS alone cannot show tooltips reliably on (hover: none) — sticky :hover is flaky.
 * Edge chips shift `--tip-shift` / `--caret-shift` so the bubble stays in the viewport
 * (home `overflow-x-hidden` would otherwise clip a centered tooltip).
 */
import { bootOnce } from './boot-once';

const OPEN = 'is-open';
const VIEW_PAD = 10;
const CARET_INSET = 14;

function isTouchUi(): boolean {
    return window.matchMedia('(hover: none)').matches;
}

function tipFor(chip: Element): HTMLElement | null {
    const el = chip.querySelector('.skill-tooltip');
    return el instanceof HTMLElement ? el : null;
}

function placeTip(chip: HTMLElement): void {
    const tip = tipFor(chip);
    if (!tip) return;

    const tipWidth = tip.offsetWidth;
    if (tipWidth === 0) return;

    const chipRect = chip.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const center = chipRect.left + chipRect.width / 2;
    const unshiftedLeft = center - tipWidth / 2;
    const unshiftedRight = center + tipWidth / 2;

    let shift = 0;
    if (unshiftedLeft < VIEW_PAD) shift = VIEW_PAD - unshiftedLeft;
    else if (unshiftedRight > vw - VIEW_PAD) shift = vw - VIEW_PAD - unshiftedRight;

    const maxCaret = Math.max(0, tipWidth / 2 - CARET_INSET);
    const caret = Math.max(-maxCaret, Math.min(maxCaret, -shift));
    tip.style.setProperty('--tip-shift', `${shift}px`);
    tip.style.setProperty('--caret-shift', `${caret}px`);
}

function placeAll(root: ParentNode = document): void {
    root.querySelectorAll('.skill-chip').forEach((el) => {
        if (el instanceof HTMLElement) placeTip(el);
    });
}

function setOpen(chip: HTMLElement, open: boolean): void {
    if (open) placeTip(chip);
    chip.classList.toggle(OPEN, open);
    chip.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && document.activeElement === chip) chip.blur();
}

function closeAll(except?: Element | null): void {
    document.querySelectorAll(`.skill-chip.${OPEN}`).forEach((el) => {
        if (el === except || !(el instanceof HTMLElement)) return;
        setOpen(el, false);
    });
}

function bindChip(chip: HTMLElement): void {
    if (chip.dataset.skillTipBound === '1') return;
    if (!tipFor(chip)) return;

    chip.dataset.skillTipBound = '1';
    if (!chip.hasAttribute('aria-expanded')) {
        chip.setAttribute('aria-expanded', 'false');
    }

    chip.addEventListener('pointerenter', () => {
        placeTip(chip);
    });

    chip.addEventListener('click', () => {
        if (!isTouchUi()) return;
        const next = !chip.classList.contains(OPEN);
        closeAll(next ? chip : null);
        setOpen(chip, next);
    });

    chip.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(chip, false);
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const next = !chip.classList.contains(OPEN);
        closeAll(next ? chip : null);
        setOpen(chip, next);
    });
}

function onPointerDownOutside(event: Event): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    const chip = target instanceof Element ? target.closest('.skill-chip') : null;
    if (chip) return;
    closeAll();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.classList.contains('skill-chip')) {
        active.blur();
    }
}

export function initSkillTooltips(root: ParentNode = document): void {
    root.querySelectorAll('.skill-chip').forEach((el) => {
        if (el instanceof HTMLElement) bindChip(el);
    });
    requestAnimationFrame(() => placeAll(root));
}

function boot(): void {
    initSkillTooltips();
}

if (typeof document !== 'undefined' && bootOnce('skill-tooltips')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    document.addEventListener('astro:page-load', boot);
    document.addEventListener('pointerdown', onPointerDownOutside, true);
    window.addEventListener('resize', () => placeAll(), { passive: true });
}
