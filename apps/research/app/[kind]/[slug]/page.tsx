import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { TocInline, TocSide } from "@/components/Toc";
import { kinds, site, type Kind } from "@/config/site";
import { formatDate } from "@/libs/format";
import { articleJsonLd, articleMetadata, bibtex, pathOf, plainCitation } from "@/libs/seo";
import { extractToc } from "@/libs/toc";
import { entries, find } from "@/libs/velite";

type Params = Promise<{ kind: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
    return entries.map((entry) => ({ kind: entry.folder, slug: entry.name }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { kind, slug } = await params;
    const entry = find(kind, slug);
    return entry ? articleMetadata(entry) : {};
}

export default async function Page({ params }: { params: Params }) {
    const { kind, slug } = await params;
    const entry = find(kind, slug);
    if (!entry) notFound();

    const toc = extractToc(entry.raw);
    const related = entry.related
        .map((target) => entries.find((candidate) => candidate.slug === target))
        .filter((candidate) => candidate !== undefined);
    const info = kinds[kind as Kind];

    return (
        <div className="shell">
            <JsonLd data={articleJsonLd(entry)} />
            <article className="article-grid">
                <div>
                    <header className="article-head">
                        <p className="eyebrow">
                            <Link href={`/${kind}`}>{info.singular}</Link> · Prismio {entry.version}
                            {entry.status === "preprint" ? " · Preprint" : ""}
                        </p>
                        <h1>{entry.title}</h1>
                        <p className="byline">
                            {entry.authors.map((author, index) => (
                                <span key={author.name}>
                                    {index > 0 ? ", " : ""}
                                    {author.url ? <a href={author.url}>{author.name}</a> : author.name}
                                </span>
                            ))}
                        </p>
                        <ul className="meta">
                            <li>Published <time dateTime={entry.published.slice(0, 10)}>{formatDate(entry.published)}</time></li>
                            {entry.updated.slice(0, 10) !== entry.published.slice(0, 10) && (
                                <li>Updated <time dateTime={entry.updated.slice(0, 10)}>{formatDate(entry.updated)}</time></li>
                            )}
                            <li>{entry.minutes} min read</li>
                            <li><a href={`${pathOf(entry)}.md`}>Markdown</a></li>
                        </ul>

                        <section className="abstract" aria-labelledby="abstract">
                            <h2 id="abstract">Abstract</h2>
                            <p>{entry.abstract}</p>
                        </section>

                        {entry.findings.length > 0 && (
                            <section className="findings" aria-labelledby="findings">
                                <h2 id="findings">Key findings</h2>
                                <ol>
                                    {entry.findings.map((finding) => (
                                        <li key={finding}>{finding}</li>
                                    ))}
                                </ol>
                            </section>
                        )}
                        <TocInline items={toc} />
                    </header>

                    <Prose code={entry.code} />

                    {entry.evidence.length > 0 && (
                        <section className="aside-block" aria-labelledby="evidence">
                            <h2 id="evidence">Reproduce it</h2>
                            <ul>
                                {entry.evidence.map((item) => (
                                    <li key={item.url}><a href={item.url}>{item.label}</a></li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {entry.faq.length > 0 && (
                        <section className="aside-block faq" aria-labelledby="faq">
                            <h2 id="faq">Questions this answers</h2>
                            <dl>
                                {entry.faq.map((item) => (
                                    <div key={item.q}>
                                        <dt>{item.q}</dt>
                                        <dd>{item.a}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    <section className="aside-block cite" aria-labelledby="cite">
                        <h2 id="cite">Cite this</h2>
                        <p>{plainCitation(entry)}</p>
                        <pre>{bibtex(entry)}</pre>
                        <p>
                            Licensed under <a href={site.license} rel="license">{site.licenseName}</a>.
                        </p>
                    </section>

                    {related.length > 0 && (
                        <section className="aside-block" aria-labelledby="related">
                            <h2 id="related">Related</h2>
                            <ul>
                                {related.map((item) => (
                                    <li key={item.slug}><Link href={pathOf(item)}>{item.title}</Link></li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
                <TocSide items={toc} />
            </article>
        </div>
    );
}
