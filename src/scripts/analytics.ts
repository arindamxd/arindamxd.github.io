/**
 * GA4 + Microsoft Clarity bootstrap.
 * Loaded only in production via GoogleAnalytics.astro.
 * Measurement IDs are XOR-encoded in source (see `src/utils/analytics.ts`).
 */
import {
    CLARITY_ENABLED,
    clarityScriptUrl,
    gtagScriptUrl,
    isAnalyticsEnabled,
    resolveClarityId,
    resolveMeasurementId,
} from "../utils/analytics";

function whenIdle(fn: () => void): void {
    window.requestIdleCallback(fn, { timeout: 2500 });
}

function ensureGtag(measurementId: string): void {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
        window.gtag = function gtag(..._args: unknown[]) {
            // Mirror the official stub: push the Arguments object (not a rest array).
            window.dataLayer.push(arguments as unknown);
        };
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });

    // Queue hits immediately; fetch gtag.js after first paint so it stays off the critical path.
    whenIdle(() => {
        if (document.querySelector(`script[data-ga-loader="1"]`)) return;
        const script = document.createElement("script");
        script.async = true;
        script.dataset.gaLoader = "1";
        script.src = gtagScriptUrl(measurementId);
        document.head.appendChild(script);
    });
}

function ensureClarity(projectId: string): void {
    if (window.__clarityBooted) return;
    window.__clarityBooted = true;

    if (typeof window.clarity !== "function") {
        const queue: IArguments[] = [];
        const clarityStub = function clarity(..._args: unknown[]) {
            queue.push(arguments);
        };
        (clarityStub as unknown as { q: IArguments[] }).q = queue;
        window.clarity = clarityStub;
    }

    whenIdle(() => {
        if (document.querySelector(`script[data-clarity-loader="1"]`)) return;
        const script = document.createElement("script");
        script.async = true;
        script.dataset.clarityLoader = "1";
        script.src = clarityScriptUrl(projectId);
        const first = document.getElementsByTagName("script")[0];
        first?.parentNode?.insertBefore(script, first);
    });
}

function sendPageView(): void {
    if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
            page_title: document.title,
            page_location: location.href,
            page_path: location.pathname + location.search,
        });
    }

    // Help Clarity attribute soft ClientRouter navigations
    if (typeof window.clarity === "function") {
        window.clarity("set", "page", location.pathname + location.search);
    }
}

function boot(): void {
    if (!isAnalyticsEnabled()) return;

    const measurementId = resolveMeasurementId();
    if (measurementId) ensureGtag(measurementId);

    if (CLARITY_ENABLED) {
        const clarityId = resolveClarityId();
        if (clarityId) ensureClarity(clarityId);
    }

    if (!window.__gaPageLoadBound) {
        window.__gaPageLoadBound = true;
        // Fires on initial load and after every ClientRouter navigation
        document.addEventListener("astro:page-load", sendPageView);
    }
}

boot();
