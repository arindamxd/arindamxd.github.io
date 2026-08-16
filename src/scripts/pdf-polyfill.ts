/**
 * pdf.js 6 uses APIs Cursor’s Simple Browser (older Electron) may lack.
 * Must run before pdfjs-dist is imported / getDocument is called.
 */
type Resolvers<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

type PromiseCtor = PromiseConstructor & {
    withResolvers?: <T>() => Resolvers<T>;
};

const PromiseImpl = Promise as PromiseCtor;
if (typeof PromiseImpl.withResolvers !== "function") {
    PromiseImpl.withResolvers = function withResolvers<T>(): Resolvers<T> {
        let resolve!: Resolvers<T>["resolve"];
        let reject!: Resolvers<T>["reject"];
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

type UrlParser = (url: string | URL, base?: string | URL) => URL | null;

const UrlCtor = URL as typeof URL & { parse?: UrlParser };
if (typeof UrlCtor.parse !== "function") {
    UrlCtor.parse = (url, base) => {
        try {
            return base === undefined ? new URL(url) : new URL(url, base);
        } catch {
            return null;
        }
    };
}

type KeyedCollection = {
    has: (key: unknown) => boolean;
    get: (key: unknown) => unknown;
    set: (key: unknown, value: unknown) => unknown;
    getOrInsert?: (key: unknown, value: unknown) => unknown;
    getOrInsertComputed?: (key: unknown, callbackfn: (key: unknown) => unknown) => unknown;
};

function patchUpsert(proto: KeyedCollection): void {
    if (typeof proto.getOrInsert !== "function") {
        proto.getOrInsert = function getOrInsert(this: KeyedCollection, key, value) {
            if (this.has(key)) return this.get(key);
            this.set(key, value);
            return value;
        };
    }
    if (typeof proto.getOrInsertComputed !== "function") {
        proto.getOrInsertComputed = function getOrInsertComputed(
            this: KeyedCollection,
            key,
            callbackfn,
        ) {
            if (this.has(key)) return this.get(key);
            const value = callbackfn(key);
            this.set(key, value);
            return value;
        };
    }
}

patchUpsert(Map.prototype as unknown as KeyedCollection);
patchUpsert(WeakMap.prototype as unknown as KeyedCollection);
