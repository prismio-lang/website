import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      ".velite": "./.velite",
    },
  },
  async redirects() {
    return [
      { source: "/overview/introduction", destination: "/start/overview", permanent: true },
      { source: "/overview/roadmap", destination: "/roadmap", permanent: true },
      { source: "/overview/versioning", destination: "/releases", permanent: true },
      { source: "/getting_started/install", destination: "/start/installation", permanent: true },
      { source: "/getting_started/hello_world", destination: "/start/hello-world", permanent: true },
      { source: "/getting_started/build_run", destination: "/start/build-and-run", permanent: true },
      { source: "/getting_started/migration", destination: "/migration", permanent: true },
      { source: "/language/syntax", destination: "/language", permanent: true },
      { source: "/language/memory/ownership", destination: "/language/ownership-and-borrowing", permanent: true },
      { source: "/language/memory/borrowing", destination: "/language/ownership-and-borrowing", permanent: true },
      { source: "/language/memory/lifetimes", destination: "/language/lifetimes", permanent: true },
      { source: "/language/expressions/operators", destination: "/language/operators", permanent: true },
      { source: "/language/statements/control_flow", destination: "/language/control-flow", permanent: true },
      { source: "/language/statements/matching", destination: "/language/pattern-matching", permanent: true },
      { source: "/language/modules/imports", destination: "/language/modules", permanent: true },
      { source: "/reference/compiler_flags", destination: "/compiler/cli", permanent: true },
      { source: "/reference/attributes", destination: "/language/annotations", permanent: true },
      { source: "/toolchain/compiler", destination: "/compiler/overview", permanent: true },
      { source: "/toolchain/diagnostics", destination: "/compiler/diagnostics", permanent: true },
      { source: "/toolchain/package_manager", destination: "/package-manager", permanent: true },
      { source: "/interop/ffi", destination: "/language/ffi", permanent: true },
      { source: "/stdlib/overview", destination: "/stdlib", permanent: true },
      { source: "/stdlib/collections", destination: "/stdlib/lists", permanent: true },
      { source: "/spec/grammar", destination: "/specification/grammar", permanent: true },
      { source: "/spec/types", destination: "/specification/type-system", permanent: true },
      { source: "/spec/memory", destination: "/specification/memory-model", permanent: true },
    ];
  },
};

export default nextConfig;
