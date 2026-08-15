# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [SemVer](https://semver.org/). Site version lives in [`package.json`](package.json); agent memory mirrors it in [`AGENTS.md`](AGENTS.md).

## [Unreleased]

### Added

- Project detail body screenshots open a fullscreen image lightbox (Motion spring; ClientRouter-safe body overlay; hero banner excluded)

### Changed

- Intro YoE chip fill matches the hero grey gap (`surface`) in light and dark, matching Framer
- Page enter (reload and ClientRouter) is Motion `springPage` only; first paint CSS-holds `is-page-entering` (no WAAPI tween)
- Footer reach ticker figures refreshed (`footer-reach.json`)
- Contributions calendar month labels match the footer size at every width (SVG stretch no longer blows them up on desktop)
- Experience year timeline on mobile: current year plus three past years, even content-sized gaps; last year clips under the edge fade (desktop unchanged)
- Credentials: diploma lists DYCTC; ACE Award sits above the Google Developers Directory feature

### Fixed

- Mid-page reload restores the saved scroll offset and still plays Motion `springPage` without a content flash (`is-scroll-hold` until opacity is pinned)
- Contributions heatmap no longer vanishes in `astro dev` after Vite re-prebundles React (`jsxDEV` shim)
- Experience year labels no longer overflow past the mobile edge fade when the row is squeezed

## [1.0.8] — 2026-08-14

### Added

- OSS Motion (`motion`) for page-shell enter and scroll reveal (`inView`, `animate`, `stagger`)
- Shared SVG sprite in `BaseLayout` (persist across ClientRouter; unused Framer marks dropped)
- SSR first paint for hero “Available for…”, testimonials quote, and years-of-experience count
- Credentials accordion as `src/scripts/credentials-accordion.ts` (loaded from `site-client` when the section exists)
- Skip-to-content link targeting `#main`
- Article `published_time` / `modified_time` and Twitter `site`/`creator` on share tags

### Changed

- Home enter matches projects/blogs: page-shell rise+blur only (hero appear script removed)
- Reload enter waits until `.page-shell` has real content (not an empty wrapper)
- Page-shell enter paints a contained viewport layer; marquees pause offscreen or in a hidden tab
- Lenis scroll restore and available-for resize no longer run every frame
- Mid-page reload: in-view sections stay visible; below-fold still fades up on scroll
- Page enter is a single shell rise+blur (no stacked Y)
- Footer reach ticker figures refreshed (`footer-reach.json`)
- Preload self-hosted Manrope; drop dead Google Fonts preconnect
- Home widgets (available-for, testimonials, skill tooltips, count-up, credentials) load only when their DOM exists
- Images decode async; hero avatar `fetchpriority="high"`; brand logos lazy with width/height
- Surface shells (hero, 404, project detail, blogs list) use the footer grey gap on mobile: `border-border` + 6px pad (not inset box-shadow)
- Experience year timeline on mobile: even 3-column spacing, aligned with job rows (desktop unchanged)
- Mobile hero: hide My work; Resume stays the original `w-min` pill (not full-width)
- Lenis only on fine-pointer / wheel; native scroll on coarse touch; hash offset 80px under the top nav
- Page-enter race: inline WAAPI and Motion share `__pageEnterStarted`; enter script runs after `.page-shell` slot content
- Hero ID-card tie colors live in `hero.css` (physical dark clip; not theme-flipped)
- `robots.txt` disallows `/design` as well as `/tools`
- SEO: home description uses the author bio; blog/project catalog meta is topic-led; OG image is a real PNG with width/height; sitemap lastmod from content dates; Person / ProfilePage / CollectionPage / Breadcrumb JSON-LD

### Fixed

- Home reload enter was static: `index.astro` self-closed `BaseLayout`, so the page sat outside `.page-shell`
- Skipping native View Transitions no longer logs `AbortError: Transition was skipped`
- Theme toggle no longer no-ops after several ClientRouter visits (single `site-client.ts` layout entry)
- Home from a project no longer freezes: skip native View Transition snapshots (frost + large images); CSS content fade instead; contributions calendar hydrates when visible
- Contributions calendar hydrate no longer dies on a stale Vite optimize-deps 504 after HMR/build
- Contributions calendar no longer crashes in `astro dev` (`_jsxDEV is not a function`): Vite 8 was prebundling production `react/jsx-dev-runtime`
- Skill chip tooltips on edge chips stay in the viewport (home `overflow-x-hidden` no longer clips them)
- Testimonials no longer flash an empty phone while the slider boots
- 404 primary CTA matches home scramble + full-width mobile treatment
- Default OG image was AVIF saved as `.png` (social crawlers often reject it) — now a real PNG

## [1.0.7] — 2026-08-13

### Added

- Cursor rule `.cursor/rules/no-push.mdc`: never auto-push; confirm before any `git push`

### Changed

- Version-bump workflow is local-only (changelog → package → memory → commit → tag); push removed from the default release steps
- Dropped post-build JS obfuscation (it bloated HTML to ~1.3MB and made ClientRouter + theme toggle hang). Vite minify remains; GA/Clarity IDs stay XOR-encoded. Hover prefetch for in-site links.

### Fixed

- Theme toggle stacking extra click listeners on each ClientRouter navigation (appeared stuck after even-numbered visits)
- Testimonials `#testimonials-data` JSON island no longer rewritten as obfuscated JS
- Lenis / motion / tools scripts boot once; contributions calendar defers theme paint off the toggle frame
- Shorter page view transitions; none on narrow viewports (frost glass snapshot cost)

## [1.0.6] — 2026-08-11

### Added

- Microsoft Clarity in production alongside GA4 (XOR-encoded project ID; ClientRouter page hints)
- Reach tool header shortcuts to Google Console, Google Analytics, and Microsoft Clarity
- Python skill chip (`public/assets/skills/python.svg`) on the home skills stack
- Author gallery photos under `public/assets/author/gallery/` (`pic01`–`pic03`)
- Coco and Ensecure project pages with Astro privacy policies at `/projects/<slug>/privacy-policy`
- Skills tools chips: Cursor, Claude Code, and GitKraken (official logos under `public/assets/skills/`)
- Skill chip tap-to-toggle tooltips on touch (`skill-tooltips.ts`)
- Contribution calendar day tooltips (date + count)

### Changed

- Microsoft Clarity gated behind `CLARITY_ENABLED` (off by default; GA4 unchanged)
- `ToolsPageShell` optional `header-actions` slot (top-right of title row)
- `.tools-chip` works as links (`inline-flex`, no underline)
- X social icon: use `/assets/socials/x.svg` (renamed from `x-small.svg`)
- Android `assetlinks.json` served from `public/.well-known/` (ships with the static build)
- Project list order via `updated_date`: CameraX → Coco → Ensecure
- Privacy callouts as highlighted blockquotes (no-analytics / on-device / permissions control)
- Footer reach ticker figures refreshed (`footer-reach.json`)
- Scramble: hover on fine pointers; tap scramble on touch via `pointerdown`
- Contributions calendar uses `client:only="react"` and syncs theme via `useSyncExternalStore` + `themechange`
- Docs synced: README client-scripts table, AGENTS durable notes (theme/calendar), design-system theme toggle + skill tap tooltips, Cursor design rule

### Removed

- Unused legacy root `images/` gallery (sample/wall + fulls/thumbs)
- Orphan assets: unused author PNGs, `favicon.svg`, Inter woff2 files and `font-inter` token
- Static `public/apps/` Coco/Ensecure privacy HTML (redirects keep old `/apps/*/privacy-policy` URLs until end of 2026)

### Fixed

- Theme toggle unreliable taps on mobile (track hit-testing + click delegation; nav z-index)
- Contributions calendar colors sometimes stale after refresh / theme change

## [1.0.5] — 2026-08-09

### Added

- Cursor rules for version-bump (full release: commit + tag + push) and commit+changelog workflows
- Google Analytics 4 (shared `GoogleAnalytics` + `src/utils/analytics.ts`) with ClientRouter page views; skipped in local `astro dev`
- Production JS obfuscation for all published client scripts and inline HTML scripts (`vite-plugins/obfuscate-production-js.ts`)
- Private `/tools/analytics-reach` tool to format GA4 uniques/views into `src/content/footer-reach.json`
- Footer reach ticker from curated `footer-reach.json` (above copyright)
- Mandatory TypeScript: root `tsconfig.json` (`astro/tsconfigs/strict`, `allowJs: false`), `src/env.d.ts`, and `scripts/assert-no-js.mjs` gate

### Changed

- `AGENTS.md`: commit requests must update `[Unreleased]` first; version-bump steps listed explicitly
- Contributions calendar shows the last 8 months (was last year); section copy refreshed
- Reach tool defaults to Realtime fetch and falls back when standard reports are empty
- Converted all client scripts (`src/scripts/*`), `astro.config`, and the obfuscation Vite plugin to TypeScript
- `npm run build` runs `astro check` before `astro build`; `npm run check` also asserts no JS under `src/`
- README, design-system docs, and Cursor design rule synced for v1.0.5 (TypeScript-only scripts, routes, content map)

### Fixed

- TypeScript types in contributions and credentials sections (`astro check` clean)
- Footer reach/copyright spacing tightened into one stack
- `BlogCodeBlock` Shiki `lang` typing for strict `astro check`
- `astro check` hints: import Zod from `astro/zod`; explicit `is:inline` on JSON-LD / testimonials data scripts

## [1.0.4] — 2026-08-09

### Added

- Home GitHub contributions calendar (`react-github-calendar` React island) before footer
- Shared `SectionHeading` element (centered title + muted description) used across home marketing sections
- Contributions section copy + usernames in `contributions-metadata.json`
- Gallery `preview` paths for Skills, Brands, and Contributions (dummy data; no live leak / no network)

### Changed

- Feature sheets use Tailwind `@apply` for layout/type/token colors (keep glass, keyframes, prose, and state machines as plain CSS); credentials accordion CSS moved into `utils.css`
- Page-scoped `tools.css` / `design.css` `@reference` `global.css` for `@apply` theme access
- Skills, credentials, testimonials, projects, blogs, and contributions sections share `SectionHeading`
- `/design` Layout sample mounts live `SectionHeading` (no hand mock)
- Brands metadata shape is `{ title, logos[] }`; credentials accordion binds per-root (multi-instance safe)

## [1.0.3] — 2026-08-09

### Added

- Living `/design` gallery with live section/page mounts (`preview`) and dummy data (`design-preview-data.ts`)
- Gallery media shell + project logo **A** placeholders; site-wide broken-image fallback (`image-fallback.ts`)
- Design system docs + Cursor rule coverage for gallery, nav glass, and theme-toggle clip layer
- Git-tracked project memory ([`AGENTS.md`](AGENTS.md)) with version table, content/skills/tools map
- Private `/tools` suite (author, markdown preview, scramble compare) and expanded design-system recipes
- CC BY 4.0 license with attribution requirements
- Root [`CHANGELOG.md`](CHANGELOG.md) for ongoing product release notes

### Changed

- Reorganized site CSS into feature sheets (`nav`, `hero`, `projects`, …) under `global.css`
- `/design` Components mounts live `NavBar preview` on the gradient demo shell
- Testimonials slider prefers embedded `#testimonials-data` (supports gallery dummy quotes)

### Fixed

- Frosted nav / theme toggle: clip icons on `.nav-theme-toggle__clip` so `backdrop-filter` stays intact
- Nav glass rules documented (no same-node `overflow: hidden` / `transform` / view-transition name)

## [1.0.2] — 2026-08-09

### Changed

- Package release bump (see tag `v1.0.2`)

## [1.0.1] — prior

See git tag `v1.0.1` and commit history for earlier notes.

[Unreleased]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.8...HEAD
[1.0.8]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/arindamxd/arindamxd.github.io/releases/tag/v1.0.1
