export interface DocNavNode {
    label: string;
    href?: string;
    items?: DocNavNode[];
}

export interface DocsSection extends DocNavNode {
    items: DocNavNode[];
}

export const DocsNavList: DocsSection[] = [
    {
        label: "Start contributing",
        items: [
            {label: "Contributor overview", href: "/start"},
            {label: "Repository tour", href: "/start/repository-tour"},
            {label: "Development environment", href: "/start/development-setup"},
            {label: "Local compiler loop", href: "/start/local-compiler-loop"},
            {label: "First compiler change", href: "/start/first-compiler-change"},
        ],
    },
    {
        label: "Compiler",
        items: [
            {label: "Architecture", href: "/compiler/overview"},
            {label: "Pipeline and driver", href: "/compiler/pipeline-and-driver"},
            {label: "Lexer, parser, and AST", href: "/compiler/frontend"},
            {label: "Imports and symbols", href: "/compiler/imports-and-symbols"},
            {label: "Semantic analysis and types", href: "/compiler/semantic-analysis-and-types"},
            {label: "Ownership and drop lowering", href: "/compiler/ownership-and-drop-lowering"},
            {label: "Generics and monomorphization", href: "/compiler/generics-and-monomorphization"},
            {label: "Traits, impls, and dispatch", href: "/compiler/traits-impls-and-dispatch"},
            {label: "Closures and captures", href: "/compiler/closures-and-captures"},
            {label: "Enums and pattern lowering", href: "/compiler/enums-and-pattern-lowering"},
            {label: "Loop guards", href: "/compiler/loop-guards"},
            {label: "Bootstrapping", href: "/compiler/bootstrap"},
        ],
    },
    {
        label: "AIF and memory",
        items: [
            {label: "AIF overview", href: "/aif/overview"},
            {label: "AIF internals", href: "/compiler/aif-internals"},
            {label: "Tiers and analysis domains", href: "/aif/tiers-and-analysis-domains"},
            {label: "Regions, views, and provenance", href: "/aif/regions-views-and-provenance"},
            {label: "Foreign-function contracts", href: "/aif/ffi-contracts"},
            {label: "Layout selection", href: "/aif/layout-selection"},
            {label: "Reuse, reports, and verification", href: "/aif/reuse-reports-and-verification"},
        ],
    },
    {
        label: "LLVM",
        items: [
            {label: "LLVM backend overview", href: "/llvm/overview"},
            {label: "Types and ABI", href: "/llvm/types-and-abi"},
            {label: "Functions and calls", href: "/llvm/functions-and-calls"},
            {label: "Control-flow lowering", href: "/llvm/control-flow"},
            {label: "LLVM C API bridge", href: "/llvm/llvm-c-bridge"},
            {label: "Debug information", href: "/llvm/debug-information"},
            {label: "Runtime IR and optimization", href: "/llvm/runtime-ir-and-optimization"},
        ],
    },
    {
        label: "Runtime",
        items: [
            {label: "Runtime architecture", href: "/runtime/overview"},
            {label: "String representation", href: "/compiler/string-representation"},
            {label: "Collection representations", href: "/runtime/collection-representations"},
            {label: "Allocation, arenas, RC, and cycles", href: "/runtime/allocation-arenas-rc-and-cycles"},
            {label: "Tasks and channels", href: "/runtime/tasks-and-channels"},
            {label: "Builtins, stdlib, and foreign code", href: "/runtime/supported-surface"},
            {label: "Library artifacts (.bc and .plib)", href: "/runtime/library-artifacts"},
            {label: "Platforms and packaging", href: "/runtime/platform-and-packaging"},
        ],
    },
    {
        label: "UMS and tooling",
        items: [
            {label: "UMS overview", href: "/tooling/ums-overview"},
            {label: "build.ums manifest", href: "/tooling/build-manifest"},
            {label: "Build graph and linking", href: "/tooling/build-graph-and-linking"},
            {label: "Compiler host and promotion", href: "/tooling/compiler-host-and-promotion"},
            {label: "CLI reference", href: "/compiler/cli"},
            {label: "Diagnostics", href: "/compiler/diagnostics"},
            {label: "IDE protocol", href: "/tooling/ide-protocol"},
            {label: "Debugging, targets, and tracing", href: "/tooling/debugging-targets-and-build-tracing"},
        ],
    },
    {
        label: "Testing and performance",
        items: [
            {label: "Testing overview", href: "/testing/overview"},
            {label: "Regression suite", href: "/testing/regression-suite"},
            {label: "Fixed-point verification", href: "/testing/fixed-point-verification"},
            {label: "AIF differential testing", href: "/testing/aif-differential"},
            {label: "Benchmark contract", href: "/performance/benchmark-contract"},
            {label: "Run and extend benchmarks", href: "/performance/running-adding-and-reading-results"},
            {label: "Performance investigations", href: "/performance/investigation-method"},
        ],
    },
    {
        label: "Contributor cookbook",
        items: [
            {label: "Cookbook overview", href: "/cookbook"},
            {label: "C interoperability", href: "/cookbook/c-ffi"},
            {label: "CLI arguments", href: "/cookbook/cli-arguments"},
            {label: "Add a language feature", href: "/cookbook/add-a-language-feature"},
            {label: "Add a diagnostic", href: "/cookbook/add-a-diagnostic"},
            {label: "Add a runtime or stdlib API", href: "/cookbook/add-a-runtime-or-stdlib-api"},
            {label: "Extend UMS", href: "/cookbook/extend-ums"},
            {label: "Debug a regression", href: "/cookbook/debug-a-compiler-regression"},
        ],
    },
    {
        label: "Project reference",
        items: [
            {label: "FAQ", href: "/faq"},
            {label: "Glossary", href: "/glossary"},
            {label: "Migration guides", href: "/migration"},
            {label: "Releases", href: "/releases"},
            {label: "Prismio 0.1.0", href: "/releases/0.1.0"},
            {label: "Engineering roadmap", href: "/roadmap"},
            {label: "Security and compatibility", href: "/project/security-and-compatibility"},
        ],
    },
];

export function flattenDocNodes(nodes: DocNavNode[]): Array<{ label: string; href: string }> {
    return nodes.flatMap((node) => [
        ...(node.href ? [{label: node.label, href: node.href}] : []),
        ...(node.items ? flattenDocNodes(node.items) : []),
    ]);
}

export function firstDocLink(node: DocNavNode): { label: string; href: string } | undefined {
    if (node.href) return {label: node.label, href: node.href};
    return node.items?.map(firstDocLink).find(Boolean);
}

export const flatDocsNav = flattenDocNodes(DocsNavList);
