// Headers and redirects for Workers Static Assets (the `_headers` and `_redirects` files), applied by
// ../../scripts/finalize-static-site.mjs. The redirects are the old documentation URLs that next.config.ts
// redirects() served at run time.
export const redirects = [
    { from: "/overview/introduction", to: "/start/overview", status: 301 },
    { from: "/overview/roadmap", to: "/roadmap", status: 301 },
    { from: "/overview/versioning", to: "/releases", status: 301 },
    { from: "/getting_started/install", to: "/start/installation", status: 301 },
    { from: "/getting_started/hello_world", to: "/start/hello-world", status: 301 },
    { from: "/getting_started/build_run", to: "/start/build-and-run", status: 301 },
    { from: "/getting_started/migration", to: "/migration", status: 301 },
    { from: "/language/syntax", to: "/language", status: 301 },
    { from: "/language/memory/ownership", to: "/language/ownership-and-borrowing", status: 301 },
    { from: "/language/memory/borrowing", to: "/language/ownership-and-borrowing", status: 301 },
    { from: "/language/memory/lifetimes", to: "/language/lifetimes", status: 301 },
    { from: "/language/expressions/operators", to: "/language/operators", status: 301 },
    { from: "/language/statements/control_flow", to: "/language/control-flow", status: 301 },
    { from: "/language/statements/matching", to: "/language/pattern-matching", status: 301 },
    { from: "/language/modules/imports", to: "/language/modules", status: 301 },
    { from: "/reference/compiler_flags", to: "/compiler/cli", status: 301 },
    { from: "/reference/attributes", to: "/language/annotations", status: 301 },
    { from: "/toolchain/compiler", to: "/compiler/overview", status: 301 },
    { from: "/toolchain/diagnostics", to: "/compiler/diagnostics", status: 301 },
    { from: "/toolchain/package_manager", to: "/package-manager", status: 301 },
    { from: "/interop/ffi", to: "/language/ffi", status: 301 },
    { from: "/stdlib/overview", to: "/stdlib", status: 301 },
    { from: "/stdlib/collections", to: "/stdlib/vec", status: 301 },
    { from: "/stdlib/lists", to: "/stdlib/vec", status: 301 },
    { from: "/spec/grammar", to: "/specification/grammar", status: 301 },
    { from: "/spec/types", to: "/specification/type-system", status: 301 },
    { from: "/spec/memory", to: "/specification/memory-model", status: 301 },
];

export const headers = [
    {
        source: "/*",
        values: {
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "X-Frame-Options": "SAMEORIGIN",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        },
    },
    {
        // Not content-hashed, so not immutable: a day in the browser, a week stale-while-revalidate.
        source: "/icons/*",
        values: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
];
