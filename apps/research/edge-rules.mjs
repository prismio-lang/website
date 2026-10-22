// Headers and redirects for Workers Static Assets (the `_headers` and `_redirects` files), applied by
// ../../scripts/finalize-static-site.mjs.
export const redirects = [];

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
        // The Markdown mirrors and the feeds are for machines: tell caches and crawlers what they are.
        source: "/*.md",
        values: { "Content-Type": "text/markdown; charset=utf-8" },
    },
    {
        source: "/feed.xml",
        values: { "Content-Type": "application/atom+xml; charset=utf-8" },
    },
    {
        // Not content-hashed, so not immutable: a day in the browser, a week stale-while-revalidate.
        source: "/icons/*",
        values: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
];
