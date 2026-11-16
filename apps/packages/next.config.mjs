/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export: every page is built to HTML and served as a Workers Static Asset, so a page view invokes no
    // Worker. Redirects and headers live in edge-rules.mjs. Publishing goes through apps/packages-api, not this site.
    output: 'export',
    images: {unoptimized: true},
    transpilePackages: ['lucide-react'],
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default nextConfig;
