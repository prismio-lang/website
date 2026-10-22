import GithubSlugger from "github-slugger";

export interface TocItem {
    id: string;
    text: string;
    level: 2 | 3;
}

// Headings from the Markdown source, outside code fences. The slugs come from the same GithubSlugger sequence
// the heading components use, so a duplicate heading gets the same `-1` suffix in both places.
export function extractToc(raw: string): TocItem[] {
    const slugger = new GithubSlugger();
    const items: TocItem[] = [];
    let fenced = false;
    for (const line of raw.split("\n")) {
        if (/^\s*```/.test(line)) fenced = !fenced;
        if (fenced) continue;
        const match = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
        if (!match) continue;
        const text = (match[2] ?? "").replace(/[`*_]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
        items.push({ id: slugger.slug(text), text, level: match[1] === "##" ? 2 : 3 });
    }
    return items;
}
