"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, X } from "lucide-react";
import emitter from "@/libs/emitter";
import { docs, type Docs } from "@/libs/velite";
import { statusLabel } from "@/components/DocStatus";

const categories: Record<string, string> = {
    start: "Getting started",
    tutorials: "Tutorials",
    guides: "Guides",
    language: "Language",
    specification: "Specification",
    compiler: "Compiler",
    stdlib: "Standard library",
    "package-manager": "Packages",
    examples: "Examples",
    cookbook: "Cookbook",
    migration: "Migration",
    errors: "Errors",
    releases: "Releases",
};

function plainText(markdown: string) {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#*`_[\]()>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export default function SearchModal() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);

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
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setIsOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return [];
        const terms = needle.split(/\s+/).filter(Boolean);

        return (docs as Docs[])
            .map((doc) => {
                const body = plainText(doc.raw);
                const title = doc.title.toLowerCase();
                const description = doc.description.toLowerCase();
                const tags = doc.tags.join(" ").toLowerCase();
                const bodyLower = body.toLowerCase();
                let score = 0;

                // Exact phrase matches
                if (title === needle) score += 200;
                else if (title.startsWith(needle)) score += 140;
                else if (title.includes(needle)) score += 100;

                // Check all terms
                const allTermsMatch = terms.every(
                    (term) => title.includes(term) || tags.includes(term) || description.includes(term) || bodyLower.includes(term)
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
                const snippet = index >= 0
                    ? `${start > 0 ? "…" : ""}${body.slice(start, start + 145)}${start + 145 < body.length ? "…" : ""}`
                    : doc.description;

                return { doc, score, snippet };
            })
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
            .slice(0, 10);
    }, [query]);

    const navigate = useCallback((slug: string) => {
        setIsOpen(false);
        router.push(`/${slug}`);
    }, [router]);

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
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/55 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && setIsOpen(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="search-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101014]">
                <h2 id="search-title" className="sr-only">Search Prismio documentation</h2>
                <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <Search aria-hidden="true" size={20} className="shrink-0 text-zinc-500 dark:text-zinc-300" />
                    <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} aria-controls="search-results" aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined} placeholder="Search concepts, errors, APIs, examples…" className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400" />
                    <button type="button" onClick={() => setIsOpen(false)} aria-label="Close search" className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        <X aria-hidden="true" size={17} />
                    </button>
                </div>

                <div id="search-results" role="listbox" className="max-h-[60vh] min-h-44 overflow-y-auto p-2">
                    {!query.trim() && <p className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-300">Search {docs.length} versioned reference pages by title, concept, status, or compiler error.</p>}
                    {query.trim() && results.length === 0 && <p className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-300">No documentation matched “{query}”.</p>}
                    {results.map(({ doc, snippet }, index) => (
                        <button key={doc.slug} id={`search-result-${index}`} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => navigate(doc.slug)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left ${index === activeIndex ? "bg-violet-50 dark:bg-violet-500/10" : "hover:bg-zinc-50 dark:hover:bg-white/5"}`}>
                            <FileText aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-300" />
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-zinc-950 dark:text-zinc-100">{doc.title}</span>
                                    <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{statusLabel(doc.status)}</span>
                                </span>
                                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-300">{snippet}</span>
                                <span className="mt-1 block text-[0.65rem] uppercase tracking-wide text-zinc-400 dark:text-zinc-400">{categories[doc.slug.split("/")[0] ?? ""] ?? "Reference"} · v{doc.version}</span>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-300">
                    <span>↑↓ navigate · Enter open</span>
                    <span>Esc close</span>
                </div>
            </div>
        </div>
    );
}
