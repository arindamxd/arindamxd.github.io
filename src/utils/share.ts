import { twitterHandle } from "./seo";

export type ShareNetwork = "bluesky" | "facebook" | "linkedin" | "threads" | "x";

export const SHARE_NETWORKS: { id: ShareNetwork; label: string; icon: string }[] = [
    { id: "bluesky", label: "Share on Bluesky", icon: "share-bluesky" },
    { id: "facebook", label: "Share on Facebook", icon: "share-facebook" },
    { id: "linkedin", label: "Share on LinkedIn", icon: "share-linkedin" },
    { id: "threads", label: "Share on Threads", icon: "share-threads" },
    { id: "x", label: "Share on X", icon: "share-x" },
];

/** Outbound share intents. */
export function shareIntentUrls(opts: {
    url: string;
    title: string;
    text?: string;
}): Record<ShareNetwork, string> {
    const text = (opts.text || opts.title).trim() || opts.title;
    const composed = `${text} ${opts.url}`.trim();

    const x = new URL("https://x.com/intent/tweet");
    x.searchParams.set("url", opts.url);
    x.searchParams.set("text", text);
    const via = twitterHandle()?.replace(/^@/, "");
    if (via) x.searchParams.set("via", via);

    const linkedin = new URL("https://www.linkedin.com/sharing/share-offsite/");
    linkedin.searchParams.set("url", opts.url);

    const facebook = new URL("https://www.facebook.com/sharer/sharer.php");
    facebook.searchParams.set("u", opts.url);

    const bluesky = new URL("https://bsky.app/intent/compose");
    bluesky.searchParams.set("text", composed);

    const threads = new URL("https://www.threads.net/intent/post");
    threads.searchParams.set("text", composed);

    return {
        bluesky: bluesky.toString(),
        facebook: facebook.toString(),
        linkedin: linkedin.toString(),
        threads: threads.toString(),
        x: x.toString(),
    };
}
