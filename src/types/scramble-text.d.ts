declare module "scramble-text" {
    export default class ScrambleText {
        constructor(
            el: HTMLElement,
            option?: {
                timeOffset?: number;
                fps?: number;
                chars?: string[];
                callback?: () => void;
            },
        );
        play(): this;
        start(): this;
        stop(): this;
    }
}
