/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, s, defineCollection } from "velite";
import rehypeShiki from "@shikijs/rehype";
import prismioGrammar from "./prismio.tmLanguage.json" with { type: "json" };
import { bundledThemes } from "shiki";

// The code-block themes: GitHub's light and dark, with Prismio's own colours on
// top. The two modes are tuned separately: dark keeps GitHub's classic dark
// palette, and light uses GitHub's current light palette (github-light-default),
// whose deeper shades keep at least 4.5:1 against the white block, where the
// classic light palette's pale olive and teal read as washed out. Every override names a `.prismio` scope (prismio.tmLanguage.json), and a
// TextMate selector that names more of a scope wins, so C, Rust, LLVM IR and
// the shell keep GitHub's colours exactly and only Prismio blocks change.
//
// One colour per kind of word, so a reader can tell them apart at a glance:
// control flow red, declarations violet, modifiers orange, concurrency
// magenta, built-in types green, std and user types teal, values blue, and
// function names gold, as the IntelliJ plugin colours calls (PrismioDefault /
// PrismioDarcula). The shades are GitHub's own (the classic github-light and
// github-dark palette the base themes use), so a Prismio block sits beside a C
// or shell block without a second red or a second blue; magenta, teal and gold
// are the three it adds. Light-mode shades are chosen for contrast on white.

type Shade = { light: string; dark: string; fontStyle?: string };

const PALETTE: Array<[string[], Shade]> = [
    [["keyword.control.flow.prismio", "keyword.control.import.prismio", "keyword.operator.word.prismio"],
        { light: "#C2255C", dark: "#FF7B9C" }],
    [["storage.type.prismio", "storage.type.function.prismio"],
        { light: "#7C3AED", dark: "#B392F0" }],
    [["storage.modifier.prismio"],
        { light: "#C2410C", dark: "#FFAB70" }],
    [["keyword.other.concurrency.prismio"],
        { light: "#BE185D", dark: "#F778BA" }],
    [["support.type.primitive.prismio"],
        { light: "#047857", dark: "#5FD38D" }],
    [["support.type.std.prismio", "entity.name.type.prismio"],
        { light: "#0F766E", dark: "#4FD1C5" }],
    [["constant.language.prismio", "constant.numeric.hex.prismio", "constant.numeric.binary.prismio",
        "constant.numeric.octal.prismio", "constant.numeric.float.prismio",
        "constant.numeric.integer.prismio", "variable.other.constant.prismio",
        "constant.character.escape.prismio"],
        { light: "#A16207", dark: "#E6C07B" }],
    [["variable.language.self.prismio"],
        { light: "#C2410C", dark: "#FFAB70", fontStyle: "italic" }],
    [["entity.name.function.declaration.prismio"],
        { light: "#1D4ED8", dark: "#6CB6FF", fontStyle: "bold" }],
    [["entity.name.function.call.prismio", "entity.name.function.method.prismio"],
        { light: "#2563EB", dark: "#8CC4FF" }],
    [["entity.name.label.prismio"],
        { light: "#6E7781", dark: "#959DA5", fontStyle: "italic" }],
    [["punctuation.section.interpolation.begin.prismio", "punctuation.section.interpolation.end.prismio"],
        { light: "#C2255C", dark: "#FF7B9C" }],
    [["comment.line.documentation.prismio"],
        { light: "#6E7781", dark: "#959DA5", fontStyle: "italic" }],
];

async function withPrismio(base: string, mode: "light" | "dark"): Promise<any> {
    const theme: any = (await bundledThemes[base as keyof typeof bundledThemes]()).default;
    const overrides = PALETTE.map(([scope, shade]) => ({
        scope,
        settings: {
            foreground: shade[mode],
            ...(shade.fontStyle ? { fontStyle: shade.fontStyle } : {}),
        },
    }));
    return {
        ...theme,
        name: `prismio-${mode}`,
        tokenColors: [...(theme.tokenColors ?? theme.settings ?? []), ...overrides],
    };
}

const prismioLight: any = await withPrismio("github-light-default", "light");
const prismioDark: any = await withPrismio("github-dark", "dark");

// For a site that is light only and wants Prismio's highlighting without the dual-theme setup.
export { prismioLight, prismioGrammar };

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
                            light: prismioLight,
                            dark: prismioDark,
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
