# AGENTS.md — project memory

Git-tracked map + durable decisions for humans and coding agents.  
**Current site version:** `1.0.3` ([`package.json`](package.json) · git tag `v1.0.3`) · product notes: [`CHANGELOG.md`](CHANGELOG.md)  
**UI source of truth:** [`docs/design-system.md`](docs/design-system.md) · Cursor rule: [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc) · Gallery: `/design`

Keep this file in sync when you ship durable architecture decisions or bump the package version. Prefer linking to long recipes in `docs/` over duplicating them here.

---

## Versions

| Field | Value | Notes |
| --- | --- | --- |
| **Package** | `1.0.3` | Bump in `package.json` on release |
| **Git tags** | `v1.0.3`, `v1.0.2`, `v1.0.1` | Match package when tagging |
| **Memory doc** | `1.0.3` | Same as package after each memory update on a release line |
| **Changelog** | [`CHANGELOG.md`](CHANGELOG.md) | Keep a Changelog · append under Unreleased as you go, fold into the version on release |
| **Node** | `>=22.12` | `engines` in package.json |
| **Astro** | `^7.2` | Static output · Vite 8 |
| **Tailwind** | v4 via `@tailwindcss/vite` | Tokens in `src/styles/tokens.css` |
| **License** | CC-BY-4.0 | See `LICENSE` |

**When releasing:** move `[Unreleased]` notes into a new `CHANGELOG.md` section → bump `package.json` (+ lock) → update this **Versions** table + memory changelog → commit → tag `vX.Y.Z` → push branch + tags.

---

## Stack (short)

- Astro static portfolio · Tailwind v4 · feature CSS via [`global.css`](src/styles/global.css) (layout via `@apply` in sheets; do **not** import `tools.css` / `design.css` into global — those `@reference` global for theme)
- Content: JSON catalogs + Markdown under `src/content/` · loaders in `src/utils/`
- Motion today: Lenis + custom appear/reveal/scramble/count-up · Motion.js adoption is roadmap in design-system §12
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
| Credentials | `src/content/credentials-metadata.json` | `SectionCredentials` accordion |
| Brands | `src/content/brands-metadata.json` | `SectionBrands` marquee |
| **Skills** | `src/content/skills-metadata.json` | `SectionSkills` + `SkillElement` (icons under `public/assets/skills/`) |
| Testimonials | `src/content/testimonials-metadata.json` | Phone slider; DOM `#testimonials-data` |
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
- Current stack chips include Kotlin, Swift, Flutter, Jetpack Compose, UPI, QR Scanner, Security/RASP (see JSON for truth)
- Chip recipe: `54px` square, `9px` radius, surface + border, hover lift + tooltip — details in design-system
- `/design` mounts live `SectionSkills` (no separate dummy skills catalog yet)

---

## Tools

Registry: [`src/utils/tools.ts`](src/utils/tools.ts) — add hub entries here when shipping a tool.

| Slug | Path | Purpose |
| --- | --- | --- |
| `author` | `/tools/author` | Draft blog/project → download MD + catalog JSON |
| `markdown` | `/tools/markdown` | Side-by-side MD preview (`data-lenis-prevent` on nested scroll) |
| `scramble-compare` | `/tools/scramble-compare` | Scramble library bake-off |

Shell: [`ToolsPageShell.astro`](src/components/tools/ToolsPageShell.astro) · styles: page-scoped [`tools.css`](src/styles/tools.css) · all tools `noindex`.

---

## Motion & scripts

| Script | Role |
| --- | --- |
| `theme.js` | Light/dark · `html.dark` · syncs all `[data-theme-toggle]` |
| `smooth-scroll.js` | Lenis · `data-lenis-prevent` for nested panes |
| `scramble-text.js` | `data-scramble` / variants |
| `available-text.js` | Hero “Available for…” cycle |
| `reveal.js` / `hero-appear.js` / `count-up.js` | Appear, scroll reveal, YoE count |
| `testimonial-slider.js` | Phone stories · prefers `#testimonials-data` |
| `image-fallback.js` | Broken `<img>` → media shell or logo mark |
| Tools scripts | `tools-*.js` for author / markdown / scramble-compare |

Honor `prefers-reduced-motion`. Roadmap: adopt Motion (JS) per design-system §12 — don’t add GSAP theatre.

---

## Durable decisions (gotchas)

### `/design` gallery

- Mount **live** sections/pages with `preview` + [`design-preview-data.ts`](src/utils/design-preview-data.ts) — avoid hand mocks that drift.
- **Media:** [`design-media-placeholder.svg`](public/assets/resources/design-media-placeholder.svg) + `.design-media-ph` (token gradient like `.design-nav-demo`). No live Camerax / blog / author photos in preview.
- **Project thumbs:** [`design-logo-placeholder.svg`](public/assets/resources/design-logo-placeholder.svg) — white **A** on `thumb_bg_color`.
- Testimonials: embed `#testimonials-data` (preview dummy · live same mechanism).

### Nav glass / theme toggle

- No `transform`, `view-transition-name`, or **`overflow: hidden` on the same node as `.nav-glass`**.
- Clip theme icons on **`.nav-theme-toggle__clip`**; track is `.nav-theme-toggle__track` (`width: 200%`, slides under `html.dark`).

### Layout / color

- Default column **`max-w-[550px]`** (home, footer, tools hub).
- Semantic tokens only (`bg-bg`, `text-text`, …). Match existing section recipes.

---

## Where to look

| Need | Path |
| --- | --- |
| Full UI recipes | `docs/design-system.md` |
| Blog authoring | `docs/blog-authoring.md` |
| Project authoring | `docs/project-authoring.md` |
| Skills data | `src/content/skills-metadata.json` |
| Tools registry | `src/utils/tools.ts` |
| Gallery page / dummy data | `src/pages/design.astro`, `src/utils/design-preview-data.ts` |
| Tokens | `src/styles/tokens.css` |
| Nav / glass | `src/styles/nav.css`, `src/components/NavBar.astro` |
| Site README | `README.md` |

---

## Changelog (memory)

Versioned notes for **this memory file** and related agent guidance — full product history lives in [`CHANGELOG.md`](CHANGELOG.md). Align the top **Versions** row when the package bumps.

### 1.0.3 — 2026-08-09

- Release bump to `1.0.3`; root `CHANGELOG.md` (Keep a Changelog) for ongoing product notes.
- Expanded `AGENTS.md`: routes, content/skills/tools map, motion scripts, version table.
- Gallery: live `preview` mounts + media/logo placeholders + `image-fallback.js`.
- Theme toggle clip via `.nav-theme-toggle__clip`; design-system docs + `.cursor/rules/design-system.mdc` synced.
- Logo placeholder glyph set to letter **A**.

### 1.0.2 — 2026-08-09

- Package release tag `v1.0.2` (pre-gallery memory expansion).

### 1.0.1 — (prior)

- See git tag `v1.0.1` / `CHANGELOG.md`.
