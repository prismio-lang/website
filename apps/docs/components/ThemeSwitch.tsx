"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
            title={isDark ? "Use light theme" : "Use dark theme"}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
            {isDark ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
        </button>
    );
}
