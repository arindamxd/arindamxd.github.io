// astro.config.ts

import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

const SERVER_PORT = 3000;
const LIVE_URL = "https://arindamxd.github.io";

// Prefer explicit SITE_URL; otherwise always use the live site so sitemap/canonical stay correct in CI.
const SITE_URL = process.env.SITE_URL?.trim();
const BASE_URL = SITE_URL || LIVE_URL;

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
            filter: (page) => !page.includes("/tools") && !page.includes("/design"),
        }),
    ],
    vite: {
        resolve: {
            extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
        },
        plugins: [tailwindcss()],
        optimizeDeps: {
            // Keep the contributions island off 504 "Outdated Optimize Dep" after HMR/build
            include: ["react", "react-dom", "react-activity-calendar"],
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
