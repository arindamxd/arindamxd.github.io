import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Read a project-relative Markdown file and return GFM HTML. */
export function renderMarkdownDoc(src: string): string {
    const absolute = path.isAbsolute(src) ? src : path.join(process.cwd(), src);
    const md = fs.readFileSync(absolute, "utf-8");
    return marked.parse(md) as string;
}
