# Blog authoring

Blogs are split across two places:

1. **List/card catalog** — [`src/content/blogs-metadata.json`](../src/content/blogs-metadata.json)
2. **Article body** — Markdown under [`src/content/blogs/`](../src/content/blogs/)

At build time, [`src/utils/blogs.ts`](../src/utils/blogs.ts) merges them into the `Blog` shape used by the site.

## Catalog entry (JSON)

Keep list fields here. Do **not** put article copy in JSON — only a path to the MD file.

```json
{
  "slug": "my-post",
  "title": "Post title (list + page h1)",
  "thumb": "/assets/… or https://…",
  "author": { "name": "…", "avatar": "/assets/…" },
  "date": "2024-03-29",
  "content": "blogs/my-post.md"
}
```

`content` is relative to `src/content/`.

## Article file (Markdown)

Create `src/content/blogs/<slug>.md` with frontmatter for the intro, then normal Markdown for the body.

````md
---
title: "Lead heading under the meta row"
description: "Short intro copy"
banner: "https://… wide image"
---

## Section heading

Body paragraph…

### Supporting heading

- **Label**: Labeled disc list item
- Plain disc list item

1. Numbered step one
2. Numbered step two

```swift
let button = UIButton(type: .system)
```
````

### Frontmatter

| Field | Renders as |
|-------|------------|
| `title` | Intro lead under the meta row (not the list/h1 title in JSON) |
| `description` | Intro supporting copy |
| `banner` | Full-width article banner image |

### Body → blocks

Markdown is compiled into the typed blocks rendered by `BlogPage.astro`:

| Markdown | Block |
|----------|--------|
| `##` (or `#`) | Section heading (`title`) |
| `###`+ | Sub-heading (`subtitle`) |
| Paragraph | Body copy |
| `-` list | Disc bullets |
| `1.` list | Numbered bullets |
| `- **Label**: text` | Labeled bullet (`{ label, text }`) |
| Fenced code | Code panel (`BlogCodeBlock`; set language e.g. `swift`) |

Spacing follows the rhythm in `BlogPage.astro` (~52px before titles/subtitles, ~20px heading → content, ~24px between peers).

### Labeled bullets

```md
- **Target–Action Mechanism**: Link a tap to a method in your code.
- **Control States**: normal, highlighted, disabled, …
```

Mix labeled and plain items in the same list if needed.

### Code

Use a language tag so the panel shows a label and Shiki colors:

````md
```swift
let button = UIButton(type: .system)
button.setTitle("Click Me!", for: .normal)
```
````

Omit the language (or use `plaintext`) for unhighlighted mono text.

## Typical section pattern

````md
## Section heading

Intro paragraph for the section.

### Supporting heading

- **First idea**: Explanation…
- **Second idea**: Explanation…

More copy…

```kotlin
fun example() = Unit
```
````

Types live in `src/types/blog.d.ts`. The renderer is `src/components/elements/BlogPage.astro`.
