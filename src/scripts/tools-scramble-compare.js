/**
 * /tools/scramble-compare — hover + play bake-off:
 * ours | @scrambl/core | scramble-text | scrmbl
 */
import { wrapElement, playScramble, stopScramble, prefersReducedMotion } from './scramble-text.js';
import { scramble as scramblCore } from '@scrambl/core';
import ScrambleText from 'scramble-text';
import { scramble as scrmblVanilla } from 'scrmbl';

const DEFAULT_TEXT = 'Technical Lead · Mobile Engineering';

function init() {
    const root = document.getElementById('tools-scramble-compare');
    if (!root) return;

    if (root._scrambleCompareAbort instanceof AbortController) {
        root._scrambleCompareAbort.abort();
    }
    const ac = new AbortController();
    root._scrambleCompareAbort = ac;
    const { signal } = ac;

    const input = document.getElementById('scramble-sample');
    const stages = {
        ours: root.querySelector('[data-scramble-stage="ours"]'),
        scrambl: root.querySelector('[data-scramble-stage="scrambl"]'),
        'scramble-text': root.querySelector('[data-scramble-stage="scramble-text"]'),
        scrmbl: root.querySelector('[data-scramble-stage="scrmbl"]'),
    };

    /** @type {Record<string, any>} */
    const runtime = {
        oursHost: null,
        scramblInst: null,
        scrambleTextInst: null,
        scrmblCtrl: null,
    };

    function sampleText() {
        if (input instanceof HTMLInputElement) {
            const v = input.value.replace(/\s+/g, ' ').trim();
            return v || DEFAULT_TEXT;
        }
        return root.dataset.sample || DEFAULT_TEXT;
    }

    function setPlain(el, text) {
        if (!(el instanceof HTMLElement)) return;
        el.textContent = text;
        el.removeAttribute('data-scramble-wrapped');
        el.classList.remove('scramble-host');
    }

    function destroyEngines() {
        stopScramble(runtime.oursHost);
        runtime.oursHost = null;

        try {
            runtime.scramblInst?.destroy?.();
        } catch (_) {}
        runtime.scramblInst = null;

        try {
            runtime.scrambleTextInst?.stop?.();
        } catch (_) {}
        runtime.scrambleTextInst = null;

        try {
            runtime.scrmblCtrl?.destroy?.();
        } catch (_) {}
        runtime.scrmblCtrl = null;
    }

    function resetAll() {
        destroyEngines();
        const text = sampleText();
        Object.values(stages).forEach((el) => setPlain(el, text));
    }

    function playOurs() {
        const el = stages.ours;
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        if (prefersReducedMotion()) {
            setPlain(el, text);
            return;
        }
        stopScramble(runtime.oursHost);
        setPlain(el, text);
        runtime.oursHost = wrapElement(el);
        playScramble(runtime.oursHost, { allowMobile: true });
    }

    function playScrambl() {
        const el = stages.scrambl;
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        try {
            runtime.scramblInst?.destroy?.();
        } catch (_) {}
        setPlain(el, text);
        if (prefersReducedMotion()) return;
        runtime.scramblInst = scramblCore(el, {
            text,
            duration: 700,
            chars: '0+-*|{}`/()$&',
            from: 'left',
        });
    }

    function playScrambleTextPkg() {
        const el = stages['scramble-text'];
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        try {
            runtime.scrambleTextInst?.stop?.();
        } catch (_) {}
        setPlain(el, text);
        if (prefersReducedMotion()) return;
        runtime.scrambleTextInst = new ScrambleText(el, {
            timeOffset: 40,
            chars: Array.from('0+-*|{}`/()$&'),
        });
        runtime.scrambleTextInst.play().start();
    }

    function playScrmbl() {
        const el = stages.scrmbl;
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        if (runtime.scrmblCtrl) {
            try {
                runtime.scrmblCtrl.update(text);
                if (!prefersReducedMotion()) runtime.scrmblCtrl.replay();
                return;
            } catch (_) {
                try {
                    runtime.scrmblCtrl.destroy();
                } catch (__) {}
                runtime.scrmblCtrl = null;
            }
        }
        setPlain(el, text);
        if (prefersReducedMotion()) return;
        runtime.scrmblCtrl = scrmblVanilla(el, {
            duration: 700,
            charset: '0+-*|{}`/()$&',
            order: 'start',
            respectReducedMotion: true,
        });
    }

    const players = {
        ours: playOurs,
        scrambl: playScrambl,
        'scramble-text': playScrambleTextPkg,
        scrmbl: playScrmbl,
    };

    function playOne(id) {
        players[id]?.();
    }

    function playAll() {
        Object.keys(players).forEach(playOne);
    }

    root.querySelectorAll('.tools-scramble-card').forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        const id = card.getAttribute('data-engine');
        if (!id || !players[id]) return;

        const run = () => playOne(id);
        card.addEventListener('mouseenter', run, { signal });
        card.addEventListener('focusin', run, { signal });
    });

    root.querySelectorAll('[data-scramble-action]').forEach((btn) => {
        btn.addEventListener(
            'click',
            (event) => {
                event.stopPropagation();
                const action = btn.getAttribute('data-scramble-action');
                if (action === 'play-all') {
                    playAll();
                    return;
                }
                if (action === 'reset') {
                    resetAll();
                    return;
                }
                if (action === 'play') {
                    playOne(btn.getAttribute('data-engine') || '');
                }
            },
            { signal }
        );
    });

    if (input instanceof HTMLInputElement) {
        let t = 0;
        input.addEventListener(
            'input',
            () => {
                clearTimeout(t);
                t = window.setTimeout(() => resetAll(), 200);
            },
            { signal }
        );
        input.addEventListener('change', () => resetAll(), { signal });
    }

    signal.addEventListener('abort', () => destroyEngines());
    resetAll();
}

init();
document.addEventListener('astro:page-load', init);
