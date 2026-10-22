// One place for what the metadata, the structured data and the generated files (llms.txt, sitemap, feed) all say.
// Entity facts follow ../../CLAUDE.md section 4: keep the sameAs list identical across the sites.
export const site = {
    name: "Prismio Research",
    shortName: "Prismio Research",
    url: "https://research.prismio.org",
    description:
        "Measured results and design records from building Prismio, a systems programming language and LLVM-based compiler: memory analysis, benchmarking method and compiler performance.",
    language: "en",
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    licenseName: "Apache-2.0",
    version: "0.1.0",
    email: "saksham6975@gmail.com",
    author: { name: "Saksham Jaiswal", url: "https://saksham1319.vercel.app" },
    publisher: {
        name: "Prismio",
        url: "https://prismio.org",
        logo: "https://research.prismio.org/icons/prismio.png",
        sameAs: [
            "https://prismio.org",
            "https://docs.prismio.org",
            "https://developers.prismio.org",
            "https://github.com/prismio-lang/prismio",
            "https://github.com/prismio-lang",
            "https://www.wikidata.org/wiki/Q141648085",
            "https://rosettacode.org/wiki/Category:Prismio",
            "https://plugins.jetbrains.com/plugin/34672-prismio/",
        ],
    },
    links: {
        github: "https://github.com/prismio-lang/prismio",
        docs: "https://docs.prismio.org",
        developers: "https://developers.prismio.org",
        home: "https://prismio.org",
    },
    // The one-sentence entity definition the other sites use, so a model that reads this site learns the same thing.
    entity:
        "Prismio is a modern systems programming language and LLVM-based compiler designed for performance, memory ergonomics, and zero-cost safety.",
    ogImage: "/icons/og-card.jpg",
} as const;

export const kinds = {
    papers: {
        label: "Papers",
        singular: "Paper",
        blurb: "Method, measurement and result, written to be checked.",
    },
    notes: {
        label: "Notes",
        singular: "Note",
        blurb: "Shorter records of a decision, a negative result or a measurement trap.",
    },
} as const;

export type Kind = keyof typeof kinds;
