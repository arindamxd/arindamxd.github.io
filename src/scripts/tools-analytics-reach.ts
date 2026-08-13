/**
 * /tools/analytics-reach — format GA4 metrics into footer.reach JSON for author-metadata.
 * OAuth tokens stay in the browser; nothing is sent to a custom backend.
 */
import { bootOnce } from "./boot-once";
import {
    buildFooterReach,
    reachAriaLabel,
    reachJsonSnippet,
} from "../utils/reach";
import type { FooterReach } from "../utils/reach";

const STORAGE = {
    clientId: "tools-ga-oauth-client-id",
    propertyId: "tools-ga-property-id",
} as const;

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

type ReachPeriod = FooterReach["period"];

interface FetchFormElements extends HTMLFormElement {
    clientId: HTMLInputElement;
    propertyId: HTMLInputElement;
    range: HTMLSelectElement | HTMLInputElement;
}

interface ManualFormElements extends HTMLFormElement {
    uniques: HTMLInputElement;
    views: HTMLInputElement;
    period: HTMLSelectElement | HTMLInputElement;
}

type GaMetricValue = { value?: string };
type GaReportRow = { metricValues?: GaMetricValue[] };
type GaReportPayload = {
    rows?: GaReportRow[];
    error?: { message?: string; status?: string };
};

(function () {
    if (!bootOnce("tools-analytics-reach")) return;
    let currentReach: FooterReach | null = null;
    let bound = false;

    function $(sel: string, root: ParentNode = document): Element | null {
        return root.querySelector(sel);
    }

    function isFetchForm(el: Element | null): el is FetchFormElements {
        return el instanceof HTMLFormElement;
    }

    function isManualForm(el: Element | null): el is ManualFormElements {
        return el instanceof HTMLFormElement;
    }

    function periodFromRange(range: string): ReachPeriod {
        if (range === "realtime") return "month";
        if (range === "7daysAgo") return "week";
        if (range === "365daysAgo") return "year";
        return "month";
    }

    function setStatus(message: string, isError = false): void {
        const el = $("#reach-fetch-status");
        if (!el) return;
        el.textContent = message || "";
        el.classList.toggle("text-primary", Boolean(isError));
    }

    function loadSettings(form: FetchFormElements): void {
        try {
            const clientId = localStorage.getItem(STORAGE.clientId) || "";
            const propertyId = localStorage.getItem(STORAGE.propertyId) || "";
            if (clientId) form.clientId.value = clientId;
            if (propertyId) form.propertyId.value = propertyId;
        } catch {
            /* ignore */
        }
    }

    function saveSettings(form: FetchFormElements): void {
        try {
            localStorage.setItem(STORAGE.clientId, form.clientId.value.trim());
            localStorage.setItem(
                STORAGE.propertyId,
                form.propertyId.value.trim(),
            );
            setStatus("Settings saved in this browser.");
        } catch {
            setStatus("Could not write localStorage.", true);
        }
    }

    function renderReach(reach: FooterReach): void {
        currentReach = reach;
        const ticker = $("#reach-ticker");
        const jsonEl = $("#reach-json");
        if (!ticker || !jsonEl) return;

        const periodWord =
            reach.period === "week"
                ? "WEEK"
                : reach.period === "year"
                    ? "YEAR"
                    : "MONTH";

        ticker.textContent = `${reach.uniques} UNIQUE · ${reach.views} VIEWS / ${periodWord}`;
        ticker.setAttribute("aria-label", reachAriaLabel(reach));
        jsonEl.textContent = reachJsonSnippet(reach);
    }

    function applyManual(form: ManualFormElements): void {
        const uniques = Number(form.uniques.value);
        const views = Number(form.views.value);
        if (!Number.isFinite(uniques) || !Number.isFinite(views)) {
            setStatus("Enter numeric uniques and views.", true);
            return;
        }
        const periodRaw = form.period.value;
        const period: ReachPeriod =
            periodRaw === "week" || periodRaw === "year" || periodRaw === "month"
                ? periodRaw
                : "month";
        const reach = buildFooterReach({
            uniques,
            views,
            period,
            asOf: new Date().toISOString().slice(0, 10),
        });
        renderReach(reach);
        setStatus("");
    }

    function requestAccessToken(clientId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!window.google?.accounts?.oauth2) {
                reject(
                    new Error(
                        "Google Identity Services not loaded yet — wait a second and retry.",
                    ),
                );
                return;
            }

            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPE,
                callback: (response) => {
                    if (response.error) {
                        reject(
                            new Error(
                                response.error_description || response.error,
                            ),
                        );
                        return;
                    }
                    if (!response.access_token) {
                        reject(new Error("No access token returned."));
                        return;
                    }
                    resolve(response.access_token);
                },
                error_callback: (err) => {
                    reject(new Error(err?.message || "OAuth popup failed."));
                },
            });

            client.requestAccessToken({ prompt: "" });
        });
    }

    async function postGa(
        accessToken: string,
        propertyId: string,
        method: string,
        body: Record<string, unknown>,
    ): Promise<GaReportPayload> {
        const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:${method}`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data: unknown = await res.json().catch(() => ({}));
        const payload =
            data && typeof data === "object" ? (data as GaReportPayload) : {};
        if (!res.ok) {
            const msg =
                payload.error?.message ||
                payload.error?.status ||
                `GA Data API error (${res.status})`;
            throw new Error(msg);
        }
        return payload;
    }

    function runReport(
        accessToken: string,
        propertyId: string,
        startDate: string,
    ): Promise<GaReportPayload> {
        // Include today — "yesterday" misses brand-new properties that only have Realtime/today traffic.
        return postGa(accessToken, propertyId, "runReport", {
            dateRanges: [{ startDate, endDate: "today" }],
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
        });
    }

    function runRealtimeReport(
        accessToken: string,
        propertyId: string,
    ): Promise<GaReportPayload> {
        return postGa(accessToken, propertyId, "runRealtimeReport", {
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
        });
    }

    function metricsFromReport(
        data: GaReportPayload,
    ): { uniques: number; views: number } | null {
        const values = data.rows?.[0]?.metricValues;
        if (!values || values.length < 2) return null;
        return {
            uniques: Number(values[0]?.value || 0),
            views: Number(values[1]?.value || 0),
        };
    }

    async function signInAndFetch(form: FetchFormElements): Promise<void> {
        const clientId = form.clientId.value.trim();
        const propertyId = form.propertyId.value
            .trim()
            .replace(/^properties\//, "");
        const range = form.range.value;

        if (!clientId || !propertyId) {
            setStatus("Client ID and numeric property ID are required.", true);
            return;
        }

        saveSettings(form);
        setStatus("Requesting Google access…");

        try {
            const token = await requestAccessToken(clientId);
            const raw = $("#reach-raw");
            let report: GaReportPayload;
            let source = "standard";

            if (range === "realtime") {
                setStatus("Fetching GA4 Realtime…");
                report = await runRealtimeReport(token, propertyId);
                source = "realtime";
            } else {
                setStatus("Fetching GA4 report…");
                report = await runReport(token, propertyId, range);
                let metrics = metricsFromReport(report);
                // Realtime shows sooner than standard reports — fall back for new properties.
                if (!metrics) {
                    setStatus("No standard rows yet — trying Realtime…");
                    report = await runRealtimeReport(token, propertyId);
                    source = "realtime";
                    metrics = metricsFromReport(report);
                }
                if (raw) {
                    raw.textContent = JSON.stringify(report, null, 2);
                }
                if (!metrics) {
                    throw new Error(
                        "No metric rows yet. Realtime in GA can show before the Data API — wait a bit or use Enter numbers.",
                    );
                }
                const reach = buildFooterReach({
                    uniques: metrics.uniques,
                    views: metrics.views,
                    period: periodFromRange(range),
                    asOf: new Date().toISOString().slice(0, 10),
                });
                renderReach(reach);
                const note =
                    source === "realtime"
                        ? " (Realtime — last ~30 min; standard reports may lag)"
                        : "";
                setStatus(
                    `Loaded ${metrics.uniques.toLocaleString()} uniques · ${metrics.views.toLocaleString()} views.${note}`,
                );
                return;
            }

            if (raw) {
                raw.textContent = JSON.stringify(report, null, 2);
            }
            const metrics = metricsFromReport(report);
            if (!metrics) {
                throw new Error(
                    "Realtime returned no metric rows. Confirm the Property ID and try again in a minute.",
                );
            }
            const reach = buildFooterReach({
                uniques: metrics.uniques,
                views: metrics.views,
                period: "month",
                asOf: new Date().toISOString().slice(0, 10),
            });
            renderReach(reach);
            setStatus(
                `Loaded ${metrics.uniques.toLocaleString()} uniques · ${metrics.views.toLocaleString()} views. (Realtime — last ~30 min)`,
            );
        } catch (err: unknown) {
            setStatus(err instanceof Error ? err.message : String(err), true);
        }
    }

    async function copyJson(): Promise<void> {
        if (!currentReach) return;
        const text = reachJsonSnippet(currentReach);
        try {
            await navigator.clipboard.writeText(text);
            setStatus("Copied footer.reach JSON.");
        } catch {
            setStatus(
                "Clipboard blocked — select the JSON and copy manually.",
                true,
            );
        }
    }

    function downloadJson(): void {
        if (!currentReach) return;
        const blob = new Blob(
            [JSON.stringify({ reach: currentReach }, null, 4) + "\n"],
            { type: "application/json" },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "footer-reach.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    function bindTabs(): void {
        const tabs = document.querySelectorAll("[data-reach-tab]");
        const fetchPanel = $("#panel-fetch");
        const manualPanel = $("#panel-manual");

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                const mode = tab.getAttribute("data-reach-tab");
                tabs.forEach((t) => {
                    const on = t === tab;
                    t.classList.toggle("is-active", on);
                    t.setAttribute("aria-selected", on ? "true" : "false");
                });
                if (manualPanel instanceof HTMLElement) {
                    manualPanel.hidden = mode !== "manual";
                }
                if (fetchPanel instanceof HTMLElement) {
                    fetchPanel.hidden = mode !== "fetch";
                }
            });
        });
    }

    function init(): void {
        const app = $("#tools-reach-app");
        if (!app) return;

        const fetchFormEl = $("#form-fetch");
        const fetchForm = isFetchForm(fetchFormEl) ? fetchFormEl : null;
        if (fetchForm) loadSettings(fetchForm);

        if (!bound) {
            bound = true;
            bindTabs();

            document.addEventListener("click", (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                const btn = target.closest("[data-reach-action]");
                if (!btn) return;
                const action = btn.getAttribute("data-reach-action");

                const liveFetchEl = $("#form-fetch");
                const liveManualEl = $("#form-manual");
                const liveFetch = isFetchForm(liveFetchEl) ? liveFetchEl : null;
                const liveManual = isManualForm(liveManualEl) ? liveManualEl : null;

                if (action === "save-settings" && liveFetch) {
                    saveSettings(liveFetch);
                }
                if (action === "sign-in-fetch" && liveFetch) {
                    void signInAndFetch(liveFetch);
                }
                if (action === "apply-manual" && liveManual) {
                    applyManual(liveManual);
                }
                if (action === "copy") void copyJson();
                if (action === "download") downloadJson();
            });

            document.addEventListener("input", (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                const formEl = target.closest("#form-manual");
                if (!isManualForm(formEl)) return;
                if (formEl.uniques?.value && formEl.views?.value) {
                    applyManual(formEl);
                }
            });
        }
    }

    init();
    document.addEventListener("astro:page-load", init);
})();
