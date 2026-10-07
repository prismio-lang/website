import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: every page is built to HTML and served as a Workers Static Asset, so a page view invokes no
  // Worker. Redirects and headers live in edge-rules.mjs; images cannot be optimised at run time.
  output: "export",
  images: { unoptimized: true },
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      ".velite": "./.velite",
    },
  },
};

export default nextConfig;
