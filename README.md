# arindamxd.github.io

Personal portfolio site for **[Arindam Karmakar](https://arindamxd.github.io)** — Mobile App Developer (iOS / Android). Static Astro site with JSON-driven content, dark/light theme, and Framer-inspired motion.

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
- Static privacy-policy / app pages under `public/apps/` (CameraX, Coco, Ensecure)

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
│   └── blog-authoring.md          # How to write blog body blocks
├── public/
│   ├── apps/                      # App landing / privacy pages
│   └── assets/                    # Fonts, images, icons, project art
├── src/
│   ├── components/
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── sections/              # Home / list page sections
│   │   └── elements/              # Cards, project/blog pages, code block
│   ├── content/                   # All site copy & data (JSON)
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── 404.astro
│   │   ├── projects.astro
│   │   ├── projects/[slug].astro
│   │   ├── blogs.astro
│   │   └── blogs/[slug].astro
│   ├── scripts/                   # Client JS (theme, motion, slider, …)
│   ├── styles/
│   │   ├── global.css             # Tailwind + design tokens + Framer leftovers
│   │   └── motion.css             # Appear / reveal / Lenis helpers
│   ├── types/                     # blog / project / experience TS types
│   └── utils/date.ts
├── MIGRATION.md                   # Proton → Tailwind migration notes
├── MOTION-GAP-PLAN.md             # Framer vs local motion checklist
├── astro.config.mjs
└── package.json
```

---

## Routes

| Path | Source | Notes |
| --- | --- | --- |
| `/` | `pages/index.astro` | Full home composition |
| `/projects` | `pages/projects.astro` | Project list |
| `/projects/[slug]` | `pages/projects/[slug].astro` | From `projects-metadata.json` |
| `/blogs` | `pages/blogs.astro` | Blog list |
| `/blogs/[slug]` | `pages/blogs/[slug].astro` | From `blogs-metadata.json` |
| `/404` | `pages/404.astro` | Custom not-found |

Keep **one metadata entry per slug** so static routes stay unique.

---

## Content (JSON)

Edit files in `src/content/`. Sections and detail pages import these at build time.

| File | Role |
| --- | --- |
| `author-metadata.json` | Name, bio, SEO, intro hero, footer, social links |
| `projects-metadata.json` | Project list + detail page layout (`page.header`, `page.body` containers) |
| `blogs-metadata.json` | Blog list + `page.intro` + typed `page.body` blocks |
| `brands-metadata.json` | Collaboration / brand logos (marquee) |
| `skills-metadata.json` | Skills section (`tech.stack`, `tech.tools`) |
| `experiences-metadata.json` | Work history (`title`, `company`, `start`, `end`) |
| `testimonials-metadata.json` | Phone slider quotes |

### Types

- `src/types/project.d.ts` — project shape  
- `src/types/blog.d.ts` — blog + body block union  
- `src/types/experience.d.ts` — experience row  

### Adding a blog post

1. Add an entry to `blogs-metadata.json` (`slug`, `title`, `thumb`, `author`, `date`, `page`).
2. Author `page.body` with typed blocks (`title`, `subtitle`, `paragraph`, `bullets`, `code`).
3. Put images under `public/assets/` (or use absolute URLs).

Full block reference: **[docs/blog-authoring.md](./docs/blog-authoring.md)**. Code blocks render via `BlogCodeBlock.astro` (optional `language` for syntax highlighting).

### Adding a project

1. Add an entry to `projects-metadata.json` with unique `slug`.
2. Fill `desc`, `images`, and `page` (`header` + `body` image/content containers).
3. Add logos / assets under `public/assets/projects/<slug>/` as needed.

---

## Styling & design system

Entry stylesheets (only these two):

- `src/styles/global.css` — Tailwind import, `@theme` tokens, fonts, dark overrides, intentional Framer CSS
- `src/styles/motion.css` — hero appear, reveal, Lenis-related helpers

**Tokens** (semantic colors, fonts, breakpoint) live in `@theme` inside `global.css`:

- Colors: `bg`, `accent` (`#29ffff`), `primary` (`#2a29ff`), `text`, `surface`, `border`, `active`, …
- Fonts: **Manrope** (600/700 only — avoid `font-medium` / 500), **Inter**, **Fragment Mono** (self-hosted under `/assets/fonts/`)
- Breakpoint: `--breakpoint-framer: 610px` → use `max-framer:` for ≤609px mobile styles

Dark mode is **class-based** (`html.dark`), not `prefers-color-scheme`.

Some high-risk Framer pieces remain in CSS on purpose (hero shell, testimonial phone UI, brands marquee keyframes, project logo zoom, fixed nav formula). See **[MIGRATION.md](./MIGRATION.md)**.

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

Motion gap notes / Framer parity: **[MOTION-GAP-PLAN.md](./MOTION-GAP-PLAN.md)**.

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
| [docs/blog-authoring.md](./docs/blog-authoring.md) | Blog JSON body blocks |
| [MIGRATION.md](./MIGRATION.md) | Tailwind migration status & leftover CSS |
| [MOTION-GAP-PLAN.md](./MOTION-GAP-PLAN.md) | Motion / layout parity vs Framer |

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
