"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, Menu, Search, X } from "lucide-react";
import { Logo, DocsSearch, emitter } from "@prismio/ui";
import { ThemeSwitch } from "../theme/ThemeSwitch";
import { DocsNav } from "./DocsNav";
import type { DocsSection, DocsSiteConfig } from "../../types";

export interface DocsHeaderProps {
    siteConfig: DocsSiteConfig;
    navList: DocsSection[];
    brandTag?: string;
    installUrl?: string;
}

export function DocsHeader({
    siteConfig,
    navList,
    brandTag,
    installUrl = "https://www.prismio.org/install",
}: DocsHeaderProps) {
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const openSearch = () => setOpen(false);
        emitter.on("openSearchModal", openSearch);
        return () => emitter.off("openSearchModal", openSearch);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            <header className="sticky top-0 z-[80] h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#0b0b0d]/90">
                <div className="flex h-full items-center gap-4 px-5 sm:px-8">
                    <div className="flex items-center gap-2 shrink-0">
                        <Logo />
                        {brandTag ? (
                            <span className="text-purple-500 font-bold text-xl">{brandTag}</span>
                        ) : null}
                    </div>

                    <span className="hidden rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 sm:inline dark:bg-zinc-900 dark:text-zinc-300">
                        v{siteConfig.currentVersion}
                    </span>

                    <DocsSearch emitter={emitter} />

                    <div className="ml-auto hidden items-center gap-2 lg:flex">
                        <Link
                            href="/releases"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                        >
                            Versions
                        </Link>
                        <a
                            href={siteConfig.links.github}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Prismio on GitHub"
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                        >
                            <Github aria-hidden="true" size={17} />
                        </a>
                        <ThemeSwitch />
                        <Link
                            href={installUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            <span>Install</span>
                            <ArrowUpRight aria-hidden="true" size={13} />
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => emitter.emit("openSearchModal")}
                            aria-label="Search documentation"
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                        >
                            <Search aria-hidden="true" size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            aria-expanded={isOpen}
                            aria-controls="mobile-docs-nav"
                            aria-label={isOpen ? "Close navigation" : "Open navigation"}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                        >
                            {isOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
                        </button>
                    </div>
                </div>
            </header>

            {isOpen && (
                <div
                    id="mobile-docs-nav"
                    className="fixed inset-x-0 bottom-0 top-16 z-[70] overflow-y-auto no-scrollbar bg-white px-5 py-6 lg:hidden dark:bg-[#0b0b0d]"
                >
                    <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                        <Link
                            href={installUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1 text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
                        >
                            Install compiler <ArrowUpRight aria-hidden="true" size={14} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <a
                                href={siteConfig.links.github}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Prismio on GitHub"
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                            >
                                <Github aria-hidden="true" size={17} />
                            </a>
                            <ThemeSwitch />
                        </div>
                    </div>
                    <DocsNav navList={navList} onItemClick={() => setOpen(false)} className="pb-16" />
                </div>
            )}
        </>
    );
}

export default DocsHeader;
