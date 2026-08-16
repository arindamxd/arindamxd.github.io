# AGENTS.md — project memory

Git-tracked map + durable decisions for humans and coding agents.  
**Current site version:** `1.0.8` ([`package.json`](package.json) · git tag `v1.0.8`) · product notes: [`CHANGELOG.md`](CHANGELOG.md)  
**UI source of truth:** [`docs/design-system.md`](docs/design-system.md) · Cursor rule: [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc) · Gallery: `/design`

Keep this file in sync when you ship durable architecture decisions or bump the package version. Prefer linking to long recipes in `docs/` over duplicating them here.

---

## Versions

| Field | Value | Notes |
| --- | --- | --- |
| **Package** | `1.0.8` | Bump in `package.json` on release |
| **Git tags** | `v1.0.8`, `v1.0.7`, `v1.0.6`, `v1.0.5`, `v1.0.4`, `v1.0.3`, `v1.0.2`, `v1.0.1` | Match package when tagging |
| **Memory doc** | `1.0.8` | Same as package after each memory update on a release line |
| **Changelog** | [`CHANGELOG.md`](CHANGELOG.md) | Keep a Changelog · append under Unreleased as you go (required when asked to commit), fold into the version on release |
| **Node** | `>=22.12` | `engines` in package.json |
| **Astro** | `^7.2` | Static output · Vite 8 |
| **Tailwind** | v4 via `@tailwindcss/vite` | Tokens in `src/styles/tokens.css` |
| **License** | CC-BY-4.0 | See `LICENSE` |

**When the user asks to bump / release the project version:** run the **local release** (do not push):

1. Fold `[Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) into `## [X.Y.Z] — YYYY-MM-DD` (+ compare links).
2. Bump `version` in [`package.json`](package.json) and root [`package-lock.json`](package-lock.json).
3. Sync this file: header version, **Versions** table, memory changelog entry; bump version line in [`README.md`](README.md) when present.
4. Commit (`Release vX.Y.Z.`).
5. Annotated tag `vX.Y.Z`.

**Never push** the branch or tag automatically. If the user asks to push, confirm first, then wait for an explicit yes. Rules: [`.cursor/rules/version-bump.mdc`](version-bump.mdc) · [`.cursor/rules/no-push.mdc`](no-push.mdc).

**When the user asks to commit:** update [`CHANGELOG.md`](CHANGELOG.md) `[Unreleased]` with bullets for that work, stage it with the commit, then commit. Do not version-bump/tag unless they also asked for a release. Rule: [`.cursor/rules/commit-changelog.mdc`](.cursor/rules/commit-changelog.mdc).

---

## Stack (short)

- Astro static portfolio · Tailwind v4 · feature CSS via [`global.css`](src/styles/global.css) (layout via `@apply` in sheets; do **not** import `tools.css` / `design.css` into global — those `@reference` global for theme)
- **TypeScript mandatory** under `src/` — [`tsconfig.json`](tsconfig.json) · `astro check` on build
- Content: JSON catalogs + Markdown under `src/content/` · loaders in `src/utils/`
- Motion today: Lenis + OSS [`motion`](https://motion.dev/) for page-shell enter + scroll reveal · custom scramble/count-up · tokens in [`src/scripts/motion-tokens.ts`](src/scripts/motion-tokens.ts)
- Deploy: GitHub Pages from **`trunk`** · live https://arindamxd.github.io
- Dev: `npm run dev` → http://localhost:3000 · `npm run build` → `./dist/`

---

## Routes & surfaces

| Route | Role |
| --- | --- |
| `/` | Home — intro, skills, experience, credentials, brands, testimonials, projects, blogs, contributions, footer |
| `/projects`, `/projects/[slug]` | Catalog + detail (sticky media cards) |
| `/projects/[slug]/privacy-policy` | Privacy MD when `privacy_policy: true` |
| `/blogs`, `/blogs/[slug]` | Catalog + article |
| `/design` | Living design gallery (`noindex`) — live components + `preview` dummy data |
| `/tools`, `/tools/*` | Private ops tools (`noindex`) |
| `/404` | Not-found hero card |

Nav chrome mounts **once** from [`BaseLayout.astro`](src/layouts/BaseLayout.astro). Exception: `/design` may mount in-flow `<NavBar preview />` inside `.design-nav-demo`.

---

## Content map

| Catalog / body | Path | Loader / consumer |
| --- | --- | --- |
| Author (intro + footer) | `src/content/author-metadata.json` | Intro, Footer, NotFound |
| Experiences | `src/content/experiences-metadata.json` | `SectionExperiences`, YoE |
| Credentials | `src/content/credentials-metadata.json` | `SectionCredentials` accordion. Optional `file` (same-origin path) opens the media viewer; `url` stays an outbound link |
| Brands | `src/content/brands-metadata.json` | `SectionBrands` marquee (`title` + `logos[]`) |
| **Skills** | `src/content/skills-metadata.json` | `SectionSkills` + `SkillElement` (icons under `public/assets/skills/`) |
| Testimonials | `src/content/testimonials-metadata.json` | Phone slider; DOM `#testimonials-data` |
| Contributions | `src/content/contributions-metadata.json` | `SectionContributions` (build fetch) + `GitHubContributionsCalendar` (`react-activity-calendar`, `client:visible`) |
| Projects catalog | `src/content/projects-metadata.json` | [`projects.ts`](src/utils/projects.ts) |
| Project bodies | `src/content/projects/*.md` | Merged at build |
| Privacy policies | `src/content/privacy-policies/*.md` | Project privacy pages |
| Blogs catalog | `src/content/blogs-metadata.json` | [`blogs.ts`](src/utils/blogs.ts) |
| Blog bodies | `src/content/blogs/*.md` | Merged at build |

**Authoring docs:** [`docs/blog-authoring.md`](docs/blog-authoring.md) · [`docs/project-authoring.md`](docs/project-authoring.md)  
**Draft helpers:** `/tools/author` (download MD + catalog JSON).

### Skills (home)

- Section: [`SectionSkills.astro`](src/components/sections/SectionSkills.astro) · chip: [`SkillElement.astro`](src/components/elements/SkillElement.astro) · CSS: [`skills.css`](src/styles/skills.css)
- Metadata shape: `title`, `description`, `tech.stack[]` / related groups with `icon`, `label`, `description`
- Current stack chips include Kotlin, Swift, Python, Flutter, Jetpack Compose, UPI, QR Scanner, Security/RASP; tools include Android Studio, Xcode, VS Code, Cursor, Claude Code, GitKraken (see JSON for truth)
- `/design` mounts live `SectionSkills` with `preview` dummy catalog
- Chip recipe: `54px` square, `9px` radius, surface + border, hover lift + tooltip — details in design-system; touch uses `skill-tooltips.ts` (`.is-open`)

### Projects

- Catalog: [`src/content/projects-metadata.json`](src/content/projects-metadata.json) · bodies: `src/content/projects/*.md` · merge: [`projects.ts`](src/utils/projects.ts)
- **`desc.short` ≤ 60 characters** (author tool `maxlength="60"`)
- Thumbs: circular store PNG (22px mark in a 54px disc, hover 26px; CSS clips to a circle). **`thumb_bg_color`** is a **light tint** that contrasts with the icon fill — not the logo’s own color, not primary-by-default. Current: CameraX `rgb(206, 232, 230)` · Coco `rgb(228, 240, 214)` · Ensecure `rgb(245, 234, 204)`
- Banners: local `/assets/projects/<slug>/banner.jpg` (download; don’t hotlink)
- Card hover: logo / banner / arrow share `0.3s ease-in-out` — no separate Motion spring on the thumb
- Authoring: [`docs/project-authoring.md`](docs/project-authoring.md) · Cursor rule: [`.cursor/rules/project-authoring.mdc`](.cursor/rules/project-authoring.mdc)

---

## Tools

Registry: [`src/utils/tools.ts`](src/utils/tools.ts) — add hub entries here when shipping a tool.

| Slug | Path | Purpose |
| --- | --- | --- |
| `author` | `/tools/author` | Draft blog/project → download MD + catalog JSON |
| `markdown` | `/tools/markdown` | Side-by-side MD preview (`data-lenis-prevent` on nested scroll) |
| `scramble-compare` | `/tools/scramble-compare` | Scramble library bake-off |
| `analytics-reach` | `/tools/analytics-reach` | Format GA4 uniques/views → `src/content/footer-reach.json` |

Shell: [`ToolsPageShell.astro`](src/components/tools/ToolsPageShell.astro) · styles: page-scoped [`tools.css`](src/styles/tools.css) · all tools `noindex`.

---

## Motion & scripts

All client scripts are TypeScript under [`src/scripts/`](src/scripts/) (`allowJs: false`).

| Script | Role |
| --- | --- |
| `boot-once.ts` | Guard so ClientRouter does not stack window listeners |
| `site-client.ts` | Layout entry: page fade, theme, motion, Lenis (one script so ClientRouter cannot drop theme). Page widgets (`available-text`, testimonials, skill tooltips, count-up, credentials accordion, share bar, media viewer) load only when their DOM exists |
| `theme.ts` | Light/dark · `html.dark` · click delegation · `themechange` · syncs all `[data-theme-toggle]` |
| `page-transition.ts` | Page-shell dissolve + Motion `springPage` rise/blur (reload and ClientRouter). First paint CSS-holds via `is-page-entering`; `__pageEnterStarted` when enter actually runs |
| `smooth-scroll.ts` | Lenis on fine-pointer / wheel only · native scroll on coarse touch · `data-lenis-prevent` for nested panes · hash offset 80px on narrow |
| `scramble-text.ts` | `data-scramble` / variants · hover (fine pointer) + tap (touch) |
| `skill-tooltips.ts` | Skill chip tooltips · tap-to-toggle on `(hover: none)` · viewport clamp for edge chips |
| `available-text.ts` | Hero “Available for…” cycle (SSR first word; CSS handles mobile one-line) |
| `reveal.ts` / `count-up.ts` | Scroll reveal (`inView` + spring); YoE count (SSR number; animates when scrolling into view) |
| `credentials-accordion.ts` | Credentials exclusive accordion (`data-credentials-accordion`) |
| `motion-tokens.ts` | House easing, `springPage` / `springSoft` / `springSnappy` |
| `testimonial-slider.ts` | Phone stories · prefers `#testimonials-data` |
| `image-fallback.ts` | Broken `<img>` → media shell or logo mark |
| `share-bar.ts` | Blog/project share icon — hover/tap menu (copy + social intents) (`data-share-bar`) |
| `media-viewer.ts` | View-only overlay for images / PDF / text (`data-media-viewer`). Credentials `file` and project body screenshots (not hero banner). PDF via lazy `media-viewer-pdf.ts`. Not DRM. |
| `analytics.ts` | GA4 + optional Microsoft Clarity (`CLARITY_ENABLED`) + ClientRouter page views |
| `markdown-fullscreen.ts` | Fullscreen markdown doc panels |
| Tools scripts | `tools-*.ts` for author / markdown / scramble-compare / analytics-reach |

Honor `prefers-reduced-motion`. Scramble stays custom until Motion+; no GSAP theatre.

---

## Durable decisions (gotchas)

### TypeScript (mandatory)

- Root [`tsconfig.json`](tsconfig.json) extends `astro/tsconfigs/strict` with **`allowJs: false`**.
- No `.js` / `.jsx` / `.mjs` / `.cjs` under `src/` — enforced by `npm run check` (`astro check` + `scripts/assert-no-js.mjs`).
- `npm run build` runs `astro check` first, then `astro build`.
- Config: [`astro.config.ts`](astro.config.ts) (Vite minify in production; no post-build JS obfuscation).
- Client scripts register window listeners via [`bootOnce`](src/scripts/boot-once.ts) so ClientRouter cannot stack theme/Lenis/motion handlers. Inline layout/loader scripts use `window.__layoutInlineBoot` / `__pageLoaderScript`.
- Shared window globals: [`src/env.d.ts`](src/env.d.ts).

### `/design` gallery

- Mount **live** sections/pages with `preview` + [`design-preview-data.ts`](src/utils/design-preview-data.ts) — avoid hand mocks that drift.
- **Media:** [`design-media-placeholder.svg`](public/assets/resources/design-media-placeholder.svg) + `.design-media-ph` (token gradient like `.design-nav-demo`). No live Camerax / blog / author photos in preview.
- **Project thumbs:** [`design-logo-placeholder.svg`](public/assets/resources/design-logo-placeholder.svg) — white **A** on `thumb_bg_color`.
- Testimonials: embed `#testimonials-data` (preview dummy · live same mechanism).

### Nav glass / theme toggle

- No `transform`, `view-transition-name`, or **`overflow: hidden` on the same node as `.nav-glass`**.
- Clip theme icons on **`.nav-theme-toggle__clip`**; track is `.nav-theme-toggle__track` (`width: 200%`, slides under `html.dark`).
- Decorative clip/track use **`pointer-events: none`** so the `<button>` owns taps (mobile WebKit). Nav container `z-index: 40`. Toggle via document click delegation (`bootOnce('theme')`); `applyTheme` dispatches `themechange` on the next frame so islands do not block the icon slide.

### Contributions calendar

- **This site:** [`react-activity-calendar`](https://github.com/grubersjoe/react-activity-calendar) (direct dep — **not** `react-github-calendar`). Island [`GitHubContributionsCalendar.tsx`](src/components/elements/GitHubContributionsCalendar.tsx) via **`client:visible`** (surface fallback) so home ClientRouter swaps are not blocked on React hydrate. Cursor rule: [`.cursor/rules/contributions-calendar.mdc`](.cursor/rules/contributions-calendar.mdc).
- **Data:** fetched at **build** in [`SectionContributions.astro`](src/components/sections/SectionContributions.astro) from Jonathan Gruber’s [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api) (`https://github-contributions-api.jogruber.de/v4/{username}?y=last`). Filter to the last **8 months**, merge counts by date across `usernames[]` in [`contributions-metadata.json`](src/content/contributions-metadata.json). `/design` uses `previewContributionDays()` (no network).
- Theme: `useSyncExternalStore` on `data-theme` / `.dark` + `themechange` / `storage` / `pageshow`; heatmap uses `useDeferredValue` (do not remount with `key` on the toggle frame).
- Tear down `ActivityCalendar` on `astro:before-preparation` / `astro:before-swap` so head `<style>` cleanup does not `removeChild` after ClientRouter swap.
- Vite 8 Rolldown: **do not** `optimizeDeps.include` React / `jsx-dev-runtime` (production CJS has `jsxDEV = undefined` → `_jsxDEV is not a function` in dev). Keep `react-activity-calendar` included; exclude the React entries. In `astro dev`, alias `react/jsx-dev-runtime` to [`src/shims/react-jsx-dev-runtime.ts`](src/shims/react-jsx-dev-runtime.ts) so a stale Vite prebundle cannot blank the heatmap.
- **Not Echo / Kibo:** the [Echo Astro template](https://echo-astro-template.vercel.app/projects/echo-ui) heatmap is [Kibo UI Contribution Graph](https://www.kibo-ui.com/components/contribution-graph) (`npx kibo-ui add contribution-graph` / Shadcnblocks `@shadcnblocks/contribution-graph/contribution-graph-standard-1`). Copy-paste shadcn SVG + Radix tooltip (`<rect data-level>` / `data-slot="tooltip-trigger"`). Visualization only — Echo’s demo bakes static 2024 dummy days (no live GitHub fetch). **Do not replace** this island with Kibo / shadcnblocks.

### Page enter

- First paint: inline CSS hold in [`BaseLayout.astro`](src/layouts/BaseLayout.astro) (`html.is-page-entering` on `.page-shell`). No WAAPI tween.
- Reload and ClientRouter both play Motion `springPage` from [`page-transition.ts`](src/scripts/page-transition.ts) (`animate` on `.page-shell`). Wait until the shell has non-script children, the loader is done, and scroll restore has applied.
- Set **`window.__pageEnterStarted`** only when enter runs (or reduced-motion skip). `__pageEnterBound` means the Motion module parsed — do not treat that as “enter already played”.
- Mid-page reload: `is-page-restore` (no `100vh` clip) so scroll can land; `is-scroll-hold` keeps `scroll-pending` until Motion pins opacity 0, then `springPage` plays. Do not lift `scroll-pending` from Lenis/load/timeout or the page flashes. In-view reveals settle; below-fold still fades up.
- If the bundle never binds, a short inline timeout uncovers the shell so the page is not stuck.

### Lenis vs native scroll

- Lenis runs on **fine pointer / wheel** only. Coarse touch (`(hover: none) and (pointer: coarse)`) and `prefers-reduced-motion` use native scroll.
- In-page hash links: offset **20px** desktop, **80px** on `max-narrow` (top nav). Same handler with or without Lenis.

### SEO

- Helpers live in [`src/utils/seo.ts`](src/utils/seo.ts). Home description = author `bio`. Catalog **layout** descriptions are topic-led; on-page section copy stays in the JSON catalogs.
- Blog/project detail: per-page OG image (correct MIME; default PNG width/height only on the site fallback), WebPage + BlogPosting / SoftwareApplication JSON-LD, project meta from `desc.long` (not the 60-char card line). Optional blog `tags` → `article:tag`.
- Sitemap: filter `/tools`, `/design`, `/apps`; `lastmod` from blog `date` / project `updated_date`. Public RSS at [`/rss.xml`](src/pages/rss.xml.ts).
- Share image: `public/assets/resources/og-image.png` must be a real PNG (not AVIF with a `.png` name). Dimensions in `OG_IMAGE_WIDTH` / `OG_IMAGE_HEIGHT`.
- Skip link: `.skip-link` → `#main` on every page `<main>`.

### Layout / color

- Default column **`max-w-[550px]`** (home, footer, tools hub).
- Semantic tokens only (`bg-bg`, `text-text`, …). Match existing section recipes.

### Surface shell grey gap

- **Footer** is the source of truth for padding from the outer border to the inner content box: `border border-border` + `p-[9→6]` (`pb-[18]` when a bottom bar sits in the shell).
- **Must match:** `.hero-card` (home intro, 404, project detail) and the blogs list wrapper.
- **Do not** use `shadow-[inset_0_0_0_1px_…]` on those shells (inset sits inside the padding and looks tighter). Inset rings stay OK on small chrome (back circle, chips, hole, code).
- Full recipe: [`docs/design-system.md`](docs/design-system.md) § Surface shell (grey gap) · Cursor rule: [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc).

### Media viewer (view-only)

- Trigger: `[data-media-viewer][data-src]` (optional `data-title`, `data-kind`). Same-origin paths only. A wrapped `<img>` is enough for screenshots (`currentSrc` is reused).
- Overlay is body-mounted (`media-viewer.ts`, `viewer.css`). PDFs paint to canvas (lazy pdf.js); no download button, save/print shortcuts, or context menu while open.
- **Not DRM.** The browser still fetches the file. Do not use an `<iframe>` / `<embed>` of a PDF (native toolbar has Download).
- Consumers: credentials optional `file`; project body shots via [`ProjectLightboxImage`](src/components/elements/ProjectLightboxImage.astro) (hero banner stays plain). `url` on credentials stays outbound.

### SVG sprite

- One [`SvgSprite.astro`](src/components/SvgSprite.astro) in [`BaseLayout`](src/layouts/BaseLayout.astro), **outside** `.page-shell`, with `transition:persist="svg-sprite"`.
- Do **not** copy `#svg-templates` into pages. Add icons there only when a `<use href="#id">` exists.

### Legacy `/apps/*/privacy-policy` redirects

- [`astro.config.ts`](astro.config.ts) redirects `/apps/coco|ensecure/privacy-policy` → `/projects/<slug>/privacy-policy` for old Play Console / bookmark links.
- **Remove by end of 2026** (`TODO(2026-12)` in config) once store listings point only at the new URLs.

---

## Where to look

| Need | Path |
| --- | --- |
| Full UI recipes | `docs/design-system.md` |
| Blog authoring | `docs/blog-authoring.md` |
| Project authoring | [`docs/project-authoring.md`](docs/project-authoring.md) · [`.cursor/rules/project-authoring.mdc`](.cursor/rules/project-authoring.mdc) |
| Skills data | `src/content/skills-metadata.json` |
| Years of experience | [`src/utils/date.ts`](src/utils/date.ts) `yearsOfExperience()` — intro badge + experiences count |
| SEO helpers | [`src/utils/seo.ts`](src/utils/seo.ts) — titles, canonical, JSON-LD (incl. BlogPosting / SoftwareApplication), sitemap lastmod, RSS |
| Tools registry | `src/utils/tools.ts` |
| Gallery page / dummy data | `src/pages/design.astro`, `src/utils/design-preview-data.ts` |
| Tokens | `src/styles/tokens.css` |
| Nav / glass | `src/styles/nav.css`, `src/components/NavBar.astro` |
| SVG sprite | [`src/components/SvgSprite.astro`](src/components/SvgSprite.astro) — mount from BaseLayout only |
| Site README | `README.md` |
| Version bump / release | [`.cursor/rules/version-bump.mdc`](.cursor/rules/version-bump.mdc) · Versions section above |
| Never auto-push | [`.cursor/rules/no-push.mdc`](.cursor/rules/no-push.mdc) |
| Commit + changelog | [`.cursor/rules/commit-changelog.mdc`](.cursor/rules/commit-changelog.mdc) |
| Contributions calendar | [`GitHubContributionsCalendar.tsx`](src/components/elements/GitHubContributionsCalendar.tsx) · [`SectionContributions.astro`](src/components/sections/SectionContributions.astro) · [`.cursor/rules/contributions-calendar.mdc`](.cursor/rules/contributions-calendar.mdc) — `react-activity-calendar` + jogruber API; not Kibo UI / Echo |

---

## Changelog (memory)

Versioned notes for **this memory file** and related agent guidance — full product history lives in [`CHANGELOG.md`](CHANGELOG.md). Align the top **Versions** row when the package bumps.

### Unreleased

- Share icon on blog and project detail (top right): hover/tap dropdown with copy link plus Bluesky, Facebook, LinkedIn, Threads, and X. [`ShareBar`](src/components/elements/ShareBar.astro) · [`share-bar.ts`](src/scripts/share-bar.ts).
- Blog/project SEO: per-page OG MIME, WebPage + BlogPosting / SoftwareApplication JSON-LD, project meta from `desc.long`, blog `tags`, `/rss.xml`.
- Shared view-only media overlay (`data-media-viewer`, `media-viewer.ts`): credentials `file` (ACE Award PDF) and project body screenshots. Hero banner excluded. PDFs render to canvas (no download bar). License rows are title/org only (no outbound URLs or link arrows).
- Project catalog: `desc.short` ≤ 60 characters; circular Play thumbs (22px in the 54px disc); light tint `thumb_bg_color` (not the logo fill); local banners; card hover 22→26px shares `0.3s ease-in-out` with banner/arrow. Rule: [`.cursor/rules/project-authoring.mdc`](.cursor/rules/project-authoring.mdc).

### 1.0.8 — 2026-08-14

- Release bump to `1.0.8`.
- SSR first paint for available-for, testimonials, and YoE; credentials accordion as `credentials-accordion.ts`.
- SEO: real PNG OG image, skip link, JSON-LD, sitemap lastmod, topic-led catalog descriptions.
- Vite 8 Rolldown: do not prebundle React / `jsx-dev-runtime` (dev `jsxDEV` crash); direct dep `react-activity-calendar`.
- Lenis on fine pointer only; page-enter race shared via `__pageEnterStarted`; mobile hero hides My work.
- Contributions stack recorded: this site is `react-activity-calendar` + jogruber API (build fetch, last 8 months). Echo / Shadcnblocks uses Kibo UI Contribution Graph (static dummy on their demo) — do not swap. Rule: `.cursor/rules/contributions-calendar.mdc`.

### 1.0.7 — 2026-08-13

- Release bump to `1.0.7`.
- No post-build JS obfuscation (Vite minify only); `bootOnce` for ClientRouter listener stacking; calendar `useDeferredValue` for theme.
- Surface-shell grey gap follows footer (`border-border` + `p-[9→6]`); hero / 404 / project / blogs list match; inset rings not for those shells. Docs + design rule + README mobile guidelines synced.
- Experience timeline: mobile now + 3 past years at content width, `justify-between` with a `16px` minimum gap; last year clips under the edge fade. Skill tooltips clamp to the viewport on edge chips.

### 1.0.6 — 2026-08-11

- Release bump to `1.0.6`.
- Durable notes: mobile theme toggle hit-testing / `themechange`; contributions `client:only` + theme store; skill tap tooltips; Cursor / Claude Code / GitKraken tools.
- Docs + design rule synced for touch scramble/tooltips and Clarity `CLARITY_ENABLED`.
- Agent git policy: never auto-push; version-bump is local commit+tag only; push requires explicit confirmation (`.cursor/rules/no-push.mdc`).

### 1.0.5 — 2026-08-09

- Release bump to `1.0.5`.
- Mandatory TypeScript (`allowJs: false`, check-on-build); GA4 + production JS obfuscation; reach tool + footer ticker.
- Agent workflows: commit+changelog and full version-bump rules.

### 1.0.4 — 2026-08-09

- Release bump to `1.0.4`.
- Feature sheets: Tailwind `@apply` for layout/type/token colors; page-scoped `tools.css` / `design.css` use `@reference` to `global.css`.
- Design-system docs + Cursor rule + stack blurb synced for `@apply`-in-sheets.
- Home contributions calendar + shared `SectionHeading`; gallery preview paths for Skills / Brands / Contributions.
- Version-bump workflow: when asked to bump version → changelog + package + memory → commit → tag (local only; no push) (rule: `.cursor/rules/version-bump.mdc`).
- Commit workflow: when asked to commit → update `CHANGELOG.md` Unreleased first, then commit (rule: `.cursor/rules/commit-changelog.mdc`).
- Never auto-push to origin; if the user asks to push, confirm and wait for yes (rule: `.cursor/rules/no-push.mdc`).
- Mandatory TypeScript: strict `tsconfig.json`, all `src/scripts` + config as `.ts`, `allowJs: false`, check-on-build.

### 1.0.3 — 2026-08-09

- Release bump to `1.0.3`; root `CHANGELOG.md` (Keep a Changelog) for ongoing product notes.
- Expanded `AGENTS.md`: routes, content/skills/tools map, motion scripts, version table.
- Gallery: live `preview` mounts + media/logo placeholders + `image-fallback.ts`.
- Theme toggle clip via `.nav-theme-toggle__clip`; design-system docs + `.cursor/rules/design-system.mdc` synced.
- Logo placeholder glyph set to letter **A**.

### 1.0.2 — 2026-08-09

- Package release tag `v1.0.2` (pre-gallery memory expansion).

### 1.0.1 — (prior)

- See git tag `v1.0.1` / `CHANGELOG.md`.
