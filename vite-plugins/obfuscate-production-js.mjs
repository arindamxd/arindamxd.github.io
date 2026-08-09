/**
 * Astro integration: strongly obfuscate all published client JS.
 * Runs after the static build so it covers:
 * - every dist/_astro/*.js chunk
 * - inline script bodies in HTML (Astro inlines many page scripts)
 *
 * Skips JSON-LD and external src= scripts (those point at already-obfuscated files).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import javascriptObfuscator from "javascript-obfuscator";

const { obfuscate } = javascriptObfuscator;

/** Strong preset — ESM import/export paths preserved via ignoreImports. */
const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.85,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: "hexadecimal",
    ignoreImports: true,
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 3,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.85,
    stringArrayEncoding: ["base64", "rc4"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: "function",
    stringArrayThreshold: 0.85,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
};

/**
 * @param {string} code
 */
function obfuscateCode(code) {
    return obfuscate(code, OBFUSCATOR_OPTIONS).getObfuscatedCode();
}

/**
 * @param {string} dir
 * @param {string[]} extensions
 * @param {string[]} [out]
 */
function walkFiles(dir, extensions, out = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            walkFiles(full, extensions, out);
            continue;
        }
        if (extensions.some((ext) => ent.name.endsWith(ext))) {
            out.push(full);
        }
    }
    return out;
}

/**
 * @param {string} html
 */
function obfuscateInlineScripts(html) {
    return html.replace(
        /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi,
        (match, attrs = "", body) => {
            if (/\bsrc\s*=/i.test(attrs)) return match;
            if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) {
                return match;
            }
            const trimmed = body.trim();
            if (!trimmed || trimmed.length < 24) return match;

            try {
                return (
                    "<script" +
                    attrs +
                    ">" +
                    obfuscateCode(body) +
                    "</" +
                    "script>"
                );
            } catch {
                return match;
            }
        },
    );
}

/** @returns {import('astro').AstroIntegration} */
export function obfuscateProductionIntegration() {
    return {
        name: "obfuscate-production-js",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {
                const root = fileURLToPath(dir);
                let jsCount = 0;
                let jsSkipped = 0;

                for (const file of walkFiles(root, [".js", ".mjs"])) {
                    const code = fs.readFileSync(file, "utf8");
                    if (code.length < 24) {
                        jsSkipped += 1;
                        continue;
                    }
                    try {
                        fs.writeFileSync(file, obfuscateCode(code));
                        jsCount += 1;
                    } catch (err) {
                        jsSkipped += 1;
                        const message =
                            err instanceof Error ? err.message : String(err);
                        logger.warn(
                            `Skip JS ${path.relative(root, file)}: ${message}`,
                        );
                    }
                }

                let htmlCount = 0;
                for (const file of walkFiles(root, [".html"])) {
                    const html = fs.readFileSync(file, "utf8");
                    const next = obfuscateInlineScripts(html);
                    if (next !== html) {
                        fs.writeFileSync(file, next);
                        htmlCount += 1;
                    }
                }

                logger.info(
                    `Obfuscated ${jsCount} JS file(s)` +
                        (jsSkipped ? ` (skipped ${jsSkipped})` : "") +
                        `, inline scripts in ${htmlCount} HTML file(s)`,
                );
            },
        },
    };
}
