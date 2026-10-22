import { defineConfig, s } from "velite";
import rehypeShiki from "@shikijs/rehype";
import { prismioGrammar, prismioLight } from "@prismio/docs-core/velite";

const person = s.object({ name: s.string(), url: s.string().optional() });

export default defineConfig({
    collections: {
        research: {
            name: "Research",
            pattern: "{papers,notes}/**/*.{md,mdx}",
            schema: s
                .object({
                    title: s.string().min(3).max(110),
                    // The meta description and the snippet an answer engine quotes: one self-contained sentence or two.
                    description: s.string().min(20).max(180),
                    // The paper's abstract, shown on the page and sent as citation_abstract.
                    abstract: s.string().min(80).max(1500),
                    authors: s.array(person).default([{ name: "Saksham Jaiswal", url: "https://saksham1319.vercel.app" }]),
                    status: s.enum(["preprint", "published", "revised"]).default("preprint"),
                    draft: s.boolean().default(false),
                    published: s.isodate(),
                    updated: s.isodate(),
                    version: s.string(),
                    tags: s.array(s.string()).default([]),
                    related: s.array(s.string()).default([]),
                    // Short, self-contained statements of what was found: what a reader or a model lifts first.
                    findings: s.array(s.string()).default([]),
                    faq: s.array(s.object({ q: s.string(), a: s.string() })).default([]),
                    // Where the numbers and the code live, so a reader can rerun them.
                    evidence: s.array(s.object({ label: s.string(), url: s.string() })).default([]),
                    raw: s.raw(),
                    slug: s.path(),
                    code: s.mdx(),
                })
                .transform((data) => {
                    const [folder = "papers", ...rest] = data.slug.split("/");
                    const words = data.raw.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
                    return {
                        ...data,
                        kind: folder === "notes" ? ("note" as const) : ("paper" as const),
                        folder,
                        name: rest.join("/"),
                        minutes: Math.max(1, Math.round(words / 230)),
                    };
                }),
        },
    },
    mdx: {
        rehypePlugins: [
            [
                rehypeShiki,
                {
                    theme: prismioLight,
                    addLanguageClass: true,
                    langs: [
                        "bash", "sh", "shell", "c", "cpp", "rust", "llvm", "json", "yaml", "toml", "diff", "text",
                        { ...prismioGrammar, name: "prismio", aliases: ["pr", "prism", "ums"] },
                    ],
                },
            ],
        ],
    },
});
