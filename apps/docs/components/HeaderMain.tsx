"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, Menu, Search, X } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeSwitch";
import DocsNav from "@/app/Nav";
import emitter from "@/libs/emitter";
import { siteConfig } from "@/config/site";

export default function HeaderMain() {
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const openSearch = () => setOpen(false);
        emitter.on("openSearchModal", openSearch);
        return () => emitter.off("openSearchModal", openSearch);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    return (
        <>
            <header className="sticky top-0 z-[80] h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#0b0b0d]/90">
                <div className="flex h-full items-center gap-4 px-5 sm:px-8">
                    <Logo />
                    <span className="hidden rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 sm:inline dark:bg-zinc-900 dark:text-zinc-300">
                        v{siteConfig.currentVersion}
                    </span>

                    <button
                        type="button"
                        onClick={() => emitter.emit("openSearchModal")}
                        className="mx-auto hidden h-9 w-full max-w-md items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-left text-sm text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 lg:flex dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        <Search aria-hidden="true" size={15} />
                        <span>Search concepts, errors, and examples</span>
                        <kbd className="ml-auto rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[0.65rem] dark:border-zinc-700 dark:bg-zinc-800">⌘ K</kbd>
                    </button>

                    <div className="ml-auto hidden items-center gap-2 lg:flex">
                        <Link href="/releases" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white">
                            Versions
                        </Link>
                        <a href={siteConfig.links.github} target="_blank" rel="noreferrer" aria-label="Prismio on GitHub" className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white">
                            <Github aria-hidden="true" size={17} />
                        </a>
                        <ThemeToggle />
                        <Link
                            href="https://www.prismio.org/install"
                            target="_blank"
                            rel="noreferrer"
                            className="button button--md button--tertiary h-10 px-6 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-gray-800 dark:bg-white hover:bg-zinc-100 dark:hover:bg-gray-100 transition-colors"
                        >
                            Install
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-2 lg:hidden">
                        <button type="button" onClick={() => emitter.emit("openSearchModal")} aria-label="Search documentation" className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                            <Search aria-hidden="true" size={18} />
                        </button>
                        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-docs-nav" aria-label={isOpen ? "Close navigation" : "Open navigation"} className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                            {isOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
                        </button>
                    </div>
                </div>
            </header>

            {isOpen && (
                <div id="mobile-docs-nav" className="fixed inset-x-0 bottom-0 top-16 z-[70] overflow-y-auto bg-white px-5 py-6 lg:hidden dark:bg-[#0b0b0d]">
                    <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                        <Link href="https://www.prismio.org/install" target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-1 text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300">
                            Install compiler <ArrowUpRight aria-hidden="true" size={14} />
                        </Link>
                        <ThemeToggle />
                    </div>
                    <DocsNav onItemClick={() => setOpen(false)} className="pb-16" />
                </div>
            )}
        </>
    );
}
