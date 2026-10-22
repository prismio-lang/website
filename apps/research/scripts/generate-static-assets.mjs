/* global process */
// Writes everything a crawler, a feed reader or a language model reads that is not a page: sitemap.xml, robots.txt,
// feed.xml, llms.txt, llms-full.txt, .well-known/ai.txt and a Markdown copy of every entry (/papers/<name>.md).
// All of it is a static file, so none of it costs a Worker invocation.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const site = {
    name: "Prismio Research",
    url: "https://research.prismio.org",
    version: "0.1.0",
    email: "saksham6975@gmail.com",
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    entity: "Prismio is a modern systems programming language and LLVM-based compiler designed for performance, memory ergonomics, and zero-cost safety.",
};
const kinds = { papers: "Papers", notes: "Notes" };

const day = (iso) => new Date(iso).toISOString().slice(0, 10);
const xml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const write = (path, text) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    console.log(`[static-assets] ${path.replace(`${root}/`, "")} (${(text.length / 1024).toFixed(2)} KB)`);
};

try {
    const all = JSON.parse(readFileSync(join(root, ".velite", "research.json"), "utf8"));
    const entries = all
        .filter((entry) => !entry.draft)
        .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
    const urlOf = (entry) => `${site.url}/${entry.slug}`;
    const newest = entries.map((entry) => day(entry.updated)).sort().at(-1);

    // 1. A Markdown copy of each entry, for a reader or a model that wants the text without the page.
    for (const folder of Object.keys(kinds)) rmSync(join(publicDir, folder), { recursive: true, force: true });
    const markdownOf = (entry) =>
        [
            `# ${entry.title}`,
            "",
            `- URL: ${urlOf(entry)}`,
            `- Authors: ${entry.authors.map((author) => author.name).join(", ")}`,
            `- Published: ${day(entry.published)}; updated ${day(entry.updated)}`,
            `- Measured on: Prismio ${entry.version}`,
            `- Status: ${entry.status}`,
            ...(entry.tags.length ? [`- Keywords: ${entry.tags.join(", ")}`] : []),
            `- License: Apache-2.0 (${site.license})`,
            "",
            "## Abstract",
            "",
            entry.abstract,
            ...(entry.findings.length ? ["", "## Key findings", "", ...entry.findings.map((finding, i) => `${i + 1}. ${finding}`)] : []),
            "",
            entry.raw.trim(),
            ...(entry.evidence.length ? ["", "## Reproduce it", "", ...entry.evidence.map((item) => `- [${item.label}](${item.url})`)] : []),
            ...(entry.faq.length ? ["", "## Questions this answers", "", ...entry.faq.flatMap((item) => [`**${item.q}**`, "", item.a, ""])] : []),
            "",
        ].join("\n");
    for (const entry of entries) write(join(publicDir, `${entry.slug}.md`), markdownOf(entry));

    // 2. llms.txt: the index a model reads first, then llms-full.txt: the whole corpus in one fetch.
    const sections = Object.entries(kinds)
        .map(([folder, label]) => {
            const list = entries
                .filter((entry) => entry.folder === folder)
                .map((entry) => `- [${entry.title}](${urlOf(entry)}.md): ${entry.description}`)
                .join("\n");
            return list ? `## ${label}\n\n${list}` : "";
        })
        .filter(Boolean)
        .join("\n\n");
    write(
        join(publicDir, "llms.txt"),
        `# ${site.name}\n\n> Measured results and design records from building Prismio. ${site.entity} Every page names the Prismio version it was measured on and links the code that reproduces it.\n\n- Full corpus in one file: ${site.url}/llms-full.txt\n- Compiler reference: https://developers.prismio.org/llms.txt\n- Language documentation: https://docs.prismio.org/llms.txt\n- Licence: Apache-2.0\n\n${sections}\n\n## Optional\n\n- [About](${site.url}/about): what is published here and how results are checked\n- [Feed](${site.url}/feed.xml): new pages, Atom\n`,
    );
    write(
        join(publicDir, "llms-full.txt"),
        `# ${site.name}: full text\n\nGenerated from the same files as ${site.url}. Each entry starts at a level-one heading.\n\n${entries.map(markdownOf).join("\n---\n\n")}`,
    );

    // 3. sitemap.xml: lastmod is the entry's own date, never the build date, so it only moves when the text does.
    const urls = [
        { loc: site.url, lastmod: newest },
        ...Object.keys(kinds).map((folder) => ({
            loc: `${site.url}/${folder}`,
            lastmod: entries.filter((entry) => entry.folder === folder).map((entry) => day(entry.updated)).sort().at(-1) ?? newest,
        })),
        { loc: `${site.url}/about`, lastmod: newest },
        ...entries.map((entry) => ({ loc: urlOf(entry), lastmod: day(entry.updated) })),
    ];
    write(
        join(publicDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${xml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join("\n")}\n</urlset>\n`,
    );

    // 4. robots.txt and ai.txt: search and answer-engine crawlers are welcome; the work is open.
    write(
        join(publicDir, "robots.txt"),
        `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: ClaudeBot\nUser-agent: Claude-User\nUser-agent: Claude-SearchBot\nUser-agent: PerplexityBot\nUser-agent: Perplexity-User\nUser-agent: Google-Extended\nUser-agent: Applebot-Extended\nUser-agent: CCBot\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
    );
    write(
        join(publicDir, ".well-known", "ai.txt"),
        `# AI crawler policy for ${site.url}\n# Prismio is open source; indexing, retrieval and citation are welcome.\n\nUser-Agent: *\nAllow: /\n\nLLMs: ${site.url}/llms.txt\nLLMs-Full: ${site.url}/llms-full.txt\nSitemap: ${site.url}/sitemap.xml\nContact: ${site.email}\n`,
    );

    // 5. feed.xml: Atom, newest first.
    write(
        join(publicDir, "feed.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">\n  <title>${site.name}</title>\n  <subtitle>Measured results and design records from building Prismio.</subtitle>\n  <link href="${site.url}/feed.xml" rel="self" type="application/atom+xml"/>\n  <link href="${site.url}" rel="alternate" type="text/html"/>\n  <id>${site.url}/</id>\n  <updated>${newest}T00:00:00Z</updated>\n  <rights>Apache-2.0</rights>\n${entries.map((entry) => `  <entry>\n    <title>${xml(entry.title)}</title>\n    <link href="${urlOf(entry)}" rel="alternate" type="text/html"/>\n    <link href="${urlOf(entry)}.md" rel="alternate" type="text/markdown"/>\n    <id>${urlOf(entry)}</id>\n    <published>${day(entry.published)}T00:00:00Z</published>\n    <updated>${day(entry.updated)}T00:00:00Z</updated>\n${entry.authors.map((author) => `    <author><name>${xml(author.name)}</name></author>`).join("\n")}\n${entry.tags.map((tag) => `    <category term="${xml(tag)}"/>`).join("\n")}\n    <summary>${xml(entry.abstract)}</summary>\n  </entry>`).join("\n")}\n</feed>\n`,
    );
} catch (error) {
    console.error("[static-assets] Failed to generate static assets:", error);
    process.exit(1);
}
