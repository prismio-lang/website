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
      { source: "/overview/introduction", destination: "/start", permanent: true },
      { source: "/overview/roadmap", destination: "/roadmap", permanent: true },
      { source: "/overview/versioning", destination: "/releases", permanent: true },
      { source: "/getting_started/install", destination: "/start/development-setup", permanent: true },
      { source: "/getting_started/hello_world", destination: "/start/local-compiler-loop", permanent: true },
      { source: "/getting_started/build_run", destination: "/start/local-compiler-loop", permanent: true },
      { source: "/getting_started/migration", destination: "/migration", permanent: true },
      { source: "/language/syntax", destination: "/compiler/frontend", permanent: true },
      { source: "/language/memory/ownership", destination: "/compiler/ownership-and-drop-lowering", permanent: true },
      { source: "/language/memory/borrowing", destination: "/aif/regions-views-and-provenance", permanent: true },
      { source: "/language/memory/lifetimes", destination: "/aif/regions-views-and-provenance", permanent: true },
      { source: "/language/expressions/operators", destination: "/compiler/frontend", permanent: true },
      { source: "/language/statements/control_flow", destination: "/llvm/control-flow", permanent: true },
      { source: "/language/statements/matching", destination: "/compiler/enums-and-pattern-lowering", permanent: true },
      { source: "/language/modules/imports", destination: "/compiler/imports-and-symbols", permanent: true },
      { source: "/reference/compiler_flags", destination: "/compiler/cli", permanent: true },
      { source: "/reference/attributes", destination: "/compiler/frontend", permanent: true },
      { source: "/toolchain/compiler", destination: "/compiler/overview", permanent: true },
      { source: "/toolchain/diagnostics", destination: "/compiler/diagnostics", permanent: true },
      { source: "/toolchain/package_manager", destination: "/tooling/ums-overview", permanent: true },
      { source: "/interop/ffi", destination: "/aif/ffi-contracts", permanent: true },
      { source: "/stdlib/overview", destination: "/runtime/supported-surface", permanent: true },
      { source: "/stdlib/collections", destination: "/runtime/collection-representations", permanent: true },
      { source: "/spec/grammar", destination: "/compiler/frontend", permanent: true },
      { source: "/spec/types", destination: "/compiler/semantic-analysis-and-types", permanent: true },
      { source: "/spec/memory", destination: "/aif/overview", permanent: true },
    ];
  },
};

export default nextConfig;
