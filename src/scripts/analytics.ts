/**
 * GA4 bootstrap + ClientRouter page views.
 * Loaded only in production via GoogleAnalytics.astro.
 * Obfuscated with the rest of client JS on `astro build`.
 */
import {
    gtagScriptUrl,
    isAnalyticsEnabled,
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

function sendPageView(): void {
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname + location.search,
    });
}

function boot(): void {
    if (!isAnalyticsEnabled()) return;

    const measurementId = resolveMeasurementId();
    if (!measurementId) return;

    ensureGtag(measurementId);

    if (!window.__gaPageLoadBound) {
        window.__gaPageLoadBound = true;
        // Fires on initial load and after every ClientRouter navigation
        document.addEventListener("astro:page-load", sendPageView);
    }
}

boot();
