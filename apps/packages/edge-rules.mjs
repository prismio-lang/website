// Headers for Workers Static Assets (the `_headers` file), applied by ../../scripts/finalize-static-site.mjs.
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
        // Sign-in screens and the example package pages are not for search results.
        source: "/auth/*",
        values: {"X-Robots-Tag": "noindex, nofollow"},
    },
    {
        source: "/package/*",
        values: {"X-Robots-Tag": "noindex"},
    },
    {
        // Not content-hashed, so not immutable: a day in the browser, a week stale-while-revalidate.
        source: "/icons/*",
        values: {"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"},
    },
    {
        source: "/llms.txt",
        values: {"Cache-Control": "public, max-age=3600", "Content-Type": "text/plain; charset=utf-8"},
    },
];
