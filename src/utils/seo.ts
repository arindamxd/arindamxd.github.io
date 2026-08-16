import author from "../content/author-metadata.json";
import blogsCatalog from "../content/blogs-metadata.json";
import projectsCatalog from "../content/projects-metadata.json";

const SITE = (author.canonical || "https://arindamxd.github.io/").replace(/\/$/, "");

/** Default share image pixel size (matches `public/assets/resources/og-image.png`). */
export const OG_IMAGE_WIDTH = 1010;
export const OG_IMAGE_HEIGHT = 620;
export const OG_IMAGE_TYPE = "image/png";

/** Absolute URL for a path or already-absolute href. */
export function absoluteUrl(pathOrUrl: string, site = SITE): string {
    if (!pathOrUrl) return `${site}/`;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${site}${path}`;
}

/** Canonical path with trailing slash for directory-style routes (GitHub Pages). */
export function canonicalFromPathname(pathname: string, site = SITE): string {
    if (!pathname || pathname === "/") return `${site}/`;
    const clean = pathname.replace(/\/+$/, "");
    return `${site}${clean}/`;
}

/** Keep meta descriptions in a useful length for SERPs. */
export function metaDescription(text: string, max = 160): string {
    const flat = text.replace(/\s+/g, " ").trim();
    if (flat.length <= max) return flat;
    const cut = flat.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function pageTitle(page: string, home = false): string {
    if (home) return `${author.name} — ${author.role} · ${author.subRole}`;
    return `${page} | ${author.name}`;
}

/** Home SERP snippet — bio already sits in the 160-char window. */
export function homeMetaDescription(): string {
    return metaDescription(author.bio);
}

export function twitterHandle(): string | undefined {
    const socials = [...author.intro.social, ...author.footer.social];
    const x = socials.find((s) => /(?:twitter|x)\.com\//i.test(s.url));
    const match = x?.url.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
    return match?.[1] ? `@${match[1]}` : undefined;
}

export function isoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export const PERSON_ID = `${SITE}/#person`;
export const WEBSITE_ID = `${SITE}/#website`;

/** MIME type for OG/Twitter images from a path or URL. */
export function imageMimeType(pathOrUrl: string): string {
    const path = pathOrUrl.split("?")[0]?.toLowerCase() ?? "";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
    if (path.endsWith(".webp")) return "image/webp";
    if (path.endsWith(".gif")) return "image/gif";
    if (path.endsWith(".svg")) return "image/svg+xml";
    if (path.endsWith(".avif")) return "image/avif";
    return OG_IMAGE_TYPE;
}

export function uniqueKeywords(
    ...groups: (string | string[] | undefined | null)[]
): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const group of groups) {
        const items = Array.isArray(group) ? group : group ? [group] : [];
        for (const raw of items) {
            const value = raw.trim();
            if (!value) continue;
            const key = value.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(value);
        }
    }
    return out;
}

/** Topic keywords from a project category string like "Productivity / Camera App". */
export function keywordsFromCategory(category: string): string[] {
    return uniqueKeywords(category.split(/[/,&]+/).map((part) => part.trim()));
}

function schemaSoftwareCategory(category: string): string {
    const c = category.toLowerCase();
    if (c.includes("camera") || c.includes("photo")) return "MultimediaApplication";
    if (c.includes("security")) return "SecurityApplication";
    if (c.includes("productiv")) return "BusinessApplication";
    return "MobileApplication";
}

export function personJsonLd(): Record<string, unknown> {
    const sameAs = [
        ...author.intro.social.map((s) => s.url),
        ...author.footer.social.map((s) => s.url),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": PERSON_ID,
        name: author.name,
        url: `${SITE}/`,
        email: author.email,
        jobTitle: `${author.role}, ${author.subRole}`,
        description: author.bio,
        image: {
            "@type": "ImageObject",
            url: absoluteUrl(author.intro.avatar),
        },
        address: {
            "@type": "PostalAddress",
            addressCountry: author.location,
        },
        knowsAbout: [
            "Mobile engineering",
            "Android",
            "iOS",
            "Flutter",
            "Kotlin",
            "Swift",
            "UPI",
            "QR scanning",
            "Application security",
            "RASP",
        ],
        knowsLanguage: ["en"],
        sameAs,
    };
}

export function websiteJsonLd(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: author.name,
        url: `${SITE}/`,
        inLanguage: "en-US",
        description: author.intro.subTitle,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
    };
}

export function profilePageJsonLd(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": `${SITE}/#profile`,
        url: `${SITE}/`,
        name: pageTitle(author.name, true),
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        mainEntity: { "@id": PERSON_ID },
    };
}

export type Breadcrumb = { name: string; path: string };

export function breadcrumbJsonLd(
    crumbs: Breadcrumb[],
    id?: string,
): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        ...(id ? { "@id": id } : {}),
        itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: canonicalFromPathname(crumb.path),
        })),
    };
}

export function collectionPageJsonLd(opts: {
    name: string;
    path: string;
    description: string;
    items: { name: string; path: string }[];
    extraType?: string;
}): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": opts.extraType ? [opts.extraType, "CollectionPage"] : "CollectionPage",
        name: opts.name,
        url: canonicalFromPathname(opts.path),
        description: opts.description,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": PERSON_ID },
        mainEntity: {
            "@type": "ItemList",
            itemListElement: opts.items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                url: canonicalFromPathname(item.path),
            })),
        },
    };
}

function ymd(value: string): string {
    return value.slice(0, 10);
}

/** Pathname (trailing slash) → YYYY-MM-DD for sitemap lastmod. */
export function sitemapLastmodByPath(): Map<string, string> {
    const map = new Map<string, string>();
    const blogDates = blogsCatalog.data.map((b) => ymd(b.date));
    const projectDates = projectsCatalog.data.map((p) => ymd(p.header.updated_date));

    for (const blog of blogsCatalog.data) {
        map.set(`/blogs/${blog.slug}/`, ymd(blog.date));
    }
    for (const project of projectsCatalog.data) {
        const updated = ymd(project.header.updated_date);
        map.set(`/projects/${project.slug}/`, updated);
        if (project.privacy_policy) {
            map.set(`/projects/${project.slug}/privacy-policy/`, updated);
        }
    }

    const latestBlog = blogDates.reduce((a, b) => (a > b ? a : b), "");
    const latestProject = projectDates.reduce((a, b) => (a > b ? a : b), "");
    if (latestBlog) {
        map.set("/blogs/", latestBlog);
        map.set("/rss.xml", latestBlog);
    }
    if (latestProject) map.set("/projects/", latestProject);

    const home = [latestBlog, latestProject].filter(Boolean).reduce((a, b) => (a > b ? a : b), "");
    if (home) map.set("/", home);

    return map;
}

export function webPageJsonLd(opts: {
    name: string;
    path: string;
    description: string;
    image?: string;
    datePublished?: string;
    dateModified?: string;
    keywords?: string[];
    mainEntityId?: string;
    breadcrumbId?: string;
}): Record<string, unknown> {
    const url = canonicalFromPathname(opts.path);
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": url,
        url,
        name: opts.name,
        description: opts.description,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        ...(opts.image
            ? {
                  primaryImageOfPage: {
                      "@type": "ImageObject",
                      url: absoluteUrl(opts.image),
                  },
              }
            : {}),
        ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
        ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
        ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
        ...(opts.breadcrumbId ? { breadcrumb: { "@id": opts.breadcrumbId } } : {}),
        ...(opts.mainEntityId ? { mainEntity: { "@id": opts.mainEntityId } } : {}),
        author: { "@id": PERSON_ID },
    };
}

export function blogPostingJsonLd(opts: {
    title: string;
    description: string;
    path: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    wordCount?: number;
    keywords?: string[];
    section?: string;
}): Record<string, unknown> {
    const url = canonicalFromPathname(opts.path);
    const modified = opts.dateModified || opts.datePublished;
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: opts.title,
        name: opts.title,
        description: opts.description,
        image: {
            "@type": "ImageObject",
            url: absoluteUrl(opts.image),
        },
        datePublished: opts.datePublished,
        dateModified: modified,
        inLanguage: "en-US",
        url,
        ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
        ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
        ...(opts.section ? { articleSection: opts.section } : {}),
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
        isPartOf: {
            "@type": "Blog",
            name: opts.section || "Blog",
            url: canonicalFromPathname("/blogs/"),
        },
    };
}

export function softwareApplicationJsonLd(opts: {
    name: string;
    description: string;
    path: string;
    image: string;
    thumb?: string;
    category: string;
    datePublished: string;
    dateModified: string;
    installUrl?: string;
    sourceCode?: string;
    featureList?: string[];
    keywords?: string[];
}): Record<string, unknown> {
    const pageUrl = canonicalFromPathname(opts.path);
    const images = uniqueKeywords(opts.image, opts.thumb).map((src) => ({
        "@type": "ImageObject",
        url: absoluteUrl(src),
    }));
    const sameAs = uniqueKeywords(opts.installUrl, opts.sourceCode);

    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#app`,
        name: opts.name,
        description: opts.description,
        image: images.length === 1 ? images[0] : images,
        screenshot: {
            "@type": "ImageObject",
            url: absoluteUrl(opts.image),
        },
        applicationCategory: schemaSoftwareCategory(opts.category),
        applicationSubCategory: opts.category,
        operatingSystem: "Android",
        inLanguage: "en-US",
        url: pageUrl,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        datePublished: opts.datePublished,
        dateModified: opts.dateModified,
        ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
        ...(opts.featureList?.length ? { featureList: opts.featureList } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(opts.installUrl
            ? {
                  installUrl: opts.installUrl,
                  downloadUrl: opts.installUrl,
                  offers: {
                      "@type": "Offer",
                      price: "0",
                      priceCurrency: "USD",
                      availability: "https://schema.org/InStock",
                      url: opts.installUrl,
                  },
              }
            : {}),
    };
}

export function sitemapFilter(page: string): boolean {
    try {
        const path = new URL(page).pathname;
        return !path.includes("/tools") && !path.includes("/design") && !path.includes("/apps/");
    } catch {
        return !page.includes("/tools") && !page.includes("/design") && !page.includes("/apps/");
    }
}

export const defaultOgImage = absoluteUrl(author.ogImage);
export const siteOrigin = SITE;
export { author as siteAuthor };
