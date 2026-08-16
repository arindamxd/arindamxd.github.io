import { getBlogCatalogMeta, getBlogs } from "../utils/blogs";
import { absoluteUrl, canonicalFromPathname, siteAuthor } from "../utils/seo";

export const prerender = true;

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function rfc822(date: Date): string {
    return date.toUTCString();
}

export function GET(): Response {
    const catalog = getBlogCatalogMeta();
    const blogs = getBlogs();
    const feedUrl = absoluteUrl("/rss.xml");
    const blogsUrl = canonicalFromPathname("/blogs/");

    const items = blogs
        .slice()
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((blog) => {
            const link = canonicalFromPathname(`/blogs/${blog.slug}/`);
            const description = xmlEscape(blog.page.intro.paragraph);
            return `    <item>
      <title>${xmlEscape(blog.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${rfc822(blog.date)}</pubDate>
      <description>${description}</description>
    </item>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${siteAuthor.name} — ${catalog.title}`)}</title>
    <link>${xmlEscape(blogsUrl)}</link>
    <description>${xmlEscape(catalog.description)}</description>
    <language>en-us</language>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
