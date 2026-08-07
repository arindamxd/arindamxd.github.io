# Proton → Tailwind migration (archive)

Day-to-day notes live in **[`docs/migration/`](docs/migration/00-overview.md)**.

**Stack:** Astro + Tailwind CSS v4 (`@tailwindcss/vite`)  
**Stylesheets:** `src/styles/global.css` + `src/styles/motion.css` only  

**Breakpoint:** `--breakpoint-framer: 610px` → use `max-framer:` for ≤609px.  
**Fonts:** Manrope ships 600/700 only — avoid `font-medium` (500).

## Status

All migration units in `docs/migration/` are **Done**. Easy leftovers (`data-border`, social, back button, brands layout, project sticky/cards) are Tailwind. High-risk Framer trees stay in `global.css` on purpose.

## Intentional CSS in `global.css`

- Hero tie / badge / card shell (Intro, 404, ProjectPage)
- Testimonial phone slider + hand art + gesture/progress (JS contract)
- Brands marquee `@keyframes scroll` + `.logo-track`
- Project card logo paint/scale zoom
- `.nav-bar-container` Framer fixed formula
- Shared Proton utils

## Content

- Metadata deduped: one entry per slug in `projects-metadata.json` / `blogs-metadata.json` (avoids duplicate routes).

## Verify

```bash
npm run build
# Expect unique routes only

node -e "
const p=require('./src/content/projects-metadata.json');
const b=require('./src/content/blogs-metadata.json');
console.log('projects', p.data.length, p.data.map(x=>x.slug));
console.log('blogs', b.data.length, b.data.map(x=>x.slug));
"
```
