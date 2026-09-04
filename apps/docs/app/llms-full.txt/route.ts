import { docs, type Docs } from "@/libs/velite";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

export function GET() {
    const records = (docs as Docs[])
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((doc) => [
            `# ${doc.title}`,
            "",
            `Canonical URL: ${siteConfig.siteUrl}/${doc.slug}`,
            `Prismio version: ${doc.version}`,
            `Implementation status: ${doc.status}`,
            `Last verified: ${doc.lastUpdated.slice(0, 10)}`,
            `Description: ${doc.description}`,
            `Tags: ${doc.tags.join(", ")}`,
            "",
            doc.raw.trim(),
        ].join("\n"))
        .join("\n\n---\n\n");

    const body = `# Prismio ${siteConfig.currentVersion} full documentation corpus\n\nThis Markdown-first export is generated from the same content records as docs.prismio.org. “coming-soon” means the feature is not accepted by compiler 0.1.0.\n\n${records}\n`;

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
