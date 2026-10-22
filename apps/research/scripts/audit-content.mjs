/* global process */
// Checks the research content before it is published: what the schema cannot say.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const all = JSON.parse(readFileSync(join(root, ".velite", "research.json"), "utf8"));
const entries = all.filter((entry) => !entry.draft);
const slugs = new Set(entries.map((entry) => entry.slug));
const staticRoutes = new Set(["", "papers", "notes", "about"]);
const failures = [];

const titles = new Map();
const descriptions = new Map();

for (const entry of entries) {
    const at = entry.slug;
    const parts = entry.slug.split("/");
    if (parts.length !== 2) failures.push(`${at}: an entry is content/<papers|notes>/<name>.md, one level deep`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(parts[1] ?? "")) failures.push(`${at}: the file name must be lowercase words joined by hyphens`);
    if (entry.updated < entry.published) failures.push(`${at}: updated is before published`);
    if (entry.tags.length < 2) failures.push(`${at}: give it at least two tags; they are its keywords`);
    if (entry.kind === "paper" && entry.findings.length < 2) failures.push(`${at}: a paper states its findings (at least two) so they can be quoted`);
    if (entry.kind === "paper" && entry.evidence.length < 1) failures.push(`${at}: a paper links the code or data that reproduces it`);
    if (/^#\s/.test(entry.raw.trimStart())) failures.push(`${at}: the title is the page heading; start the body with prose, not "# ..."`);
    if (entry.abstract.trim() === entry.description.trim()) failures.push(`${at}: abstract and description are the same text; the description is the snippet, the abstract is the summary`);
    if (/twitter|x\.com\//i.test(entry.raw)) failures.push(`${at}: no Twitter/X links or metadata`);
    if (/Allocation Inference Framework/i.test(entry.raw + entry.abstract)) failures.push(`${at}: AIF is the Adaptive Inference Framework`);

    for (const related of entry.related) {
        if (!slugs.has(related)) failures.push(`${at}: related "${related}" is not an entry`);
        if (related === at) failures.push(`${at}: related points at itself`);
    }

    // Root-relative links must land on an entry or a fixed page.
    for (const match of entry.raw.matchAll(/\]\((\/[^)\s#]*)(#[^)]*)?\)/g)) {
        const target = (match[1] ?? "").replace(/^\//, "").replace(/\.md$/, "");
        if (!staticRoutes.has(target) && !slugs.has(target)) failures.push(`${at}: link /${target} does not resolve`);
    }

    if (titles.has(entry.title)) failures.push(`${at}: same title as ${titles.get(entry.title)}`);
    titles.set(entry.title, at);
    if (descriptions.has(entry.description)) failures.push(`${at}: same description as ${descriptions.get(entry.description)}`);
    descriptions.set(entry.description, at);
}

if (failures.length > 0) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
}
console.log(`Content audit passed: ${entries.length} entries, all metadata and internal links valid.`);
