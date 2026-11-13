"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { emitter } from "@prismio/ui";
import type { DocRecord, DocSearchRecord, DocsSearchConfig } from "../../types";

export interface DocsSearchModalProps {
    docs?: DocRecord[] | DocSearchRecord[];
    config: DocsSearchConfig;
}

function plainText(markdown: string) {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#*`_[\]()>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps each place a query term appears, so the eye finds why a result matched. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
    if (terms.length === 0) return <>{text}</>;
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    return (
        <>
            {text.split(pattern).map((part, index) =>
                index % 2 === 1 ? (
                    <mark
                        key={index}
                        className="bg-transparent font-semibold text-violet-700 dark:text-violet-300"
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </>
    );
}

const KBD =
    "rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-sans text-[0.6875rem] font-medium leading-4 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

export function DocsSearchModal({ docs, config }: DocsSearchModalProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchDocs, setSearchDocs] = useState<DocSearchRecord[]>(docs ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [entered, setEntered] = useState(false);

    const {
        categories,
        placeholder = "Search documentation…",
        emptyPrompt = searchDocs.length > 0
            ? `Search ${searchDocs.length} versioned reference pages by title, concept, status, or keyword.`
            : "Search versioned reference pages by title, concept, status, or keyword.",
    } = config;

    useEffect(() => {
        if (docs && docs.length > 0) {
            setSearchDocs(docs);
        }
    }, [docs]);

    useEffect(() => {
        if (isOpen && searchDocs.length === 0 && !isLoading) {
            setIsLoading(true);
            fetch("/search-index.json")
                .then((res) => (res.ok ? res.json() : []))
                .then((data: DocSearchRecord[]) => {
                    if (Array.isArray(data) && data.length > 0) {
                        setSearchDocs(data);
                    }
                })
                .catch((err) => {
                    console.error("Failed to load search index:", err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, searchDocs.length, isLoading]);

    useEffect(() => {
        const open = () => {
            setIsOpen(true);
            setQuery("");
            setActiveIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        };
        const close = () => setIsOpen(false);
        emitter.on("openSearchModal", open);
        emitter.on("closeSearchModal", close);
        return () => {
            emitter.off("openSearchModal", open);
            emitter.off("closeSearchModal", close);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setEntered(false);
            return;
        }
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, [isOpen]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setIsOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
                return;
            }
            // "/" opens search from anywhere that is not a place to type.
            if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
                const target = event.target as HTMLElement | null;
                const typing =
                    target &&
                    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
                if (!typing) {
                    event.preventDefault();
                    setIsOpen(true);
                    setQuery("");
                    setActiveIndex(0);
                    requestAnimationFrame(() => inputRef.current?.focus());
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return [];
        const terms = needle.split(/\s+/).filter(Boolean);

        return searchDocs
            .map((doc) => {
                const body = doc.raw ? plainText(doc.raw) : (doc.body ?? doc.description ?? "");
                const title = doc.title.toLowerCase();
                const description = doc.description.toLowerCase();
                const tags = (doc.tags ?? []).join(" ").toLowerCase();
                const bodyLower = body.toLowerCase();
                let score = 0;

                if (title === needle) score += 200;
                else if (title.startsWith(needle)) score += 140;
                else if (title.includes(needle)) score += 100;

                const allTermsMatch = terms.every(
                    (term) =>
                        title.includes(term) ||
                        tags.includes(term) ||
                        description.includes(term) ||
                        bodyLower.includes(term)
                );
                if (!allTermsMatch) return { doc, score: 0, snippet: "" };

                terms.forEach((term) => {
                    if (title.includes(term)) score += 50;
                    if (tags.includes(term)) score += 30;
                    if (description.includes(term)) score += 20;
                    if (bodyLower.includes(term)) score += 10;
                });

                const firstTerm = terms[0] || needle;
                const index = bodyLower.indexOf(firstTerm);
                const start = Math.max(0, index - 45);
                const snippet =
                    index >= 0
                        ? `${start > 0 ? "…" : ""}${body.slice(start, start + 145)}${
                              start + 145 < body.length ? "…" : ""
                          }`
                        : doc.description;

                return { doc, score, snippet };
            })
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
            .slice(0, 10);
    }, [searchDocs, query]);

    const terms = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

    const navigate = useCallback(
        (slug: string) => {
            setIsOpen(false);
            router.push(`/${slug}`);
        },
        [router]
    );

    useEffect(() => {
        if (isOpen && activeIndex >= 0) {
            const el = document.getElementById(`search-result-${activeIndex}`);
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [activeIndex, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                navigate(results[activeIndex].doc.slug);
            }
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handler);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handler);
        };
    }, [activeIndex, isOpen, navigate, results]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/50 px-3 pt-[8vh] transition-opacity duration-150 sm:px-4 sm:pt-[12vh] max-md:items-stretch max-md:px-0 max-md:pt-0 ${
                entered ? "opacity-100" : "opacity-0"
            }`}
            onMouseDown={(event) => event.currentTarget === event.target && setIsOpen(false)}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-title"
                className={`w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white max-md:flex max-md:h-dvh max-md:max-w-none max-md:flex-col max-md:rounded-none max-md:border-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:border-zinc-800 dark:bg-[#0b0c10] ${
                    entered ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0"
                }`}
            >
                <h2 id="search-title" className="sr-only">Search documentation</h2>
                <div className="flex items-center gap-3 border-b border-zinc-200 px-4 max-md:shrink-0 max-md:gap-2 max-md:pt-[env(safe-area-inset-top)] max-md:pr-1.5 dark:border-white/[0.08]">
                    <Search aria-hidden="true" size={18} className="shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                        }}
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-controls="search-results"
                        aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
                        placeholder={placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-14 min-w-0 flex-1 bg-transparent text-base text-zinc-950 max-md:h-16 max-md:text-[1.0625rem] outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close search"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 max-md:size-11 max-md:justify-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                        <kbd className={`${KBD} hidden sm:inline`}>esc</kbd>
                        <X aria-hidden="true" size={17} className="sm:hidden max-md:size-5" />
                    </button>
                </div>

                <div id="search-results" role="listbox" aria-label="Results" className="max-h-[56vh] min-h-40 overflow-y-auto p-2 max-md:max-h-none max-md:min-h-0 max-md:flex-1 max-md:overscroll-contain max-md:px-1.5">
                    {!query.trim() && (
                        <div className="px-4 py-10 text-center">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">{emptyPrompt}</p>
                            <p className="mt-3 text-xs text-zinc-500 max-md:hidden dark:text-zinc-400">
                                Press <kbd className={KBD}>/</kbd> anywhere in the docs to search.
                            </p>
                        </div>
                    )}
                    {query.trim() && results.length === 0 && (
                        <p className="px-4 py-12 text-center text-sm text-zinc-600 dark:text-zinc-300" role="status">
                            {isLoading ? "Loading the index…" : <>Nothing matched “{query}”. Try a shorter word, or an error code such as P1001.</>}
                        </p>
                    )}
                    {results.map(({ doc, snippet }, index) => {
                        const active = index === activeIndex;
                        const badge = doc.draft
                            ? { label: "Draft", cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" }
                            : doc.status === "experimental"
                            ? { label: "Experimental", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" }
                            : doc.status === "planned"
                            ? { label: "Planned", cls: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300" }
                            : null;
                        return (
                            <button
                                key={doc.slug}
                                id={`search-result-${index}`}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => navigate(doc.slug)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors max-md:py-3.5 ${
                                    active ? "bg-zinc-100 dark:bg-white/[0.06]" : ""
                                }`}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                                            <Highlight text={doc.title} terms={terms} />
                                        </span>
                                        <span className="font-mono text-[0.6875rem] text-zinc-500 dark:text-zinc-400">
                                            {categories[doc.slug.split("/")[0] ?? ""] ?? "Reference"} · v{doc.version}
                                        </span>
                                        {badge ? (
                                            <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="mt-1 block line-clamp-2 text-[0.8125rem] leading-5 text-zinc-600 dark:text-zinc-400">
                                        <Highlight text={snippet} terms={terms} />
                                    </span>
                                </span>
                                <CornerDownLeft
                                    aria-hidden="true"
                                    size={15}
                                    className={`shrink-0 text-zinc-400 transition-opacity max-md:hidden dark:text-zinc-500 ${active ? "opacity-100" : "opacity-0"}`}
                                />
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 max-md:shrink-0 max-md:pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-white/[0.08] dark:text-zinc-400">
                    <span className="hidden items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1.5"><kbd className={KBD}>↑</kbd><kbd className={KBD}>↓</kbd> move</span>
                        <span className="flex items-center gap-1.5"><kbd className={KBD}>↵</kbd> open</span>
                    </span>
                    <span aria-live="polite" className="sm:ml-auto">
                        {query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Titles, concepts and text"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DocsSearchModal;
