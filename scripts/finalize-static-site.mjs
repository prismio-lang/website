/* global process */
// Turns a vinext `output: "export"` build into a Cloudflare assets-only deployment, so a page view costs no
// Worker invocation (static asset requests are free and unlimited; Worker requests are capped at 100k/day).
//
// vinext writes the exported HTML, the `<route>.txt` navigation payloads and `404.html` to dist/client, apart from
// the Build Output that `cf deploy` uploads. This copies them into that Build Output, appends the app's edge rules
// (edge-rules.mjs) to `_headers` and writes `_redirects`, and replaces the Worker bundle with a stub that answers
// the only requests that can still reach it (a path with no asset) with the static 404 page.
//
// Run from an app directory, after `vite build`.
import {cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync} from "node:fs";
import {join, resolve} from "node:path";
import {pathToFileURL} from "node:url";

const root = process.cwd();
const exported = join(root, "dist", "client");
const worker = join(root, ".cloudflare", "output", "v0", "workers", "default");
const assets = join(worker, "assets");
const bundle = join(worker, "bundle");

const fail = (message) => {
    console.error(`[finalize-static-site] ${message}`);
    process.exit(1);
};

if (!existsSync(join(exported, "index.html")) || !existsSync(join(exported, "404.html"))) {
    fail("dist/client has no index.html/404.html: build with `output: 'export'` first (pnpm build:vinext).");
}
if (!existsSync(assets)) fail(`${assets} is missing: run the Vite build first.`);

// 1. The exported site, over the build's own assets (the build already put _next/static and public/ there).
const copied = [];
const copy = (dir, relative = "") => {
    for (const name of readdirSync(join(dir, relative))) {
        const rel = join(relative, name);
        if (statSync(join(dir, rel)).isDirectory()) copy(dir, rel);
        else {
            cpSync(join(dir, rel), join(assets, rel));
            copied.push(rel);
        }
    }
};
for (const rel of readdirSync(exported)) mkdirSync(join(assets, rel.includes(".") ? "." : rel), {recursive: true});
copy(exported);

// 2. Edge rules: the app's headers and redirects, in the files Workers Static Assets reads.
const rulesPath = join(root, "edge-rules.mjs");
const {headers = [], redirects = []} = existsSync(rulesPath) ? await import(pathToFileURL(rulesPath).href) : {};
const headersFile = join(assets, "_headers");
const generated = existsSync(headersFile) ? readFileSync(headersFile, "utf8").trimEnd() : "";
const extra = headers.map(({source, values}) => `${source}\n${Object.entries(values).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`);
writeFileSync(headersFile, `${[generated, ...extra].filter(Boolean).join("\n\n")}\n`);
if (headers.length + (generated ? generated.split("\n\n").length : 0) > 100) fail("_headers would exceed the 100-rule limit.");
if (redirects.length > 0) {
    writeFileSync(join(assets, "_redirects"), `${redirects.map(({from, to, status = 301}) => `${from} ${to} ${status}`).join("\n")}\n`);
}

// 3. The stub Worker. A request that matches no asset gets the static 404 page, nothing is rendered.
rmSync(bundle, {recursive: true, force: true});
mkdirSync(bundle, {recursive: true});
writeFileSync(
    join(bundle, "index.js"),
    `export default {
  async fetch(request, env) {
    const page = await env.ASSETS.fetch(new URL("/404.html", request.url));
    return new Response(request.method === "HEAD" ? null : page.body, {
      status: 404,
      headers: {"content-type": "text/html; charset=utf-8"},
    });
  },
};
`,
);

console.log(`[finalize-static-site] ${copied.length} exported files, ${headers.length} header rules, ${redirects.length} redirects -> ${resolve(assets)}`);
