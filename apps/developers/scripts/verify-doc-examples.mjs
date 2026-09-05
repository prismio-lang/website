import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const docsRoot = resolve(import.meta.dirname, "..");
const contentRoot = join(docsRoot, "content");
const compiler = resolve(process.env.PRISMIO ?? join(docsRoot, "..", "prismio", "build", process.platform === "win32" ? "gen6.exe" : "gen6"));
const work = mkdtempSync(join(tmpdir(), "prismio-docs-"));

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : /\.mdx?$/.test(path) ? [path] : [];
    });
}

const cases = [];
const pattern = /<!--\s*prismio-check:\s*(pass|fail)\s*-->\s*```prismio[^\n]*\n([\s\S]*?)```/g;

for (const path of walk(contentRoot)) {
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(pattern)) {
        cases.push({
            expectation: match[1],
            code: match[2],
            source: relative(contentRoot, path).split(sep).join("/"),
        });
    }
}

const failures = [];

try {
    cases.forEach((test, index) => {
        const stem = `${String(index + 1).padStart(3, "0")}-${basename(test.source).replace(/\.mdx?$/, "")}`;
        const sourcePath = join(work, `${stem}.psm`);
        const outputPath = join(work, `${stem}.ll`);
        writeFileSync(sourcePath, test.code);

        const result = spawnSync(compiler, ["build", sourcePath, "-o", outputPath], {
            encoding: "utf8",
            timeout: 30_000,
        });
        const compiled = result.status === 0;
        const expectedCompile = test.expectation === "pass";

        if (compiled !== expectedCompile) {
            failures.push([
                `${test.source}: expected compile ${test.expectation}, received exit ${result.status}`,
                result.error?.message,
                result.stdout,
                result.stderr,
            ].filter(Boolean).join("\n"));
        }
    });
} finally {
    rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
    console.error(failures.join("\n\n"));
    process.exit(1);
}

console.log(`Example verification passed: ${cases.length} compiler-checked snippets using ${compiler}.`);
