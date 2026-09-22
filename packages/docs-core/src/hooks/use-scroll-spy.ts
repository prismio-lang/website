import * as React from "react";

export interface UseScrollSpyOptions {
    offset?: number;
}

export function useScrollSpy(
    selectors: string[],
    options: UseScrollSpyOptions = {}
): [string | null, (id: string) => void] {
    const { offset = 0.2 } = options;
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const selectorKey = selectors.join(",");
    const lockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const setManualActiveId = React.useCallback((id: string) => {
        setActiveId(id);
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        lockTimerRef.current = setTimeout(() => {
            lockTimerRef.current = null;
        }, 700);
    }, []);

    React.useEffect(() => {
        if (!selectorKey) return;

        const getElements = () =>
            selectorKey
                .split(",")
                .map((sel) => document.querySelector<HTMLElement>(sel.trim()))
                .filter((el): el is HTMLElement => Boolean(el));

        const compute = () => {
            if (lockTimerRef.current) return;

            const elements = getElements();
            if (elements.length === 0) return;

            // When scrolled to the very bottom of the page, activate the last element
            const isBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 25;
            if (isBottom) {
                const last = elements[elements.length - 1];
                const lastId = last?.id || last?.getAttribute("data-id");
                if (lastId) {
                    setActiveId(lastId);
                    return;
                }
            }

            // Headings dock at scroll-padding-top (80px).
            // triggerY ensures headings landing at ~80px are reliably captured
            // across all screen heights (even small viewports or docked devtools).
            const triggerY = Math.max(110, Math.min(250, window.innerHeight * offset));

            let best: HTMLElement | null = null;
            for (const el of elements) {
                const top = el.getBoundingClientRect().top;
                if (top <= triggerY) {
                    best = el;
                } else {
                    break;
                }
            }

            if (!best) best = elements[0] ?? null;

            if (best) {
                const id = best.id || best.getAttribute("data-id");
                if (id) setActiveId(id);
            }
        };

        compute();

        let rafId: number;
        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(compute);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafId);
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        };
    }, [selectorKey, offset]);

    return [activeId, setManualActiveId];
}
