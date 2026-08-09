import { useEffect, useState } from "react";
import { ActivityCalendar, type Activity, type ThemeInput } from "react-activity-calendar";

const THEME: ThemeInput = {
    light: ["#efefef", "#c5c4ff", "#8a89ff", "#5554ff", "#2a29ff"],
    dark: ["#2a2a2a", "#3a3999", "#4a49cc", "#3a39e6", "#2a29ff"],
};

function readScheme(): "light" | "dark" {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

type Props = {
    username: string;
    contributions: Activity[];
    totalCount?: number;
};

export default function GitHubContributionsCalendar({
    username,
    contributions,
    totalCount,
}: Props) {
    const [colorScheme, setColorScheme] = useState<"light" | "dark">(readScheme);

    useEffect(() => {
        const sync = () => setColorScheme(readScheme());
        sync();

        const root = document.documentElement;
        const observer = new MutationObserver(sync);
        observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

        return () => observer.disconnect();
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
            <ActivityCalendar
                data={contributions}
                colorScheme={colorScheme}
                theme={THEME}
                fontSize={11}
                blockSize={8}
                blockMargin={2}
                maxLevel={4}
                labels={{
                    totalCount: `${count} contributions in the last year`,
                }}
            />
        </div>
    );
}
