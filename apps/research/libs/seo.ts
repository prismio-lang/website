import type { Metadata } from "next";
import { kinds, site, type Kind } from "@/config/site";
import type { Research } from "@/libs/velite";
import { isoDay } from "@/libs/format";

export const absolute = (path: string): string => `${site.url}${path === "/" ? "" : path}`;
export const pathOf = (entry: Research): string => `/${entry.folder}/${entry.name}`;

const publisherId = `${site.publisher.url}/#organization`;
const websiteId = `${site.url}/#website`;

const organization = {
    "@type": "Organization",
    "@id": publisherId,
    name: site.publisher.name,
    url: site.publisher.url,
    logo: site.publisher.logo,
    sameAs: site.publisher.sameAs,
    description: site.entity,
};

const website = {
    "@type": "WebSite",
    "@id": websiteId,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": publisherId },
};

// What the articles are about, so "Prismio" is the language and not another thing of that name.
const subject = {
    "@type": "ComputerLanguage",
    name: "Prismio",
    url: site.publisher.url,
    description: site.entity,
    sameAs: ["https://www.wikidata.org/wiki/Q141648085", site.links.github],
};

export function homeJsonLd(entries: Research[]) {
    return {
        "@context": "https://schema.org",
        "@graph": [
            organization,
            website,
            {
                "@type": "CollectionPage",
                "@id": `${site.url}/#collection`,
                url: site.url,
                name: site.name,
                description: site.description,
                isPartOf: { "@id": websiteId },
                about: subject,
                mainEntity: {
                    "@type": "ItemList",
                    itemListElement: entries.map((entry, index) => ({
                        "@type": "ListItem",
                        position: index + 1,
                        url: absolute(pathOf(entry)),
                        name: entry.title,
                    })),
                },
            },
        ],
    };
}

export function indexJsonLd(kind: Kind, entries: Research[]) {
    const path = `/${kind}`;
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${absolute(path)}#collection`,
                url: absolute(path),
                name: `${kinds[kind].label} | ${site.name}`,
                description: kinds[kind].blurb,
                isPartOf: { "@id": websiteId },
                mainEntity: {
                    "@type": "ItemList",
                    itemListElement: entries.map((entry, index) => ({
                        "@type": "ListItem",
                        position: index + 1,
                        url: absolute(pathOf(entry)),
                        name: entry.title,
                    })),
                },
            },
            breadcrumbs([{ name: site.name, path: "/" }, { name: kinds[kind].label, path }]),
        ],
    };
}

function breadcrumbs(trail: Array<{ name: string; path: string }>) {
    return {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: absolute(item.path),
        })),
    };
}

export function articleJsonLd(entry: Research) {
    const url = absolute(pathOf(entry));
    return {
        "@context": "https://schema.org",
        "@graph": [
            organization,
            website,
            {
                "@type": entry.kind === "paper" ? "ScholarlyArticle" : "TechArticle",
                "@id": `${url}#article`,
                headline: entry.title,
                name: entry.title,
                description: entry.description,
                abstract: entry.abstract,
                url,
                mainEntityOfPage: url,
                inLanguage: site.language,
                datePublished: isoDay(entry.published),
                dateModified: isoDay(entry.updated),
                author: entry.authors.map((author) => ({
                    "@type": "Person",
                    name: author.name,
                    ...(author.url ? { url: author.url } : {}),
                })),
                publisher: { "@id": publisherId },
                isPartOf: { "@id": websiteId },
                keywords: entry.tags.join(", "),
                articleSection: kinds[entry.folder as Kind]?.singular ?? "Paper",
                timeRequired: `PT${entry.minutes}M`,
                license: site.license,
                isAccessibleForFree: true,
                image: absolute(site.ogImage),
                about: subject,
                version: entry.version,
                encoding: {
                    "@type": "MediaObject",
                    contentUrl: absolute(`${pathOf(entry)}.md`),
                    encodingFormat: "text/markdown",
                },
            },
            breadcrumbs([
                { name: site.name, path: "/" },
                { name: kinds[entry.folder as Kind]?.label ?? "Papers", path: `/${entry.folder}` },
                { name: entry.title, path: pathOf(entry) },
            ]),
            ...(entry.faq.length > 0
                ? [
                      {
                          "@type": "FAQPage",
                          mainEntity: entry.faq.map((item) => ({
                              "@type": "Question",
                              name: item.q,
                              acceptedAnswer: { "@type": "Answer", text: item.a },
                          })),
                      },
                  ]
                : []),
        ],
    };
}

export function articleMetadata(entry: Research): Metadata {
    const path = pathOf(entry);
    return {
        title: entry.title,
        description: entry.description,
        keywords: entry.tags,
        authors: entry.authors.map((author) => ({ name: author.name, url: author.url })),
        alternates: { canonical: path, types: { "text/markdown": `${path}.md` } },
        openGraph: {
            type: "article",
            title: entry.title,
            description: entry.description,
            url: path,
            siteName: site.name,
            locale: "en_US",
            publishedTime: entry.published,
            modifiedTime: entry.updated,
            authors: entry.authors.map((author) => author.name),
            tags: entry.tags,
            images: [{ url: site.ogImage, width: 1200, height: 630, alt: `${entry.title} | ${site.name}` }],
        },
        // Google Scholar and the reference managers read these, and so do the answer engines that cite papers.
        other: {
            citation_title: entry.title,
            citation_author: entry.authors.map((author) => author.name),
            citation_publication_date: isoDay(entry.published).replaceAll("-", "/"),
            citation_online_date: isoDay(entry.updated).replaceAll("-", "/"),
            citation_publisher: site.publisher.name,
            citation_language: site.language,
            citation_abstract_html_url: absolute(path),
            citation_keywords: entry.tags.join("; "),
            citation_technical_report_institution: site.publisher.name,
        },
    };
}

export function bibtex(entry: Research): string {
    const first = entry.authors[0]?.name ?? site.author.name;
    const surname = first.split(" ").at(-1)?.toLowerCase() ?? "prismio";
    const year = isoDay(entry.published).slice(0, 4);
    const key = `${surname}${year}${entry.name.replace(/[^a-z0-9]/gi, "")}`;
    return [
        `@misc{${key},`,
        `  title        = {${entry.title}},`,
        `  author       = {${entry.authors.map((author) => author.name).join(" and ")}},`,
        `  year         = {${year}},`,
        `  month        = {${["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][new Date(entry.published).getUTCMonth()]}},`,
        `  howpublished = {${site.name}},`,
        `  note         = {Prismio ${entry.version}},`,
        `  url          = {${absolute(pathOf(entry))}}`,
        `}`,
    ].join("\n");
}

export function plainCitation(entry: Research): string {
    const names = entry.authors.map((author) => author.name).join(", ");
    return `${names} (${isoDay(entry.published).slice(0, 4)}). ${entry.title}. ${site.name}. ${absolute(pathOf(entry))}`;
}
