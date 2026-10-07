/* global process */
// Compiles content/releases/<version>.md into lib/releases.generated.json.
// A release is one markdown file: a frontmatter block (version, title, date, status, summary) and a body.
// The pages read the JSON, so nothing touches the file system at request time.
import {readFileSync, readdirSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {Marked} from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content", "releases");
const outFile = join(root, "lib", "releases.generated.json");
const DOCS = "https://docs.prismio.org";
const REQUIRED = ["version", "title", "date", "status", "summary"];

const slug = (text) =>
    text
        .toLowerCase()
        .replace(/<[^>]+>/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function parseFile(file) {
    const raw = readFileSync(join(contentDir, file), "utf8");
    const match = /^---\n([\s\S]*?)\n---\n/.exec(raw);
    if (!match) throw new Error(`${file}: missing frontmatter`);
    const meta = {};
    for (const line of match[1].split("\n")) {
        const kv = /^(\w+):\s*(.*)$/.exec(line);
        if (!kv) throw new Error(`${file}: cannot read frontmatter line "${line}"`);
        meta[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
    }
    for (const key of REQUIRED) if (!meta[key]) throw new Error(`${file}: frontmatter is missing "${key}"`);
    if (`${meta.version}.md` !== file) throw new Error(`${file}: version "${meta.version}" does not match the file name`);
    return {meta, body: raw.slice(match[0].length)};
}

function render(body) {
    const toc = [];
    const marked = new Marked({
        gfm: true,
        renderer: {
            heading({tokens, depth}) {
                const html = this.parser.parseInline(tokens);
                const id = slug(html);
                if (depth === 2) toc.push({id, text: html.replace(/<[^>]+>/g, "")});
                return `<h${depth} id="${id}">${html}</h${depth}>\n`;
            },
            link({href, title, tokens}) {
                const text = this.parser.parseInline(tokens);
                // A root-relative link in a release file points into the documentation.
                const target = href.startsWith("/") ? `${DOCS}${href}` : href;
                const external = !target.startsWith("#");
                const attrs = external ? ` target="_blank" rel="noopener noreferrer"` : "";
                return `<a href="${escapeHtml(target)}"${title ? ` title="${escapeHtml(title)}"` : ""}${attrs}>${text}</a>`;
            },
        },
    });
    return {html: marked.parse(body), toc};
}

const releases = readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
        const {meta, body} = parseFile(file);
        return {...meta, ...render(body)};
    });

const key = (version) => version.split(".").map(Number);
releases.sort((a, b) => {
    const [x, y] = [key(a.version), key(b.version)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0);
    return 0;
});

try {
    writeFileSync(outFile, `${JSON.stringify(releases, null, 2)}\n`);
    console.log(`[releases] Generated lib/releases.generated.json (${releases.length} release${releases.length === 1 ? "" : "s"})`);
} catch (error) {
    console.error("[releases] Failed:", error);
    process.exit(1);
}
