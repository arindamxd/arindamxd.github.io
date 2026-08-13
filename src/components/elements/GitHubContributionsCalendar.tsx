import { useDeferredValue, useEffect, useState, useSyncExternalStore } from "react";
import { ActivityCalendar, type Activity, type ThemeInput } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";

const THEME: ThemeInput = {
    light: ["#efefef", "#c5c4ff", "#8a89ff", "#5554ff", "#2a29ff"],
    dark: ["#2a2a2a", "#3a3999", "#4a49cc", "#3a39e6", "#2a29ff"],
};

type Scheme = "light" | "dark";

function readScheme(): Scheme {
    if (typeof document === "undefined") return "dark";
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeScheme(onStoreChange: () => void): () => void {
    window.addEventListener("themechange", onStoreChange);
    window.addEventListener("storage", onStoreChange);
    window.addEventListener("pageshow", onStoreChange);

    return () => {
        window.removeEventListener("themechange", onStoreChange);
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("pageshow", onStoreChange);
    };
}

type Props = {
    username: string;
    contributions: Activity[];
    totalCount?: number;
};

/**
 * Mounted via `client:visible` so returning home does not hydrate React on the
 * swap frame. Before ClientRouter swaps we unmount ActivityCalendar so its
 * head `<style>` cleanup can `removeChild` while still under `document.head`.
 */
export default function GitHubContributionsCalendar({
    username,
    contributions,
    totalCount,
}: Props) {
    const [alive, setAlive] = useState(true);
    const [mounted, setMounted] = useState(false);
    const colorScheme = useSyncExternalStore<Scheme>(
        subscribeScheme,
        readScheme,
        (): Scheme => "dark",
    );
    // Paint html.dark immediately; rebuild the heatmap when the main thread is free
    const calendarScheme = useDeferredValue(colorScheme);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const tearDown = () => setAlive(false);
        const revive = () => setAlive(true);
        document.addEventListener("astro:before-preparation", tearDown);
        document.addEventListener("astro:before-swap", tearDown);
        // Same island can survive cancelled nav / soft remounts — revive on settle
        document.addEventListener("astro:page-load", revive);

        return () => {
            document.removeEventListener("astro:before-preparation", tearDown);
            document.removeEventListener("astro:before-swap", tearDown);
            document.removeEventListener("astro:page-load", revive);
        };
    }, []);

    if (!contributions.length) {
        return (
            <p className="m-0 p-0 text-center font-manrope text-[14px] font-semibold tracking-[-0.04em] text-text/50">
                Contribution data unavailable right now.
            </p>
        );
    }

    const count =
        typeof totalCount === "number"
            ? totalCount
            : contributions.reduce((sum, day) => sum + day.count, 0);

    return (
        <div
            className="github-contributions-calendar w-full"
            aria-label={`${username} GitHub contributions`}
        >
            {alive && mounted ? (
                <ActivityCalendar
                    data={contributions}
                    colorScheme={calendarScheme}
                    theme={THEME}
                    fontSize={11}
                    blockSize={8}
                    blockMargin={2}
                    maxLevel={4}
                    labels={{
                        totalCount: `${count} contributions in the last 8 months`,
                    }}
                    tooltips={{
                        activity: {
                            text: ({ count: dayCount, date }) => {
                                const when = new Date(`${date}T12:00:00`).toLocaleDateString(
                                    undefined,
                                    {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    },
                                );
                                const noun = dayCount === 1 ? "contribution" : "contributions";
                                return `${dayCount} ${noun} on ${when}`;
                            },
                            placement: "top",
                            withArrow: true,
                        },
                    }}
                />
            ) : (
                <div
                    className="w-full min-h-[132px] rounded-[14px] bg-surface"
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
