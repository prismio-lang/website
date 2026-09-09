import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const contentRoot = new URL("../content/", import.meta.url);

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : /\.mdx?$/.test(path) ? [path] : [];
    });
}

function slugFor(path) {
    const pathSlug = relative(contentRoot.pathname, path).split(sep).join("/").replace(/\.mdx?$/, "");
    return pathSlug.endsWith("/index") ? pathSlug.slice(0, -6) : pathSlug;
}

function field(frontmatter, name) {
    return frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim();
}

function arrayField(frontmatter, name) {
    const raw = field(frontmatter, name);
    if (!raw?.startsWith("[") || !raw.endsWith("]")) return [];
    return raw.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

const files = walk(contentRoot.pathname);
const records = files.map((path) => {
    const source = readFileSync(path, "utf8");
    const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`${path}: missing YAML frontmatter`);
    const body = match[2];
    // Prose only: a fenced block is example text, and a `#` at the start of a
    // line inside one is that language's comment, not a Markdown heading. The
    // UMS lockfile sample begins `# prismio lockfile v1`, which failed the
    // duplicate-H1 rule below for a heading it does not contain.
    const prose = body.replace(/^```[\s\S]*?^```/gm, "");
    return { path, slug: slugFor(path), source, frontmatter: match[1], body, prose };
});
const slugs = new Set(records.map((record) => record.slug));
const failures = [];
const required = ["title", "description", "status", "version", "lastUpdated", "tags", "related"];

for (const record of records) {
    for (const name of required) {
        if (!field(record.frontmatter, name)) failures.push(`${record.slug}: missing ${name}`);
    }

    const status = field(record.frontmatter, "status");
    if (!new Set(["implemented", "experimental", "draft", "coming-soon"]).has(status)) {
        failures.push(`${record.slug}: invalid status ${status}`);
    }
    if (status === "coming-soon" && !/(not implemented|not included|Coming Soon|\bno\b)/i.test(record.body)) {
        failures.push(`${record.slug}: Coming Soon page must plainly state that it is not implemented`);
    }
    if (/^#\s+/m.test(record.prose)) failures.push(`${record.slug}: body must not duplicate the page H1`);

    for (const target of arrayField(record.frontmatter, "related")) {
        if (!slugs.has(target)) failures.push(`${record.slug}: related target does not exist: ${target}`);
    }

    for (const match of record.body.matchAll(/\]\(\/([^\s)#]+)(?:#[^)]+)?\)/g)) {
        const target = match[1].replace(/\/$/, "");
        if (target && !slugs.has(target)) failures.push(`${record.slug}: internal link does not exist: /${target}`);
    }
}

// ---------------------------------------------------------------------------
// Readability gates. See ../../../DOC_STYLE.md for the reasoning.
//
// **Expansions are a hard rule; the other two are ratchets.** A wrong acronym
// expansion has no backlog and never should: both glossaries once said
// "Allocation Inference Framework" while the spec, aif/README.md and
// src/aif/model.psm all said "Adaptive", and the surrounding prose was assured
// enough that nobody checked. That is the failure this catches.
//
// The other two have a real backlog, so a page is measured against
// `readability-baseline.json`: a page not listed must pass, and a listed page
// that now passes must be removed. The list only shrinks, and it is the
// worklist.
// ---------------------------------------------------------------------------
const ACRONYMS = {
    AIF: { canonical: "Adaptive Inference Framework", wrong: ["Allocation Inference Framework"] },
    UMS: { canonical: "Unified Manifest System", wrong: [] },
};

let baseline = { opensWithIdentifier: [], noRunnableBlock: [] };
try {
    baseline = JSON.parse(readFileSync(new URL("./readability-baseline.json", import.meta.url), "utf8"));
} catch { /* no baseline yet: every page is held to the rule */ }

function firstProseParagraph(prose) {
    for (const chunk of prose.split(/\n\s*\n/)) {
        const text = chunk.trim();
        if (!text || text.startsWith("#") || text.startsWith("<") || text.startsWith("|")) continue;
        return text;
    }
    return "";
}

for (const record of records) {
    for (const [acronym, { canonical, wrong }] of Object.entries(ACRONYMS)) {
        for (const variant of wrong) {
            if (record.body.includes(variant)) {
                failures.push(`${record.slug}: ${acronym} expanded as "${variant}"; it is "${canonical}"`);
            }
        }
    }

    // Rule 1: an opening that leads with a filename answers a question the
    // reader has not been given yet.
    const opening = firstProseParagraph(record.prose);
    const opensWithIdentifier = /^`[A-Za-z_][\w./-]*`/.test(opening);
    const listedOpening = baseline.opensWithIdentifier.includes(record.slug);
    if (opensWithIdentifier && !listedOpening) {
        failures.push(`${record.slug}: opens with a code identifier; lead with the problem it solves`);
    }
    if (!opensWithIdentifier && listedOpening) {
        failures.push(`${record.slug}: fixed — remove it from readability-baseline.json opensWithIdentifier`);
    }

    // Rule 2: a page with nothing to run gives the reader nothing to try.
    const hasBlock = /```(bash|prismio|text)/.test(record.body);
    const declined = Boolean(field(record.frontmatter, "no-command"));
    const listedBlock = baseline.noRunnableBlock.includes(record.slug);
    if (!hasBlock && !declined && !listedBlock) {
        failures.push(`${record.slug}: no runnable or output block; add one, or declare no-command: <reason>`);
    }
    if ((hasBlock || declined) && listedBlock) {
        failures.push(`${record.slug}: fixed — remove it from readability-baseline.json noRunnableBlock`);
    }
}

if (slugs.size !== records.length) failures.push("duplicate generated slugs detected");

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
}

console.log(`Content audit passed: ${records.length} pages, all metadata and internal links valid.`);
