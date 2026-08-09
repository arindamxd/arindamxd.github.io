# Design system — arindamxd.github.io

Source of truth for UI/UX architecture on this site. Prefer matching **existing patterns in code** over inventing new ones. Tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css) (imported via [`global.css`](../src/styles/global.css)); motion in [`src/styles/motion.css`](../src/styles/motion.css).

**Living preview:** [`/design`](../src/pages/design.astro) (`noindex`) — interactive gallery of tokens, components, and roadmap UX targets. Home / 404 / Project / Blog / Footer mounts use live components with `preview` + dummy copy from [`design-preview-data.ts`](../src/utils/design-preview-data.ts) (gradient media shell + logo mark — not live project/blog assets).

---

## 1. Product personality

| Trait | Implication |
| --- | --- |
| Technical Lead · Mobile | Calm, precise, portfolio-grade — not startup-marketing loud |
| Craft-forward | Tight type, intentional motion, few decorations |
| Content-narrow | Most storytelling sits in a **550px** column; wide layouts are the exception |
| Light + dark | Semantic tokens flip; brand primary/accent stay constant |

**Avoid:** purple-gradient SaaS looks, cream+terracotta editorial kits, dense broadsheet grids, glow stacks, emoji ornament, dashboard card grids on marketing surfaces, Inter/Roboto/Arial as display type.

---

## 2. Architecture

```
BaseLayout          → SEO, theme, ClientRouter, Lenis, page loader
  NavBar            → floating glass pill (mounted here once; `transition:persist` only)
  .site-root        → page content scope (wraps main sections)
  main / sections   → content
  Footer            → contact shell (max 550px)
```

| Layer | Responsibility |
| --- | --- |
| **Pages** (`src/pages/`) | Route, layout choice, data wiring |
| **Sections** (`components/sections/`) | One job per block (intro, projects, blogs…) |
| **Elements** (`components/elements/`) | Reusable row/card/page body pieces |
| **Content** (`src/content/`) | JSON catalogs + Markdown bodies |
| **Utils** (`src/utils/`) | Parse/merge content → typed models |
| **Scripts** (`src/scripts/`) | Client **TypeScript** only (scramble, reveal, theme, image-fallback, tools) — `allowJs: false` |
| **Styles** | See CSS architecture below |

### CSS architecture

**Entry:** [`src/styles/global.css`](../src/styles/global.css) — import order **is** the cascade. [`BaseLayout`](../src/layouts/BaseLayout.astro) imports only this file.

```
global.css
  → tailwindcss
  → tokens.css       (@theme + .dark + dark variant)
  → fonts.css
  → base.css
  → motion.css
  → nav.css · utils.css
  → hero.css · projects.css · testimonials.css · brands.css · skills.css
```

| File | Owns |
| --- | --- |
| [`tokens.css`](../src/styles/tokens.css) | Semantic colors, fonts, `--breakpoint-narrow` |
| [`fonts.css`](../src/styles/fonts.css) | `@font-face` |
| [`base.css`](../src/styles/base.css) | Reset + `--site-will-change-override` / aspect-ratio support |
| [`motion.css`](../src/styles/motion.css) | Page loader, appear / reveal |
| [`nav.css`](../src/styles/nav.css) | `.nav-bar-container`, shared `.nav-glass` / `.nav-pill` / `.nav-theme-toggle` |
| [`utils.css`](../src/styles/utils.css) | Presence, scrollbars, overflow helpers; gallery `.design-media-ph` shell |
| [`hero.css`](../src/styles/hero.css) | Hero ID card, tie, scramble, location |
| [`projects.css`](../src/styles/projects.css) | Sticky project media cards |
| [`testimonials.css`](../src/styles/testimonials.css) | Phone carousel, hand art, gestures |
| [`brands.css`](../src/styles/brands.css) | Logo marquee |
| [`skills.css`](../src/styles/skills.css) | Skill chip tooltips |
| [`tools.css`](../src/styles/tools.css) | **Page-scoped** — tools hub / utilities only |
| [`design.css`](../src/styles/design.css) | **Page-scoped** — `/design` gallery only |

Do **not** `@import` `tools.css` or `design.css` into `global.css`.

### Naming (`site-root` + `--site-*`)

Page shells wrap content in **`site-root`**:

```html
<div class="site-root contents min-h-screen w-auto">
  <!-- sections -->
</div>
```

Hero / layout CSS is scoped as `.site-root .hero-…` (and similar). Layout helpers use **`--site-*`** variables (set in `base.css` / consumed in feature sheets):

| Variable | Role |
| --- | --- |
| `--site-will-change-override` | Safari-safe `will-change` (default `none`) |
| `--site-will-change-effect-override` | Transform effect override on animated nodes |
| `--site-aspect-ratio-supported` | Aspect-ratio fallback height helper |
| `--site-viewport-height` | Nav position vs viewport (optional override) |
| `--site-canvas-fixed-position` | Nav `position` override (default `fixed`) |
| `--site-gap` | Legacy gap token (testimonials) |
| `--site-paragraph-spacing` | Local paragraph spacing override |
| `--site-text-wrap-override` | e.g. `balance` on select text blocks |

**Rules**

- Put new custom CSS in the matching feature sheet with **semantic** class names (`.hero-…`, `.projects-card`, `.tools-…`).
- Prefer **`@apply`** inside those sheets for layout / spacing / type / token colors (`flex`, `gap-*`, `rounded-*`, `bg-surface`, `font-manrope`, …). Keep plain CSS for glass, keyframes, prose descendants, data-attribute state machines, and calc/var quirks.
- Page-scoped sheets (`tools.css`, `design.css`) must start with `@reference "./global.css";` so `@apply` can see the theme.
- Prefer Tailwind utilities in markup when a one-off fits; do not invent a second root wrapper or a parallel variable namespace.

**Private tools** (`/tools`): hub + one route per tool. Register tools in [`src/utils/tools.ts`](../src/utils/tools.ts). Shell: [`ToolsPageShell.astro`](../src/components/tools/ToolsPageShell.astro).

---

## 3. Layout & breakpoints

| Token / class | Value | Use |
| --- | --- | --- |
| Content column | `max-w-[550px]` | Home sections, footer, blogs/projects lists, tools **hub** |
| Reading / detail | `max-w-[550px]` text; banners up to `~1180px` | Blog/project detail |
| Tools author | `max-w-[1100px]` | Forms + previews |
| Tools markdown | `max-w-[1280px]` | Split panes |
| `narrow` / `max-narrow:` | 610px | Mobile overrides (`--breakpoint-narrow`) |

**Rhythm**

- Section stack gap: `50px` desktop → `30px` mobile (hero often `gap-20` / `50px`).
- Section header: use [`SectionHeading`](../src/components/elements/SectionHeading.astro) — title + muted description (`max-w-[350px]`, `opacity-60`), **centered**; bottom margin `30px` / `20px` narrow. **Left** headers stay hand-rolled on detail/tools.
- Page top offset under floating nav: `~110–120px` padding-top.
- Horizontal inset on narrow: `px-2.5` when matching the 550px column; tools utility pages may use `px-4` / `px-5`.

**Composition rules**

1. One composition per viewport on branded/marketing surfaces — not a dashboard.
2. One job per section: one headline, one short supporting line, then the content.
3. Prefer full-bleed atmosphere only where the existing hero/shell patterns already do; don’t invent new card chrome for content that currently uses surface shells.

---

## 4. Color

Semantic tokens (use these — not raw hex in new UI):

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--color-bg` / `bg-bg` | `#ffffff` | `#222222` | Page background |
| `--color-text` / `text-text` | `#171717` | `#f5f5f5` | Primary text / icons |
| `--color-surface` / `bg-surface` | `#f6f6f6` | `#2a2a2a` | Shells, inputs, secondary buttons |
| `--color-border` / `border-border` | `#e3e3e3` | `#3a3a3a` | Hairlines, inset rings |
| `--color-primary` / `bg-primary` | `#2a29ff` | same | Primary CTA fill / hover accents |
| `--color-accent` | `#29ffff` | same | Rare accent (brand cyan) |
| `--color-active` | `#9ef34a` | same | Availability / success pulse |
| `--color-inactive` | `#efefef` / `#333` | Secondary hover wash |

**Text hierarchy via opacity** (on `text-text`):

- Primary: `100%`
- Supporting: `/60` or `opacity-60`
- Meta / quiet: `/50`–`/40`

**Borders:** prefer `border border-border` or inset ring `shadow-[inset_0_0_0_1px_var(--color-border)]` over heavy drop shadows.

**Icons / logos:** monochrome with `brightness-0 dark:invert`; hover often `opacity-40 → 100%`.

---

## 5. Typography

| Family | Token / class | Use |
| --- | --- | --- |
| **Manrope** | `font-manrope` | Almost all UI & marketing type (weight **600** default) |
| **Fragment Mono** | `font-fragment` | Code, raw Markdown, technical previews |

**Tracking:** typically `-0.04em` body/UI; `-0.05em` large titles; hero display can go to `-0.06em` / `-0.09em` (404).

**Scale (Manrope semibold)**

| Role | Desktop | Mobile (`max-narrow`) | Leading |
| --- | --- | --- | --- |
| Display / hero | `70px` | `48px` | `90%` |
| Page / section H1–H2 | `50px` | `34px` | `105–110%` |
| Card / emphasis | `20–22px` | `17–19px` | `120–130%` |
| Body / CTA label | `17px` | `15px` | `140%` |
| List title | `16px` | `14px` | `130%` |
| Meta / back / nav | `13–14px` | `12–13px` | `120–130%` |
| Micro badge | `11px` | — | `none` |

Reset margins on text: `m-0 p-0` is the house style.

---

## 6. Shape & elevation

| Pattern | Radius | Notes |
| --- | --- | --- |
| Pills / CTAs / nav / search | `rounded-full` | Default for **interactive** chrome |
| Soft content shell | `rounded-[45px]`–`[46px]` → mobile `[36px]` | Projects/blogs list wrappers, footer |
| Inner list rows | `rounded-[41px]` | Blog/project rows on `bg-bg` inside surface shell |
| Media | `rounded-[30px]` → mobile `[20px]` | Banners / screenshots |
| Utility inputs (tools forms) | `14px` or full pill when search-like | See `tools.css` |
| Icon button | Circle `52px` / `34px` | Back control, nav home |

**Elevation:** almost none. Depth = surface contrast + 1px border/inset ring. Nav is the exception: shared `.nav-glass` (`backdrop-filter` blur 16px + soft shadow). Do not sprinkle glass elsewhere.

**Cards:** not the default metaphor. Use **surface shells** and **rows**. Cards only when they wrap a clear interaction (e.g. tools hub links).

---

## 7. Components (recipes)

### Primary CTA (filled pill)

- Height `58px`, `rounded-full`, `bg-primary`, label Manrope 17/600 white.
- Optional trailing white circle control (`52px`) with icon.
- Hover: slight brightness change; use `data-scramble` + `data-scramble-variant="primary"` when it’s a key CTA.

### Secondary CTA

- Same height, `bg-surface`, text `text-text`, hover `bg-inactive` / border strengthen.

### Nav pill

Floating glass nav — see **Nav pill (detailed)** below for sizes. Theme toggle is a separate circle beside the pill.

### Back control (detail / tools)

- Row: `52px` circle (`bg-bg` + inset border) + “Back to …” label (`14px`).
- Hover: circle → `bg-primary`, icon inverts.
- Include arrow SVG sprite (`#svg12261373696`) when used.
- Prefer this over plain “← text” links.

### Section header (marketing)

Use [`SectionHeading`](../src/components/elements/SectionHeading.astro) (`title`, optional `description`, `class`, `level`).

```
h2 50→34, center, tracking -0.05em
p  17→15, center, max-w 350px, opacity 60%
gap under description: 30px → 20px narrow (owned by the element)
```

`/design` mounts the live element under Layout.

### List shell

- Outer: `bg-surface`, large radius, `p-[9px]`, inset border.
- Rows: `bg-bg`, large radius, horizontal padding; scramble on title links.

### Form controls (tools)

- Shared classes in `src/styles/tools.css`: `.tools-input`, `.tools-textarea`, `.tools-chip`, `.tools-btn-primary`, `.tools-btn-secondary`.
- Search fields: **full pill** + custom clear button (not native `type="search"` cancel).
- Nested scroll areas: `data-lenis-prevent` + `overscroll-behavior: contain`.

### Markdown doc fullscreen (`data-md-doc`)

Open a project Markdown file in a fullscreen GFM viewer from any control.

1. Mount a panel once per page:

```astro
import MarkdownDocPanel from "../components/MarkdownDocPanel.astro";
<!-- … -->
<MarkdownDocPanel id="design-system" src="docs/design-system.md" />
<script src="../scripts/markdown-fullscreen.ts" />
```

2. Trigger with matching id:

```html
<button type="button" class="md-doc-trigger" data-md-doc="design-system">
  docs/design-system.md
</button>
<!-- or any button / link / element: -->
<button type="button" class="tools-btn-secondary" data-md-doc="design-system">
  Full documentation
</button>
```

| Piece | Role |
| --- | --- |
| `data-md-doc="<id>"` | Opens the panel with the same id |
| `.md-doc-trigger` | Optional inline style (Fragment Mono chip, like `.tools-code`) |
| `MarkdownDocPanel` | Build-time renders `src` → HTML into `[data-md-doc-panel]` |
| Close / Esc | Built into the script; nested body uses `data-lenis-prevent` |

Do **not** deep-link to GitHub for in-site docs when this pattern fits. Reuse one panel id for multiple triggers on the same page.

### Blog code blocks & snippets

Article fenced code is **not** plain `<pre>` — it goes through [`BlogCodeBlock.astro`](../src/components/elements/BlogCodeBlock.astro) via `BlogPage.astro`.

**Authoring** (in `src/content/blogs/*.md`):

````md
```swift
let button = UIButton(type: .system)
button.setTitle("Tap", for: .normal)
```
````

| Piece | Detail |
| --- | --- |
| Parser | Fenced `code` nodes → `{ type: "code", code, language }` in [`blogs.ts`](../src/utils/blogs.ts) |
| Component | `BlogCodeBlock` → Astro `<Code>` (Shiki) |
| Themes | Light: `github-light` · Dark: `github-dark` (follow site theme) |
| Shell | `.article-code` — `bg-surface`, inset border, radius `20px` → `16px` narrow |
| Language label | Uppercase meta bar (hidden for `plaintext` / `text`) |
| Type | Mono stack 13px / 12px narrow, weight 500 — **not** Fragment Mono inside Shiki lines |
| Spacing | ~24px between peers; ~20px under a heading (`BlogPage` rhythm) |

**Inline `` `code` `` in blog paragraphs:** currently flattened to plain text by the MD → block pipeline (no styled inline chip). Prefer fenced blocks for real snippets. Tools/UI chrome may use `.tools-code` / `.md-doc-trigger` instead.

Live preview: `/design` → Components. Full authoring: [`blog-authoring.md`](./blog-authoring.md).

### Nav pill (detailed)

[`NavBar.astro`](../src/components/NavBar.astro) — floating glass chrome, mounted **once** from [`BaseLayout.astro`](../src/layouts/BaseLayout.astro) (direct `body` child, outside page `overflow-x-hidden` shells). Do **not** re-declare the fixed nav in pages / tools.

**Exception — gallery:** `/design` Components mounts a second, **in-flow** [`NavBar`](../src/components/NavBar.astro) with `preview` (dummy Contact mailto · `#home` / `#project` / `#blog` anchors) inside `.design-nav-demo` so glass reads on the gradient shell. That preview is not `transition:persist` and is not the site chrome.

| Piece | Spec |
| --- | --- |
| Position | Fixed; desktop near bottom (~18px), narrow at top (~8–11px); centered with flex (**no** `transform` on the container) |
| Height | `60px` → `52px` at ≤389px |
| Fill | `.nav-glass` in [`nav.css`](../src/styles/nav.css): `backdrop-filter: blur(16px) saturate(1.45)`; fill `rgba(26,26,26,0.52)` / dark `rgba(40,40,40,0.55)`; solid fallback when unsupported; `prefers-reduced-transparency` → opaque, no blur |
| Home control | Circle `34→30` |
| Links | Manrope `16→14/13`, white, `data-scramble` |
| Contact chip | Pill `46→40`, white fill → hover `primary` |
| Persist | `transition:persist="site-nav"` only — **never** `transition:name` / `view-transition-name` on the nav (Chromium drops backdrop blur) |
| Page shells | Prefer `overflow-x-hidden` (not `overflow-hidden`) on the page wrapper so WebKit can still frost |

### Theme toggle

Separate circle beside nav (`60→52`): `.nav-theme-toggle.nav-glass`. **Do not** put `overflow: hidden` on the glass node — same-element clip + `backdrop-filter` breaks frost in Chrome. Clip on the inner `.nav-theme-toggle__clip` (`overflow: hidden` + `border-radius: inherit`); the sliding `.nav-theme-toggle__track` is `width: 200%` and translates `300ms` with house cubic-bezier under `html.dark`. `data-theme-toggle` (all toggles sync via [`theme.ts`](../src/scripts/theme.ts)).

### `/design` gallery placeholders

Dummy media for `preview` mounts — **not** live Camerax / blog / author photos:

| Asset / class | Role |
| --- | --- |
| [`design-media-placeholder.svg`](../public/assets/resources/design-media-placeholder.svg) | Transparent shell; paint via `.design-media-ph` / `img[src*="design-media-placeholder"]` in [`utils.css`](../src/styles/utils.css) — same token gradient as `.design-nav-demo` (surface → primary mix), flips with theme |
| [`design-logo-placeholder.svg`](../public/assets/resources/design-logo-placeholder.svg) | White **A** in rounded frame for project `thumb` on colored `thumb_bg_color` |
| [`design-preview-data.ts`](../src/utils/design-preview-data.ts) | Dummy author, experiences, credentials, testimonials, projects, blogs, privacy frontmatter |
| [`image-fallback.ts`](../src/scripts/image-fallback.ts) | Capture-phase: broken `<img>` → media shell (or logo mark inside `.project-logo`); loaded from BaseLayout |

Testimonials phone reads `#testimonials-data` JSON from the section (preview embeds dummy quotes; live home uses the same embed path).

### Hero ID card (home)

[`SectionIntro`](../src/components/sections/SectionIntro.astro) — home first viewport. `/design` → Home mounts the same component with `preview` (dummy copy via `design-preview-data.ts`).

| Piece | Spec |
| --- | --- |
| Tie / shell | `.hero-tie` above card; soft shell + inset border; `.hero-card-hole` |
| Identity | Avatar ~`70px`; name `22→19`; role `14→13`; social icons `22px` `opacity-40→100` |
| Slot bars | Active / inactive indicator bars in card header |
| Slogan H1 | Display `70→48`, leading ~`90%`, tracking tight |
| Intro support | `17→15` under slogan |
| YoE badge | Micro `11px`, tracking `-0.05em`; fill darker than content bg (`color-mix` with black) + inset `border` — not `surface` |
| CTAs | Primary Resume + secondary My work |
| Availability | Green pulse + cycling “Available for…” (`available-text.ts` + scramble) |
| Location row | Pin + `13→12`; muted “Located in…” + city |
| Bottom link | Outbound text+arrow (`cardLinkText` / `cardLinkURL`) |

### 404 card

[`SectionNotFound`](../src/components/sections/SectionNotFound.astro) — same tie/hole/card/bottom chrome as home, **no** slot bars or identity stack. Display `404` at `141px` / tracking `-0.09em`; title + muted support; single primary “Go back home” CTA. `/design` mounts the same component with `preview`.

### Project hero card

[`ProjectPage`](../src/components/elements/ProjectPage.astro) reuses tie/hole/card chrome but **not** the home identity stack.

| Piece | Spec |
| --- | --- |
| Media | Banner image inside card (`rounded-[40→30]`) |
| Metadata rows | Organization / Category / Released (see below) |
| Live Preview | Bottom text+arrow when `header.link` is set |
| After card | Left H1 `50→34` + long desc `18→16` `/60`, **then** back control (blog is back → H1) |

### Brand logo marquee

[`SectionBrands`](../src/components/sections/SectionBrands.astro): eyebrow `13→12` `/60`; `.logo-track` height `52px`; edge mask fade; logos `dark:invert`.

### Skill chips

[`SkillElement`](../src/components/elements/SkillElement.astro): square `54px`, radius `9px`, `bg-surface` + `border-border`; hover lift + soft shadow; tooltip `rounded-[12px]` with label + short description + caret.

### Experience block

[`SectionExperiences`](../src/components/sections/SectionExperiences.astro):

| Piece | Spec |
| --- | --- |
| YoE banner | `bg-primary` shell `rounded-[40→32]`; count `65→48` white + `data-count-to`; ladder SVG; labels white `/60`–`/90` at `14px`. `/design` mounts `SectionExperiences` with `preview`. |
| Year timeline | Hairline + current-year primary dot `14px` + past `#cacaca` `10px`; **now** year `52→44`; past years `18→15` `/40`; edge fade |
| Mid-header | Left H3 `24→22` + support `17→15` `/50` between timeline and rows |
| Employment rows | 3-col `title / company / years`; top hairline; `16→14` / `14→13` / `opacity-60` |

### Credentials accordion

[`SectionCredentials`](../src/components/sections/SectionCredentials.astro): `data-credentials-accordion`; trigger `20→17` + plus→minus; CSS grid-rows expand `~0.4s`; expanded panel = nested title/org rows; outbound URLs use text+arrow. `/design` mounts with `preview`.

### Testimonials phone

[`SectionTestimonials`](../src/components/sections/SectionTestimonials.astro): phone shell ~360×750 (scaled); `bg-primary` frame; `#prevButton` / `#nextButton` gesture zones; progress bars; quote `22px` white; person chip; side gradient panels. Home-only signature — don’t reuse as generic carousel chrome. `/design` mounts with `preview` (dummy quotes via embedded `#testimonials-data`).

### Footer contact shell

[`Footer.astro`](../src/components/Footer.astro) — always `max-w-[550px]`. `/design` mounts with `preview`.

| Piece | Spec |
| --- | --- |
| Outer | `rounded-[46→36]` `bg-surface` `border-border` `p-[9px]` |
| Inner | `bg-bg` `rounded-[40→32]` `px-[60→30]` `py-[50→40/30]` |
| Heading | Centered H2 `50→34` + support `17→15` (`max-w-[277px]` `/60`) |
| Person | Avatar `70→56`; name `22→19`; role `14→13` `/60` |
| Socials | Circles `36px` `bg-surface`; icons `22px` `opacity-40→100` |
| Meta | © row `/60`; “Created by” + small avatar + name (`13px`) |

### Sticky project media card

[`ProjectElement`](../src/components/elements/ProjectElement.astro) — **not** the blog list shell.

| Piece | Spec |
| --- | --- |
| Stick | `sticky top-[110px]` |
| Height | `400→280` |
| Frame | `rounded-[45px]` `p-[9px]` over banner image |
| Caption | Pill **overlaid** at bottom (`justify-end`): logo disc + title `16→14` + desc `/60` `14→13` + arrow circle on `bg-surface` |
| Gallery | `/design` → Project list uses `SectionProjects` `preview` + `design-logo-placeholder` / media shell |

### Project metadata rows

Inside project hero card: height `74px`, `rounded-[41px]` **`bg-bg`**; icon circle `54px` **`bg-surface`**; label `/50` `14→13`; value right `16→14`. Used for Organization / Category / Released.

### Project links bar

Height `64px`, `rounded-[46→36]` `bg-surface` `border-border`; evenly spaced text+arrow links (`Source Code`, `Privacy Policy`).

### Project “View all” bar

[`ProjectViewAll`](../src/components/elements/ProjectViewAll.astro): same `64px` surface bar as links bar, but **single centered** “View all” + arrow (home projects section). Distinct from blog inline View all.

### Project body media

Content title `26→24`; body `18→16` `/60`. Media up to `~1180px`, `rounded-[30→20]`. Layouts: `image-large`, `images-pair`, `images-pair-then-large` — see [`project-authoring.md`](./project-authoring.md).

### Detail page H1 (left)

Blog / project / privacy: `50→34`, leading `105%`, tracking `-0.05em`, **left**-aligned (marketing sections stay centered).

### Blog list row

[`BlogElement`](../src/components/elements/BlogElement.astro) inside list shell: thumb **`54px`** circle (hover `scale-110`); title `16→14`; date `14→13` `/50`; row `rounded-[41px]` `bg-bg` `py-2.5 pl-2.5 pr-5`.

### Article meta + intro

[`BlogPage`](../src/components/elements/BlogPage.astro):

| Piece | Spec |
| --- | --- |
| Order | Back → H1 → meta (project is hero → H1 → back) |
| Meta row | Avatar `28px` + author `15→14` + date `14→13` `/50` |
| Divider | `h-px bg-border` in `py-5` |
| Intro | Lead `26→24`; support `18→16` `/60` |
| Banner | Max `~1180px`, `rounded-[30→20]` |
| Body H2 | `38→30` |
| Body H3 | `22→20` |
| Body para | `18→16` `/50` |
| Rhythm | ~52px before titles; ~24px peers; ~20px heading→content |

### Article bullets

| Style | Spec |
| --- | --- |
| Disc | `5px` circle `bg-text/40` |
| Labeled | `<span class="text-text">Label:</span>` + muted rest (`- **Label**: text` in MD) |
| Numbered | `1.` `text-text/40` tabular nums |

### Blog “View all” (inline)

[`BlogViewAll`](../src/components/elements/BlogViewAll.astro): flat `h-12` row inside list shell — label **“View all”** + arrow, **no** surface bar (unlike `ProjectViewAll`).

### Privacy policy page

[`ProjectPrivacyPage`](../src/components/elements/ProjectPrivacyPage.astro): back control + left H1; “For app” `/60`; “Last updated” `/40`; hairline; `.privacy-content` h2 `26→24`, h3 `20→18`, p/li `18→16` `/50`; disc `5px`; blockquote left border + surface wash.

### Tools hub

- Width matches footer (`max-w-[550px]`).
- Search filters registry entries; empty state copy when no matches.
- New tools: add to `siteTools`, add `src/pages/tools/<slug>.astro`.

---

## 8. Motion

| Mechanism | When |
| --- | --- |
| Page loader | First paint hold, then exit slide |
| **Scroll reveal** | Section / list enter — **target:** Motion `inView` + spring (§12.2.2); today: `appear-*` / `reveal.ts` |
| Lenis | Smooth page wheel scroll |
| **Spring physics** | Interactive UI + reveals — **target:** Motion `type: "spring"` (§12.2.3) |
| **Scramble on CTAs** | **target:** [Motion+ `scrambleText`](https://motion.dev/examples/js-scramble-text) (§12.2.1) |
| Short color/opacity transitions | `200ms` ease-in-out hovers |
| **Circular cursor** | Desktop ring follower — **target:** §12.2.4 (after Adopt Motion) |
| Availability pulse | Green dot on hero |

**Rules**

- Ship 2–3 intentional motions on visually led surfaces; don’t animate everything.
- Respect `prefers-reduced-motion` (Lenis, scramble, springs, reveals must no-op).
- Nested overflow: never fight Lenis — mark scrollables with `data-lenis-prevent`.
- Do **not** add a second custom scramble or reveal engine — migrate to Motion (§12.2.1–12.2.3).

---

## 9. Content & IA

| Surface | Width | Notes |
| --- | --- | --- |
| Marketing / portfolio | 550px column | Centered sections |
| Blog / project detail | 550px text, wider media | Back control + left title |
| `/tools` hub | 550px | Search + list |
| `/tools/*` utilities | Wider | `noindex`; excluded from sitemap |

Authoring docs: [`blog-authoring.md`](./blog-authoring.md), [`project-authoring.md`](./project-authoring.md).

---

## 10. Implementation checklist (new UI)

1. **Tokens first** — `bg-bg`, `text-text`, `bg-surface`, `border-border`, `bg-primary`.
2. **Type** — Manrope 600, correct size/tracking from the scale; Fragment Mono for code only.
3. **Width** — default 550px column unless the feature is a multi-pane tool.
4. **Shape** — pills for actions; soft shells for groups; no generic card grids.
5. **Hierarchy** — one headline + one muted support line per section.
6. **Interaction** — scramble on key links; back control pattern on subpages.
7. **Theme** — verify light and dark; icons invert correctly.
8. **Motion** — optional reveal; Lenis-safe nested scroll.
9. **CSS home** — page content under `site-root`; new rules in the matching feature sheet (`hero.css`, `projects.css`, …) with `@apply` for layout when possible, or Tailwind in markup — not a one-off orphan stylesheet.
10. **SEO** — private utilities: `noindex={true}`.
11. **Registry** — tools go through `siteTools`, not one-off orphan pages.

---

## 11. Anti-patterns

- Introducing a second display font or weight stack “for variety”
- Purple/indigo gradient themes, glow borders, glass everywhere
- Wide marketing dashboards (stats strips, pill clouds, multi-card heroes)
- Native form widgets that break the pill language (default search clear, harsh focus rings)
- Scroll chaining inside tools without `data-lenis-prevent`
- Hard-coding light-only greys that don’t flip in `.dark`
- Duplicating shell/footer width with a mismatched max-width (use **550px** for hub/footer alignment)
- New global CSS outside the `global.css` import graph, or dumping page-only tools/design rules into the site-wide bundle
- A second page-root wrapper or parallel CSS variable namespace instead of `site-root` / `--site-*`

---

## 12. Enhancement roadmap (research-backed)

Prioritized opportunities to evolve the site **without abandoning** the 550px craft language. Trends are filtered through this brand: Technical Lead · Mobile, calm, precise — not trend-chasing for its own sake.

### 12.1 Decision principle

| Prefer | Reach for library when |
| --- | --- |
| **Native platform first** (CSS, View Transitions, WAAPI) | You need springs, interruptible layout morphs, complex timelines, or a cleaner JS API over raw VT |
| **One motion system** | Mixing Lenis + GSAP + Motion + custom reveal without ownership |
| **Proof of craft** | Decorative animation that doesn’t communicate hierarchy or state |

External references worth tracking: [Motion](https://motion.dev/), [Motion `animateView`](https://motion.dev/docs/animate-view), [Motion + Astro guide](https://developers.netlify.com/guides/motion-animation-library-with-astro/), [CSS scroll-driven + View Transitions (2026)](https://www.frontendhorizon.com/blog/view-transitions-api-and-css-scroll-driven-animations-the-browser-wins-of-2026), [native migration notes](https://mintec.co/blog/native-view-transitions-migration/), [immersive stack guidance](https://adamarant.com/en/blog/immersive-web-stack-in-2026-lenis-gsap-and-what-to-skip).

---

### 12.2 Motion & interaction

**Today:** Lenis smooth scroll, custom `appear-*` / reveal, scramble text, page loader, Astro `ClientRouter`.

| Enhancement | Approach | Fit |
| --- | --- | --- |
| **P0 — Reduced-motion contract** | Audit every animation; provide CSS/`matchMedia('(prefers-reduced-motion: reduce)')` no-ops for scramble, Lenis, reveals | Accessibility baseline |
| **P0 — Motion token scale** | Formalize durations: `120 / 200 / 320 / 520ms` and one house easing (e.g. `cubic-bezier(0.44, 0, 0.56, 1)` already used in nav) as CSS variables | Consistency |
| **P1 — View Transitions polish** | Named transitions for shared elements (project thumb → detail banner, blog row → article). Astro ClientRouter already enables VT; add `view-transition-name` sparingly — **never on `.nav-glass` / `.nav-bar-container`** (breaks frost) | Native, 0kb |
| **P1 — Adopt Motion (JS)** | Add open-source [`motion`](https://motion.dev/) **vanilla JS** (not React) as the site animation runtime: `animate`, `inView`, `stagger`, `scroll` as needed. Works with Astro scripts ([Astro guide](https://developers.netlify.com/guides/motion-animation-library-with-astro/)). Foundation for §12.2.2–12.2.3 | Small, MIT |
| **P1 — Motion scroll reveal (`inView`)** | On top of Adopt Motion (JS): replace custom `appear-*` / [`reveal.ts`](../src/scripts/reveal.ts) with Motion `inView` + `animate` + `stagger` — see **§12.2.2** | Primary reveal path |
| **P1 — Motion spring physics** | On top of Adopt Motion (JS): use `animate(..., { type: "spring", ... })` for interactive UI (tools, pills, back control) — see **§12.2.3** | Natural feel |
| **P2 — CSS scroll-driven reveals** | Progressive enhancement / fallback: `animation-timeline: view()` where supported; Motion `inView` remains the authored path | Perf on low-end |
| **P1 — Replace custom scramble with Motion+ `scrambleText`** | See **§12.2.1** — [JS scramble example](https://motion.dev/examples/js-scramble-text) / [`scrambleText` docs](https://motion.dev/docs/scramble-text) | Brand motion, less custom JS |
| **P2 — `animateView()`** | Use Motion’s [`animateView`](https://motion.dev/docs/animate-view) where native VT is awkward (springs, interruption) — e.g. tools hub → tool morph, theme toggle continuity | Escalation path |
| **P2 — Keep Lenis intentionally** | Retain Lenis for the signature smooth-scroll feel **unless** §12.2.5 verification says otherwise; nested panes must use `data-lenis-prevent` | Brand motion |
| **P2 — Verify Lenis vs alternatives** | Structured bake-off before locking the scroll stack — see **§12.2.5** | Evidence, not habit |
| **P2 — Circular custom cursor** | Small ring/dot follower on desktop pointers — see **§12.2.4**. Not magnetic blobs | Craft pointer |
| **P3 — Skip by default** | GSAP + ScrollTrigger theatre, particle fields, **magnetic / blend-mode mega cursors**, full-page scroll-jacking — clashes with narrow-column craft unless a single flagship case study needs it | Restraint |

**Motion stack recommendation (target):**

```
Native VT                         →  page ↔ page morphs
Adopt Motion (JS, OSS)            →  site animation runtime (animate / inView / stagger / scroll)
  ├─ inView + stagger             →  scroll reveal (replaces reveal.ts / appear-*)
  └─ spring physics               →  tools UI + enter animations + cursor follow
Lenis                             →  page wheel feel (existing)
Motion+ scrambleText              →  CTA / link scramble (replaces scramble-text.ts)
Circular cursor (desktop)         →  small ring follower (§12.2.4)
CSS scroll-driven                 →  optional progressive enhancement / reading progress
```

#### 12.2.1 Migrate scramble → Motion+ `scrambleText`

**Today:** custom Keel-style helpers in [`src/scripts/scramble-text.ts`](../src/scripts/scramble-text.ts), opted in via `data-scramble` / `data-scramble-variant` on nav, CTAs, list rows, back links, and the hero “available for” cycle (`available-text.ts`).

**Target:** use Motion’s vanilla scramble API from the [js-scramble-text example](https://motion.dev/examples/js-scramble-text) — `scrambleText` from Motion+ ([docs](https://motion.dev/docs/scramble-text)).

| Step | Action |
| --- | --- |
| 1 | Obtain [Motion+](https://motion.dev/plus) access token; install per [Motion+ installation](https://motion.dev/docs/motion-plus-installation) (`motion-plus` / `motion-plus-dom` as documented). |
| 2 | Add a thin site wrapper (e.g. `src/scripts/scramble-motion.ts`) that: gates on `prefers-reduced-motion` and the existing desktop max-width rule (`NO_SCRAMBLE_MQ`); maps hover / focus-visible on `[data-scramble]` to `scrambleText(el, { duration })`; keeps `data-scramble-variant` only if still needed for color, not for animation engine. |
| 3 | Match house feel: short duration (~0.4–0.8s), optional `stagger()` from `motion` for letter reveal; prefer alphanumeric / symbol charset close to current `SCRAMBLE_CHARS` (`0+-*\|{}\`/()$&`) via `scrambleText` character options. |
| 4 | Re-home **available-for** word cycling to call `scrambleText` when swapping labels (same API, not a second algorithm). |
| 5 | Remove or stub [`scramble-text.ts`](../src/scripts/scramble-text.ts) once all call sites (BaseLayout script, available-text) use the wrapper; keep `data-scramble` attributes as the public markup contract. |
| 6 | Verify keyboard focus-visible still scrambles (a11y parity with hover) and reduced-motion shows final text immediately. |

**Why replace**

- One vendor motion system instead of maintaining scramble timers / DOM wrapping
- Playback controls (pause / finish) and stagger from Motion
- Aligns with §12 Motion adoption; example + agent docs at [motion.dev/examples/js-scramble-text](https://motion.dev/examples/js-scramble-text)

**Constraint:** `scrambleText` is **Motion+** (paid membership), not the free `motion` package. Budget / token setup is a prerequisite before deleting the custom file. Until then, keep custom scramble but do not extend it with new features.

#### 12.2.2 Scroll reveal with Motion (`inView`)

**Today:** custom [`reveal.ts`](../src/scripts/reveal.ts) + `appear-*` classes in [`motion.css`](../src/styles/motion.css).

**Target:** free [`motion`](https://motion.dev/) package — `inView` + `animate` + `stagger` (same pattern as the [Motion + Astro guide](https://developers.netlify.com/guides/motion-animation-library-with-astro/); scroll-triggered API: [inView](https://motion.dev/docs/inview), scroll-linked optional: [scroll](https://motion.dev/docs/scroll)).

| Step | Action |
| --- | --- |
| 1 | `npm install motion` (OSS). Tree-shake: `import { animate, inView, stagger } from "motion"`. |
| 2 | Mark sections/rows with a stable hook (e.g. `data-reveal` or `.scrolling-section`) — reuse existing markup where possible. |
| 3 | On enter viewport (`amount: ~0.2–0.25`), `animate(el, { opacity: [0, 1], y: [24, 0] }, { type: "spring", … })`. For list shells, `animate(children, {…}, { delay: stagger(0.06) })`. |
| 4 | Gate with `prefers-reduced-motion`: set final styles immediately, skip `inView` animation. |
| 5 | Keep Lenis; reveals are scroll-**triggered**, not scroll-jacked. Do not bind reveal progress to Lenis unless designing a scrubbed case study. |
| 6 | Remove or slim `reveal.ts` / unused `appear-*` once parity is confirmed on home, projects, blogs. |
| 7 | Optional P2: CSS `animation-timeline: view()` as progressive enhancement for simple fades; Motion remains the authored default for stagger/spring. |

**House limits**

- One reveal recipe site-wide (fade + small `y`, spring or short easing) — don’t invent per-section theatrics.
- Prefer section-level + list-row stagger; avoid animating every typographic node.
- No parallax stacks on the 550px column unless a single flagship page asks for `scroll()`.

#### 12.2.3 Spring physics with Motion

**Today:** mostly CSS transitions (`200ms ease-in-out`) and custom appear curves; no shared spring config.

**Target:** Motion `animate` / transitions with `type: "spring"` for **interactive** UI that should feel physical ([Motion springs](https://motion.dev/docs/react-transitions) apply the same spring model in JS).

| Use spring | Use short CSS / tween instead |
| --- | --- |
| Tools fullscreen open/close, panel expand | Color / opacity hovers (`200ms`) |
| Back-control / pill press feedback (`scale`) | Theme toggle track slide (already fine) |
| List-row / section scroll reveal enter | Lenis page scroll (keep Lenis) |
| Modal / command-palette enter+exit | Layout that must stay 1:1 with reduced-motion instant |

**House spring tokens (suggested — tune once, reuse)**

```js
// e.g. src/scripts/motion-tokens.ts
export const springSnappy = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };
export const springSoft   = { type: "spring", stiffness: 180, damping: 28, mass: 1 };
```

| Step | Action |
| --- | --- |
| 1 | Centralize `springSnappy` / `springSoft` (or CSS-variable documentation if mirrored later). |
| 2 | Wire snappy springs to tools chrome (fullscreen, chips) and soft springs to scroll reveals (§12.2.2). |
| 3 | Never spring infinite loops or scroll position; springs are for discrete UI state changes + enter animations. |
| 4 | Under `prefers-reduced-motion`, jump to end state (`animate` with `duration: 0` or set styles directly). |

**Do not** adopt Motion React / layout `layout={true}` site-wide — this stack is Astro + vanilla JS unless a future island needs it.

#### 12.2.4 Circular custom cursor

**Today:** native OS cursor only.

**Target:** a small **circle / ring** that follows the pointer on fine pointers (desktop), in brand tokens — craft signal, not a gimmick.

**Visual recipe**

| Property | Value |
| --- | --- |
| Shape | Circle ring (~24–32px) + optional inner dot (~4–6px), or single filled disk at low opacity |
| Color | `border` / fill from `text-text` or `primary` at low opacity; must flip correctly in `.dark` |
| Blend | Prefer normal / soft opacity — **avoid** `mix-blend-mode: difference` full-viewport tricks |
| States | Default ring · **hover grow** on `[data-scramble]`, `a`, `button` (~1.4×) · **press** slight shrink · hide over `input` / `textarea` / tools editors (native I-beam) |
| Motion | Follow with Motion spring (`springSoft`) or lerp — never 1:1 laggy JS without rAF; hide when idle optional |
| Native cursor | `cursor: none` only while custom cursor is active |

**Gates (required)**

| Condition | Behavior |
| --- | --- |
| `pointer: fine` + hover-capable | Enable |
| Touch / coarse pointer | Keep system cursor |
| `prefers-reduced-motion` | Disable custom cursor (system cursor) |
| `/tools/*` text fields & markdown panes | Show system cursor (editing) |
| Keyboard-only navigation | Custom cursor irrelevant; focus rings remain primary |

**Implementation sketch**

```html
<!-- BaseLayout: one portal -->
<div id="site-cursor" class="site-cursor" aria-hidden="true" hidden>
  <div class="site-cursor-ring"></div>
</div>
```

```js
// pointermove → motion animate / spring x,y of #site-cursor
// mouseover interactive → add .is-hover (scale up)
// prefer matchMedia('(pointer: fine) and (hover: hover)')
```

Wire after **Adopt Motion (JS)** so the follower can use `springSoft` (§12.2.3). Pure CSS `cursor: url(...)` circle is acceptable as a lighter P3 fallback (no grow states).

**Anti-patterns**

- Magnetic attraction toward every link (listed under P3 skip)
- Giant 80px cursors, emoji cursors, trailing particle ribbons
- Hiding cursor on mobile or inside form fields
- Replacing focus rings with cursor-only affordances

#### 12.2.5 Verify Lenis smooth scroll vs alternatives

**Goal:** Confirm Lenis remains the right page-scroll feel for this site — or replace it with evidence — **before** stacking Motion reveals/springs on top of a scroll model we might discard.

**Today:** [`src/scripts/smooth-scroll.ts`](../src/scripts/smooth-scroll.ts) — Lenis `autoRaf`, `lerp: 0.1`, `smoothWheel`, hash `scrollTo`, Astro swap resize, `data-lenis-prevent` on nested tools panes, gated by `prefers-reduced-motion`.

##### Candidates to compare

| Option | Role | Why include |
| --- | --- | --- |
| **A — Lenis (current)** | Smooth wheel lerp on `window` | Baseline / brand feel |
| **B — Native browser scroll** | No smooth-scroll lib | Best a11y, INP, nested scroll; 0 kb |
| **C — CSS `scroll-behavior: smooth`** | Anchor jumps only | Free; does **not** replace wheel smoothing |
| **D — Motion `scroll()` only** | Scroll-**linked** animations, not wheel smoothing | Wrong job for “buttery page scroll”; still useful later for scrubbed effects |
| **E — GSAP ScrollSmoother / similar** | Heavy smooth-scroll | Only if Lenis fails and native feels too raw — default **skip** for weight |

Do **not** run Lenis + another smooth-scroll lib at once.

##### Hypothesis

Lenis wins on **desktop wheel feel** and hash navigation polish; native wins on **INP, touch, nested overflow, reduced-motion simplicity**. Keep Lenis if the feel gap is obvious and regressions are manageable; otherwise drop it.

##### Test matrix (same pages, same device)

| # | Scenario | Pass criteria |
| --- | --- | --- |
| 1 | Home long scroll (wheel, trackpad) | Subjective smoothness 1–5; no jank / frame drops |
| 2 | Anchor `#projects` / `#contact` | Lands correctly with ~nav offset; no double-scroll |
| 3 | Astro client nav + back/forward | Scroll restore / top behavior matches intent; no stuck `scroll-pending` |
| 4 | `/tools/markdown` inner panes | Wheel inside pane scrolls pane only (`data-lenis-prevent` or native) |
| 5 | Blog / project long article | Reading comfort; no fight with text selection |
| 6 | Mobile Safari + Chrome Android | Touch scroll feels native; no rubber-band bugs |
| 7 | `prefers-reduced-motion: reduce` | No smooth-scroll lib active; instant scroll |
| 8 | Keyboard (PageDown, space, tabs) | Focus and scroll remain usable |
| 9 | Lighthouse / Web Vitals | INP / TBT not worse than native by a clear margin |
| 10 | Motion `inView` reveals (after Adopt Motion) | Reveals fire once; no delayed/missed triggers under Lenis |

##### Method (1–2 days)

1. **Branch A** — current Lenis (control).  
2. **Branch B** — disable Lenis (`smooth-scroll.ts` no-op except reduced-motion path / restore helpers still work).  
3. Optional **Branch E** — only if A vs B is inconclusive and you still want smoothing (document why).  
4. Record short screen captures (desktop trackpad + mouse wheel + iPhone).  
5. Score each scenario in a small table (feel / bugs / perf).  
6. **Decision rule:**
   - Keep Lenis if desktop feel is clearly better **and** tools nested scroll + a11y gates stay green.  
   - Drop Lenis if native is “good enough” and fixes tools/INP/mobile pain.  
   - Never adopt Motion or GSAP as a *smooth wheel* replacement; use them for animation, not scroll hijacking.

##### Integration checklist (if keeping Lenis)

- [ ] Single instance on `window.__lenis`  
- [ ] All nested `overflow: auto` use `data-lenis-prevent`  
- [ ] Hash links use `lenis.scrollTo` with shared nav offset  
- [ ] `astro:after-swap` → `resize()` + known scroll position  
- [ ] Reveal / Motion `inView` verified under Lenis  
- [ ] Document result in this file (date + decision)

##### Integration checklist (if dropping Lenis)

- [ ] Remove `lenis` dependency + `smooth-scroll.ts` import  
- [ ] Restore native scroll + `scroll-behavior` only for in-page anchors if desired  
- [ ] Replace `lenis.scrollTo` / `__lenis` callers (reveal, BaseLayout restore)  
- [ ] Remove `data-lenis-prevent` (optional cleanup)  
- [ ] Update §8 / motion stack diagram to “native scroll”

### 12.3 UI / UX product

| Enhancement | Notes |
| --- | --- |
| **Narrative case studies** | Move project pages beyond feature grids — “messy middle” decisions, constraints, trade-offs (strong 2026 portfolio pattern). Still one section / one job. |
| **Live proof** | Optional dynamic signals: last commit date, star count, Play Store badge freshness — small meta rows, not stat dashboards. |
| **Traffic / reach meta line** | Quiet uppercase strip like `171.9K UNIQUE · 1.04M VIEWS / MONTH` — see **§12.3.1**. |
| **Command palette** (`⌘K`) | Jump to Projects / Blogs / Tools / Contact; fits Technical Lead UX better than mega-menus. Pill modal, Manrope, surface shell. |
| **Reading progress** | Thin primary bar on blog/project detail (CSS scroll-driven). |
| **Share / copy deep links** | Quiet chip under article titles. |
| **Tools as product** | Expand `/tools` as a private ops suite: OG image preview, contrast checker, sitemap diff, resume PDF checker — all hub-registered. |
| **Empty / error / loading** | Formalize tools + content empty states (already started on hub search). |
| **Focus rings** | Visible, on-brand focus (`outline` with primary / offset) for keyboard users — don’t rely on mouse-only hovers. |

#### 12.3.1 Traffic / reach meta line (screenshot pattern)

Reference look: a single quiet line — `171.9K UNIQUE · 1.04M VIEWS / MONTH` — uppercase, muted, no chrome. Use this as **live proof**, not a hero KPI dashboard.

**Where it belongs (pick one)**

| Placement | Why |
| --- | --- |
| **Preferred — Footer**, above copyright inside the contact shell | Matches “proof” without competing with the hero; sits with © / Created by |
| Intro card, under location row | Only if numbers stay secondary (`text-text/50`); never larger than body |
| Tools hub | Skip — private surface; traffic flex belongs on the public brand |

Do **not** put it in the first viewport as a stat strip beside the brand.

**Visual recipe (this design system)**

| Property | Value |
| --- | --- |
| Type | `font-manrope`, `font-semibold` (`600`) |
| Size | `11px`–`12px` (micro / badge scale) |
| Case | `uppercase` |
| Tracking | `0.06em`–`0.12em` (looser than UI body — this is a ticker, not a title) |
| Color | `text-text/45`–`/55` (light + dark via opacity; never hard-coded `#888`) |
| Layout | One centered line; separator `·` (middle dot) with spaces |
| Chrome | **None** — no pill, border, card, or background bar |
| Motion | Optional count-up once in view via existing [`count-up.ts`](../src/scripts/count-up.ts); respect `prefers-reduced-motion` |

**Markup sketch**

```astro
<p
  class="m-0 p-0 text-center font-manrope text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-text/50"
  aria-label="171.9 thousand unique visitors and 1.04 million views per month"
>
  <span data-count-to="171.9" data-count-suffix="K" data-count-decimals="1">171.9K</span>
  UNIQUE
  <span aria-hidden="true"> · </span>
  <span data-count-to="1.04" data-count-suffix="M" data-count-decimals="2">1.04M</span>
  VIEWS / MONTH
</p>
```

Notes:

- Extend `count-up.ts` if decimals aren’t supported yet (`data-count-decimals`); until then, render static formatted strings and only animate integers (e.g. experience years — already live).
- Prefer **static curated numbers** in `author-metadata.json` (e.g. `footer.reach`) updated monthly over live analytics in the browser (keeps the site static, private keys off GitHub Pages).
- Optional later: a `/tools` private fetcher that prints updated JSON for you to commit — not a public API call on every page view.

**Data shape (suggested)**

```json
"reach": {
  "uniques": "171.9K",
  "views": "1.04M",
  "period": "month",
  "label": "UNIQUE · VIEWS / MONTH"
}
```

**A11y**

- Provide a spoken `aria-label` with full words (“thousand”, “million”, “per month”).
- Don’t rely on color alone; opacity must still meet contrast for small caps (bump to `/60` if AA fails).

**Anti-patterns**

- Large display numbers, colored accents, sparkline charts, or “+12% MoM” trends in the footer
- Auto-fetching Google Analytics in client JS on the public site
- Animating on every Lenis scroll tick (one-shot in-view only)

---

### 12.4 Agentic / AI UX (optional, brand-safe)

Industry trend: portfolios as [agentic showcases](https://websitereviewai.com/blog/2026-03-31-portfolio-website-trends-2026) that route visitors by intent. For this site, keep it **restrained**:

| Do | Don’t |
| --- | --- |
| Lightweight “Ask about my work” that **navigates** to existing sections/projects | Chatbot that invents experience claims |
| Tooling that helps *you* author content (`/tools`) | Public LLM that dilutes personal voice |
| Structured FAQ / JSON-LD for voice & AI search answers | Generative walls of text on first paint |

If pursued: stream UI to existing shells (550px), not a second visual system.

---

### 12.5 Performance

| Enhancement | Target |
| --- | --- |
| **Core Web Vitals** | LCP < 2.5s, INP < 200ms, CLS stable (hero avatar / fonts) |
| **Font strategy** | Subset already; consider `font-display: optional` for non-critical Inter if still loaded |
| **Image** | Explicit dimensions everywhere; AVIF/WebP where assets allow; priority only on LCP image |
| **JS budget** | Prefer CSS/VT over libraries; if adding Motion, tree-shake imports (`animate`, `inView`, `stagger` only) |
| **Speculation Rules** | Prefetch `/projects`, `/blogs` for faster next nav (pairs with VT) |
| **MotionScore / audits** | Periodically audit live site ([MotionScore](https://motion.dev/) or Lighthouse) after motion changes |

---

### 12.6 Accessibility & inclusive design

| Enhancement | Notes |
| --- | --- |
| WCAG 2.2 AA contrast | Audit primary-on-white and muted `/60` text on both themes |
| Keyboard path | Nav, theme toggle, scramble links, tools forms, fullscreen tools — full tab order |
| `prefers-reduced-motion` | Hard gate Lenis, scramble, parallax, springs |
| `prefers-contrast` / forced colors | Smoke-test Windows high contrast |
| Skip link | “Skip to content” targeting main |
| Live regions | Tools search empty state already; extend to copy-to-clipboard confirmations |

---

### 12.7 Content, SEO & discoverability

| Enhancement | Notes |
| --- | --- |
| **FAQ / HowTo JSON-LD** | Mobile engineering topics you already write about |
| **OG freshness** | Per-blog/project images; tools could generate previews |
| **Sitemap quality** | Keep `/tools` out; ensure blog/project lastmod |
| **Voice / answer-shaped copy** | Section intros that answer “who / what / where” clearly (aids AI overviews without gimmicks) |
| **i18n** | Only if there’s a real audience need; don’t ship half-translated UI |

---

### 12.8 Design-system / engineering DX

| Enhancement | Notes |
| --- | --- |
| **Token CSS variables for motion** | `--ease-standard`, `--duration-fast/mid/slow` |
| **Component gallery** | Living style guide at [`/design`](../src/pages/design.astro) (`noindex`) — tokens, live `preview` sections, roadmap UX; dummy media via `design-preview-data.ts` |
| **Lint** | Fail PRs that introduce raw hex outside tokens or Inter as new display usage |
| **Cursor / agent** | Keep `.cursor/rules/design-system.mdc` in sync when tokens change; optional Motion [AI Kit](https://motion.dev/) if Motion is adopted |
| **Visual regression** | Lightweight Playwright screenshots for home light/dark |

---

### 12.9 Suggested phased plan

**Phase A — Foundation (1–2 weeks)**  
Reduced-motion audit · focus rings · motion duration tokens · reading progress · tools empty/focus polish.

**Phase B — Platform motion (2–4 weeks)**  
Named View Transitions on project/blog · Speculation Rules prefetch · **§12.2.5 Lenis vs native (and peers) verification** — decide keep/drop before Phase C stacks Motion on scroll.

**Phase C — Motion.js where it earns its keep**  
1. **Adopt Motion (JS)** — install OSS `motion` as the animation runtime  
2. **§12.2.2 scroll reveal** (`inView` + stagger) replacing `reveal.ts` / `appear-*`  
3. **§12.2.3 spring physics** — shared `springSnappy` / `springSoft` on tools UI + reveals  
4. Motion+ **[`scrambleText`](https://motion.dev/examples/js-scramble-text)** (§12.2.1) · remove `scramble-text.ts`  
5. `prefers-reduced-motion` hard gates for all of the above

**Phase D — Product depth**  
Command palette · richer project narratives · traffic meta line in footer (§12.3.1) · **circular custom cursor** (§12.2.4) · 1–2 new `/tools` utilities · optional live proof meta.

**Phase E — Experimental**  
Brand-safe agentic navigator · MotionScore CI · kitchen-sink gallery.

---

### 12.10 Explicit non-goals

- Rebuilding the site in React solely to use Motion React / Motion UI kits
- Inventing a *new* custom scramble engine, or swapping scramble for an unrelated typewriter trend — migrate to [Motion+ scrambleText](https://motion.dev/examples/js-scramble-text) instead
- Animation volume as a substitute for stronger case-study writing
- Wide bento / dashboard home layouts
- Dark-only redesign (keep dual theme; dark may be preferred by visitors, light remains first-class)