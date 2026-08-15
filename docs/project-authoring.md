# Project authoring

Projects are split across two places:

1. **List/card catalog** — [`src/content/projects-metadata.json`](../src/content/projects-metadata.json)
2. **Detail body** — Markdown under [`src/content/projects/`](../src/content/projects/)

At build time, [`src/utils/projects.ts`](../src/utils/projects.ts) merges them into the `Project` shape used by the site.

## Catalog entry (JSON)

Keep list/card and hero meta here. Do **not** put body layout copy or gallery images in JSON — only a path to the MD file.

```json
{
  "slug": "camerax",
  "title": "CameraX",
  "desc": {
    "short": "Card subtitle (max 60 characters)",
    "long": "Intro paragraph under the page h1"
  },
  "images": {
    "thumb": "/assets/projects/camerax/logo.png",
    "thumb_bg_color": "rgb(206, 232, 230)",
    "banner": "/assets/projects/camerax/banner.jpg"
  },
  "header": {
    "organization": "Personal",
    "category": "Productivity / Camera App",
    "released_date": "2019-09-27",
    "updated_date": "2025-08-28",
    "downloads": "100K+",
    "link": "https://…"
  },
  "content": "projects/camerax.md",
  "source_code": "https://github.com/…",
  "privacy_policy": true
}
```

`content` is relative to `src/content/`. Optional fields after `content`: `source_code`, then `privacy_policy`.

### Card copy

| Field | Rule |
| --- | --- |
| `desc.short` | **≤ 60 characters.** Caption subtitle on the project card. Author tool enforces `maxlength="60"`. |
| `desc.long` | Intro under the detail-page H1 — no character cap beyond keeping it one tight paragraph. |

### Images (card thumb + banner)

| Field | Rule |
| --- | --- |
| `thumb` | App/store icon as a **circular PNG** at `/assets/projects/<slug>/logo.png`. Clip the square Play asset to a circle (transparent corners). CSS always clips the 22px mark to a circle (hover **26px**). Do **not** scale the icon to fill the 54px disc. |
| `thumb_bg_color` | A **light tint** of the logo’s identity hue (or a complementary light accent) so the 22px mark contrasts with the disc. **Do not** use the logo’s own fill color — the mark vanishes. **Do not** default every card to primary unless the mark is a white glyph on a colored disc. |
| `banner` | Download locally to `public/assets/projects/<slug>/banner.jpg`. Prefer local files over hotlinking Unsplash or Play. |

Current disc tints (keep as the starting point when editing these three):

| Project | `thumb_bg_color` | Why |
| --- | --- | --- |
| CameraX | `rgb(206, 232, 230)` | Light seafoam behind the dark teal camera |
| Coco | `rgb(228, 240, 214)` | Pale lime behind the green chip |
| Ensecure | `rgb(245, 234, 204)` | Pale gold behind the slate / yellow gears |

Card hover (logo, banner zoom, arrow) shares **`transform 0.3s ease-in-out`** in [`projects.css`](../src/styles/projects.css) — do not put the thumb on a separate Motion spring.

### Header fields

| Field | Renders as |
|-------|------------|
| `organization` | Hero meta row |
| `category` | Hero meta row |
| `released_date` | “Released on” (ISO date string) |
| `updated_date` | Used for list sorting |
| `downloads` | Optional catalog metadata |
| `link` | “Live Preview” CTA |

### Catalog link fields (after `content`)

| Field | Renders as |
|-------|------------|
| `source_code` | End-of-page “Source Code” link |
| `privacy_policy` | End-of-page “Privacy Policy” link → `/projects/<slug>/privacy-policy` |

When `privacy_policy` is `true`, add the policy Markdown at `src/content/privacy-policies/<slug>.md`.

## Body file (Markdown)

Create `src/content/projects/<slug>.md` with **no frontmatter**. Encode the fixed visual sequence as markdown images and `##` + paragraph content blocks.

````md
![Image Small Top Left](https://…/top-left.jpg)
![Image Small Top Right](https://…/top-right.jpg)

## Section heading

Body paragraph for this section.

![Image Large Middle](https://…/middle.jpg)

## Another section

More copy…

![Image Small Bottom Left](https://…/bottom-left.jpg)
![Image Small Bottom Right](https://…/bottom-right.jpg)
![Image Large Bottom](https://…/bottom-large.jpg)
````

### Body → blocks

Adjacent image lines (no blank line between them) form one image group. Consecutive image-only paragraphs are also merged into one group. Group size picks the layout:

| Markdown | Block |
|----------|--------|
| 1 image | Full-width large image (`image-large`) |
| 2 images | Side-by-side pair (`images-pair`) |
| 3 images | Pair row + large image below (`images-pair-then-large`) |
| `##` + following paragraph | Section title + description (`content`) |

Typical CameraX-style page: **pair → content → large → content → pair-then-large**.

### Authoring tips

- Keep images in a group on consecutive lines (or blank-line-separated paragraphs that are image-only).
- Every `##` heading must be followed by a description paragraph.
- Alt text on `![alt](url)` becomes the image `alt`.
- Put assets under `public/assets/projects/<slug>/` or use absolute URLs.

Types live in `src/types/project.d.ts`. The renderer is `src/components/elements/ProjectPage.astro`.
