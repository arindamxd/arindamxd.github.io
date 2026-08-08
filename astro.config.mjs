// astro.config.mjs

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

const SERVER_PORT = 3000;
const LIVE_URL = 'https://arindamxd.github.io';

// Prefer explicit SITE_URL; otherwise always use the live site so sitemap/canonical stay correct in CI.
const SITE_URL = process.env.SITE_URL?.trim();
const BASE_URL = SITE_URL || LIVE_URL;

export default defineConfig({
    site: BASE_URL,
    server: { port: SERVER_PORT },
    base: '/', // keep "/" when deploying to arindamxd.github.io
    // Preserve Astro 5/6 whitespace behavior (v7 default is 'jsx', which can drop spaces between inline elements)
    compressHTML: true,
    integrations: [
        sitemap({
            filter: (page) => !page.includes('/tools'),
        }),
    ],
    vite: {
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
        },
        plugins: [tailwindcss()],
    },
    devToolbar: {
        enabled: false,
    },
});
