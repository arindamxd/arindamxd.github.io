import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";
import type {
    Image,
    Paragraph,
    PhrasingContent,
    Root,
    RootContent,
} from "mdast";
import type {
    Project,
    ProjectBodyBlock,
    ProjectCatalogEntry,
    ProjectImage,
} from "../types/project";
import catalog from "../content/projects-metadata.json";

const mdModules = import.meta.glob("../content/projects/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

function resolveMdRaw(contentPath: string): string {
    const fileName = contentPath.replace(/^.*\//, "");
    const key = Object.keys(mdModules).find((k) => k.endsWith(`/${fileName}`));
    if (!key) {
        throw new Error(`Project markdown not found for content path: ${contentPath}`);
    }
    return mdModules[key];
}

function phrasingText(nodes: PhrasingContent[] | undefined): string {
    if (!nodes?.length) return "";
    return toString({ type: "paragraph", children: nodes } as Paragraph).trim();
}

function toProjectImage(image: Image): ProjectImage {
    return {
        src: image.url,
        alt: image.alt?.trim() || "",
    };
}

/** Paragraph that contains only images (and optional whitespace text). */
function extractImages(paragraph: Paragraph): ProjectImage[] | null {
    const images: ProjectImage[] = [];
    for (const child of paragraph.children) {
        if (child.type === "image") {
            images.push(toProjectImage(child));
            continue;
        }
        if (child.type === "text" && !child.value.trim()) continue;
        return null;
    }
    return images.length > 0 ? images : null;
}

function imagesToBlock(images: ProjectImage[]): ProjectBodyBlock {
    if (images.length === 1) {
        return { type: "image-large", image: images[0] };
    }
    if (images.length === 2) {
        return { type: "images-pair", left: images[0], right: images[1] };
    }
    if (images.length === 3) {
        return {
            type: "images-pair-then-large",
            left: images[0],
            right: images[1],
            large: images[2],
        };
    }
    throw new Error(
        `Project markdown image group must have 1–3 images, got ${images.length}`,
    );
}

function mdastToBody(root: Root): ProjectBodyBlock[] {
    const blocks: ProjectBodyBlock[] = [];
    const children = root.children as RootContent[];
    let i = 0;

    while (i < children.length) {
        const node = children[i];

        if (node.type === "paragraph") {
            const images = extractImages(node);
            if (images) {
                const group = [...images];
                i += 1;
                while (i < children.length && children[i].type === "paragraph") {
                    const next = extractImages(children[i] as Paragraph);
                    if (!next) break;
                    group.push(...next);
                    i += 1;
                }
                blocks.push(imagesToBlock(group));
                continue;
            }

            const text = phrasingText(node.children);
            if (text) {
                throw new Error(
                    "Project markdown: standalone paragraphs must follow a ## heading (content block)",
                );
            }
            i += 1;
            continue;
        }

        if (node.type === "heading") {
            const title = phrasingText(node.children);
            if (!title) {
                i += 1;
                continue;
            }

            i += 1;
            let description = "";
            if (i < children.length && children[i].type === "paragraph") {
                const para = children[i] as Paragraph;
                if (!extractImages(para)) {
                    description = phrasingText(para.children);
                    i += 1;
                }
            }

            if (!description) {
                throw new Error(
                    `Project markdown: heading "${title}" must be followed by a description paragraph`,
                );
            }

            blocks.push({ type: "content", title, description });
            continue;
        }

        i += 1;
    }

    return blocks;
}

function parseProjectMarkdown(raw: string): ProjectBodyBlock[] {
    const tree = unified().use(remarkParse).parse(raw) as Root;
    return mdastToBody(tree);
}

function loadBody(contentPath: string): ProjectBodyBlock[] {
    return parseProjectMarkdown(resolveMdRaw(contentPath));
}

function toProject(entry: ProjectCatalogEntry): Project {
    return {
        slug: entry.slug,
        title: entry.title,
        desc: entry.desc,
        images: entry.images,
        header: {
            organization: entry.header.organization,
            category: entry.header.category,
            released_date: new Date(entry.header.released_date),
            updated_date: new Date(entry.header.updated_date),
            ...(entry.header.downloads ? { downloads: entry.header.downloads } : {}),
            ...(entry.header.link ? { link: entry.header.link } : {}),
        },
        ...(entry.privacy_policy ? { privacy_policy: true } : {}),
        page: {
            body: loadBody(entry.content),
        },
    };
}

/** Projects that have a privacy-policy page under /projects/{slug}/privacy-policy */
export function getProjectsWithPrivacyPolicy(): Project[] {
    return getProjects().filter((p) => p.privacy_policy);
}

/** Section title/description from the catalog root. */
export function getProjectCatalogMeta(): { title: string; description: string } {
    return {
        title: catalog.title,
        description: catalog.description,
    };
}

export function getProjects(): Project[] {
    return (catalog.data as ProjectCatalogEntry[]).map(toProject);
}

export function getProjectBySlug(slug: string): Project | undefined {
    return getProjects().find((p) => p.slug === slug);
}
