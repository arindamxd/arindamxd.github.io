/**
 * Vite 8 / Rolldown can prebundle `react/jsx-dev-runtime` from production CJS
 * (`jsxDEV = undefined`) and the contributions island dies with
 * `_jsxDEV is not a function`. This shim always provides jsxDEV via createElement.
 * Aliased only in `astro dev` (see astro.config.ts).
 */
import { createElement, Fragment, type ReactElement, type ReactNode } from "react";

export { Fragment };

type Props = Record<string, unknown> | null | undefined;

export function jsxDEV(
    type: Parameters<typeof createElement>[0],
    props: Props,
    key?: string | number | null,
): ReactElement {
    const safe: Record<string, unknown> = props ? { ...props } : {};
    const children = safe.children as ReactNode | ReactNode[] | undefined;
    delete safe.children;
    if (key !== undefined && key !== null) {
        safe.key = key;
    }
    if (Array.isArray(children)) {
        return createElement(type, safe, ...children);
    }
    if (children !== undefined) {
        return createElement(type, safe, children);
    }
    return createElement(type, safe);
}

export const jsx = jsxDEV;
export const jsxs = jsxDEV;
