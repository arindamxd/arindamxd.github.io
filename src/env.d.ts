/// <reference types="astro/client" />

import type Lenis from "lenis";

interface GtagFunction {
    (command: "js", date: Date): void;
    (
        command: "config",
        targetId: string,
        config?: Record<string, unknown>,
    ): void;
    (
        command: "event",
        eventName: string,
        params?: Record<string, unknown>,
    ): void;
    (...args: unknown[]): void;
}

/** Minimal Google Identity Services typings used by /tools/analytics-reach. */
interface GoogleTokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
}

interface GoogleTokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleOauth2 {
    initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback?: (err: { message?: string }) => void;
    }) => GoogleTokenClient;
}

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: GtagFunction;
        clarity?: (...args: unknown[]) => void;
        __gaPageLoadBound?: boolean;
        __clarityBooted?: boolean;
        __restoreScrollY?: number;
        __scrollRestoreDone?: boolean;
        __pageLoaderDone?: boolean;
        __pageEnterStarted?: boolean;
        __pageEnterBound?: boolean;
        __tryPageEnter?: () => void;
        __pageLoaderScript?: boolean;
        __layoutInlineBoot?: boolean;
        __scriptBoot?: Record<string, boolean>;
        __lenis?: Lenis;
        __applyScrollRestore?: (reveal: boolean) => void;
        google?: {
            accounts?: {
                oauth2: GoogleOauth2;
            };
        };
    }

    interface HTMLElement {
        _toolsHubAbort?: AbortController;
        _scrambleCompareAbort?: AbortController;
    }
}

export {};
