// Headers and redirects for Workers Static Assets (the `_headers` and `_redirects` files), applied by
// ../../scripts/finalize-static-site.mjs. They replace what next.config.mjs redirects() did at run time.
export const redirects = [
    {from: "/docs", to: "https://docs.prismio.org", status: 301},
    {from: "/playground", to: "https://play.prismio.org", status: 301},
    {from: "/packages", to: "https://packages.prismio.org", status: 301},
    {from: "/developers", to: "https://developers.prismio.org", status: 301},
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
        values: {"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"},
    },
    {
        source: "/images/*",
        values: {"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"},
    },
];
