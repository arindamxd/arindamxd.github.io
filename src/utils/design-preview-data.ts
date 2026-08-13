/**
 * Dummy content for `/design` gallery when sections render with `preview`.
 * Same shapes as live JSON — texts only differ.
 */

import type { Blog } from "../types/blog";
import type { Project } from "../types/project";

/** Gallery-only media — no live project/blog/testimonial assets. */
const previewMedia = {
    /** Nav-demo / screenshot gradient shell (theme tokens via CSS on this src). */
    media: "/assets/resources/design-media-placeholder.svg",
    /** White logo mark for project thumbs on colored `thumb_bg_color`. */
    logo: "/assets/resources/design-logo-placeholder.svg",
} as const;

export const previewAuthor = {
    name: "Alex Rivera",
    role: "Product Designer",
    subRole: "Mobile · Systems",
    bio: "Dummy bio for the design gallery — not live site content.",
    email: "hello@example.com",
    canonical: "https://example.com/",
    ogImage: "/assets/resources/og-image.png",
    location: "India",
    intro: {
        avatar: previewMedia.media,
        title: "Building products with care.",
        subTitle: "Short support line under the slogan — calm, precise craft.",
        social: [
            {
                name: "GitHub",
                url: "#",
                icon: "/assets/socials/github.svg",
            },
            {
                name: "LinkedIn",
                url: "#",
                icon: "/assets/socials/linkedin.svg",
            },
            {
                name: "X",
                url: "#",
                icon: "/assets/socials/x.svg",
            },
        ],
        resumeURL: "#",
        cardLinkText: "Portfolio",
        cardLinkURL: "#",
    },
    footer: {
        avatar: previewMedia.media,
        title: "Let’s talk",
        description: "Dummy support under the footer heading — keep it short.",
        social: [
            {
                name: "X",
                url: "#",
                icon: "/assets/socials/x.svg",
            },
            {
                name: "LinkedIn",
                url: "#",
                icon: "/assets/socials/linkedin.svg",
            },
            {
                name: "GitHub",
                url: "#",
                icon: "/assets/socials/github.svg",
            },
        ],
        reach: {
            uniques: "12.4K",
            views: "48.2K",
            period: "month" as const,
            label: "UNIQUE · VIEWS / MONTH",
        },
    },
} as const;

export const previewExperiences = {
    title: "Experience",
    description: "Mid-header between timeline and employment rows.",
    data: [
        {
            title: "Technical Lead",
            company: "Example Co.",
            start: "2022-01",
            end: "-",
        },
        {
            title: "Senior Engineer",
            company: "Studio North",
            start: "2019-06",
            end: "2021-12",
        },
        {
            title: "Product Designer",
            company: "Launch Lab",
            start: "2017-10",
            end: "2019-05",
        },
        {
            title: "Design Intern",
            company: "First Desk",
            start: "2016-06",
            end: "2017-09",
        },
    ],
} as const;

/** Fixed YoE for gallery so count stays stable. */
export const previewYearsOfExperience = 8;

export const previewCredentials = {
    title: "Credentials",
    description: "Dummy groups for the gallery accordion.",
    groups: [
        {
            title: "Certifications",
            items: [
                {
                    title: "Credential title",
                    org: "Organization",
                    url: "#",
                },
                {
                    title: "Another credential",
                    org: "Issuer Name",
                },
            ],
        },
        {
            title: "Awards",
            items: [
                {
                    title: "Sample award",
                    org: "Conference",
                },
            ],
        },
    ],
} as const;

export const previewTestimonials = {
    title: "What People Say",
    description: "Dummy quotes for the gallery phone — not live testimonials.",
    data: [
        {
            text: "Clear communication and craft — shipped on time, every time.",
            author: "Jordan Lee",
            position: "Product Lead, Sample Co.",
            background: previewMedia.media,
        },
        {
            text: "Reliable partner on systems work and design polish. Would collaborate again.",
            author: "Sam Ortiz",
            position: "Engineering Manager, North Lab",
            background: previewMedia.media,
        },
        {
            text: "Calm execution under pressure — the flows always felt intentional.",
            author: "Riley Chen",
            position: "Founder, Launch Desk",
            background: previewMedia.media,
        },
    ],
} as const;

export const previewProjectCatalogMeta = {
    title: "Projects",
    description: "Dummy catalog intro for the gallery list.",
};

export const previewProjects: Project[] = [
    {
        slug: "sample-app",
        title: "Sample App",
        desc: {
            short: "Dummy project card — short description for the list.",
            long: "Longer dummy description under the project hero — calm, precise craft for the gallery.",
        },
        images: {
            thumb: previewMedia.logo,
            thumb_bg_color: "rgb(42, 41, 255)",
            banner: previewMedia.media,
        },
        header: {
            organization: "Example Co.",
            category: "Mobile / Tools",
            released_date: new Date("2024-01-15"),
            updated_date: new Date("2026-03-01"),
            downloads: "10K+",
            link: "#",
        },
        page: {
            body: [
                {
                    type: "content",
                    title: "Overview",
                    description:
                        "Dummy body section — heading + support paragraph matching project detail rhythm.",
                },
                {
                    type: "images-pair",
                    left: { src: previewMedia.media, alt: "" },
                    right: { src: previewMedia.media, alt: "" },
                },
                {
                    type: "image-large",
                    image: { src: previewMedia.media, alt: "" },
                },
                {
                    type: "images-pair-then-large",
                    left: { src: previewMedia.media, alt: "" },
                    right: { src: previewMedia.media, alt: "" },
                    large: { src: previewMedia.media, alt: "" },
                },
            ],
        },
        source_code: "#",
        privacy_policy: true,
    },
    {
        slug: "north-studio",
        title: "North Studio",
        desc: {
            short: "Second dummy card for the home limit + View all pattern.",
            long: "Another long description for gallery completeness.",
        },
        images: {
            thumb: previewMedia.logo,
            thumb_bg_color: "rgb(58, 58, 58)",
            banner: previewMedia.media,
        },
        header: {
            organization: "Studio North",
            category: "Design System",
            released_date: new Date("2023-06-01"),
            updated_date: new Date("2025-11-12"),
            link: "#",
        },
        page: { body: [] },
        source_code: "#",
    },
    {
        slug: "launch-lab",
        title: "Launch Lab",
        desc: {
            short: "Third dummy project so View all appears with home + limit.",
            long: "Unused on the limited list — still counted for View all.",
        },
        images: {
            thumb: previewMedia.logo,
            thumb_bg_color: "rgb(224, 122, 106)",
            banner: previewMedia.media,
        },
        header: {
            organization: "Launch Lab",
            category: "Prototype",
            released_date: new Date("2022-03-01"),
            updated_date: new Date("2024-08-01"),
        },
        page: { body: [] },
    },
];

export const previewProjectDetail = previewProjects[0]!;


export const previewPrivacyFrontmatter = {
    title: "Privacy Policy",
    app: "Sample App",
    lastUpdated: "1 Jan 2024",
    contact: "hello@example.com",
};

export const previewBlogCatalogMeta = {
    title: "Articles",
    description: "Dummy catalog intro for the gallery blog list.",
};

export const previewBlogs: Blog[] = [
    {
        slug: "sample-article",
        title: "Article title goes here",
        thumb: previewMedia.media,
        author: {
            name: "Alex Rivera",
            avatar: previewMedia.media,
        },
        date: new Date("2024-03-29"),
        page: {
            intro: {
                title: "Intro lead",
                paragraph: "Supporting intro paragraph under the hairline.",
                banner: previewMedia.media,
            },
            body: [
                { type: "title", text: "Section heading" },
                { type: "subtitle", text: "Subheading" },
                {
                    type: "paragraph",
                    text: "Body paragraph at /50. Rhythm: ~52px before titles, ~24px peers, ~20px under heading.",
                },
                {
                    type: "bullets",
                    style: "disc",
                    items: [
                        "Plain disc item",
                        { label: "Label", text: "labeled bullet from MD" },
                    ],
                },
                {
                    type: "bullets",
                    style: "number",
                    items: ["Numbered step one", "Numbered step two"],
                },
                {
                    type: "code",
                    language: "ts",
                    code: `const greeting = "Hello gallery";\nconsole.log(greeting);`,
                },
            ],
        },
    },
    {
        slug: "second-article",
        title: "Second dummy article for the list shell",
        thumb: previewMedia.media,
        author: {
            name: "Alex Rivera",
            avatar: previewMedia.media,
        },
        date: new Date("2024-02-12"),
        page: {
            intro: {
                title: "Intro",
                paragraph: "Unused detail body in list preview.",
                banner: previewMedia.media,
            },
            body: [],
        },
    },
    {
        slug: "third-article",
        title: "Third dummy article",
        thumb: previewMedia.media,
        author: {
            name: "Alex Rivera",
            avatar: previewMedia.media,
        },
        date: new Date("2023-11-08"),
        page: {
            intro: {
                title: "Intro",
                paragraph: "Unused.",
                banner: previewMedia.media,
            },
            body: [],
        },
    },
    {
        slug: "fourth-article",
        title: "Fourth dummy article for View all",
        thumb: previewMedia.media,
        author: {
            name: "Alex Rivera",
            avatar: previewMedia.media,
        },
        date: new Date("2023-08-01"),
        page: {
            intro: {
                title: "Intro",
                paragraph: "Unused.",
                banner: previewMedia.media,
            },
            body: [],
        },
    },
];

export const previewBlogDetail = previewBlogs[0]!;

export const previewSkills = {
    title: "Powered By",
    description: "Dummy stack for the gallery — not live site skills.",
    tech: {
        stack: [
            {
                icon: "/assets/skills/kotlin.svg",
                label: "Kotlin",
                description: "Dummy chip tooltip for the gallery.",
            },
            {
                icon: "/assets/skills/swift.svg",
                label: "Swift",
                description: "Dummy chip tooltip for the gallery.",
            },
            {
                icon: "/assets/skills/flutter.svg",
                label: "Flutter",
                description: "Dummy chip tooltip for the gallery.",
            },
            {
                icon: "/assets/skills/qr.svg",
                label: "Scanner",
                description: "Dummy chip tooltip for the gallery.",
            },
        ],
        tools: [
            {
                icon: "/assets/skills/cursor.svg",
                label: "Cursor",
                description: "Dummy tool chip for the gallery.",
            },
            {
                icon: "/assets/skills/claude-code.svg",
                label: "Claude Code",
                description: "Dummy tool chip for the gallery.",
            },
            {
                icon: "/assets/skills/gitkraken.svg",
                label: "GitKraken",
                description: "Dummy tool chip for the gallery.",
            },
            {
                icon: "/assets/skills/vs-code.svg",
                label: "Editor",
                description: "Dummy tool chip for the gallery.",
            },
        ],
    },
} as const;

export const previewBrands = {
    title: "Proudly worked/working with",
    logos: [
        previewMedia.logo,
        previewMedia.logo,
        previewMedia.logo,
        previewMedia.logo,
        previewMedia.logo,
        previewMedia.logo,
    ],
} as const;

export const previewContributionsMeta = {
    title: "Contributions",
    description: "Dummy GitHub activity for the gallery — not live data.",
    usernames: ["preview"],
} as const;

/** Stable last-8-months contribution days for gallery (no network). */
export function previewContributionDays(): {
    date: string;
    count: number;
    level: number;
}[] {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - 8);

    const days: { date: string; count: number; level: number }[] = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const seed = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
        const count = seed % 7 === 0 ? 0 : (seed % 12);
        const level =
            count <= 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4;
        days.push({
            date: d.toISOString().slice(0, 10),
            count,
            level,
        });
    }
    return days;
}
