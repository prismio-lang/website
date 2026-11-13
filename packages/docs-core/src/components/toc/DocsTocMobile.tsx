"use client";

import { FC, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { Heading } from "../../types";

export interface DocsTocMobileProps {
    headings: Heading[];
}

const indentByLevel: Record<number, string> = {
    2: "pl-4",
    3: "pl-8",
    4: "pl-12",
};

/**
 * The on-page contents for phones: a collapsed disclosure under the page header. The sidebar
 * version (DocsToc) only shows on wide screens, so below 768px this is the way to jump.
 */
export const DocsTocMobile: FC<DocsTocMobileProps> = ({ headings }) => {
    const ref = useRef<HTMLDetailsElement>(null);
    const items = headings.filter((h) => h.level >= 2 && h.level <= 3);
    if (items.length < 2) return null;

    return (
        <details
            ref={ref}
            className="group mb-8 rounded-xl border border-zinc-200 md:hidden dark:border-zinc-800"
        >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <span>
                    On this page
                    <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">{items.length} sections</span>
                </span>
                <ChevronDown
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-zinc-500 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none dark:text-zinc-400"
                />
            </summary>
            <nav aria-label="On this page" className="border-t border-zinc-200 py-1.5 dark:border-zinc-800">
                <ul>
                    {items.map((heading) => (
                        <li key={heading.id}>
                            <a
                                href={`#${heading.id}`}
                                onClick={() => {
                                    if (ref.current) ref.current.open = false;
                                }}
                                className={`block py-2.5 pr-4 text-[0.9375rem] leading-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 ${
                                    indentByLevel[heading.level] ?? "pl-4"
                                } ${
                                    heading.level === 2
                                        ? "text-zinc-800 dark:text-zinc-200"
                                        : "text-zinc-600 dark:text-zinc-400"
                                }`}
                            >
                                {heading.text.replace(/\*\*/g, "")}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </details>
    );
};

export default DocsTocMobile;
