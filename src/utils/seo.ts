import author from "../content/author-metadata.json";

const SITE = (author.canonical || "https://arindamxd.github.io/").replace(/\/$/, "");

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

export const defaultOgImage = absoluteUrl(author.ogImage);
export const siteOrigin = SITE;
export { author as siteAuthor };
