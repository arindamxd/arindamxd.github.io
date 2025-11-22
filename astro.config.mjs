// astro.config.mjs

import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

const SERVER_PORT = 3000;
const LOCALHOST_URL = `http://localhost:${SERVER_PORT}`;
const LIVE_URL = 'https://arindamxd.github.io';

// Explicit SITE_URL env override (preferred) falls back to NODE_ENV
const SITE_URL = process.env.SITE_URL?.trim();
const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = SITE_URL || (isProduction ? LIVE_URL : LOCALHOST_URL);

export default defineConfig({
    site: BASE_URL,
    server: { port: SERVER_PORT },
    base: '/', // keep "/" when deploying to arindamxd.github.io
    integrations: [],
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
