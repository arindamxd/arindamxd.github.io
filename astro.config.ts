// astro.config.ts

import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";
import { sitemapFilter, sitemapLastmodByPath } from "./src/utils/seo";

/** Dev-only: Vite 8 may prebundle production `jsxDEV = undefined`. */
const reactJsxDevRuntimeShim = fileURLToPath(
    new URL("./src/shims/react-jsx-dev-runtime.ts", import.meta.url),
);

const SERVER_PORT = 3000;
const LIVE_URL = "https://arindamxd.github.io";

// Prefer explicit SITE_URL; otherwise always use the live site so sitemap/canonical stay correct in CI.
const SITE_URL = process.env.SITE_URL?.trim();
const BASE_URL = SITE_URL || LIVE_URL;
const lastmodByPath = sitemapLastmodByPath();

function pathnameWithSlash(url: string): string {
    const path = new URL(url).pathname;
    if (path === "/") return "/";
    return path.endsWith("/") ? path : `${path}/`;
}

export default defineConfig({
    site: BASE_URL,
    server: { port: SERVER_PORT },
    base: "/", // keep "/" when deploying to arindamxd.github.io
    // Preserve Astro 5/6 whitespace behavior (v7 default is 'jsx', which can drop spaces between inline elements)
    compressHTML: true,
    // TODO(2026-12): Remove after year-end once Play Console + bookmarks use /projects/*/privacy-policy only.
    redirects: {
        "/apps/coco/privacy-policy": "/projects/coco/privacy-policy",
        "/apps/ensecure/privacy-policy": "/projects/ensecure/privacy-policy",
    },
    prefetch: {
        prefetchAll: true,
        defaultStrategy: "hover",
    },
    integrations: [
        react(),
        sitemap({
            filter: sitemapFilter,
            serialize(item) {
                const lastmod = lastmodByPath.get(pathnameWithSlash(item.url));
                if (lastmod) item.lastmod = lastmod;
                return item;
            },
        }),
    ],
    vite: {
        resolve: {
            extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
            dedupe: ["react", "react-dom"],
        },
        plugins: [
            {
                name: "react-jsx-dev-runtime-shim",
                apply: "serve",
                config() {
                    return {
                        resolve: {
                            alias: {
                                "react/jsx-dev-runtime": reactJsxDevRuntimeShim,
                            },
                        },
                    };
                },
            },
            tailwindcss(),
        ],
        optimizeDeps: {
            // Prebundle the calendar only. Vite 8 Rolldown otherwise inlines React's
            // production jsx-dev-runtime (`jsxDEV = undefined`) and the island crashes
            // with `_jsxDEV is not a function` in `astro dev`.
            include: ["react-activity-calendar"],
            exclude: [
                "react",
                "react-dom",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "react-dom/client",
            ],
        },
        build: {
            // Keep client scripts as `/_astro/*.js` so ClientRouter does not
            // re-execute inlined IIFEs (stacked theme/Lenis listeners).
            assetsInlineLimit: 0,
        },
    },
    devToolbar: {
        enabled: false,
    },
});
