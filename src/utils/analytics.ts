/**
 * Site analytics config (GA4 + Microsoft Clarity).
 * IDs are XOR-encoded so production HTML/JS does not ship plain literals.
 * All client JS chunks (including this loader) are obfuscated on `astro build`
 * via `vite-plugins/obfuscate-production-js.ts`.
 */

/** XOR key — shared by GA + Clarity payloads. */
const ANALYTICS_ID_KEY = [0x5a, 0x3c, 0x91, 0xe2, 0x17, 0x88, 0x4b, 0xd0] as const;

/** Encoded bytes for the GA4 Measurement ID (not a plaintext `G-…` literal). */
const GA_ID_PAYLOAD = [
    0x1d, 0x11, 0xc3, 0xac, 0x41, 0xbd, 0x72, 0x92, 0x6c, 0x6b, 0xc1, 0xd0,
] as const;

/** Encoded bytes for the Clarity project ID. */
const CLARITY_ID_PAYLOAD = [34, 70, 226, 129, 36, 230, 125, 160, 46, 81] as const;

function decodePayload(payload: readonly number[]): string {
    return payload
        .map(
            (byte, i) =>
                String.fromCharCode(
                    byte ^ ANALYTICS_ID_KEY[i % ANALYTICS_ID_KEY.length]!,
                ),
        )
        .join("");
}

/** Decode the GA4 Measurement ID at runtime. */
export function resolveMeasurementId(): string {
    return decodePayload(GA_ID_PAYLOAD);
}

/** Decode the Microsoft Clarity project ID at runtime. */
export function resolveClarityId(): string {
    return decodePayload(CLARITY_ID_PAYLOAD);
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

/** Build the Clarity tag URL without a contiguous vendor hostname literal in source. */
export function clarityScriptUrl(projectId: string): string {
    const host = ["clarity", ".ms"].join("");
    return `https://www.${host}/tag/${encodeURIComponent(projectId)}`;
}
