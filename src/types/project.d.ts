/** Image used in project body layout blocks. */
export interface ProjectImage {
    src: string
    alt: string
}

/**
 * One body block per entry. Use `type` to pick the renderer.
 *
 * | type                     | fields                         | Use for                          |
 * |--------------------------|--------------------------------|----------------------------------|
 * | `images-pair`            | `left`, `right`                | Side-by-side image row           |
 * | `content`                | `title`, `description`         | Section heading + copy           |
 * | `image-large`            | `image`                        | Full-width large image           |
 * | `images-pair-then-large` | `left`, `right`, `large`       | Pair row followed by large image |
 */
export type ProjectBodyBlock =
    | { type: "images-pair"; left: ProjectImage; right: ProjectImage }
    | { type: "content"; title: string; description: string }
    | { type: "image-large"; image: ProjectImage }
    | {
          type: "images-pair-then-large"
          left: ProjectImage
          right: ProjectImage
          large: ProjectImage
      }

/** List/card + hero fields stored in projects-metadata.json (plus a path to the MD body). */
export interface ProjectCatalogEntry {
    slug: string
    title: string
    desc: {
        short: string
        long: string
    }
    images: {
        thumb: string
        thumb_bg_color: string
        banner: string
    }
    header: {
        organization: string
        category: string
        released_date: string
        updated_date: string
        downloads?: string
        link?: string
    }
    /** Relative path under src/content/, e.g. projects/camerax.md */
    content: string
}

export interface Project {
    slug: string
    title: string
    desc: {
        short: string
        long: string
    }
    images: {
        thumb: string
        thumb_bg_color: string
        banner: string
    }
    header: {
        organization: string
        category: string
        released_date: Date
        updated_date: Date
        downloads?: string
        link?: string
    }
    page: {
        body: ProjectBodyBlock[]
    }
}
