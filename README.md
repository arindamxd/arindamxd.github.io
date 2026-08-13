# arindamxd.github.io

Personal portfolio site for **[Arindam Karmakar](https://arindamxd.github.io)** — Technical Lead, Mobile Engineering. Static Astro site with JSON-driven content, dark/light theme, and intentional motion.

**Version:** `1.0.8` · **Live:** [https://arindamxd.github.io](https://arindamxd.github.io) · **Repo:** [github.com/arindamxd/arindamxd.github.io](https://github.com/arindamxd/arindamxd.github.io) · **Notes:** [CHANGELOG.md](./CHANGELOG.md)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro](https://astro.build) `^7.2` (static output, Vite 8) |
| Language | **TypeScript mandatory** under `src/` — [`tsconfig.json`](./tsconfig.json) (`astro/tsconfigs/strict`, `allowJs: false`) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` · tokens in `src/styles/tokens.css` |
| Motion | Page-shell enter + scroll reveal (`motion` / `motion.css`) + scramble + [Lenis](https://github.com/darkroomengineering/lenis) |
| Content | JSON catalogs + Markdown bodies under `src/content/` (runtime loaders in `src/utils/`) |
| Runtime | Node `>=22.12` |
| Deploy | GitHub Pages via Actions (`trunk` branch) |
| Format | Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` |

Site URL is set in `astro.config.ts`: production defaults to `https://arindamxd.github.io`; override with `SITE_URL`. Dev server runs on **port 3000**. Production JS is minified by Vite (no post-build obfuscation).

---

## Features

- Single-page home: intro hero, skills, experience, credentials, brands marquee, testimonials (phone slider), projects, blogs, GitHub contributions calendar, footer reach ticker
- Dedicated list + detail routes for **projects** and **blogs**
- Living `/design` gallery (`noindex`) — live section mounts + preview dummy data
- Private `/tools` suite (`noindex`): author, markdown preview, scramble compare, analytics reach
- Dark / light theme (default dark), persisted in `localStorage`, flash-free boot script in `BaseLayout`
- SEO: meta description, canonical, Open Graph (PNG + size), Twitter card, Person / ProfilePage / CollectionPage JSON-LD, sitemap lastmod
- GA4 page views in production only (skipped in `astro dev`)
- Client motion: Lenis, page-shell enter, scroll reveal (`data-reveal`), count-up, scramble — respects `prefers-reduced-motion`
- App deep-link verification: `public/.well-known/assetlinks.json` (CameraX, certification app)
- Project privacy policies at `/projects/<slug>/privacy-policy` (CameraX, Coco, Ensecure); old `/apps/*/privacy-policy` URLs redirect

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # astro check + no-JS-under-src gate
npm run build    # check, then → ./dist/
npm run preview  # preview production build
```

| Command | Action |
| --- | --- |
| `npm run dev` | Local dev server (port 3000) |
| `npm run check` | `astro check` + assert no `.js` under `src/` |
| `npm run build` | `astro check`, then production build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run clean` | Remove `dist`, `.astro`, Vite cache |
| `npm run astro -- --help` | Astro CLI help |

---

## Project structure

```text
/
├── .github/workflows/deploy.yml   # GitHub Pages (push to trunk)
├── public/.well-known/assetlinks.json  # Android App Links (served at /.well-known/)
├── AGENTS.md                      # Git-tracked agent / project memory
├── CHANGELOG.md                   # Product release notes
├── tsconfig.json                  # Strict TS · allowJs: false
├── docs/
│   ├── design-system.md           # UI/UX source of truth
│   ├── blog-authoring.md          # Blog JSON catalog + Markdown authoring
│   └── project-authoring.md       # Project JSON catalog + Markdown body
├── public/
│   ├── .well-known/               # Android App Links (assetlinks.json)
│   └── assets/                    # Fonts, images, icons, project art
├── scripts/
│   └── assert-no-js.mjs           # CI gate: no JS under src/
├── src/
│   ├── components/
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── sections/              # Home / list page sections
│   │   ├── elements/              # Cards, project/blog pages, code block
│   │   └── tools/                 # ToolsPageShell
│   ├── content/                   # Site copy (JSON catalogs + blogs|projects|privacy-policies/*.md)
│   ├── content.config.ts          # Content Layer registration (blogs glob)
│   ├── env.d.ts                   # Window globals for client scripts
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── 404.astro
│   │   ├── design.astro           # Living design gallery (noindex)
│   │   ├── tools/                 # Private ops tools (noindex)
│   │   ├── projects.astro
│   │   ├── projects/[slug]/          # index + privacy-policy
│   │   ├── blogs.astro
│   │   └── blogs/[slug].astro
│   ├── scripts/                   # Client TypeScript (theme, motion, tools, …)
│   ├── styles/                    # tokens + feature sheets via global.css
│   ├── types/                     # blog / project / experience (+ ambient pkgs)
│   └── utils/                     # loaders, SEO, analytics, tools registry, reach
├── astro.config.ts
└── package.json
```

---

## Routes

| Path | Source | Notes |
| --- | --- | --- |
| `/` | `pages/index.astro` | Full home composition |
| `/projects` | `pages/projects.astro` | Project list |
| `/projects/[slug]` | `pages/projects/[slug]/index.astro` | Catalog + `content/projects/*.md` |
| `/projects/[slug]/privacy-policy` | `pages/projects/[slug]/privacy-policy.astro` | Optional; `content/privacy-policies/*.md` |
| `/blogs` | `pages/blogs.astro` | Blog list |
| `/blogs/[slug]` | `pages/blogs/[slug].astro` | Catalog + `content/blogs/*.md` |
| `/design` | `pages/design.astro` | Living gallery (`noindex`) |
| `/tools` | `pages/tools/index.astro` | Tools hub (`noindex`) |
| `/tools/*` | `pages/tools/<slug>.astro` | Author, markdown, scramble-compare, analytics-reach |
| `/404` | `pages/404.astro` | Custom not-found |

Keep **one metadata entry per slug** so static routes stay unique.

---

## Content (JSON)

Edit files in `src/content/`. Sections and detail pages import these at build time.

| File | Role |
| --- | --- |
| `author-metadata.json` | Name, bio, SEO, intro hero, footer, social links |
| `footer-reach.json` | Curated uniques/views for the footer reach ticker |
| `projects-metadata.json` | Project list/card + hero `header` + `content` (+ optional `source_code`, `privacy_policy`) |
| `projects/*.md` | Project body (image groups + `##` content sections) |
| `privacy-policies/*.md` | Per-project privacy policy pages (`/projects/<slug>/privacy-policy`) |
| `blogs-metadata.json` | Blog list/card fields + `content` path to MD |
| `blogs/*.md` | Blog intro frontmatter + Markdown body |
| `brands-metadata.json` | Brand marquee (`title` + `logos[]`) |
| `skills-metadata.json` | Skills section (`tech.stack`, `tech.tools`) |
| `experiences-metadata.json` | Work history (`title`, `company`, `start`, `end`) |
| `credentials-metadata.json` | Credentials accordion |
| `testimonials-metadata.json` | Phone slider quotes |
| `contributions-metadata.json` | GitHub contributions section copy + usernames |

### Types

- `src/types/project.d.ts` — project shape  
- `src/types/blog.d.ts` — blog + body block union  
- `src/types/experience.d.ts` — experience row  
- `src/env.d.ts` — shared `window` globals for client scripts  

### Adding a blog post

1. Add a list entry to `blogs-metadata.json` (`slug`, `title`, `thumb`, `author`, `date`, `content`).
2. Create `src/content/blogs/<slug>.md` with intro frontmatter and Markdown body.
3. Put images under `public/assets/` (or use absolute URLs).

Full reference: **[docs/blog-authoring.md](./docs/blog-authoring.md)**. Markdown compiles to the typed blocks rendered by `BlogPage.astro` / `BlogCodeBlock.astro`.

### Adding a project

1. Add a list entry to `projects-metadata.json` (`slug`, `title`, `desc`, `images`, `header`, `content`, optional `source_code` / `privacy_policy`).
2. Create `src/content/projects/<slug>.md` with the fixed body sequence (image groups + `##` sections).
3. If `privacy_policy` is enabled, add `src/content/privacy-policies/<slug>.md`.
4. Add logos / assets under `public/assets/projects/<slug>/` as needed.

Full reference: **[docs/project-authoring.md](./docs/project-authoring.md)**. Markdown compiles to the typed blocks rendered by `ProjectPage.astro`.

---

## Styling & design system

Entry stylesheet:

- `src/styles/global.css` — Tailwind import, feature sheets (`tokens`, `hero`, `projects`, …), fonts, dark overrides

Page-scoped (not imported into global): `tools.css`, `design.css` — each `@reference`s `global.css` for `@apply`.

**Tokens** (semantic colors, fonts, breakpoint) live in `src/styles/tokens.css`:

- Colors: `bg`, `accent` (`#29ffff`), `primary` (`#2a29ff`), `text`, `surface`, `border`, `active`, …
- Fonts: **Manrope** (600/700 only — avoid `font-medium` / 500), **Fragment Mono** (code / raw markdown)
- Breakpoint: `--breakpoint-narrow: 610px` → use `max-narrow:` for ≤609px mobile styles

Dark mode is **class-based** (`html.dark`), not `prefers-color-scheme`.

### Mobile layout guidelines

Use these gutters so layouts stay consistent from **iPhone 16 (~393 CSS px)** down to compact Androids (**Galaxy S8+ / many phones at 360 CSS px**). Always verify at **360** and **~390–412** in DevTools — fixed `360px` mocks and `w-full` + `mx-*` often look fine at 412 and break at 360.

#### Breakpoints

| Token / query | Range | Use for |
| --- | --- | --- |
| `max-narrow:` / `@media (max-width: 609.98px)` | ≤609px | All mobile layout |
| `max-[389px]:` / `@media (max-width: 389.98px)` | ≤389px | Compact phones only (nav densify; leave iPhone 16 alone) |

#### Outside screen gutter (cards & chrome)

Match the **home intro** section: **`max-narrow:px-2.5`** (10px each side).

Apply to:

- Section shells and framed cards (intro hero card, testimonials phone stage, footer “Say Hello” card, project hero card, Source Code / Privacy bar, blog banner image)
- Prefer a **wrapper with `px-2.5`** and a full-width child — not `w-full` + `mx-2.5` (margins on `w-full` are unreliable in centered flex columns)

```html
<!-- ✅ Footer / links bar pattern -->
<div class="w-full max-w-[550px] max-narrow:px-2.5">
  <div class="w-full rounded-[…] border …">…</div>
</div>

<!-- ✅ Section pattern (intro, skills, …) -->
<section class="… max-w-[550px] max-narrow:px-2.5">…</section>
```

#### Inside-card grey gap (shell padding)

The strip of `bg-surface` from the card **border** to the inner `bg-bg` box (or list row / project banner). **Footer** is the source of truth:

- Hairline: **`border border-border`** (not inset `box-shadow` — that makes the gap look tighter)
- Pad: **`p-[9px]`** desktop → **`p-1.5` (6px)** on `max-narrow:` (`pb-[18px]` when a bottom bar sits in the shell)
- Same chrome on `.hero-card` (home intro, 404, project detail) and the blogs list wrapper

Full recipe: [docs/design-system.md](./docs/design-system.md) § Surface shell (grey gap).

#### Text blocks (wider inset)

Standalone copy stays on the original text gutter: **`max-narrow:px-5`** (20px).

Apply to:

- Project title / description / “Back to projects”
- Project body `content` blocks
- Blog article text columns
- “More projects” / “Coming soon…” headings on project detail (`slug` only — home/catalog keep shared `px-2.5`)

Do **not** put text and cards in one shared `px-2.5` wrapper if text must stay at `px-5`.

#### Navbar

- Floating `.nav-bar-container` keeps side clearance with **`padding-inline: 10px`** (≤609) and **`16px`** (≤389) — not a `max-width: calc(100% - 20px)` on the container
- On ≤389px, densify the pill (height 52px, gaps, Contact, theme toggle) so the bar still fits inside that max-width
- Top offset: `+8px` on ≤609, `+11px` on ≤389 — keeps the denser 52px compact nav vertically centered in the top blue / chrome band

#### Fixed-width phone mocks (testimonials)

The testimonials phone is a **360×750** mock with a `.mobile-border` that bleeds **±10px** (≈380px visual). On a **360px** viewport that cancels a `px-2.5` gutter unless you scale.

- Shell: `min(360px, calc(100% * 360 / 380))` so body + border fit inside the section gutter
- Scale with a **unitless** factor: `transform: scale(calc(100cqw / 360px))` — `scale(calc(100cqw / 360))` is invalid (length, not number) and is ignored
- See `.testimonials-phone-shell` in `src/styles/testimonials.css`

#### Checklist before shipping mobile UI

1. Compare side margin of new cards to home intro / footer at **360** and **412**
2. Compare **inside-card grey gap** (border → inner box) to the footer shell — not an inset-shadow shell
3. Keep text at `px-5` when it was designed that way; don’t force it to card gutter
4. Never ship a hard `width: 360px` (or similar) without a scale/fit strategy for viewports ≤ that width
5. Prefer `px-*` wrappers over `mx-*` on `w-full` flex children

---

## Client scripts

Loaded from `BaseLayout.astro` via `site-client.ts` (TypeScript under `src/scripts/`). Home-only widgets load when their DOM is present:

| Script | Purpose |
| --- | --- |
| `theme.ts` | Light ↔ dark toggle + `localStorage` · click delegation · `themechange` event |
| `available-text.ts` | Responsive “Available for…” copy on hero |
| `testimonial-slider.ts` | Phone testimonial carousel |
| `page-transition.ts` | Page-shell dissolve + spring rise/blur (every route) |
| `reveal.ts` | Scroll-in sections via `[data-reveal]` |
| `smooth-scroll.ts` | Lenis (skipped when reduced motion) |
| `count-up.ts` | Viewport count-up for `data-count-to` |
| `image-fallback.ts` | Broken image → gallery placeholder |
| `scramble-text.ts` | Shared `data-scramble` helpers · hover (fine pointer) + tap (touch) |
| `skill-tooltips.ts` | Skill chip tooltips · tap-to-toggle on touch · viewport clamp for edge chips |
| `analytics.ts` | GA4 bootstrap (production); optional Microsoft Clarity via `CLARITY_ENABLED` |

---

## Deployment

- **Branch:** `trunk` (not `main`)
- **Workflow:** `.github/workflows/deploy.yml`
  - Build: [`withastro/action@v5`](https://github.com/withastro/action)
  - Deploy: `actions/deploy-pages@v4`
- Triggers: push to `trunk`, or manual `workflow_dispatch`
- `base` in Astro config is `/` (user site `username.github.io`)
- `.nojekyll` is present so GitHub Pages does not run Jekyll

---

## Related docs

| Doc | What it’s for |
| --- | --- |
| [AGENTS.md](./AGENTS.md) | Git-tracked agent / project memory (durable decisions) |
| [CHANGELOG.md](./CHANGELOG.md) | Product release notes (Keep a Changelog) |
| [docs/design-system.md](./docs/design-system.md) | UI/UX source of truth · living gallery at `/design` · surface-shell grey gap (footer) |
| [docs/blog-authoring.md](./docs/blog-authoring.md) | Blog catalog + Markdown authoring |
| [docs/project-authoring.md](./docs/project-authoring.md) | Project catalog + Markdown body |
| [Mobile layout guidelines](#mobile-layout-guidelines) | Screen gutters (`px-2.5` cards / `px-5` text), inside-card grey gap, nav, 360px phone mocks |

---

## License

[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

If you clone, fork, or reuse this site’s pages, layout, components, or design, you must provide attribution in this form:

Created by [Arindam Karmakar](https://arindamxd.github.io/)

Omitting that credit violates the license.
