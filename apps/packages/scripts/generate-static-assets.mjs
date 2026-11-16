/* global process */
// Writes the files crawlers and answer engines read: robots.txt, sitemap.xml, llms.txt, .well-known/ai.txt and
// ai/*.json. The FAQ comes from config/faq.ts so the page, its JSON-LD and these files never disagree.
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const site = {
    name: "Prismio Packages",
    url: "https://packages.prismio.org",
    cdn: "https://cdn.prismio.org",
    main: "https://prismio.org",
    docs: "https://docs.prismio.org",
    github: "https://github.com/prismio-lang/prismio",
};

const read = (file) => readFileSync(join(root, file), "utf8");
const description = /description:\s*\n?\s*"([^"]+)"/.exec(read("config/site.ts"))?.[1];
const faq = [...read("config/faq.ts").matchAll(/question:\s*"([^"]+)",\s*answer:\s*\n?\s*"([^"]+)"/g)].map(
    ([, question, answer]) => ({question, answer}),
);
if (!description || faq.length === 0) {
    console.error("[static-assets] could not read config/site.ts or config/faq.ts");
    process.exit(1);
}

const prismioVersion = "0.3.0";
const status =
    "Preview. Prismio 0.3 has no package registry; the packages listed on the site are examples and are not published libraries.";

mkdirSync(join(publicDir, ".well-known"), {recursive: true});
mkdirSync(join(publicDir, "ai"), {recursive: true});

writeFileSync(
    join(publicDir, "llms.txt"),
    `# ${site.name}

> ${description}

Status: ${status}
Applies to Prismio ${prismioVersion}.

## Start here

- [Registry home](${site.url}): What the registry is and how publishing will work
- [Package manager guide](${site.docs}/package-manager): The build.ums manifest, project commands and local path dependencies that exist today
- [Prismio](${site.main}): The language, install instructions and roadmap
- [Source code](${site.github}): Compiler, standard library and tooling

## Frequently asked questions

${faq.map(({question, answer}) => `- ${question} ${answer}`).join("\n")}

## Optional

- [Machine-readable summary](${site.url}/ai/summary.json)
- [FAQ as JSON](${site.url}/ai/faq.json)
- [Main site index for LLMs](${site.main}/llms.txt)
`,
);

writeFileSync(
    join(publicDir, "ai", "summary.json"),
    JSON.stringify(
        {
            name: site.name,
            url: site.url,
            type: "package-registry",
            description,
            status,
            prismioVersion,
            publishing: "command line only; no website upload",
            downloads: `${site.cdn}/packages/<name>/<version>/package.tar.gz`,
            links: {main: site.main, documentation: `${site.docs}/package-manager`, source: site.github, issues: `${site.github}/issues`, llms: `${site.url}/llms.txt`},
        },
        null,
        2,
    ),
);

writeFileSync(join(publicDir, "ai", "faq.json"), JSON.stringify({site: site.url, faqs: faq}, null, 2));

writeFileSync(
    join(publicDir, ".well-known", "ai.txt"),
    `# AI crawler policy for ${site.url}
# Indexing, retrieval and citation of the registry home page are welcome.

User-Agent: *
Allow: /
Disallow: /auth/

Summary: ${site.url}/ai/summary.json
FAQ: ${site.url}/ai/faq.json
LLMs: ${site.url}/llms.txt
Sitemap: ${site.url}/sitemap.xml
Contact: ${site.github}/issues
`,
);

// Only the home page: package pages show example packages and are noindex.
writeFileSync(
    join(publicDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site.url}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
);

const AI_CRAWLERS = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
    "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot",
];
writeFileSync(
    join(publicDir, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /auth/\n\n${AI_CRAWLERS.map((c) => `User-agent: ${c}`).join("\n")}\nAllow: /\nDisallow: /auth/\n\nSitemap: ${site.url}/sitemap.xml\n`,
);

console.log(`[static-assets] wrote robots.txt, sitemap.xml, llms.txt, ai/*.json, .well-known/ai.txt (${faq.length} FAQs)`);
