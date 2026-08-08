# arindamxd.github.io

Personal portfolio site for **[Arindam Karmakar](https://arindamxd.github.io)** — Mobile App Developer (iOS / Android). Static Astro site with JSON-driven content, dark/light theme, and intentional motion.

**Live:** [https://arindamxd.github.io](https://arindamxd.github.io)  
**Repo:** [github.com/arindamxd/arindamxd.github.io](https://github.com/arindamxd/arindamxd.github.io)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro](https://astro.build) `^5.16` (static output) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Motion | Custom CSS + JS (`motion.css`, hero appear, scroll reveal) + [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll |
| Content | JSON under `src/content/` (no Markdown content collections) |
| Runtime | Node `>=18` |
| Deploy | GitHub Pages via Actions (`trunk` branch) |
| Format | Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` |

Site URL is set in `astro.config.mjs`: production defaults to `https://arindamxd.github.io`; override with `SITE_URL`. Dev server runs on **port 3000**.

---

## Features

- Single-page home with intro hero (badge / lanyard), brands marquee, projects, skills, experience, testimonials (phone slider), and blogs
- Dedicated list + detail routes for **projects** and **blogs**
- Dark / light theme (default dark), persisted in `localStorage`, flash-free boot script in `BaseLayout`
- SEO: meta description, canonical, Open Graph, Twitter card, Person JSON-LD
- Client motion: Lenis, hero appear, scroll reveal (`data-reveal`), count-up stats — respects `prefers-reduced-motion`
- App deep-link verification: `.well-known/assetlinks.json` (CameraX, certification app)
- Static privacy-policy / app pages under `public/apps/` (Coco, Ensecure); CameraX privacy is `/projects/camerax/privacy-policy`

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # → ./dist/
npm run preview  # preview production build
```

| Command | Action |
| --- | --- |
| `npm run dev` | Local dev server (port 3000) |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run clean` | Remove `dist`, `.astro`, Vite cache |
| `npm run check` | `astro check` |
| `npm run astro -- --help` | Astro CLI help |

---

## Project structure

```text
/
├── .github/workflows/deploy.yml   # GitHub Pages (push to trunk)
├── .well-known/assetlinks.json    # Android App Links
├── docs/
│   ├── blog-authoring.md          # Blog JSON catalog + Markdown authoring
│   └── project-authoring.md       # Project JSON catalog + Markdown body
├── public/
│   ├── apps/                      # App landing / privacy pages
│   └── assets/                    # Fonts, images, icons, project art
├── src/
│   ├── components/
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── sections/              # Home / list page sections
│   │   └── elements/              # Cards, project/blog pages, code block
│   ├── content/                   # Site copy (JSON catalogs + blogs|projects|privacy-policies/*.md)
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── 404.astro
│   │   ├── projects.astro
│   │   ├── projects/[slug]/          # index + privacy-policy
│   │   ├── blogs.astro
│   │   └── blogs/[slug].astro
│   ├── scripts/                   # Client JS (theme, motion, slider, …)
│   ├── styles/
│   │   ├── global.css             # Tailwind + design tokens + layout CSS
│   │   └── motion.css             # Appear / reveal / Lenis helpers
│   ├── types/                     # blog / project / experience TS types
│   └── utils/                     # date helpers, blog/project MD loaders
├── astro.config.mjs
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
| `/tools` | `pages/tools.astro` | Author blog/project MD (+ catalog JSON) and download |
| `/404` | `pages/404.astro` | Custom not-found |

Keep **one metadata entry per slug** so static routes stay unique.

---

## Content (JSON)

Edit files in `src/content/`. Sections and detail pages import these at build time.

| File | Role |
| --- | --- |
| `author-metadata.json` | Name, bio, SEO, intro hero, footer, social links |
| `projects-metadata.json` | Project list/card + hero `header` + `content` (+ optional `source_code`, `privacy_policy`) |
| `projects/*.md` | Project body (image groups + `##` content sections) |
| `privacy-policies/*.md` | Per-project privacy policy pages (`/projects/<slug>/privacy-policy`) |
| `blogs-metadata.json` | Blog list/card fields + `content` path to MD |
| `blogs/*.md` | Blog intro frontmatter + Markdown body |
| `brands-metadata.json` | Collaboration / brand logos (marquee) |
| `skills-metadata.json` | Skills section (`tech.stack`, `tech.tools`) |
| `experiences-metadata.json` | Work history (`title`, `company`, `start`, `end`) |
| `testimonials-metadata.json` | Phone slider quotes |

### Types

- `src/types/project.d.ts` — project shape  
- `src/types/blog.d.ts` — blog + body block union  
- `src/types/experience.d.ts` — experience row  

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

Entry stylesheets (only these two):

- `src/styles/global.css` — Tailwind import, `@theme` tokens, fonts, dark overrides, layout CSS
- `src/styles/motion.css` — hero appear, reveal, Lenis-related helpers

**Tokens** (semantic colors, fonts, breakpoint) live in `@theme` inside `global.css`:

- Colors: `bg`, `accent` (`#29ffff`), `primary` (`#2a29ff`), `text`, `surface`, `border`, `active`, …
- Fonts: **Manrope** (600/700 only — avoid `font-medium` / 500), **Inter**, **Fragment Mono** (self-hosted under `/assets/fonts/`)
- Breakpoint: `--breakpoint-narrow: 610px` → use `max-narrow:` for ≤609px mobile styles

Dark mode is **class-based** (`html.dark`), not `prefers-color-scheme`.

---

## Client scripts

Loaded from `BaseLayout.astro`:

| Script | Purpose |
| --- | --- |
| `theme.js` | Light ↔ dark toggle + `localStorage` |
| `available-text.js` | Responsive “Available for…” copy on hero |
| `testimonial-slider.js` | Phone testimonial carousel |
| `hero-appear.js` | Load-time hero / badge appear |
| `reveal.js` | Scroll-in sections via `[data-reveal]` |
| `smooth-scroll.js` | Lenis (skipped when reduced motion) |
| `count-up.js` | Viewport count-up for `data-count-to` |

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
| [docs/blog-authoring.md](./docs/blog-authoring.md) | Blog catalog + Markdown authoring |
| [docs/project-authoring.md](./docs/project-authoring.md) | Project catalog + Markdown body |

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
