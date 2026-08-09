/**
 * GA4 + Microsoft Clarity bootstrap.
 * Loaded only in production via GoogleAnalytics.astro.
 * Obfuscated with the rest of client JS on `astro build`.
 */
import {
    clarityScriptUrl,
    gtagScriptUrl,
    isAnalyticsEnabled,
    resolveClarityId,
    resolveMeasurementId,
} from "../utils/analytics";

function ensureGtag(measurementId: string): void {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
        window.gtag = function gtag(..._args: unknown[]) {
            // Mirror the official stub: push the Arguments object (not a rest array).
            window.dataLayer.push(arguments as unknown);
        };
    }

    if (!document.querySelector(`script[data-ga-loader="1"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.dataset.gaLoader = "1";
        script.src = gtagScriptUrl(measurementId);
        document.head.appendChild(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });
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

    if (!document.querySelector(`script[data-clarity-loader="1"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.dataset.clarityLoader = "1";
        script.src = clarityScriptUrl(projectId);
        const first = document.getElementsByTagName("script")[0];
        first?.parentNode?.insertBefore(script, first);
    }
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

    const clarityId = resolveClarityId();
    if (clarityId) ensureClarity(clarityId);

    if (!window.__gaPageLoadBound) {
        window.__gaPageLoadBound = true;
        // Fires on initial load and after every ClientRouter navigation
        document.addEventListener("astro:page-load", sendPageView);
    }
}

boot();
