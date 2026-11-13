"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { emitter } from "@prismio/ui";

export interface DocsNotFoundProps {
    startHref?: string;
    startLabel?: string;
}

const ROW =
    "group flex w-full items-baseline gap-4 px-6 py-2.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 sm:px-8 max-md:items-center max-md:gap-3 max-md:px-5 max-md:py-3.5";

export function DocsNotFound({
    startHref = "/start/overview",
    startLabel = "Getting started",
}: DocsNotFoundProps) {
    // A static 404 does not know the address until the browser does, so it starts generic.
    const [path, setPath] = useState<string | null>(null);

    useEffect(() => {
        const current = window.location.pathname;
        if (current && current !== "/404" && current !== "/404/") setPath(current);
    }, []);

    const handleOpenSearch = () => {
        emitter.emit("openSearchModal");
    };

    return (
        <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col justify-center px-4 py-16 max-md:min-h-0 max-md:px-0 max-md:py-10">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-5xl max-md:text-balance dark:text-white">
                That page isn&apos;t in the docs.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
                The link may be old, or the page may have moved. Search, or start from one of these.
            </p>

            {/* Written the way the compiler would say it. */}
            <div className="mt-8 overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-zinc-900/10 dark:bg-[#0b0c10] dark:ring-white/[0.09]">
                <div className="px-6 pt-6 font-mono text-sm leading-7 sm:px-8 sm:pt-8 max-md:px-5 max-md:pt-5">
                    <p className="text-white">
                        <span className="font-semibold text-rose-400">error[404]</span>
                        <span className="font-semibold">: cannot find page </span>
                        <span className="break-all font-semibold">{path ?? "this address"}</span>
                    </p>
                    <p className="mt-5">
                        <span className="font-semibold text-emerald-400">help</span>
                        <span className="text-zinc-300">: these exist</span>
                    </p>
                </div>

                <div className="mt-3 pb-3 font-mono text-sm">
                    <button type="button" onClick={handleOpenSearch} className={ROW}>
                        <span className="w-28 shrink-0 font-medium text-indigo-300 max-md:w-[5.5rem] transition-colors group-hover:text-indigo-200">Search</span>
                        <span className="flex min-w-0 flex-1 items-center gap-2 truncate font-sans max-md:whitespace-normal text-sm text-zinc-400 transition-colors group-hover:text-zinc-200">
                            <Search aria-hidden="true" size={14} className="shrink-0" />
                            Search the documentation
                        </span>
                        <kbd className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-400 max-md:hidden">⌘K</kbd>
                    </button>
                    <Link href={startHref} className={ROW}>
                        <span className="w-28 shrink-0 font-medium text-indigo-300 max-md:w-[5.5rem] transition-colors group-hover:text-indigo-200">Start</span>
                        <span className="min-w-0 flex-1 truncate font-sans max-md:whitespace-normal text-sm text-zinc-400 transition-colors group-hover:text-zinc-200">{startLabel}</span>
                        <ArrowRight aria-hidden="true" size={14} className="shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                    </Link>
                    <Link href="/" className={ROW}>
                        <span className="w-28 shrink-0 font-medium text-indigo-300 max-md:w-[5.5rem] transition-colors group-hover:text-indigo-200">Docs home</span>
                        <span className="min-w-0 flex-1 truncate font-sans max-md:whitespace-normal text-sm text-zinc-400 transition-colors group-hover:text-zinc-200">The front page of the docs</span>
                        <ArrowRight aria-hidden="true" size={14} className="shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DocsNotFound;
