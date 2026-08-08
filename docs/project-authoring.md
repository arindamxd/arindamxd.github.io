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
    "short": "Card subtitle",
    "long": "Intro paragraph under the page h1"
  },
  "images": {
    "thumb": "/assets/projects/camerax/logo.svg",
    "thumb_bg_color": "rgb(42, 41, 255)",
    "banner": "https://… wide hero image"
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
