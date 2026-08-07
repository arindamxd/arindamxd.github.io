/**
 * "Available for …" — auto-cycles words with Keel-style scramble on an interval.
 */
import {
    canScramble,
    wrapWordsHtml,
    playScramble,
    stopScramble,
    resolveScrambleBg,
} from './scramble-text.js';

const SMALL_TEXT ='m-0 p-0 font-manrope text-[13px] font-semibold leading-[120%] tracking-[-0.05em] text-text max-framer:text-[12px]';
const MUTED = 'text-text/60';
const WORDS = ['opportunities', 'discussion', 'collaborate', 'freelance', 'projects'];
/** Time between word changes (scramble itself is ~0.8–1.2s). */
const CYCLE_MS = 2800;
const MOBILE_MQ = '(max-width: 610px)';
const LONGEST_CH = Math.max(...WORDS.map((w) => w.length));

let wordIndex = 0;
let cycleTimer = null;
let isAnimating = false;

function getTarget() {
    return document.querySelector('.available-scramble');
}

function applyWord(target, word) {
    target.innerHTML = wrapWordsHtml(word);
    target.setAttribute('data-word', word);
    target.setAttribute('aria-label', `Available for ${word}`);
    target.dataset.scrambleWrapped = 'true';
    if (target instanceof Element) {
        target.style.setProperty('--scramble-bg', resolveScrambleBg(target));
    }
}

function setWord(word, { animate = false } = {}) {
    const target = getTarget();
    if (!target) return;

    if (!animate || !canScramble()) {
        applyWord(target, word);
        return;
    }

    if (isAnimating) return;
    isAnimating = true;

    playScramble(target, {
        onComplete: () => {
            applyWord(target, word);
            playScramble(getTarget(), {
                onComplete: () => {
                    isAnimating = false;
                },
            });
        },
    });
}

function advanceWord() {
    if (isAnimating) return;
    if (document.hidden) return;
    wordIndex = (wordIndex + 1) % WORDS.length;
    setWord(WORDS[wordIndex], { animate: true });
}

function stopCycle() {
    if (cycleTimer) {
        clearInterval(cycleTimer);
        cycleTimer = null;
    }
    isAnimating = false;
    stopScramble(getTarget());
}

function startCycle() {
    stopCycle();
    cycleTimer = setInterval(advanceWord, CYCLE_MS);
}

function updateAvailableText() {
    const container = document.querySelector('.available-text-container');
    if (!container) return;

    const currentWord = WORDS[wordIndex] || WORDS[0];
    const isMobile = window.matchMedia(MOBILE_MQ).matches;
    const wordHtml = `<span class="available-scramble scramble-host ${MUTED}" data-word="${currentWord}" data-no-scramble aria-label="Available for ${currentWord}" style="min-width:${LONGEST_CH}ch">${wrapWordsHtml(currentWord)}</span>`;

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

function init() {
    updateAvailableText();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('resize', updateAvailableText);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCycle();
    } else if (getTarget()) {
        startCycle();
    }
});
