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

    const body = `# Prismio Developer Reference\n\n> Source-linked implementation documentation for Prismio ${siteConfig.currentVersion}, derived from the self-hosted compiler, runtime, UMS, tests, and benchmark evidence. Experimental pages describe implemented but changeable policy; unsupported capabilities are not accepted compiler behavior.\n\n- Current version: ${siteConfig.currentVersion}\n- Full Markdown corpus: ${siteConfig.siteUrl}/llms-full.txt\n- Contributor entry: ${siteConfig.siteUrl}/start\n- Compiler architecture: ${siteConfig.siteUrl}/compiler/overview\n- AIF internals: ${siteConfig.siteUrl}/compiler/aif-internals\n- LLVM backend: ${siteConfig.siteUrl}/llvm/overview\n- Release baseline: ${siteConfig.siteUrl}/releases/0.1.0\n\n${sections}\n`;

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
