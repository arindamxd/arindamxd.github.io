# Framer → Local motion & layout gap plan

**Compared:** [arindamxd.framer.ai](https://arindamxd.framer.ai/) vs `http://localhost:3000/`  
**Method:** Playwright desktop (1440×900) + mobile (390×844) screenshots, computed-style sampling, load-time transform logs  
**Date:** 2026-08-07

---

## Verdict

Local is ~80% visually close on static structure (badge hero, brands, project cards, phone testimonials, journal, footer nav). What’s clearly missing is **Framer’s motion system** (Lenis + appear/spring entrances + counters) and a few **layout blocks / typography tweaks**. Hover micro-interactions are already mostly present on local.

---

## 1. Motion gaps (highest impact)

### 1.1 Lenis smooth scroll — **MISSING**

| | Framer | Local |
|---|---|---|
| `html` class | `lenis lenis-autoToggle` | none |
| Feel | inertia / eased wheel scroll | native abrupt scroll |

**Implement:** add `lenis` (or lightweight CSS `scroll-behavior` + optional Lenis). Prefer real Lenis to match Framer.

**Files:** `BaseLayout.astro`, new `src/scripts/smooth-scroll.js`, `package.json`

---

### 1.2 Hero appear (load) — **MISSING** (biggest “dead” feel)

Playwright load capture on Framer (`data-framer-appear-id`):

| Element | Appear ID | Start | End | Notes |
|---|---|---|---|---|
| Hero **Container** (badge card) | `985iub` | `opacity ≈ 0`, heavy **3D rotate** + `translateY ≈ -360` (`matrix3d` with perspective tilt) | `opacity: 1`, `transform: none` | ~0.8–1.2s spring |
| **Lanyard / tie** | `ki8gkn` | rotated ~±27° + offset `translate(-56.5, 4)` | settles to `translateX(-50%)` | swing-in |
| **Top** (avatar / name / available) | `zpga6n` | `opacity ≈ 0`, `translateY(30)` | fade + rise | stagger |
| **Frame 136** (YoE badge + description) | `14fbrn5` | `opacity ≈ 0`, `translateY(30)` | fade + rise | stagger |
| **Buttons** | `qkek7f` | `opacity ≈ 0`, `translateY(20)` | fade + rise | last |
| **Collaborations** (brands) | `dqrnmk` | appear enabled | fade/rise | after hero |

Framer easing samples from bundle:  
`ease:[.68,0,.31,.91]`, `ease:[.47,0,.4,1]`, `ease:[.96,-.02,.38,1.01]`  
Durations seen: `0.25 / 0.4 / 0.45 / 0.8 / 1.2`

**Local today:** only `available-pulse` + brands marquee. Hero mounts fully opaque with no entrance.

**Implement:** CSS `@keyframes` + small JS (or WAAPI) in `src/scripts/hero-appear.js`:

1. Initial state via `.is-pre-appear` on hero pieces (opacity 0 / transforms).
2. On `DOMContentLoaded` (after fonts if possible), add `.is-appeared` with staggered delays (~0 / 80 / 160 / 240 / 320ms).
3. Match approximate Framer curve with `cubic-bezier(0.68, 0, 0.31, 0.91)` or spring-like `cubic-bezier(0.22, 1, 0.36, 1)`.
4. Respect `prefers-reduced-motion: reduce` → skip to final state.

**Targets in markup:**

- `.hero-card` / outer container → 3D entrance  
- `.hero-tie-container` → swing settle  
- `.hero-card-content-top` → stagger 1  
- `.hero-card-content-others` → stagger 2  
- `.hero-card-content-buttons` → stagger 3  
- `#brands` / brands section → stagger 4  

---

### 1.3 Number count-up — **MISSING**

Framer experience/stats counters animate `0 → N` (YoE, satisfaction %). Local paints final numbers immediately.

**Implement:** `src/scripts/count-up.js` + `data-count-to` attributes; IntersectionObserver when stats enter viewport.

---

### 1.4 Sticky project-card stack — **PARTIAL**

Framer project cards are `position: sticky; top: 110px` and stack while scrolling. Local keeps Framer CSS for cards — verify sticky still works after Tailwind migration; fix if broken.

---

### 1.5 Already present on local (keep / polish)

- Available green pulse (`pulseOpacity`)
- Brands infinite marquee (`@keyframes scroll`)
- Project card hover: logo scale, arrow rotate, image zoom
- Button / link-arrow rotate, nav color transitions
- Blog thumb `group-hover:scale-110`
- Testimonial story progress bars + gesture overlays
- Social icon hover opacity

---

## 2. Layout / formatting gaps

### 2.1 Hero typography

| Token | Framer | Local |
|---|---|---|
| H1 size | **70px** | 72px |
| Line-height | 63px (90%) | 64.8px |
| Letter-spacing | **-2.8px** (−0.04em @ 70) | −3.6px (−0.05em @ 72) |
| H1 block height | 252 | 259 |
| H1 top | 334 | 409 |

**Action:** align H1 to `text-[70px] tracking-[-0.04em]` (keep mobile `50px`). Re-check hero top padding / badge `padding-top: 120px` vs Framer.

### 2.2 Section vertical rhythm

Heading Y positions (desktop):

| Section | Framer | Local | Δ |
|---|---|---|---|
| Built with Code | 1176 | 1390 | local +214 |
| Powered By | 2243 | 2103 | local −140 |
| Runtime Journey | 2905 | 2871 | ~ok |
| What People Say | 4015 | 3406 | local **−609** |
| Developer’s Log | 5303 | 4678 | local −625 |
| Say Hello | 5845 | 5141 | local −704 |
| Page height | ~6506 | shorter | missing blocks |

Local compresses after experiences because **stats + satisfaction grid are missing** (see 2.3).

### 2.3 Missing blocks between Experiences → Testimonials — **MISSING**

Framer has after the experience list:

1. Large white rounded **YoE** card (`N+` / “Years of experience…”) — Framer layout places this *below* the list (local puts a blue YoE badge *above* the timeline instead).
2. Two-up grid:
   - Photo (person at laptop)
   - Blue **client satisfaction** card (`95%` + copy + decorative dots)

Local: **no satisfaction card / no photo grid**. That alone explains ~600px shorter page and different feel.

**Action (Phase B):** add `SectionStats` (or extend `SectionExperiences`) matching Framer composition; wire count-up.

### 2.4 Testimonials header chrome — **MISSING**

Framer: title → **overlapping avatar stack** + glowing heart → subtitle.  
Local: title → subtitle only (no avatar stack / heart).

**Action:** restore avatar row + heart from original Proton/Framer assets if still in `/public` or `bkp`.

### 2.5 Skills (“Powered By”) — **CONTENT DIVERGENCE**

| Framer (live) | Local |
|---|---|
| Progress bars: Figma 90% / Framer 70% / Photoshop 60% | Icon grid: Kotlin, Swift, Python, Compose, IDEs |

Local’s mobile-stack icons are intentional product content. Decide:

- **A.** Keep icons (recommended for your brand) + add **scroll-in / hover** motion  
- **B.** Rebuild Framer progress-bar UI for visual parity  

Default in this plan: **A**, unless you want B.

### 2.6 Nav label

Framer: **Journal** · Local: **Blogs** — copy only; optional rename.

### 2.7 Resume CTA

Framer: **Resume 1.0** · Local: **Resume** — content/metadata tweak.

---

## 3. Mobile notes

Same motion gaps. Hero/card padding and H1 `50px` already exist via `max-framer:`. Re-verify lanyard + 3D appear don’t overflow on 390px; reduce 3D intensity on small screens if needed.

---

## 4. Implementation phases

### Phase A — Motion foundation *(start now)*

1. Install / wire **Lenis** smooth scroll  
2. **Hero appear** (card 3D + tie swing + staggered children)  
3. **Brands** appear after hero  
4. `prefers-reduced-motion` guards  
5. Optional: light **scroll-reveal** (`data-reveal`) for section headers (opacity + `translateY(24)` once) — Framer’s remaining sections are mostly static after load, but this improves polish without fighting layout  

### Phase B — Layout parity

1. H1 typography tokens → Framer 70px / −0.04em  
2. Testimonials avatar stack + heart  
3. Stats / satisfaction two-up after experiences + count-up  
4. Rebalance `main` `gap-[100px]` / section gaps to match Framer Y positions  
5. Verify project sticky stack  

### Phase C — Polish

1. Skill icon hover / stagger-in  
2. Nav Journal rename (optional)  
3. Resume 1.0 label (optional)  
4. Playwright visual regression checklist (hero load GIF / scroll frames)

---

## 5. Technical approach (keep Astro-friendly)

- No React / Framer Motion dependency required.  
- Prefer: **CSS keyframes + `animation-delay`** for hero; **Lenis** for scroll; **IntersectionObserver** for count-up / reveals.  
- New files:
  - `src/scripts/smooth-scroll.js`
  - `src/scripts/hero-appear.js`
  - `src/scripts/reveal.js` (optional)
  - `src/scripts/count-up.js` (Phase B)
  - Motion CSS in `src/styles/motion.css` imported from `global.css`
- Load scripts from `BaseLayout.astro` (same pattern as `available-text.js`).

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .appear-target { opacity: 1 !important; transform: none !important; animation: none !important; }
  html.lenis { /* destroy / don’t init Lenis */ }
}
```

---

## 6. Acceptance checklist

- [x] Page load: badge swings in with 3D tilt → settles; top / badge / buttons stagger fade-up  
- [x] Wheel scroll feels inertial (Lenis), not raw browser scroll  
- [x] Brands block fades/rises after hero  
- [x] `prefers-reduced-motion` skips fancy motion  
- [x] H1 matches Framer size/tracking  
- [x] (B) Stats + satisfaction grid present; numbers count up once in view  
- [x] (B) Testimonials header shows avatar stack + heart  
- [x] Sticky project cards still stack under nav  
- [x] (C) Skill icons stagger-in + hover lift  
- [x] (C) Resume 1.0 (nav/page stay **Blogs**)  
- [ ] Desktop + mobile screenshots within ~visual tolerance of Framer for motion feel (manual)  

---

## 7. Out of scope / do not regress

- Don’t rewrite hero / project-card / phone-slider Framer CSS in Tailwind mid-motion work (see `MIGRATION.md`).  
- Don’t replace mobile skill icons with Figma/Photoshop bars unless explicitly requested.  
- Don’t add purple glow / generic AI aesthetic; keep existing tokens (`--color-primary`, Manrope, badge language).

---

## 8. Start order for coding this session

1. Write this plan ✅  
2. Add `motion.css` + hero appear script + wire in layout ✅  
3. Add Lenis smooth scroll ✅  
4. Brands appear ✅  
5. H1 typography nudge ✅ (`70px` / `tracking-[-0.04em]`)  
6. Section scroll-reveal (`data-reveal`) ✅  
7. **Next:** Phase C polish (optional Journal rename, Resume label, skill hover) after visual check

### Phase B landed (2026-08-07)

| Deliverable | Path |
|---|---|
| Stats two-up | `SectionStats.astro` + `stats-metadata.json` |
| Desk photo | `public/assets/stats/desk.jpg` |
| Avatar stack | `public/assets/avatars/a1–a4.jpg` in `SectionTestimonials` |
| Count-up | `src/scripts/count-up.js` on YoE + 95% |
| Wired in | `index.astro` after experiences; `BaseLayout` script |

### Phase C landed (2026-08-07)

| Deliverable | Path |
|---|---|
| Skill hover + stagger | `SkillElement.astro`, `SectionSkills.astro`, `motion.css` |
| Nav label | kept **Blogs** in `NavBar.astro` |
| Resume CTA | `SectionIntro.astro` → **Resume 1.0** |
| Blogs page title | kept **Blogs** (`blogs.astro`) |

### Hero appear retune (2026-08-07, from side-by-side recording)

Recording showed our old motion was a **free mid-air 3D tumble** (`translateY(-360)` + heavy rotateX/Y/Z). Framer hinges the badge from the **lanyard clip** with a soft spring settle.

Changes:
- Hinged drop (`transform-origin: 50% 0%`, parent `perspective`)
- Softer spring keyframes + overshoot settle
- Clear animation → `is-settled`, then subtle pointer tilt
- Removed `appear-prep` hide (was sticking invisible when the module loaded late)


| Deliverable | Path |
|---|---|
| Gap plan | `MOTION-GAP-PLAN.md` |
| Motion CSS | `src/styles/motion.css` |
| Hero appear | `src/scripts/hero-appear.js` |
| Scroll reveal | `src/scripts/reveal.js` |
| Lenis | `src/scripts/smooth-scroll.js` + dep `lenis` |
| Wired in | `BaseLayout.astro`, `global.css` |
| Targets | `SectionIntro`, `SectionBrands`, section headers |

**Note:** `astro` pinned back to `^5.16.0` after `npm install lenis` briefly pulled Astro 7 and broke `astro:assets` in dev.