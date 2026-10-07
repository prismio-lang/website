/* global process */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const docsJsonPath = join(rootDir, ".velite/docs.json");
const publicDir = join(rootDir, "public");

function plainText(markdown) {
    return (markdown || "")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#*`_[\]()>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

try {
    const rawData = readFileSync(docsJsonPath, "utf8");
    const docs = JSON.parse(rawData);

    mkdirSync(publicDir, { recursive: true });

    // 1. Generate search-index.json
    const searchIndex = docs.map((doc) => ({
        title: doc.title,
        description: doc.description,
        slug: doc.slug,
        status: doc.status,
        draft: doc.draft,
        version: doc.version,
        tags: doc.tags,
        body: plainText(doc.raw).slice(0, 500),
    }));

    writeFileSync(join(publicDir, "search-index.json"), JSON.stringify(searchIndex));
    console.log(`[static-assets] Generated public/search-index.json (${(JSON.stringify(searchIndex).length / 1024).toFixed(2)} KB)`);

    // 2. Generate llms.txt & llms-full.txt
    const site = {
        name: "Prismio Documentation",
        siteUrl: "https://docs.prismio.org",
        currentVersion: "0.1.0",
    };

    const groups = docs.reduce((acc, doc) => {
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
                .map((item) => `- [${item.title}](${site.siteUrl}/${item.slug}): ${item.description}`)
                .join("\n");
            return `## ${title}\n\n${list}`;
        })
        .join("\n\n");

    const curatedLinks = [
        { title: "Release baseline", href: `${site.siteUrl}/releases/0.1.0` },
        { title: "Formal specification", href: `${site.siteUrl}/specification` },
        { title: "Error index", href: `${site.siteUrl}/errors` },
    ];
    const linksText = curatedLinks.map((link) => `- ${link.title}: ${link.href}`).join("\n");
    const summary = `Canonical reference for Prismio ${site.currentVersion}, derived from the self-hosted compiler and regression suite. Pages marked Planned describe unimplemented roadmap features and must not be presented as accepted syntax.`;

    const llmsTxt = `# ${site.name}\n\n> ${summary}\n\n- Current version: ${site.currentVersion}\n- Full Markdown corpus: ${site.siteUrl}/llms-full.txt\n${linksText ? linksText + "\n" : ""}\n${sections}\n`;
    writeFileSync(join(publicDir, "llms.txt"), llmsTxt);
    console.log(`[static-assets] Generated public/llms.txt (${(llmsTxt.length / 1024).toFixed(2)} KB)`);

    const records = docs
        .slice()
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((doc) =>
            [
                `# ${doc.title}`,
                `- Slug: ${doc.slug}`,
                `- Canonical: ${site.siteUrl}/${doc.slug}`,
                `- Status: ${doc.status}`,
                `- Version: ${doc.version}`,
                `- Last verified: ${doc.lastUpdated}`,
                ...(doc.tags?.length ? [`- Tags: ${doc.tags.join(", ")}`] : []),
                "",
                doc.raw,
            ].join("\n")
        )
        .join("\n\n---\n\n");

    const headerNote = "full documentation corpus\n\nThis Markdown-first export is generated from the same content records as docs.prismio.org. “experimental” means implemented but changeable; “planned” means the feature is not accepted by compiler 0.1.0.";
    const llmsFullTxt = `# Prismio ${site.currentVersion} ${headerNote}\n\n${records}\n`;
    writeFileSync(join(publicDir, "llms-full.txt"), llmsFullTxt);
    console.log(`[static-assets] Generated public/llms-full.txt (${(llmsFullTxt.length / 1024).toFixed(2)} KB)`);

    // 3. Generate sitemap.xml
    const topPrioritySlugs = ["start/overview", "language"];
    const lastmods = docs.filter((doc) => doc.lastUpdated).map((doc) => new Date(doc.lastUpdated).toISOString().split("T")[0]);
    const newestLastmod = lastmods.sort().at(-1);
    const sitemapEntries = [
        // The front page changes when any page does: the newest page date, not the build date.
        `  <url>\n    <loc>${site.siteUrl}</loc>\n    <lastmod>${newestLastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
        ...docs.map((doc) => {
            const priority = topPrioritySlugs.includes(doc.slug) ? "0.9" : "0.7";
            const changefreq = doc.status === "planned" ? "monthly" : "weekly";
            const lastmod = doc.lastUpdated ? new Date(doc.lastUpdated).toISOString().split("T")[0] : null;
            return `  <url>\n    <loc>${site.siteUrl}/${doc.slug}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        }),
    ];
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</urlset>\n`;
    writeFileSync(join(publicDir, "sitemap.xml"), sitemapXml);
    console.log(`[static-assets] Generated public/sitemap.xml (${(sitemapXml.length / 1024).toFixed(2)} KB)`);

    // 4. Generate robots.txt
    const robotsTxt = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: ClaudeBot\nUser-agent: Claude-User\nUser-agent: Claude-SearchBot\nUser-agent: PerplexityBot\nUser-agent: Perplexity-User\nUser-agent: Google-Extended\nUser-agent: Applebot-Extended\nUser-agent: CCBot\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`;
    writeFileSync(join(publicDir, "robots.txt"), robotsTxt);
    console.log(`[static-assets] Generated public/robots.txt (${(robotsTxt.length / 1024).toFixed(2)} KB)`);

    // 5. Generate .well-known/ai.txt
    const wellKnownDir = join(publicDir, ".well-known");
    mkdirSync(wellKnownDir, { recursive: true });
    const aiTxt = `# AI crawler policy for ${site.siteUrl}\n# Prismio is open source; indexing, retrieval and citation are welcome.\n\nUser-Agent: *\nAllow: /\n\nLLMs: ${site.siteUrl}/llms.txt\nLLMs-Full: ${site.siteUrl}/llms-full.txt\nSitemap: ${site.siteUrl}/sitemap.xml\nContact: saksham6975@gmail.com\n`;
    writeFileSync(join(wellKnownDir, "ai.txt"), aiTxt);
    console.log(`[static-assets] Generated public/.well-known/ai.txt`);
} catch (error) {
    console.error("[static-assets] Failed to generate static assets:", error);
    process.exit(1);
}
