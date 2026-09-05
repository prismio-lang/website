import { defineConfig, s, defineCollection } from "velite";
import rehypeShiki from "@shikijs/rehype";
import prismioGrammar from "./config/prismio.tmLanguage.json" with { type: "json" };

const docs = defineCollection({
    name: "Docs",
    pattern: "**/*.{md,mdx}",
    schema: s
        .object({
            title: s.string().min(3),
            description: s.string().min(20).max(180),
            status: s.enum(["implemented", "experimental", "draft", "coming-soon"]),
            version: s.string(),
            lastUpdated: s.isodate(),
            tags: s.array(s.string()).default([]),
            related: s.array(s.string()).default([]),
            raw: s.raw(),
            slug: s.path(),
            code: s.mdx(),
        })
});

export default defineConfig({
    collections: { docs },
    mdx: {
        rehypePlugins: [
            [
                // Velite and unified currently expose incompatible copies of the plugin type.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rehypeShiki as any,
                {
                    themes: {
                        light: "github-light",
                        dark: "github-dark",
                    },
                    addLanguageClass: true,
                    langs: [
                        "bash",
                        "sh",
                        "shell",
                        "zsh",
                        "powershell",
                        "c",
                        "cpp",
                        "rust",
                        "llvm",
                        "json",
                        "yaml",
                        "toml",
                        "diff",
                        // Register the Prismio language grammar
                        {
                            ...prismioGrammar,
                            name: "prismio",
                            aliases: ["pr", "prism", "ums"],
                        },
                    ],
                },
            ],
        ],
    },
});
