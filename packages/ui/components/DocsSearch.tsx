"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import defaultEmitter from "../lib/emitter";

export interface DocsSearchProps {
    /**
     * Event emitter to trigger the search modal.
     * Calls emitter.emit("openSearchModal") on click.
     */
    emitter?: {
        emit: (event: "openSearchModal" | string, ...args: unknown[]) => void;
    };
    /**
     * Custom click callback. If provided, overrides the default emitter action.
     */
    onClick?: () => void;
    /**
     * Placeholder text displayed on the button.
     * @default "Search the docs"
     */
    placeholder?: string;
    /**
     * Optional additional CSS classes.
     */
    className?: string;
}

export default function DocsSearch({
    emitter,
    onClick,
    placeholder = "Search the docs",
    className = "",
}: DocsSearchProps = {}) {
    const [isMac, setIsMac] = useState(true);

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
        }
    }, []);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (emitter) {
            emitter.emit("openSearchModal");
        } else {
            defaultEmitter.emit("openSearchModal");
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={placeholder}
            aria-keyshortcuts={isMac ? "Meta+K /" : "Control+K /"}
            className={`group flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 text-left text-sm text-zinc-500 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-200/70 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-zinc-800 dark:bg-[#06070a] dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-[#0b0c10] dark:hover:text-zinc-200 dark:focus-visible:outline-violet-400 ${className}`}
        >
            <Search
                aria-hidden="true"
                size={16}
                className="shrink-0 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
            />
            <span className="min-w-0 flex-1 truncate">{placeholder}</span>
            <kbd
                aria-hidden="true"
                className="shrink-0 select-none rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 font-sans text-[0.6875rem] font-medium leading-4 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
                {isMac ? "⌘ K" : "Ctrl K"}
            </kbd>
        </button>
    );
}
