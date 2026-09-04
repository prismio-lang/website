import { docs, type Docs } from "@/libs/velite";
import { siteConfig } from "@/config/site";
import { statusLabel } from "@/components/DocStatus";

export const dynamic = "force-static";

export function GET() {
    const grouped = (docs as Docs[]).reduce<Record<string, Docs[]>>((acc, doc) => {
        const key = doc.slug.split("/")[0] ?? "other";
        (acc[key] ??= []).push(doc);
        return acc;
    }, {});
    const sections = Object.entries(grouped)
        .map(([section, sectionDocs]) => {
            const links = sectionDocs
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((doc) => `- [${doc.title}](${siteConfig.siteUrl}/${doc.slug}): ${doc.description} Status: ${statusLabel(doc.status)}; version ${doc.version}.`)
                .join("\n");
            return `## ${section.replaceAll("-", " ")}\n\n${links}`;
        })
        .join("\n\n");

    const body = `# Prismio Documentation\n\n> Canonical reference for Prismio ${siteConfig.currentVersion}, derived from the self-hosted compiler and regression suite. Pages marked Coming Soon describe unimplemented roadmap features and must not be presented as accepted syntax.\n\n- Current version: ${siteConfig.currentVersion}\n- Full Markdown corpus: ${siteConfig.siteUrl}/llms-full.txt\n- Release baseline: ${siteConfig.siteUrl}/releases/0.1.0\n- Formal specification: ${siteConfig.siteUrl}/specification\n- Error index: ${siteConfig.siteUrl}/errors\n\n${sections}\n`;

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
