/**
 * Fail if any JavaScript source files remain under src/.
 * Enforces the project TypeScript mandate (see tsconfig allowJs: false).
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const FORBIDDEN = /\.(js|jsx|mjs|cjs)$/;

/** @param {string} dir @param {string[]} out */
function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            walk(full, out);
            continue;
        }
        if (FORBIDDEN.test(name)) out.push(full);
    }
    return out;
}

const bad = walk(ROOT);
if (bad.length > 0) {
    console.error(
        "JS under src/ is forbidden — convert to TypeScript:\n" + bad.join("\n"),
    );
    process.exit(1);
}

console.log("assert-no-js: src/ is TypeScript-only");
