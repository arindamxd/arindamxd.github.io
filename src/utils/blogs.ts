import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";
import type {
    Code,
    Heading,
    List,
    ListItem,
    Paragraph,
    PhrasingContent,
    Root,
    RootContent,
} from "mdast";
import type {
    Blog,
    BlogBodyBlock,
    BlogBullet,
    BlogCatalogEntry,
} from "../types/blog";
import catalog from "../content/blogs-metadata.json";

const mdModules = import.meta.glob("../content/blogs/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

function resolveMdRaw(contentPath: string): string {
    if (!contentPath) {
        throw new Error("Blog catalog entry is missing content path");
    }
    const fileName = contentPath.replace(/^.*\//, "");
    const key = Object.keys(mdModules).find((k) => k.endsWith(`/${fileName}`));
    if (!key) {
        throw new Error(`Blog markdown not found for content path: ${contentPath}`);
    }
    return mdModules[key];
}

/** Minimal YAML frontmatter for flat string keys (quoted or bare). */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
        return { data: {}, body: raw };
    }

    const data: Record<string, string> = {};
    for (const line of match[1].split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const colon = trimmed.indexOf(":");
        if (colon === -1) continue;
        const key = trimmed.slice(0, colon).trim();
        let value = trimmed.slice(colon + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        data[key] = value;
    }

    return { data, body: match[2] };
}

function phrasingNodeToString(node: PhrasingContent): string {
    switch (node.type) {
        case "inlineCode":
            return `\`${node.value.replace(/`/g, "")}\``;
        case "text":
            return node.value;
        case "break":
            return "\n";
        case "strong":
        case "emphasis":
        case "delete":
        case "link":
        case "linkReference":
            return phrasingToString(node.children);
        default:
            return toString(node);
    }
}

function phrasingToString(nodes: PhrasingContent[] | undefined): string {
    if (!nodes?.length) return "";
    return nodes.map(phrasingNodeToString).join("");
}

function phrasingText(nodes: PhrasingContent[] | undefined): string {
    return phrasingToString(nodes).trim();
}

function parseLabeledBullet(children: PhrasingContent[]): BlogBullet {
    if (
        children.length >= 2 &&
        children[0]?.type === "strong" &&
        children[1]?.type === "text"
    ) {
        const label = phrasingText(children[0].children);
        const rest = children.slice(1).map(phrasingNodeToString).join("");
        const colonMatch = rest.match(/^:\s*(.*)$/s);
        if (label && colonMatch) {
            return { label, text: colonMatch[1].trim() };
        }
    }
    return phrasingText(children);
}

function listItemToBullet(item: ListItem): BlogBullet {
    const first = item.children.find((c) => c.type === "paragraph") as
        | Paragraph
        | undefined;
    if (!first) return phrasingText([]);
    return parseLabeledBullet(first.children);
}

function listToBlock(list: List): BlogBodyBlock {
    return {
        type: "bullets",
        style: list.ordered ? "number" : "disc",
        items: list.children.map(listItemToBullet),
    };
}

function headingToBlock(heading: Heading): BlogBodyBlock | null {
    const text = phrasingText(heading.children);
    if (!text) return null;
    if (heading.depth <= 2) return { type: "title", text };
    return { type: "subtitle", text };
}

function codeToBlock(code: Code): BlogBodyBlock {
    return {
        type: "code",
        code: code.value.replace(/^\n+/, "").replace(/\n+$/, ""),
        ...(code.lang ? { language: code.lang } : {}),
    };
}

function mdastToBody(root: Root): BlogBodyBlock[] {
    const blocks: BlogBodyBlock[] = [];

    for (const node of root.children as RootContent[]) {
        if (node.type === "heading") {
            const block = headingToBlock(node);
            if (block) blocks.push(block);
            continue;
        }
        if (node.type === "paragraph") {
            const text = phrasingText(node.children);
            if (text) blocks.push({ type: "paragraph", text });
            continue;
        }
        if (node.type === "list") {
            blocks.push(listToBlock(node));
            continue;
        }
        if (node.type === "code") {
            blocks.push(codeToBlock(node));
        }
    }

    return blocks;
}

function parseBlogMarkdown(raw: string): Blog["page"] {
    const { data, body } = parseFrontmatter(raw);
    const title = data.title?.trim();
    const description = data.description?.trim();
    const banner = data.banner?.trim();

    if (!title || !description || !banner) {
        throw new Error(
            "Blog markdown frontmatter requires title, description, and banner",
        );
    }

    const tree = unified().use(remarkParse).parse(body) as Root;

    return {
        intro: {
            title,
            paragraph: description,
            banner,
        },
        body: mdastToBody(tree),
    };
}

function loadPage(contentPath: string): Blog["page"] {
    return parseBlogMarkdown(resolveMdRaw(contentPath));
}

function toBlog(entry: BlogCatalogEntry): Blog {
    return {
        slug: entry.slug,
        title: entry.title,
        thumb: entry.thumb,
        author: entry.author,
        date: new Date(entry.date),
        page: loadPage(entry.content || `blogs/${entry.slug}.md`),
        ...(entry.tags?.length ? { tags: entry.tags } : {}),
    };
}

/** Word count of title + intro + body (for BlogPosting JSON-LD). */
export function blogWordCount(blog: Blog): number {
    const chunks: string[] = [
        blog.title,
        blog.page.intro.title,
        blog.page.intro.paragraph,
    ];
    for (const block of blog.page.body) {
        switch (block.type) {
            case "title":
            case "subtitle":
            case "paragraph":
                chunks.push(block.text);
                break;
            case "code":
                chunks.push(block.code);
                break;
            case "bullets":
                for (const item of block.items) {
                    chunks.push(
                        typeof item === "string"
                            ? item
                            : `${item.label} ${item.text}`,
                    );
                }
                break;
        }
    }
    return chunks.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

/** Section title/description from the catalog root. */
export function getBlogCatalogMeta(): { title: string; description: string } {
    return {
        title: catalog.title,
        description: catalog.description,
    };
}

export function getBlogs(): Blog[] {
    return (catalog.data as BlogCatalogEntry[])
        .map(toBlog)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getBlogBySlug(slug: string): Blog | undefined {
    return getBlogs().find((b) => b.slug === slug);
}
