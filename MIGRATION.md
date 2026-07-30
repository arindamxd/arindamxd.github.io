# Proton → Tailwind migration

Status notes for picking up later.

**Stack:** Astro + Tailwind CSS v4 (`@tailwindcss/vite`)  
**Entry:** `src/styles/global.css` (only stylesheet imported from `BaseLayout.astro`)

```css
@import 'tailwindcss';
@import './shell.css';
@import './sections.css';
@import './pages.css';
```

**Breakpoint:** `--breakpoint-framer: 610px` → use `max-framer:` for ≤609px.  
**Fonts:** Manrope ships 600/700 only — avoid `font-medium` (500).

Changelog mirror (also in `global.css` header comment):

- Phase 1: tokens + fonts  
- Phase 2: base reset + body shell  
- Phase 3: typography → Tailwind utilities (C1–C5)  
- Phase 4: nav + footer (`shell.css` social hover kept)  
- Phase 5: homepage sections (`sections.css`)  
- Phase 6: detail pages (`pages.css`) + shared utils  

---

## Done

### Passes

| Pass | What |
|------|------|
| A2+B1 | Page shells + NavBar → Tailwind |
| B3 | Footer → Tailwind |
| C1–C5 | Typography presets → Tailwind; `.proton-text` engine removed; `typography.css` deleted |
| **D1** | Hero layout **kept Framer CSS** (badge / tie / card — same risk class as project cards); typography already Tailwind |
| D2 | Brands marquee layout → Tailwind (`@keyframes scroll` / `.logo-track` kept) |
| D3 | Projects header + list wrapper → Tailwind; **card layout still Framer**; typography Tailwind |
| D4 | Skills → full Tailwind |
| D5 | Experiences → Tailwind (`data-border` kept); experience row titles fixed (no clip) |
| D6 | Testimonials header/stage → Tailwind; **phone slider CSS kept** |
| D7 | Blogs / journal → Tailwind (`data-border` kept); thumb `group-hover:scale-110` |
| E | Blog / project / 404 detail pages → Tailwind; back-button CSS kept in `pages.css` |
| F | Cleanup — `pages.css` slimmed; migration notes |
| G | Primary / secondary buttons, link-icons, View All → Tailwind (`group-hover`); old button/link CSS removed |

### Deleted files

- `src/styles/typography.css` — empty stub after C5  
- `src/styles/proton.css` — unused Framer export archive (no longer imported)

### Active stylesheets

| File | Role |
|------|------|
| `global.css` | `@theme` tokens, fonts, base reset, body shell, imports |
| `shell.css` | Hero social icon hover (`.social-circle-flex`) + `--proton-aspect-ratio-supported` |
| `sections.css` | Remaining Framer: hero, project cards, testimonial phone, brands scroll, `data-border` |
| `pages.css` | Back-button layout + hover/border |

### UI fixes landed during migration

- **Primary button** white circle: inset `top-[3px] right-[3px]` in 58px pill (avoid `top-[5%]` + translate, which clipped out of the blue pill).
- **Bottom grey bars** unified across footer “Created by”, hero location bar, blog View all, projects View all — height **64px**.
- **Experience titles**: flexible row (`flex-1` title, `shrink-0` company/dates) so long titles aren’t clipped.
- **Project logo hover**: paint SVG at 44px, scale `0.5` → `0.575` (smoother zoom).

### Working conventions

- Prefer utilities in Astro; keep CSS for keyframes, complex Framer positioning, shared hover.
- Convert one section at a time; run `npm run build` after each.
- Don’t rush Hero or project cards — previous full Tailwind rewrites broke layout.

---

## Pending (take later)

### Intentional Framer CSS (higher risk)

1. **Hero (D1)** — `SectionIntro` / `SectionNotFound`: `.hero-tie*`, `.hero-badge`, `.hero-card*` shell, slots, available pulse. Typography already Tailwind.
2. **Project cards (D3 remainder)** — `ProjectElement` + `.projects-card*`, sticky `.projects-list-item*`, logo zoom / arrow rotate.
3. **Testimonial phone (D6 remainder)** — gestures, progress bars, hand/side art, vertical stack (`sections.css` + `src/scripts/testimonial-slider.js`).
4. **Brands animation** — `.logo-track` + `@keyframes scroll` only (layout already Tailwind).
5. **Shell social icons** — `.social-circle-flex` / `.social-link-icon` hover in `shell.css`.
6. **Back button** — `.back-button-link` / `.back-arrow` hover in `pages.css`.
7. **`data-border`** — shared `::after` border utility in `sections.css` (experiences, blogs, view-all, hero card, etc.).

### Content / data

- [ ] **Deduplicate metadata before deploy** — `projects-metadata.json` / `blogs-metadata.json` often restore **4× identical slugs** from the editor; keep one entry per slug or build emits duplicate routes (`/projects/camerax` ×4, same for blogs).
- [ ] Add real distinct projects / blog posts when ready.

### Optional cleanup

- [ ] Convert remaining Framer blocks in order: hero → project cards → phone slider; build after each.
- [ ] After those are Tailwind, delete leftover rules from `sections.css` and slim `shell.css` / `pages.css`.
- [ ] Refresh `README.md` project structure (still Astro starter boilerplate).
- [ ] Update stale comment at top of `sections.css` if it still mentions “buttons/links” as Framer (Pass G moved those to Tailwind).

---

## Quick verify

```bash
npm run build
# Expect unique routes only (no repeated /projects/camerax or blog slugs)

node -e "
const p=require('./src/content/projects-metadata.json');
const b=require('./src/content/blogs-metadata.json');
console.log('projects', p.data.length, p.data.map(x=>x.slug));
console.log('blogs', b.data.length, b.data.map(x=>x.slug));
"
```
