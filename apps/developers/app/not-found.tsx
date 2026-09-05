"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Search } from "lucide-react";
import emitter from "@/libs/emitter";

export default function NotFound() {
    const handleOpenSearch = () => {
        emitter.emit("openSearchModal");
    };

    return (
        <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mx-auto flex max-w-lg flex-col items-center gap-5">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
                    Error 404
                </span>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
                    Page not found
                </h1>
                <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
                    Maybe you&apos;re looking for something else? The documentation page you requested could not be found or has moved.
                </p>

                <div className="w-full max-w-md">
                    <button
                        type="button"
                        onClick={handleOpenSearch}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        <span className="flex items-center gap-2.5">
                            <Search aria-hidden="true" size={16} />
                            <span>Search documentation…</span>
                        </span>
                        <kbd className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[0.7rem] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                        <Home aria-hidden="true" size={14} /> Back to docs home
                    </Link>
                    <Link
                        href="/start/overview"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <BookOpen aria-hidden="true" size={14} /> Getting started
                    </Link>
                </div>
            </div>
        </div>
    );
}