/**
 * Skill chip tooltips: hover on fine pointers; tap-to-toggle on touch.
 * CSS alone cannot show tooltips reliably on (hover: none) — sticky :hover is flaky.
 */
import { bootOnce } from './boot-once';

const OPEN = 'is-open';

function isTouchUi(): boolean {
    return window.matchMedia('(hover: none)').matches;
}

function tipFor(chip: Element): Element | null {
    return chip.querySelector('.skill-tooltip');
}

function setOpen(chip: HTMLElement, open: boolean): void {
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
}
