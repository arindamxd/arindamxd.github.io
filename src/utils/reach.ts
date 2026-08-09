/** Curated footer reach stats (from GA via /tools/analytics-reach — not live-fetched on public pages). */
export type FooterReach = {
    uniques: string;
    views: string;
    period: "month" | "week" | "year";
    label: string;
    /** ISO date the numbers were pulled (optional, for your notes). */
    asOf?: string;
};

const PERIOD_WORDS: Record<FooterReach["period"], string> = {
    month: "per month",
    week: "per week",
    year: "per year",
};

/** Compact display: 171900 → "171.9K", 1040000 → "1.04M". */
export function formatCompactCount(value: number): string {
    if (!Number.isFinite(value) || value < 0) return "0";
    if (value < 1000) return String(Math.round(value));

    if (value < 1_000_000) {
        const n = value / 1000;
        return `${trimZeros(n.toFixed(1))}K`;
    }

    const n = value / 1_000_000;
    const digits = n >= 10 ? 1 : 2;
    return `${trimZeros(n.toFixed(digits))}M`;
}

function trimZeros(s: string): string {
    return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export function buildFooterReach(input: {
    uniques: number;
    views: number;
    period?: FooterReach["period"];
    asOf?: string;
}): FooterReach {
    const period = input.period ?? "month";
    return {
        uniques: formatCompactCount(input.uniques),
        views: formatCompactCount(input.views),
        period,
        label: "UNIQUE · VIEWS / " + period.toUpperCase(),
        ...(input.asOf ? { asOf: input.asOf } : {}),
    };
}

export function reachAriaLabel(reach: FooterReach): string {
    return `${expandCompact(reach.uniques)} unique visitors and ${expandCompact(reach.views)} views ${PERIOD_WORDS[reach.period]}`;
}

function expandCompact(display: string): string {
    const m = display.trim().match(/^([\d.]+)\s*([KM])?$/i);
    if (!m) return display;
    const n = m[1];
    const unit = (m[2] || "").toUpperCase();
    if (unit === "K") return `${n} thousand`;
    if (unit === "M") return `${n} million`;
    return n;
}

/** JSON for `src/content/footer-reach.json` (replace the whole file). */
export function reachJsonSnippet(reach: FooterReach): string {
    return JSON.stringify({ reach }, null, 4);
}
