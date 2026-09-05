import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { DocsToc } from "@/components/toc";
import { DocStatusBadge, DocStatusNotice, statusLabel } from "@/components/DocStatus";
import { docs, type Docs } from "@/libs/velite";
import { findDoc, getPager, getRelated, getSection } from "@/libs/docs/navigation";
import { getHeadings } from "@/libs/docs/utils";
import { siteConfig } from "@/config/site";
import { firstDocLink } from "@/app/nav-list";

interface PageProps {
    params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
    return (docs as Docs[]).map((doc) => ({ slug: doc.slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const doc = findDoc(slug.join("/"));
    if (!doc) return {};

    const canonical = `/${doc.slug}`;

    return {
        title: doc.title,
        description: doc.description,
        keywords: [...doc.tags, "Prismio", `Prismio ${doc.version}`],
        alternates: { canonical },
        openGraph: {
            type: "article",
            url: canonical,
            title: doc.title,
            description: doc.description,
            siteName: siteConfig.name,
            modifiedTime: doc.lastUpdated,
            tags: doc.tags,
        },
        other: {
            "prismio:version": doc.version,
            "prismio:status": doc.status,
        },
    };
}

export default async function DocsPage({ params }: PageProps) {
    const { slug } = await params;
    const doc = findDoc(slug.join("/"));
    if (!doc) notFound();

    const headings = getHeadings(doc.raw);
    const section = getSection(doc.slug);
    const related = getRelated(doc);
    const pager = getPager(doc.slug);
    const canonicalUrl = `${siteConfig.siteUrl}/${doc.slug}`;
    const parent = section ? firstDocLink(section) : undefined;
    const updated = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(new Date(doc.lastUpdated));

    const breadcrumbItems = [
        { name: "Documentation", url: siteConfig.siteUrl },
        ...(section && parent ? [{ name: section.label, url: `${siteConfig.siteUrl}${parent.href}` }] : []),
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
            isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.siteUrl },
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
        <div className="relative mx-auto flex w-full max-w-[100rem] gap-8 py-2 md:py-6">
            <article className="min-w-0 flex-1">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
                />

                <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <Link href="/" className="hover:text-zinc-900 dark:hover:text-white">Docs</Link>
                    {section && parent && parent.href !== `/${doc.slug}` && (
                        <>
                            <ChevronRight aria-hidden="true" size={14} />
                            <Link href={parent.href} className="hover:text-zinc-900 dark:hover:text-white">{section.label}</Link>
                        </>
                    )}
                    <ChevronRight aria-hidden="true" size={14} />
                    <span aria-current="page" className="text-zinc-800 dark:text-zinc-200">{doc.title}</span>
                </nav>

                <header className="mb-8 max-w-3xl">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <DocStatusBadge status={doc.status} />
                        <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                            Prismio {doc.version}
                        </span>
                    </div>
                    <h1 className="text-pretty text-4xl font-bold tracking-[-0.035em] text-zinc-950 md:text-5xl dark:text-white">
                        {doc.title}
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">{doc.description}</p>
                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        Last verified <time dateTime={doc.lastUpdated}>{updated}</time>
                    </p>
                    <DocStatusNotice status={doc.status} />
                </header>

                <MDXContent code={doc.code} />

                {(related.length > 0 || parent) && (
                    <section aria-labelledby="related-heading" className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                        <h2 id="related-heading" className="text-xl font-semibold tracking-tight">Related topics</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {parent && parent.href !== `/${doc.slug}` && (
                                <Link href={parent.href} className="rounded-xl border border-zinc-200 p-4 text-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5">
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Parent section</span>
                                    <span className="mt-1 block font-semibold text-zinc-900 dark:text-zinc-100">{parent.label}</span>
                                </Link>
                            )}
                            {related.map((item) => (
                                <Link key={item.slug} href={`/${item.slug}`} className="rounded-xl border border-zinc-200 p-4 text-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5">
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{statusLabel(item.status)}</span>
                                    <span className="mt-1 block font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <nav aria-label="Page navigation" className="mt-10 grid gap-3 border-t border-zinc-200 pt-8 sm:grid-cols-2 dark:border-zinc-800">
                    {pager.previous ? (
                        <Link href={pager.previous.href} className="group rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
                            <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><ArrowLeft size={13} /> Previous</span>
                            <span className="mt-1 block font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">{pager.previous.label}</span>
                        </Link>
                    ) : <div className="hidden sm:block" />}
                    {pager.next && (
                        <Link href={pager.next.href} className="group rounded-xl border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
                            <span className="flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Next <ArrowRight size={13} /></span>
                            <span className="mt-1 block font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">{pager.next.label}</span>
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
