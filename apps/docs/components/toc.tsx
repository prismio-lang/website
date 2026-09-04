"use client";

import { FC, useEffect, useRef, useState } from "react";
import { Heading } from "@/libs/docs/utils";
import { cn } from "@heroui/react";
import { useScrollSpy } from "@/app/hooks/use-scroll-spy";

export interface DocsTocProps {
    headings: Heading[];
}

const indentByLevel: Record<number, string> = {
    2: "pl-0",
    3: "pl-4",
    4: "pl-8",
};

export const DocsToc: FC<DocsTocProps> = ({ headings }) => {
    const items = headings.filter(h => h.level >= 2 && h.level <= 4);

    const activeId = useScrollSpy(
        items.map(h => `[id="${h.id}"]`),
        { offset: 0.15 }
    );

    // Track the pixel position of the active indicator
    const listRef = useRef<HTMLUListElement>(null);
    const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

    useEffect(() => {
        if (!activeId || !listRef.current) return;
        const activeEl = listRef.current.querySelector<HTMLElement>(`[data-heading-id="${activeId}"]`);
        if (!activeEl) return;
        const listTop = listRef.current.getBoundingClientRect().top;
        const elTop = activeEl.getBoundingClientRect().top;
        setIndicatorTop(elTop - listTop + activeEl.offsetHeight / 2 - 10);
    }, [activeId]);

    // Sync URL hash
    useEffect(() => {
        if (!activeId) return;
        const current = window.location.hash.slice(1);
        if (current !== activeId) {
            history.replaceState(null, "", `#${activeId}`);
        }
    }, [activeId]);

    if (items.length === 0) return null;

    return (
        <nav className="relative h-full text-[0.8125rem]">
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-300">
                On this page
            </p>

            <div className="relative border-l border-default-200 pl-4">
                {/* Smooth sliding indicator */}
                <span
                    className="absolute -left-px w-0.5 rounded-full bg-primary transition-all duration-200 ease-out"
                    style={{
                        top: indicatorTop !== null ? `${indicatorTop}px` : "-999px",
                        height: "20px",
                        opacity: indicatorTop !== null ? 1 : 0,
                    }}
                />

                <ul ref={listRef} className="flex flex-col gap-2">
                    {items.map((heading) => {
                        const isActive = heading.id === activeId;

                        return (
                            <li
                                key={heading.id}
                                data-heading-id={heading.id}
                                className={cn(
                                    "relative transition-colors",
                                    indentByLevel[heading.level]
                                )}
                            >
                                <a
                                    href={`#${heading.id}`}
                                    className={cn(
                                        "block leading-5 transition-colors duration-150",
                                        isActive
                                            ? "font-semibold text-zinc-950 dark:text-white"
                                            : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                                    )}
                                >
                                    {heading.text.replace(/\*\*/g, "")}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};
