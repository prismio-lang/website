import type { Metadata } from "next";
import type { DocRecord, DocsSiteConfig } from "../types";

/** The tail of every page title, and the title of the site's own pages: the two sites must read differently. */
function titles(siteConfig: DocsSiteConfig) {
    return {
        suffix: siteConfig.titleSuffix ?? `${siteConfig.shortName} docs`,
        home: siteConfig.titleDefault ?? `${siteConfig.shortName} documentation`,
    };
}

export function generateDocsRootMetadata(siteConfig: DocsSiteConfig): Metadata {
    const { suffix, home } = titles(siteConfig);
    return {
        metadataBase: new URL(siteConfig.siteUrl),
        title: {
            default: home,
            template: `%s | ${suffix}`,
        },
        description: siteConfig.description,
        applicationName: siteConfig.name,
        authors: [{ name: siteConfig.author, url: siteConfig.authorURL }],
        creator: siteConfig.author,
        alternates: { canonical: "/" },
        icons: {
            icon: [
                { url: "/favicon.ico", sizes: "32x32" },
                { url: "/icons/prismio.png", sizes: "512x512", type: "image/png" },
            ],
            apple: [{ url: "/icons/prismio.png", sizes: "180x180", type: "image/png" }],
        },
        openGraph: {
            type: "website",
            url: "/",
            title: home,
            description: siteConfig.description,
            siteName: siteConfig.name,
            images: [
                {
                    url: "/icons/og-card.jpg",
                    width: 1200,
                    height: 630,
                    alt: `${siteConfig.name} logo`,
                },
            ],
        },
        robots: { index: true, follow: true },
    };
}

export function generateDocMetadata(
    doc: DocRecord | undefined,
    siteConfig: DocsSiteConfig
): Metadata {
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
            images: [
                {
                    url: "/icons/og-card.jpg",
                    width: 1200,
                    height: 630,
                    alt: `${doc.title} — ${siteConfig.name}`,
                },
            ],
        },
        other: {
            "prismio:version": doc.version,
            "prismio:status": doc.status,
        },
    };
}

export function generateDocStaticParams(docs: DocRecord[]) {
    return docs.map((doc) => ({ slug: doc.slug.split("/") }));
}

export function generateDocsSitemap(
    docs: DocRecord[],
    siteConfig: DocsSiteConfig,
    topPrioritySlugs: string[] = []
) {
    const docEntries = docs.map((doc) => ({
        url: `${siteConfig.siteUrl}/${doc.slug}`,
        lastModified: new Date(doc.lastUpdated),
        changeFrequency: (doc.status === "planned" ? "monthly" : "weekly") as "monthly" | "weekly",
        priority: topPrioritySlugs.includes(doc.slug) ? 0.9 : 0.7,
    }));

    return [
        {
            url: siteConfig.siteUrl,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 1,
        },
        ...docEntries,
    ];
}

export function buildLlmsTxtBody(
    docs: DocRecord[],
    siteConfig: DocsSiteConfig,
    options: {
        summary: string;
        curatedLinks?: Array<{ title: string; href: string }>;
    }
): string {
    const groups = docs.reduce<Record<string, DocRecord[]>>((acc, doc) => {
        const section = doc.slug.split("/")[0] ?? "general";
        acc[section] = acc[section] ?? [];
        acc[section].push(doc);
        return acc;
    }, {});

    const sections = Object.entries(groups)
        .map(([section, items]) => {
            const title = section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const list = items
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((item) => `- [${item.title}](${siteConfig.siteUrl}/${item.slug}): ${item.description}`)
                .join("\n");
            return `## ${title}\n\n${list}`;
        })
        .join("\n\n");

    const linksText = (options.curatedLinks ?? [])
        .map((link) => `- ${link.title}: ${link.href}`)
        .join("\n");

    return `# ${siteConfig.name}\n\n> ${options.summary}\n\n- Current version: ${siteConfig.currentVersion}\n- Full Markdown corpus: ${siteConfig.siteUrl}/llms-full.txt\n${linksText ? linksText + "\n" : ""}\n${sections}\n`;
}

export function buildLlmsFullTxtBody(
    docs: DocRecord[],
    siteConfig: DocsSiteConfig,
    headerNote: string
): string {
    const records = docs
        .slice()
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((doc) =>
            [
                `# ${doc.title}`,
                `- Slug: ${doc.slug}`,
                `- Canonical: ${siteConfig.siteUrl}/${doc.slug}`,
                `- Status: ${doc.status}`,
                `- Version: ${doc.version}`,
                `- Last verified: ${doc.lastUpdated}`,
                ...(doc.tags?.length ? [`- Tags: ${doc.tags.join(", ")}`] : []),
                "",
                doc.raw,
            ].join("\n")
        )
        .join("\n\n---\n\n");

    return `# Prismio ${siteConfig.currentVersion} ${headerNote}\n\n${records}\n`;
}

export function generateLlmsTxt(
    docs: DocRecord[],
    siteConfig: DocsSiteConfig,
    options: {
        summary: string;
        curatedLinks?: Array<{ title: string; href: string }>;
    }
) {
    const body = buildLlmsTxtBody(docs, siteConfig, options);
    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}

export function generateLlmsFullTxt(
    docs: DocRecord[],
    siteConfig: DocsSiteConfig,
    headerNote: string
) {
    const body = buildLlmsFullTxtBody(docs, siteConfig, headerNote);
    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
