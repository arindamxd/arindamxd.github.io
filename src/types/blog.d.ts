/** Plain bullet or labeled lead-in (“Target–Action: …”). */
export type BlogBullet =
    | string
    | {
          label: string
          text: string
      }

/**
 * One body block per entry. Use `type` to pick the renderer.
 *
 * | type        | fields                                      | Use for                       |
 * |-------------|---------------------------------------------|-------------------------------|
 * | `title`     | `text`                                      | Section heading (h2)          |
 * | `subtitle`  | `text`                                      | Sub-heading (h3)              |
 * | `paragraph` | `text`                                      | Body copy / description       |
 * | `bullets`   | `items`, optional `style` (`disc`\|`number`) | Lists with disc or 1. 2. 3. |
 * | `code`      | `code`, optional `language`                 | Fenced code / snippets        |
 */
export type BlogBodyBlock =
    | { type: "title"; text: string }
    | { type: "subtitle"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "bullets"; items: BlogBullet[]; style?: "disc" | "number" }
    | { type: "code"; code: string; language?: string }

/** List/card fields stored in blogs-metadata.json (plus a path to the MD page). */
export interface BlogCatalogEntry {
    slug: string
    title: string
    thumb: string
    author: {
        name: string
        avatar: string
    }
    date: string
    /** Relative path under src/content/, e.g. blogs/my-post.md */
    content: string
}

export interface Blog {
    slug: string
    title: string
    thumb: string
    author: {
        name: string
        avatar: string
    }
    date: Date
    page: {
        intro: {
            title: string
            paragraph: string
            banner: string
        }
        body: BlogBodyBlock[]
    }
}
