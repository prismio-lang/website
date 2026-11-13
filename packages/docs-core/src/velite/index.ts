/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, s, defineCollection } from "velite";
import rehypeShiki from "@shikijs/rehype";
import prismioGrammar from "./prismio.tmLanguage.json" with { type: "json" };
import { bundledThemes } from "shiki";

// The code-block themes: Catppuccin Latte (light) and Mocha (dark), with Prismio's
// own colours on top. Every override names a `.prismio` scope
// (prismio.tmLanguage.json), and a TextMate selector that names more of a scope
// wins, so C, Rust, LLVM IR and the shell keep the base theme's colours exactly
// and only Prismio blocks change.
//
// One colour per kind of word, so a reader can tell them apart at a glance:
// control flow red, declarations mauve, modifiers maroon, concurrency pink,
// types yellow, values peach, and function names and calls blue, which is how
// Catppuccin colours them in an editor.
//
// Light mode is Latte tuned for a white block: a shade that is below 4.5:1 on
// white is darkened (same hue, lower lightness) until it passes, and dark mode is
// brightened the same way against the dark block. The blocks keep their own
// backgrounds (white and #24292e) rather than Catppuccin's, so they sit on the
// page the way they always have.

type Shade = { light: string; dark: string; fontStyle?: string };

const LIGHT_BG = "#ffffff";
const DARK_BG = "#24292e";

const PALETTE: Array<[string[], Shade]> = [
    [["keyword.control.flow.prismio", "keyword.control.import.prismio", "keyword.operator.word.prismio"],
        { light: "#D20F39", dark: "#F38BA8" }],
    [["storage.type.prismio", "storage.type.function.prismio"],
        { light: "#8839EF", dark: "#CBA6F7" }],
    [["storage.modifier.prismio"],
        { light: "#E64553", dark: "#EBA0AC" }],
    [["keyword.other.concurrency.prismio"],
        { light: "#EA76CB", dark: "#F5C2E7" }],
    [["support.type.primitive.prismio", "support.type.std.prismio", "entity.name.type.prismio"],
        { light: "#DF8E1D", dark: "#F9E2AF" }],
    [["constant.language.prismio", "constant.numeric.hex.prismio", "constant.numeric.binary.prismio",
        "constant.numeric.octal.prismio", "constant.numeric.float.prismio",
        "constant.numeric.integer.prismio", "variable.other.constant.prismio",
        "constant.character.escape.prismio"],
        { light: "#FE640B", dark: "#FAB387" }],
    [["variable.language.self.prismio"],
        { light: "#E64553", dark: "#EBA0AC", fontStyle: "italic" }],
    [["entity.name.function.declaration.prismio"],
        { light: "#1E66F5", dark: "#89B4FA", fontStyle: "bold" }],
    [["entity.name.function.call.prismio", "entity.name.function.method.prismio"],
        { light: "#1E66F5", dark: "#89B4FA" }],
    [["entity.name.label.prismio"],
        { light: "#7C7F93", dark: "#9399B2", fontStyle: "italic" }],
    [["punctuation.section.interpolation.begin.prismio", "punctuation.section.interpolation.end.prismio"],
        { light: "#D20F39", dark: "#F38BA8" }],
    [["comment.line.documentation.prismio"],
        { light: "#7C7F93", dark: "#9399B2", fontStyle: "italic" }],
];

function relativeLuminance(hex: string): number {
    const channel = (offset: number) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** The same hue, moved in lightness only as far as it takes to reach `min` against `bg`. */
function withContrast(hex: string, bg: string, mode: "light" | "dark", min = 4.5): string {
    if (!/^#[0-9a-f]{6}$/i.test(hex) || contrast(hex, bg) >= min) return hex;
    const [h, s, l0] = toHsl(hex);
    let l = l0;
    for (let i = 0; i < 100 && contrast(fromHsl(h, s, l), bg) < min; i++) {
        l = mode === "light" ? Math.max(0, l - 0.01) : Math.min(1, l + 0.01);
    }
    return fromHsl(h, s, l);
}

async function withPrismio(base: string, mode: "light" | "dark"): Promise<any> {
    const theme: any = (await bundledThemes[base as keyof typeof bundledThemes]()).default;
    const bg = mode === "light" ? LIGHT_BG : DARK_BG;
    const fit = (hex: string) => withContrast(hex, bg, mode);
    const fitted = (theme.tokenColors ?? theme.settings ?? []).map((entry: any) =>
        entry.settings?.foreground
            ? { ...entry, settings: { ...entry.settings, foreground: fit(entry.settings.foreground) } }
            : entry
    );
    const overrides = PALETTE.map(([scope, shade]) => ({
        scope,
        settings: {
            foreground: fit(shade[mode]),
            ...(shade.fontStyle ? { fontStyle: shade.fontStyle } : {}),
        },
    }));
    return {
        ...theme,
        name: `prismio-${mode}`,
        bg,
        fg: theme.colors?.["editor.foreground"] ?? theme.fg,
        colors: { ...theme.colors, "editor.background": bg },
        tokenColors: [...fitted, ...overrides],
    };
}

const prismioLight: any = await withPrismio("catppuccin-latte", "light");
const prismioDark: any = await withPrismio("catppuccin-mocha", "dark");

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
