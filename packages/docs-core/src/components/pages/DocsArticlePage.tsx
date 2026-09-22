/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { DocStatusBadge, DocStatusNotice, statusLabel } from "../badges/DocStatus";
import { DocsToc } from "../toc/DocsToc";
import { MDXContent } from "../mdx/MDXContent";
import { firstDocLink, getHeadings } from "../../navigation";
import type { DocRecord, DocsAppConfig } from "../../types";

export interface DocsArticlePageProps {
    doc: DocRecord;
    config: DocsAppConfig;
    pager: {
        previous?: { label: string; href: string };
        next?: { label: string; href: string };
    };
    section?: {
        label: string;
        items: any[];
    };
    related: DocRecord[];
    customComponents?: Record<string, any>;
    breadcrumbRootLabel?: string;
}

export function DocsArticlePage({
    doc,
    config,
    pager,
    section,
    related,
    customComponents,
    breadcrumbRootLabel = "Docs",
}: DocsArticlePageProps) {
    const { site } = config;
    const headings = getHeadings(doc.raw);
    const canonicalUrl = `${site.siteUrl}/${doc.slug}`;
    const parent = section ? firstDocLink(section as any) : undefined;
    const updated = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(new Date(doc.lastUpdated));

    const breadcrumbItems = [
        { name: breadcrumbRootLabel, url: site.siteUrl },
        ...(section && parent ? [{ name: section.label, url: `${site.siteUrl}${parent}` }] : []),
        { name: doc.title, url: canonicalUrl },
    ];

    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: doc.title,
            description: doc.description,
            url: canonicalUrl,
            dateModified: doc.lastUpdated,
            version: doc.version,
            proficiencyLevel: "Developer",
            isPartOf: { "@type": "WebSite", name: site.name, url: site.siteUrl },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbItems.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        },
    ];

    return (
        <div className="relative mx-auto flex w-full max-w-[100rem] gap-8 py-2 md:py-5">
            <article className="min-w-0 flex-1 px-10">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
                />

                <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <Link href="/" className="hover:text-zinc-900 dark:hover:text-white">
                        {breadcrumbRootLabel}
                    </Link>
                    {section && parent && parent !== `/${doc.slug}` && (
                        <>
                            <ChevronRight aria-hidden="true" size={14} />
                            <Link href={parent} className="hover:text-zinc-900 dark:hover:text-white">
                                {section.label}
                            </Link>
                        </>
                    )}
                    <ChevronRight aria-hidden="true" size={14} />
                    <span aria-current="page" className="text-zinc-800 dark:text-zinc-200">
                        {doc.title}
                    </span>
                </nav>

                <header className="mb-8 max-w-3xl">
                    {(doc.draft || doc.status !== "stable") && (
                        <div className="mb-3">
                            <DocStatusBadge status={doc.status} draft={doc.draft} />
                        </div>
                    )}
                    <h1 className="text-pretty text-4xl font-bold tracking-[-0.035em] text-zinc-950 md:text-5xl dark:text-white">
                        {doc.title}
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                        {doc.description}
                    </p>
                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        Last verified <time dateTime={doc.lastUpdated}>{updated}</time>
                    </p>
                    <DocStatusNotice status={doc.status} draft={doc.draft} />
                </header>

                <MDXContent code={doc.code} components={customComponents} />

                {(related.length > 0 || (parent && parent !== `/${doc.slug}`)) && (
                    <section aria-labelledby="related-heading" className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                        <h2 id="related-heading" className="text-xl font-semibold tracking-tight">
                            Related topics
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {parent && parent !== `/${doc.slug}` && section && (
                                <Link
                                    href={parent}
                                    className="rounded-xl border border-zinc-200 p-4 text-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
                                >
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Parent section
                                    </span>
                                    <span className="mt-1 block font-semibold text-zinc-900 dark:text-zinc-100">
                                        {section.label}
                                    </span>
                                </Link>
                            )}
                            {related.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/${item.slug}`}
                                    className="rounded-xl border border-zinc-200 p-4 text-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5"
                                >
                                    <span
                                        className={`block text-xs font-semibold uppercase tracking-wide ${
                                            item.draft
                                                ? "text-sky-600 dark:text-sky-400"
                                                : item.status === "experimental"
                                                ? "text-amber-600 dark:text-amber-400"
                                                : item.status === "planned"
                                                ? "text-fuchsia-600 dark:text-fuchsia-400"
                                                : "text-zinc-500 dark:text-zinc-400"
                                        }`}
                                    >
                                        {item.draft ? "Draft" : item.status !== "stable" ? statusLabel(item.status) : "Topic"}
                                    </span>
                                    <span className="mt-1 block font-semibold text-zinc-900 dark:text-zinc-100">
                                        {item.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <nav aria-label="Page navigation" className="mt-10 grid gap-3 border-t border-zinc-200 pt-8 sm:grid-cols-2 dark:border-zinc-800">
                    {pager.previous ? (
                        <Link
                            href={pager.previous.href}
                            className="group rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                            <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                <ArrowLeft size={13} /> Previous
                            </span>
                            <span className="mt-1 block font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">
                                {pager.previous.label}
                            </span>
                        </Link>
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                    {pager.next && (
                        <Link
                            href={pager.next.href}
                            className="group rounded-xl border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                            <span className="flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Next <ArrowRight size={13} />
                            </span>
                            <span className="mt-1 block font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">
                                {pager.next.label}
                            </span>
                        </Link>
                    )}
                </nav>
            </article>

            {headings.length > 0 && (
                <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto no-scrollbar py-6 pl-4 xl:block">
                    <DocsToc headings={headings} />
                </aside>
            )}
        </div>
    );
}

export default DocsArticlePage;
