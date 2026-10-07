// Headers and redirects for Workers Static Assets (the `_headers` and `_redirects` files), applied by
// ../../scripts/finalize-static-site.mjs. The redirects are the old documentation URLs that next.config.ts
// redirects() served at run time.
export const redirects = [
    { from: "/overview/introduction", to: "/start", status: 301 },
    { from: "/overview/roadmap", to: "/roadmap", status: 301 },
    { from: "/overview/versioning", to: "/releases", status: 301 },
    { from: "/getting_started/install", to: "/start/development-setup", status: 301 },
    { from: "/getting_started/hello_world", to: "/start/local-compiler-loop", status: 301 },
    { from: "/getting_started/build_run", to: "/start/local-compiler-loop", status: 301 },
    { from: "/getting_started/migration", to: "/migration", status: 301 },
    { from: "/language/syntax", to: "/compiler/frontend", status: 301 },
    { from: "/language/memory/ownership", to: "/compiler/ownership-and-drop-lowering", status: 301 },
    { from: "/language/memory/borrowing", to: "/aif/regions-views-and-provenance", status: 301 },
    { from: "/language/memory/lifetimes", to: "/aif/regions-views-and-provenance", status: 301 },
    { from: "/language/expressions/operators", to: "/compiler/frontend", status: 301 },
    { from: "/language/statements/control_flow", to: "/llvm/control-flow", status: 301 },
    { from: "/language/statements/matching", to: "/compiler/enums-and-pattern-lowering", status: 301 },
    { from: "/language/modules/imports", to: "/compiler/imports-and-symbols", status: 301 },
    { from: "/reference/compiler_flags", to: "/compiler/cli", status: 301 },
    { from: "/reference/attributes", to: "/compiler/frontend", status: 301 },
    { from: "/toolchain/compiler", to: "/compiler/overview", status: 301 },
    { from: "/toolchain/diagnostics", to: "/compiler/diagnostics", status: 301 },
    { from: "/toolchain/package_manager", to: "/tooling/ums-overview", status: 301 },
    { from: "/interop/ffi", to: "/aif/ffi-contracts", status: 301 },
    { from: "/stdlib/overview", to: "/runtime/supported-surface", status: 301 },
    { from: "/stdlib/collections", to: "/runtime/collection-representations", status: 301 },
    { from: "/spec/grammar", to: "/compiler/frontend", status: 301 },
    { from: "/spec/types", to: "/compiler/semantic-analysis-and-types", status: 301 },
    { from: "/spec/memory", to: "/aif/overview", status: 301 },
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
