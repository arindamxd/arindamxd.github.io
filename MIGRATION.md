# Proton → Tailwind migration (archive)

Day-to-day notes now live in **[`docs/migration/`](docs/migration/00-overview.md)**.

**Stack:** Astro + Tailwind CSS v4 (`@tailwindcss/vite`)  
**Stylesheets:** `src/styles/global.css` + `src/styles/motion.css` only  
(`shell.css` / `sections.css` / `pages.css` removed — leftovers merged into `global.css`)

**Breakpoint:** `--breakpoint-framer: 610px` → use `max-framer:` for ≤609px.  
**Fonts:** Manrope ships 600/700 only — avoid `font-medium` (500).

## What remains as CSS in `global.css`

- Hero tie / badge / card shell (Intro, 404, ProjectPage)
- Testimonial phone slider + hand art (JS class contract)
- Brands marquee `@keyframes scroll` + `.logo-track`
- Project card logo paint/scale zoom
- `.nav-bar-container` Framer fixed formula
- Shared Proton utils (`data-is-present`, SVG/button reset, scrollbars)

## Migrated to Tailwind (this pass)

- `data-border` → inset shadow / edge shadow utilities
- Shell social icons
- Back button (blog + project detail)
- Project cards sticky stack + card layout (logo zoom CSS kept)
- Testimonial side art panels
- Experiences / blogs / view-all borders

See section checklists under [`docs/migration/`](docs/migration/00-overview.md).
