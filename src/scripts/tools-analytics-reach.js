/**
 * /tools/analytics-reach — format GA4 metrics into footer.reach JSON for author-metadata.
 * OAuth tokens stay in the browser; nothing is sent to a custom backend.
 */
import {
    buildFooterReach,
    reachAriaLabel,
    reachJsonSnippet,
} from "../utils/reach";

const STORAGE = {
    clientId: "tools-ga-oauth-client-id",
    propertyId: "tools-ga-property-id",
};

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

(function () {
    /** @type {import('../utils/reach').FooterReach | null} */
    let currentReach = null;
    let bound = false;

    function $(sel, root = document) {
        return root.querySelector(sel);
    }

    function periodFromRange(range) {
        if (range === "realtime") return "month";
        if (range === "7daysAgo") return "week";
        if (range === "365daysAgo") return "year";
        return "month";
    }

    function setStatus(message, isError = false) {
        const el = $("#reach-fetch-status");
        if (!el) return;
        el.textContent = message || "";
        el.classList.toggle("text-primary", Boolean(isError));
    }

    function loadSettings(form) {
        try {
            const clientId = localStorage.getItem(STORAGE.clientId) || "";
            const propertyId = localStorage.getItem(STORAGE.propertyId) || "";
            if (clientId) form.clientId.value = clientId;
            if (propertyId) form.propertyId.value = propertyId;
        } catch {
            /* ignore */
        }
    }

    function saveSettings(form) {
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

    function renderReach(reach) {
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

    function applyManual(form) {
        const uniques = Number(form.uniques.value);
        const views = Number(form.views.value);
        if (!Number.isFinite(uniques) || !Number.isFinite(views)) {
            setStatus("Enter numeric uniques and views.", true);
            return;
        }
        const reach = buildFooterReach({
            uniques,
            views,
            period: form.period.value,
            asOf: new Date().toISOString().slice(0, 10),
        });
        renderReach(reach);
        setStatus("");
    }

    function requestAccessToken(clientId) {
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

    async function postGa(accessToken, propertyId, method, body) {
        const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:${method}`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg =
                data?.error?.message ||
                data?.error?.status ||
                `GA Data API error (${res.status})`;
            throw new Error(msg);
        }
        return data;
    }

    function runReport(accessToken, propertyId, startDate) {
        // Include today — "yesterday" misses brand-new properties that only have Realtime/today traffic.
        return postGa(accessToken, propertyId, "runReport", {
            dateRanges: [{ startDate, endDate: "today" }],
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
        });
    }

    function runRealtimeReport(accessToken, propertyId) {
        return postGa(accessToken, propertyId, "runRealtimeReport", {
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
            ],
        });
    }

    function metricsFromReport(data) {
        const values = data?.rows?.[0]?.metricValues;
        if (!values || values.length < 2) return null;
        return {
            uniques: Number(values[0].value || 0),
            views: Number(values[1].value || 0),
        };
    }

    async function signInAndFetch(form) {
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
            let report;
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
        } catch (err) {
            setStatus(err instanceof Error ? err.message : String(err), true);
        }
    }

    async function copyJson() {
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

    function downloadJson() {
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

    function bindTabs() {
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
                if (manualPanel) manualPanel.hidden = mode !== "manual";
                if (fetchPanel) fetchPanel.hidden = mode !== "fetch";
            });
        });
    }

    function init() {
        const app = $("#tools-reach-app");
        if (!app) return;

        const fetchForm = $("#form-fetch");
        const manualForm = $("#form-manual");
        if (fetchForm) loadSettings(fetchForm);

        if (!bound) {
            bound = true;
            bindTabs();

            document.addEventListener("click", (e) => {
                const btn = e.target.closest("[data-reach-action]");
                if (!btn) return;
                const action = btn.getAttribute("data-reach-action");

                const liveFetch = $("#form-fetch");
                const liveManual = $("#form-manual");

                if (action === "save-settings" && liveFetch) {
                    saveSettings(liveFetch);
                }
                if (action === "sign-in-fetch" && liveFetch) {
                    signInAndFetch(liveFetch);
                }
                if (action === "apply-manual" && liveManual) {
                    applyManual(liveManual);
                }
                if (action === "copy") copyJson();
                if (action === "download") downloadJson();
            });

            document.addEventListener("input", (e) => {
                const form = e.target.closest("#form-manual");
                if (!form) return;
                if (form.uniques?.value && form.views?.value) {
                    applyManual(form);
                }
            });
        }
    }

    init();
    document.addEventListener("astro:page-load", init);
})();
