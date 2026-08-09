/**
 * "Available for …" — auto-cycles words with Keel-style scramble on an interval.
 */
import {
    prefersReducedMotion,
    wrapWordsHtml,
    playScramble,
    stopScramble,
    resolveScrambleBg,
} from './scramble-text';

const SMALL_TEXT ='m-0 p-0 font-manrope text-[13px] font-semibold leading-[120%] tracking-[-0.05em] text-text max-narrow:text-[12px]';
const MUTED = 'text-text/60';
const WORDS = ['opportunities', 'discussion', 'collaborate', 'meetups', 'projects'] as const;
/** Time between word changes (scramble itself is ~0.8–1.2s). */
const CYCLE_MS = 2800;
const MOBILE_MQ = '(max-width: 610px)';

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

function updateAvailableText(): void {
    const container = document.querySelector('.available-text-container');
    if (!(container instanceof HTMLElement)) return;

    const currentWord = WORDS[wordIndex] || WORDS[0];
    const isMobile = window.matchMedia(MOBILE_MQ).matches;
    const wordHtml = `<span class="available-scramble scramble-host ${MUTED}" data-word="${currentWord}" data-no-scramble aria-label="Available for ${currentWord}">${wrapWordsHtml(currentWord)}</span>`;

    stopCycle();

    if (isMobile) {
        container.innerHTML = `<p class="${SMALL_TEXT}">Available for ${wordHtml}</p>`;
    } else {
        container.innerHTML = `
            <p class="${SMALL_TEXT}">Available for</p>
            <p class="${SMALL_TEXT}">${wordHtml}</p>
        `;
    }

    const target = getTarget();
    if (target) {
        target.style.setProperty('--scramble-bg', resolveScrambleBg(target));
    }

    startCycle();
}

function init(): void {
    if (!document.querySelector('.available-text-container')) {
        stopCycle();
        return;
    }
    updateAvailableText();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

document.addEventListener('astro:page-load', init);

window.addEventListener('resize', updateAvailableText);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCycle();
    } else if (getTarget()) {
        startCycle();
    }
});
