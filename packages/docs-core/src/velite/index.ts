/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, s, defineCollection } from "velite";
import rehypeShiki from "@shikijs/rehype";
import prismioGrammar from "./prismio.tmLanguage.json" with { type: "json" };

export const docsCollection: any = defineCollection({
    name: "Docs",
    pattern: "**/*.{md,mdx}",
    schema: s
        .object({
            title: s.string().min(3),
            description: s.string().min(20).max(180),
            status: s.enum(["stable", "experimental", "planned"]).default("stable"),
            draft: s.boolean().default(false),
            version: s.string(),
            lastUpdated: s.isodate(),
            tags: s.array(s.string()).default([]),
            related: s.array(s.string()).default([]),
            raw: s.raw(),
            slug: s.path(),
            code: s.mdx(),
        }),
});

export interface DocsVeliteOptions {
    extraLangs?: any[];
    extraCollections?: Record<string, any>;
}

export function createDocsVeliteConfig(options: DocsVeliteOptions = {}): any {
    const { extraLangs = [], extraCollections = {} } = options;

    return defineConfig({
        collections: {
            docs: docsCollection,
            ...extraCollections,
        },
        mdx: {
            rehypePlugins: [
                [
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
                            {
                                ...prismioGrammar,
                                name: "prismio",
                                aliases: ["pr", "prism", "ums"],
                            },
                            ...extraLangs,
                        ],
                    },
                ],
            ],
        },
    });
}
