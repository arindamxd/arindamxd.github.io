/**
 * /tools/scramble-compare — hover + play bake-off:
 * ours | @scrambl/core | scramble-text | scrmbl
 */
import { bootOnce } from './boot-once';
import { wrapElement, playScramble, stopScramble, prefersReducedMotion } from './scramble-text';
import { scramble as scramblCore, type ScrambleInstance } from '@scrambl/core';
import ScrambleText from 'scramble-text';
import { scramble as scrmblVanilla, type ScrambleController } from 'scrmbl';

const DEFAULT_TEXT = 'Technical Lead · Mobile Engineering';

type EngineId = 'ours' | 'scrambl' | 'scramble-text' | 'scrmbl';

type CompareRuntime = {
    oursHost: HTMLElement | null;
    scramblInst: ScrambleInstance | null;
    scrambleTextInst: ScrambleText | null;
    scrmblCtrl: ScrambleController | null;
};

function init(): void {
    const rootEl = document.getElementById('tools-scramble-compare');
    if (!rootEl) return;
    const root = rootEl;

    if (root._scrambleCompareAbort instanceof AbortController) {
        root._scrambleCompareAbort.abort();
    }
    const ac = new AbortController();
    root._scrambleCompareAbort = ac;
    const { signal } = ac;

    const input = document.getElementById('scramble-sample');
    const stages: Record<EngineId, Element | null> = {
        ours: root.querySelector('[data-scramble-stage="ours"]'),
        scrambl: root.querySelector('[data-scramble-stage="scrambl"]'),
        'scramble-text': root.querySelector('[data-scramble-stage="scramble-text"]'),
        scrmbl: root.querySelector('[data-scramble-stage="scrmbl"]'),
    };

    const runtime: CompareRuntime = {
        oursHost: null,
        scramblInst: null,
        scrambleTextInst: null,
        scrmblCtrl: null,
    };

    function sampleText(): string {
        if (input instanceof HTMLInputElement) {
            const v = input.value.replace(/\s+/g, ' ').trim();
            return v || DEFAULT_TEXT;
        }
        return root.dataset.sample || DEFAULT_TEXT;
    }

    function setPlain(el: Element | null, text: string): void {
        if (!(el instanceof HTMLElement)) return;
        el.textContent = text;
        el.removeAttribute('data-scramble-wrapped');
        el.classList.remove('scramble-host');
    }

    function destroyEngines(): void {
        stopScramble(runtime.oursHost);
        runtime.oursHost = null;

        try {
            runtime.scramblInst?.destroy?.();
        } catch {
            /* ignore */
        }
        runtime.scramblInst = null;

        try {
            runtime.scrambleTextInst?.stop?.();
        } catch {
            /* ignore */
        }
        runtime.scrambleTextInst = null;

        try {
            runtime.scrmblCtrl?.destroy?.();
        } catch {
            /* ignore */
        }
        runtime.scrmblCtrl = null;
    }

    function resetAll(): void {
        destroyEngines();
        const text = sampleText();
        Object.values(stages).forEach((el) => setPlain(el, text));
    }

    function playOurs(): void {
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

    function playScrambl(): void {
        const el = stages.scrambl;
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        try {
            runtime.scramblInst?.destroy?.();
        } catch {
            /* ignore */
        }
        setPlain(el, text);
        if (prefersReducedMotion()) return;
        runtime.scramblInst = scramblCore(el, {
            text,
            duration: 700,
            chars: '0+-*|{}`/()$&',
            from: 'left',
        });
    }

    function playScrambleTextPkg(): void {
        const el = stages['scramble-text'];
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        try {
            runtime.scrambleTextInst?.stop?.();
        } catch {
            /* ignore */
        }
        setPlain(el, text);
        if (prefersReducedMotion()) return;
        runtime.scrambleTextInst = new ScrambleText(el, {
            timeOffset: 40,
            chars: Array.from('0+-*|{}`/()$&'),
        });
        runtime.scrambleTextInst.play().start();
    }

    function playScrmbl(): void {
        const el = stages.scrmbl;
        if (!(el instanceof HTMLElement)) return;
        const text = sampleText();
        if (runtime.scrmblCtrl) {
            try {
                runtime.scrmblCtrl.update(text);
                if (!prefersReducedMotion()) runtime.scrmblCtrl.replay();
                return;
            } catch {
                try {
                    runtime.scrmblCtrl.destroy();
                } catch {
                    /* ignore */
                }
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

    const players: Record<EngineId, () => void> = {
        ours: playOurs,
        scrambl: playScrambl,
        'scramble-text': playScrambleTextPkg,
        scrmbl: playScrmbl,
    };

    function isEngineId(id: string): id is EngineId {
        return id in players;
    }

    function playOne(id: string): void {
        if (!isEngineId(id)) return;
        players[id]();
    }

    function playAll(): void {
        (Object.keys(players) as EngineId[]).forEach(playOne);
    }

    root.querySelectorAll('.tools-scramble-card').forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        const id = card.getAttribute('data-engine');
        if (!id || !isEngineId(id)) return;

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

if (bootOnce('tools-scramble-compare')) {
    init();
    document.addEventListener('astro:page-load', init);
}
