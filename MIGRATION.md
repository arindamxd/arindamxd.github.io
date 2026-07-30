# Proton → Tailwind migration

Status notes for picking up later. Stack: Astro + Tailwind CSS v4 (`@tailwindcss/vite`). Entry: `src/styles/global.css`.

**Breakpoint:** `--breakpoint-framer: 610px` → use `max-framer:` for ≤609px.  
**Fonts:** Manrope ships 600/700 only — avoid `font-medium` (500).

---

## Done

### Phases / passes

| Pass | What |
|------|------|
| 1–2 | Design tokens, fonts, base reset, body shell in `global.css` |
| A2+B1 | Page shells + NavBar → Tailwind |
| B3 | Footer → Tailwind |
| C1–C5 | All typography presets → Tailwind; `.proton-text` removed |
| D2 | Brands marquee layout → Tailwind (`@keyframes scroll` kept) |
| D3 | Projects header → Tailwind; **card layout still Framer** |
| D4 | Skills → Tailwind |
| D5 | Experiences → Tailwind (`data-border` kept) |
| D6 | Testimonials header/stage → Tailwind; **phone slider CSS kept** |
| D7 | Blogs / journal → Tailwind (`data-border` kept) |
| E | Blog/project/404 detail pages → Tailwind; back-button CSS kept |
| F | Cleanup; `pages.css` slimmed |
| G | Primary/secondary buttons, link-icons, View All → Tailwind |

### Deleted archives

- `src/styles/typography.css` (empty stub)
- `src/styles/proton.css` (unused Framer export archive)

### Active stylesheets

| File | Role |
|------|------|
| `global.css` | Tokens, fonts, base, imports |
| `shell.css` | Social icon hover (hero) |
| `sections.css` | Remaining Framer section CSS |
| `pages.css` | Back-button hover/border |

### Shared conventions from migration

- Prefer utilities in Astro; keep CSS for keyframes, complex Framer positioning, shared hover.
- Bottom grey bars (footer “Created by”, hero location bar, blog/projects View all) unified at **64px**.
- Primary button white circle: inset with `top-[3px] right-[3px]` inside 58px pill (not `top-[5%]`).

---

## Pending (take later)

### Intentional Framer CSS (higher risk to rewrite)

1. **Hero** — `SectionIntro` / `SectionNotFound`: tie, badge, card shell (`sections.css`). Typography already Tailwind. Earlier full Tailwind rewrite broke the badge.
2. **Project cards** — `ProjectElement` + `.projects-card*` (sticky list, caption, logo zoom). Earlier rewrite broke floating caption.
3. **Testimonial phone** — gestures, progress bars, hand/side art, vertical stack (`sections.css` + `testimonial-slider.js`).
4. **Brands** — keep `@keyframes scroll` / `.logo-track` unless rewritten carefully.
5. **Shell social icons** — `.social-circle-flex` hover opacity in `shell.css`.
6. **Back button** — hover/border in `pages.css`.
7. **`data-border`** — shared `::after` border utility in `sections.css`.

### Content / data

- [ ] **Deduplicate metadata** — `projects-metadata.json` and `blogs-metadata.json` often get 4× identical slugs restored from the editor; keep one entry per slug before deploy (build otherwise emits duplicate routes).
- [ ] Add real distinct projects / blog posts when ready.

### Optional cleanup

- [ ] Convert remaining Framer blocks (hero → cards → phone) one at a time; `npm run build` after each.
- [ ] After those are Tailwind, delete leftover rules from `sections.css` / slim `shell.css` / `pages.css`.
- [ ] Refresh `README.md` project structure (still Astro starter boilerplate).

---

## Quick verify

```bash
npm run build
# Expect unique routes only (no repeated /projects/camerax or blog slugs)
```
