# Blog authoring

Blogs live in `src/content/blogs-metadata.json`. Each entry has list metadata plus a `page` with `intro` and a typed `body` array.

## Entry shape

```json
{
  "slug": "my-post",
  "title": "Post title (list + page h1)",
  "thumb": "/assets/… or https://…",
  "author": { "name": "…", "avatar": "/assets/…" },
  "date": "2024-03-29",
  "page": {
    "intro": {
      "title": "Lead heading under the meta row",
      "paragraph": "Short intro copy",
      "banner": "https://… wide image"
    },
    "body": [ /* blocks below */ ]
  }
}
```

## Body blocks

Every body item **must** include `"type"`. One concern per block.

| `type` | Fields | Renders as |
|--------|--------|------------|
| `title` | `text` | Section heading (h2) |
| `subtitle` | `text` | Sub-heading (h3) |
| `paragraph` | `text` | Body / description |
| `bullets` | `items`, optional `style`: `"disc"` (default) or `"number"` | Disc or numbered list |
| `code` | `code`, optional `language` | Monospace snippet panel |

### Title / subtitle / paragraph

```json
{ "type": "title", "text": "Section heading" }
{ "type": "subtitle", "text": "Supporting heading" }
{ "type": "paragraph", "text": "Body copy…" }
```

Spacing: **~20px** between a title/subtitle and the next paragraph, bullets, or code. Peers (paragraph → paragraph, etc.) get **~24px**. New titles/subtitles open a section with **~52px** top margin.

### Bullets

Default is a **disc** list (small gray dots, `gap-2.5` between items — Framer-style).

Plain strings:

```json
{
  "type": "bullets",
  "items": [
    "Outline your website structure before designing.",
    "Gather all your content (images, text) in one place."
  ]
}
```

Numbered (`1.` `2.` `3.`):

```json
{
  "type": "bullets",
  "style": "number",
  "items": [
    "First step",
    "Second step"
  ]
}
```

Labeled items (bold lead-in + muted body) — works with either style:

```json
{
  "type": "bullets",
  "items": [
    {
      "label": "Target–Action Mechanism",
      "text": "Link a tap to a method in your code."
    },
    {
      "label": "Control States",
      "text": "normal, highlighted, disabled, …"
    }
  ]
}
```

You can mix strings and `{ label, text }` in the same `items` array. Omit `style` (or set `"disc"`) for dots.

### Code

Use `\n` for newlines inside the JSON string. Set `language` so the block shows a label and Shiki syntax colors (e.g. `swift`, `kotlin`, `ts`, `js`).

```json
{
  "type": "code",
  "language": "swift",
  "code": "let button = UIButton(type: .system)\nbutton.setTitle(\"Click Me!\", for: .normal)"
}
```

Renders a “SWIFT” header plus highlighted tokens. Omit `language` (or use `plaintext`) for unhighlighted mono text.

## Typical section pattern

```json
[
  { "type": "title", "text": "…" },
  { "type": "paragraph", "text": "…" },
  { "type": "subtitle", "text": "…" },
  { "type": "bullets", "items": [ … ] },
  { "type": "paragraph", "text": "…" },
  { "type": "code", "language": "swift", "code": "…" }
]
```

Types are defined in `src/types/blog.d.ts`. The renderer is `src/components/elements/BlogPage.astro`.
