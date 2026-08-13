/** House motion tokens — design-system §12.2.3 */

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Page shell enter (rise + blur) */
export const springPage = {
    type: "spring" as const,
    stiffness: 260,
    damping: 32,
    mass: 0.9,
};

/** Hero, sections, lists */
export const springSoft = {
    type: "spring" as const,
    stiffness: 180,
    damping: 28,
    mass: 1,
};

/** Interactive chrome (tools, pills) */
export const springSnappy = {
    type: "spring" as const,
    stiffness: 420,
    damping: 32,
    mass: 0.8,
};

export const staggerList = 0.05;

export function clearMotionStyles(el: Element): void {
    if (!(el instanceof HTMLElement)) return;
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
    el.style.removeProperty("translate");
    el.style.removeProperty("filter");
    el.style.removeProperty("will-change");
}
