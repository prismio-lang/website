/* global process */
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");

const siteConfig = {
    name: "Prismio",
    url: "https://prismio.org",
    docsUrl: "https://docs.prismio.org",
    developersUrl: "https://developers.prismio.org",
    description: "Prismio is a self-hosted, statically typed systems language that compiles through LLVM, explains memory placement through AIF, and interoperates directly with C.",
    email: "saksham6975@gmail.com",
    github: "https://github.com/prismio-lang/prismio",
    wikidata: "https://www.wikidata.org/wiki/Q141648085",
    rosettaCode: "https://rosettacode.org/wiki/Category:Prismio",
    homebrewTap: "https://github.com/prismio-lang/homebrew-tap",
    jetbrainsPlugin: "https://plugins.jetbrains.com/plugin/34672-prismio/",
    fossUnitedGrant: "https://fossunited.org/grants/prismio",
};

const PRISMIO_VERSION = "0.1.0";
const LLVM_VERSION = "23";

/** The day a page's source last changed in Git (YYYY-MM-DD), or null where there is no history to read. */
function lastChanged(...sources) {
    try {
        const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...sources.map((source) => join(rootDir, source))], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
        return out || null;
    } catch {
        return null;
    }
}

const releaseFiles = readdirSync(join(rootDir, "content", "releases")).filter((file) => file.endsWith(".md"));
const releaseDate = (file) => /^date:\s*"?([0-9-]+)"?/m.exec(readFileSync(join(rootDir, "content", "releases", file), "utf8"))?.[1] ?? null;
const releaseDates = releaseFiles.map(releaseDate).filter(Boolean).sort();

// lastmod is the day the page's own source last changed; a page without a date states none rather than today.
const sitePages = [
    { path: "/", priority: 1, changeFrequency: "weekly", lastmod: lastChanged("app/page.tsx", "components/landing", "config/faq.ts") },
    { path: "/install", priority: 0.9, changeFrequency: "monthly", lastmod: lastChanged("app/install") },
    { path: "/benchmarks", priority: 0.8, changeFrequency: "weekly", lastmod: lastChanged("app/benchmarks", "components/benchmarks", "data/results.json") },
    { path: "/roadmap", priority: 0.8, changeFrequency: "weekly", lastmod: lastChanged("app/roadmap") },
    { path: "/releases", priority: 0.7, changeFrequency: "monthly", lastmod: releaseDates.at(-1) ?? null },
    // One page per release file in content/releases.
    ...releaseFiles.map((file) => ({ path: `/releases/${file.slice(0, -3)}`, priority: 0.6, changeFrequency: "monthly", lastmod: lastChanged(`content/releases/${file}`) ?? releaseDate(file) })),
    { path: "/about", priority: 0.7, changeFrequency: "monthly", lastmod: lastChanged("app/about") },
    { path: "/community", priority: 0.6, changeFrequency: "monthly", lastmod: lastChanged("app/community") },
    { path: "/sponsors", priority: 0.5, changeFrequency: "monthly", lastmod: lastChanged("app/sponsors") },
    { path: "/team", priority: 0.5, changeFrequency: "monthly", lastmod: lastChanged("app/team/page.tsx") },
    { path: "/team/saksham-jaiswal", priority: 0.4, changeFrequency: "monthly", lastmod: lastChanged("app/team/saksham-jaiswal") },
];

const faqItems = [
    {
        question: "What is Prismio?",
        answer: "Prismio is a self-hosted, statically typed systems programming language. It compiles to native machine code through LLVM, uses the Adaptive Inference Framework (AIF) to decide and explain where values live in memory, and calls C directly without wrapper glue.",
    },
    {
        question: "Is Prismio production-ready?",
        answer: "No. Version 0.1 is active compiler development. Implemented features are tested, but syntax, runtime contracts, AIF policy and ABI details may change. Use it for compiler and language development and controlled experiments.",
    },
    {
        question: "Is the Prismio compiler written in Prismio?",
        answer: "Yes. A committed LLVM IR seed breaks the initial bootstrapping cycle, and later generations compile the Prismio compiler source. The repository checks multiple generations and fixed points.",
    },
    {
        question: "Does Prismio use garbage collection?",
        answer: "There is no single implicit tracing-GC model. The compiler enforces moves and borrows for move-only values, while the experimental AIF classifies allocations across stack, region, unique, reference-counted and cycle-aware tiers.",
    },
    {
        question: "How do I install Prismio?",
        answer: "Run curl -fsSL https://prismio.org/install.sh | sh, or build from source at github.com/prismio-lang/prismio. The install page lists supported platforms.",
    },
    {
        question: "Does Prismio interoperate with C?",
        answer: "Yes. Prismio code can call C functions and pass C structs directly, and a build.ums manifest can compile your own C sources and link libraries into a program.",
    },
];

try {
    mkdirSync(publicDir, { recursive: true });
    mkdirSync(join(publicDir, ".well-known"), { recursive: true });
    mkdirSync(join(publicDir, "ai"), { recursive: true });

    // 1. Generate llms.txt
    const llmsTxt = `# Prismio

> ${siteConfig.description}

Prismio ${PRISMIO_VERSION} is the first release, published 2026-10-02, and is pre-1.0: the language and library can still change incompatibly, and it is not production-ready. Install it with: curl -fsSL https://prismio.org/install.sh | sh (macOS and Linux) or from a release archive on GitHub. Pages marked Coming Soon in the documentation describe unimplemented features and must not be presented as accepted syntax.

## Start here

- [Install](${siteConfig.url}/install): Install the compiler with a one-line script or build from source
- [About](${siteConfig.url}/about): Architecture, AIF, LLVM backend, concurrency model and C interoperability
- [Roadmap](${siteConfig.url}/roadmap): What is implemented and what is not yet
- [Release notes](${siteConfig.url}/releases): What each version contains, its breaking changes and known limits
- [Benchmarks](${siteConfig.url}/benchmarks): Measured toolchain and runtime results with methodology

## Documentation

- [Documentation](${siteConfig.docsUrl}): Language reference, guides, cookbook and error index
- [Documentation index for LLMs](${siteConfig.docsUrl}/llms.txt): Page-by-page index of the documentation
- [Full documentation corpus](${siteConfig.docsUrl}/llms-full.txt): Entire documentation as Markdown
- [Developer docs](${siteConfig.developersUrl}): Compiler internals, runtime and tooling
- [Developer docs index for LLMs](${siteConfig.developersUrl}/llms.txt)

## Project

- [Source code](${siteConfig.github}): Compiler, standard library and benchmarks
- [Releases](${siteConfig.github}/releases): Release notes and downloads
- [Community](${siteConfig.url}/community): Discord, issues and contribution guide
- [Team](${siteConfig.url}/team): Creator and maintainers

## Ecosystem & Tooling

- [Wikidata Knowledge Graph](${siteConfig.wikidata}): Official Wikidata entity (Q141648085) for the Prismio programming language and compiler
- [Rosetta Code](${siteConfig.rosettaCode}): Rosetta Code programming language category and comparative code samples
- [JetBrains Plugin](${siteConfig.jetbrainsPlugin}): Official IDE support for CLion, IntelliJ IDEA, and JetBrains IDEs
- [Homebrew Tap](${siteConfig.homebrewTap}): macOS and Linux Homebrew formula repository
- [FOSS United Grant](${siteConfig.fossUnitedGrant}): FOSS United Foundation development grant profile

## Optional

- [Machine-readable summary](${siteConfig.url}/ai/summary.json)
- [Machine-readable service description](${siteConfig.url}/ai/service.json)
- [FAQ as JSON](${siteConfig.url}/ai/faq.json)
`;
    writeFileSync(join(publicDir, "llms.txt"), llmsTxt);
    console.log(`[static-assets] Generated public/llms.txt (${(llmsTxt.length / 1024).toFixed(2)} KB)`);

    // 2. Generate .well-known/ai.txt
    const aiTxt = `# AI crawler policy for ${siteConfig.url}
# Prismio is open source; indexing, retrieval and citation are welcome.

User-Agent: *
Allow: /
Disallow: /api/

# Machine-readable entry points
Summary: ${siteConfig.url}/ai/summary.json
Service: ${siteConfig.url}/ai/service.json
FAQ: ${siteConfig.url}/ai/faq.json
LLMs: ${siteConfig.url}/llms.txt
Sitemap: ${siteConfig.url}/sitemap.xml
Contact: ${siteConfig.email}
`;
    writeFileSync(join(publicDir, ".well-known", "ai.txt"), aiTxt);
    console.log(`[static-assets] Generated public/.well-known/ai.txt (${(aiTxt.length / 1024).toFixed(2)} KB)`);

    // 3. Generate ai/summary.json
    const summaryJson = JSON.stringify({
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        type: "programming-language",
        version: PRISMIO_VERSION,
        status: "active development, not production-ready",
        backend: `LLVM ${LLVM_VERSION}`,
        links: {
            documentation: siteConfig.docsUrl,
            developers: siteConfig.developersUrl,
            source: siteConfig.github,
            wikidata: siteConfig.wikidata,
            rosettacode: siteConfig.rosettaCode,
            homebrew: siteConfig.homebrewTap,
            jetbrains: siteConfig.jetbrainsPlugin,
            fossunited: siteConfig.fossUnitedGrant,
            releases: `${siteConfig.github}/releases`,
            llms: `${siteConfig.url}/llms.txt`,
            faq: `${siteConfig.url}/ai/faq.json`,
            service: `${siteConfig.url}/ai/service.json`,
        },
        contact: siteConfig.email,
    }, null, 2);
    writeFileSync(join(publicDir, "ai", "summary.json"), summaryJson);
    console.log(`[static-assets] Generated public/ai/summary.json (${(summaryJson.length / 1024).toFixed(2)} KB)`);

    // 4. Generate ai/faq.json
    const faqJson = JSON.stringify({
        site: siteConfig.url,
        source: `${siteConfig.docsUrl}/faq`,
        faqs: faqItems,
    }, null, 2);
    writeFileSync(join(publicDir, "ai", "faq.json"), faqJson);
    console.log(`[static-assets] Generated public/ai/faq.json (${(faqJson.length / 1024).toFixed(2)} KB)`);

    // 5. Generate ai/service.json
    const serviceJson = JSON.stringify({
        name: siteConfig.name,
        url: siteConfig.url,
        type: "programming-language",
        description: siteConfig.description,
        version: PRISMIO_VERSION,
        status: "active development, not production-ready",
        capabilities: [
            "Statically typed systems programming",
            "Native machine-code compilation through LLVM",
            "Adaptive Inference Framework (AIF) memory-placement analysis",
            "Direct C interoperability",
            "Self-hosted compiler and toolchain",
        ],
        backend: {
            name: "LLVM",
            version: LLVM_VERSION,
        },
        links: {
            install: `${siteConfig.url}/install`,
            documentation: siteConfig.docsUrl,
            developers: siteConfig.developersUrl,
            playground: `${siteConfig.url}/playground`,
            source: siteConfig.github,
            releases: `${siteConfig.github}/releases`,
            llms: `${siteConfig.url}/llms.txt`,
            summary: `${siteConfig.url}/ai/summary.json`,
            faq: `${siteConfig.url}/ai/faq.json`,
        },
        limitations: [
            "Version 0.1 is pre-1.0 and language, library, AIF, and ABI contracts may change incompatibly.",
            "The compiler is not production-ready.",
            "Documentation pages marked Coming Soon describe unimplemented features.",
        ],
        contact: siteConfig.email,
    }, null, 2);
    writeFileSync(join(publicDir, "ai", "service.json"), serviceJson);
    console.log(`[static-assets] Generated public/ai/service.json (${(serviceJson.length / 1024).toFixed(2)} KB)`);

    // 6. Generate sitemap.xml
    const sitemapEntries = sitePages.map(({ path, priority, changeFrequency, lastmod }) => {
        const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;
        return `  <url>\n    <loc>${url}</loc>\n    ${lastmod ? `<lastmod>${lastmod}</lastmod>\n    ` : ""}<changefreq>${changeFrequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</urlset>\n`;
    writeFileSync(join(publicDir, "sitemap.xml"), sitemapXml);
    console.log(`[static-assets] Generated public/sitemap.xml (${(sitemapXml.length / 1024).toFixed(2)} KB)`);

    // 7. Generate robots.txt
    const AI_CRAWLERS = [
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-User",
        "Claude-SearchBot",
        "PerplexityBot",
        "Perplexity-User",
        "Google-Extended",
        "Applebot-Extended",
        "CCBot",
    ];
    const crawlerLines = AI_CRAWLERS.map((c) => `User-agent: ${c}`).join("\n");
    const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /api/\n\n${crawlerLines}\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`;
    writeFileSync(join(publicDir, "robots.txt"), robotsTxt);
    console.log(`[static-assets] Generated public/robots.txt (${(robotsTxt.length / 1024).toFixed(2)} KB)`);
} catch (error) {
    console.error("[static-assets] Failed to generate static assets:", error);
    process.exit(1);
}
