import {
    useDeferredValue,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { ActivityCalendar, type Activity, type ThemeInput } from "react-activity-calendar";

const THEME: ThemeInput = {
    light: ["#efefef", "#c5c4ff", "#8a89ff", "#5554ff", "#2a29ff"],
    dark: ["#2a2a2a", "#3a3999", "#4a49cc", "#3a39e6", "#2a29ff"],
};

type Scheme = "light" | "dark";
type Placement = "top" | "left" | "right";

type Tip = {
    date: string;
    text: string;
    placement: Placement;
    cell: SVGRectElement;
};

const GAP = 8;
const VIEW_PAD = 8;
const ARROW_INSET = 10;
/**
 * SVG rect size + gap. Same on all viewports — the calendar SVG scales to column
 * width, so this margin/size ratio (1:3) is what you see on desktop and mobile.
 */
const BLOCK = { size: 12, margin: 4 };

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

function isTouchUi(): boolean {
    return window.matchMedia("(hover: none)").matches;
}

function weekPlacement(cell: SVGRectElement): Placement {
    const week = cell.parentElement;
    if (!(week instanceof SVGGElement)) return "top";
    const svg = week.parentElement;
    if (!svg) return "top";
    const weeks = [...svg.children].filter(
        (el): el is SVGGElement =>
            el instanceof SVGGElement && el.querySelector("rect[data-date]") !== null,
    );
    const index = weeks.indexOf(week);
    if (index === 0) return "right";
    if (index === weeks.length - 1) return "left";
    return "top";
}

function tooltipText(activity: Activity): string {
    const when = new Date(`${activity.date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const noun = activity.count === 1 ? "contribution" : "contributions";
    return `${activity.count} ${noun} on ${when}`;
}

function placeTooltip(tip: HTMLElement, cell: DOMRect, placement: Placement): void {
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    if (tw <= 0 || th <= 0) return;

    const cx = cell.left + cell.width / 2;
    const cy = cell.top + cell.height / 2;

    let left = cx - tw / 2;
    let top = cell.top - GAP - th;
    if (placement === "right") {
        left = cell.right + GAP;
        top = cy - th / 2;
    } else if (placement === "left") {
        left = cell.left - GAP - tw;
        top = cy - th / 2;
    }

    const clampedLeft = Math.min(window.innerWidth - VIEW_PAD - tw, Math.max(VIEW_PAD, left));
    const clampedTop = Math.min(window.innerHeight - VIEW_PAD - th, Math.max(VIEW_PAD, top));

    let arrowX = tw / 2;
    let arrowY = th / 2;
    if (placement === "top") {
        arrowX = Math.min(tw - ARROW_INSET, Math.max(ARROW_INSET, cx - clampedLeft));
    } else {
        arrowY = Math.min(th - ARROW_INSET, Math.max(ARROW_INSET, cy - clampedTop));
    }

    tip.style.left = `${clampedLeft}px`;
    tip.style.top = `${clampedTop}px`;
    tip.style.setProperty("--arrow-x", `${arrowX}px`);
    tip.style.setProperty("--arrow-y", `${arrowY}px`);
}

function cellFromEvent(target: EventTarget | null): SVGRectElement | null {
    if (!(target instanceof Element)) return null;
    const rect = target.closest("rect[data-date]");
    return rect instanceof SVGRectElement ? rect : null;
}

type Props = {
    username: string;
    contributions: Activity[];
};

/**
 * Mounted via `client:visible` so returning home does not hydrate React on the
 * swap frame. Before ClientRouter swaps we unmount ActivityCalendar so its
 * head `<style>` cleanup can `removeChild` while still under `document.head`.
 */
export default function GitHubContributionsCalendar({ username, contributions }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const [alive, setAlive] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [tip, setTip] = useState<Tip | null>(null);
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
        const tearDown = () => {
            setTip(null);
            setAlive(false);
        };
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

    useEffect(() => {
        const root = rootRef.current;
        if (!root || !alive || !mounted) return;

        const byDate = new Map(contributions.map((day) => [day.date, day]));

        const open = (cell: SVGRectElement) => {
            const date = cell.getAttribute("data-date");
            if (!date) return;
            const activity = byDate.get(date);
            if (!activity) return;
            setTip((current) => {
                if (current?.date === date) return isTouchUi() ? null : current;
                return {
                    date,
                    text: tooltipText(activity),
                    placement: weekPlacement(cell),
                    cell,
                };
            });
        };

        const close = () => setTip(null);

        const onPointerOver = (event: PointerEvent) => {
            if (isTouchUi()) return;
            const cell = cellFromEvent(event.target);
            if (cell) open(cell);
        };

        const onPointerLeave = () => {
            if (!isTouchUi()) close();
        };

        const onClick = (event: MouseEvent) => {
            if (!isTouchUi()) return;
            const cell = cellFromEvent(event.target);
            if (cell) open(cell);
            else close();
        };

        const onDocPointerDown = (event: PointerEvent) => {
            if (!isTouchUi()) return;
            if (event.target instanceof Node && root.contains(event.target)) return;
            close();
        };

        root.addEventListener("pointerover", onPointerOver);
        root.addEventListener("pointerleave", onPointerLeave);
        root.addEventListener("click", onClick);
        document.addEventListener("pointerdown", onDocPointerDown, true);

        return () => {
            root.removeEventListener("pointerover", onPointerOver);
            root.removeEventListener("pointerleave", onPointerLeave);
            root.removeEventListener("click", onClick);
            document.removeEventListener("pointerdown", onDocPointerDown, true);
        };
    }, [alive, mounted, contributions]);

    useLayoutEffect(() => {
        if (!tip || !tipRef.current) return;
        const sync = () => {
            if (!tipRef.current || !tip.cell.isConnected) {
                setTip(null);
                return;
            }
            placeTooltip(tipRef.current, tip.cell.getBoundingClientRect(), tip.placement);
            tipRef.current.dataset.ready = "1";
        };
        sync();
        window.addEventListener("scroll", sync, true);
        window.addEventListener("resize", sync);
        return () => {
            window.removeEventListener("scroll", sync, true);
            window.removeEventListener("resize", sync);
        };
    }, [tip]);

    if (!contributions.length) {
        return (
            <p className="m-0 p-0 text-center font-manrope text-[14px] font-semibold tracking-[-0.04em] text-text/50">
                Contribution data unavailable right now.
            </p>
        );
    }

    return (
        <div
            ref={rootRef}
            className="github-contributions-calendar w-full"
            aria-label={`${username} GitHub contributions`}
        >
            {alive && mounted ? (
                <ActivityCalendar
                    data={contributions}
                    colorScheme={calendarScheme}
                    theme={THEME}
                    blockSize={BLOCK.size}
                    blockMargin={BLOCK.margin}
                    maxLevel={4}
                    showMonthLabels={false}
                    showTotalCount={false}
                    showColorLegend={false}
                />
            ) : (
                <div
                    className="w-full min-h-[108px] rounded-[14px] bg-surface"
                    aria-hidden="true"
                />
            )}
            {mounted &&
                tip &&
                createPortal(
                    <div
                        ref={tipRef}
                        className="contrib-tooltip"
                        data-placement={tip.placement}
                        data-color-scheme={calendarScheme}
                        role="tooltip"
                    >
                        {tip.text}
                        <span className="contrib-tooltip-arrow" aria-hidden="true" />
                    </div>,
                    document.body,
                )}
        </div>
    );
}
