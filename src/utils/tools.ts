export type SiteTool = {
    slug: string;
    title: string;
    description: string;
    href: string;
};

/** Registry of private /tools — add new entries here as tools ship. */
export const siteTools: SiteTool[] = [
    {
        slug: "author",
        title: "Author",
        description:
            "Draft a blog or project body, then download Markdown and catalog JSON ready for src/content/.",
        href: "/tools/author",
    },
    {
        slug: "markdown",
        title: "Markdown preview",
        description:
            "Paste or open a .md file and preview the rendered HTML side by side.",
        href: "/tools/markdown",
    },
    {
        slug: "scramble-compare",
        title: "Scramble compare",
        description:
            "Hover bake-off: our scramble vs @scrambl/core, scramble-text, and scrmbl.",
        href: "/tools/scramble-compare",
    },
    {
        slug: "analytics-reach",
        title: "Reach stats",
        description:
            "Format GA4 uniques and views into footer.reach JSON for author-metadata.",
        href: "/tools/analytics-reach",
    },
];

export function getTool(slug: string): SiteTool | undefined {
    return siteTools.find((tool) => tool.slug === slug);
}
