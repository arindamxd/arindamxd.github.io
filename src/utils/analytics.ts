/**
 * GA4 config (single source of truth).
 * Measurement ID is XOR-encoded so production HTML/JS does not ship a plain `G-…` string.
 * All client JS chunks (including this loader) are obfuscated on `astro build`
 * via `vite-plugins/obfuscate-production-js.ts`.
 */

/** XOR key — paired with {@link GA_ID_PAYLOAD}. */
const GA_ID_KEY = [0x5a, 0x3c, 0x91, 0xe2, 0x17, 0x88, 0x4b, 0xd0] as const;

/** Encoded bytes for the Measurement ID (not a plaintext `G-…` literal). */
const GA_ID_PAYLOAD = [
    0x1d, 0x11, 0xc3, 0xac, 0x41, 0xbd, 0x72, 0x92, 0x6c, 0x6b, 0xc1, 0xd0,
] as const;

/** Decode the GA4 Measurement ID at runtime. */
export function resolveMeasurementId(): string {
    return GA_ID_PAYLOAD.map(
        (byte, i) => String.fromCharCode(byte ^ GA_ID_KEY[i % GA_ID_KEY.length]!),
    ).join("");
}

/** Load analytics on production builds only — keeps local `astro dev` out of reports. */
export function isAnalyticsEnabled(): boolean {
    return GA_ID_PAYLOAD.length > 0 && !import.meta.env.DEV;
}

/** Build the gtag loader URL without a contiguous vendor hostname literal in source. */
export function gtagScriptUrl(measurementId: string): string {
    const host = ["goog", "le", "tag", "man", "ager", ".com"].join("");
    return `https://www.${host}/gtag/js?id=${encodeURIComponent(measurementId)}`;
}
