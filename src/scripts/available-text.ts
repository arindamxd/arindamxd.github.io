/**
 * "Available for …" — auto-cycles words with Keel-style scramble on an interval.
 * Markup is SSR’d; this script only cycles the word. Mobile vs desktop layout is CSS.
 */
import { bootOnce } from './boot-once';
import { AVAILABLE_WORDS } from '../utils/available-words';
import {
    prefersReducedMotion,
    wrapWordsHtml,
    playScramble,
    stopScramble,
    resolveScrambleBg,
} from './scramble-text';

const SMALL_TEXT ='m-0 p-0 font-manrope text-[13px] font-semibold leading-[120%] tracking-[-0.05em] text-text max-narrow:text-[12px]';
const MUTED = 'text-text/60';
const WORDS = AVAILABLE_WORDS;
/** Time between word changes (scramble itself is ~0.8–1.2s). */
const CYCLE_MS = 2800;

let wordIndex = 0;
let cycleTimer: ReturnType<typeof setInterval> | null = null;
let isAnimating = false;

function getTarget(): HTMLElement | null {
    const el = document.querySelector('.available-scramble');
    return el instanceof HTMLElement ? el : null;
}

function applyWord(target: HTMLElement, word: string): void {
    target.innerHTML = wrapWordsHtml(word);
    target.setAttribute('data-word', word);
    target.setAttribute('aria-label', `Available for ${word}`);
    target.dataset.scrambleWrapped = 'true';
    target.style.setProperty('--scramble-bg', resolveScrambleBg(target));
}

function setWord(word: string, { animate = false }: { animate?: boolean } = {}): void {
    const target = getTarget();
    if (!target) return;

    if (!animate || prefersReducedMotion()) {
        applyWord(target, word);
        return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const scrambleOpts = { allowMobile: true };

    playScramble(target, {
        ...scrambleOpts,
        onComplete: () => {
            applyWord(target, word);
            playScramble(getTarget(), {
                ...scrambleOpts,
                onComplete: () => {
                    isAnimating = false;
                },
            });
        },
    });
}

function advanceWord(): void {
    if (isAnimating) return;
    if (document.hidden) return;
    wordIndex = (wordIndex + 1) % WORDS.length;
    setWord(WORDS[wordIndex]!, { animate: true });
}

function stopCycle(): void {
    if (cycleTimer) {
        clearInterval(cycleTimer);
        cycleTimer = null;
    }
    isAnimating = false;
    stopScramble(getTarget());
}

function startCycle(): void {
    stopCycle();
    cycleTimer = setInterval(advanceWord, CYCLE_MS);
}

function ensureMarkup(container: HTMLElement): void {
    if (container.querySelector('.available-scramble')) return;

    const currentWord = WORDS[wordIndex] || WORDS[0];
    container.innerHTML = `
        <p class="${SMALL_TEXT}">Available for</p>
        <p class="${SMALL_TEXT}">
            <span class="available-scramble scramble-host ${MUTED}" data-word="${currentWord}" data-no-scramble aria-label="Available for ${currentWord}">${currentWord}</span>
        </p>
    `;
}

function init(): void {
    const container = document.querySelector('.available-text-container');
    if (!(container instanceof HTMLElement)) {
        stopCycle();
        return;
    }

    ensureMarkup(container);

    const target = getTarget();
    if (target) {
        const attr = target.getAttribute('data-word') || WORDS[0];
        const idx = WORDS.indexOf(attr as (typeof WORDS)[number]);
        wordIndex = idx >= 0 ? idx : 0;
        applyWord(target, WORDS[wordIndex]!);
        startCycle();
    }
}

if (bootOnce('available-text')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('astro:page-load', init);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCycle();
        } else if (getTarget()) {
            startCycle();
        }
    });
}
