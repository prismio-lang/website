import * as React from "react";

/**
 * Scroll-based TOC tracker.
 *
 * Strategy: on every scroll (and on mount), find the heading whose top edge is
 * at or above a configurable "trigger line" (default: 20% from the top of the
 * viewport) and is closest to it from above. This gives the natural "the
 * section I'm currently reading" feel, even when headings are far apart.
 */
export function useScrollSpy(
    selectors: string[],
    options: { offset?: number } = {}
) {
    const { offset = 0.2 } = options; // fraction of viewport height from top
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const selectorKey = selectors.join(",");

    React.useEffect(() => {
        if (!selectorKey) return;

        const getElements = () =>
            selectorKey.split(",")
                .map((sel) => document.querySelector<HTMLElement>(sel))
                .filter((el): el is HTMLElement => Boolean(el));

        const compute = () => {
            const elements = getElements();
            if (elements.length === 0) return;

            const triggerY = window.innerHeight * offset;

            // Find the last element whose top is at or above the trigger line
            let best: HTMLElement | null = null;
            for (const el of elements) {
                const top = el.getBoundingClientRect().top;
                if (top <= triggerY) {
                    best = el;
                } else {
                    break; // elements are in DOM order — once we pass trigger, stop
                }
            }

            // Fallback: if nothing has crossed the line yet, highlight the first
            if (!best) best = elements[0] ?? null;

            if (best) {
                const id = best.id || best.getAttribute("data-id");
                if (id) setActiveId(id);
            }
        };

        // Run immediately
        compute();

        // Throttle scroll handler with rAF for silky performance
        let rafId: number;
        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(compute);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafId);
        };
        // Re-run if selectors change (page navigation)
    }, [selectorKey, offset]);

    return activeId;
}
