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
        label: "Getting started",
        items: [
            { label: "Prismio 0.1 overview", href: "/start/overview" },
            { label: "Installation", href: "/start/installation" },
            { label: "Hello, Prismio", href: "/start/hello-world" },
            { label: "Build and run", href: "/start/build-and-run" },
        ],
    },
    {
        label: "Tutorials",
        items: [
            { label: "Tutorial index", href: "/tutorials" },
            { label: "First complete program", href: "/tutorials/first-program" },
            { label: "Model owned data", href: "/tutorials/data-model" },
        ],
    },
    {
        label: "Guides",
        items: [
            { label: "Guide index", href: "/guides" },
            { label: "Organize source", href: "/guides/modules" },
            { label: "C ownership contracts", href: "/guides/ffi" },
            { label: "Memory and AIF", href: "/guides/memory-and-aif" },
            { label: "Compiler development", href: "/guides/compiler-development" },
        ],
    },
    {
        label: "Language reference",
        items: [
            { label: "Reference index", href: "/language" },
            {
                label: "Source and declarations",
                items: [
                    { label: "Lexical structure", href: "/language/lexical-structure" },
                    { label: "Variables", href: "/language/variables" },
                    { label: "Functions", href: "/language/functions" },
                ],
            },
            {
                label: "Types and data",
                items: [
                    { label: "Types", href: "/language/types" },
                    { label: "Structs", href: "/language/structs" },
                    { label: "Enums", href: "/language/enums" },
                    { label: "Arrays and lists", href: "/language/arrays-and-lists" },
                    { label: "Optionals", href: "/language/optionals" },
                ],
            },
            {
                label: "Expressions and flow",
                items: [
                    { label: "Operators and casts", href: "/language/operators" },
                    { label: "Control flow", href: "/language/control-flow" },
                    { label: "Pattern matching", href: "/language/pattern-matching" },
                ],
            },
            {
                label: "Memory and interop",
                items: [
                    { label: "Ownership and borrowing", href: "/language/ownership-and-borrowing" },
                    { label: "Memory annotations", href: "/language/annotations" },
                    { label: "Modules and imports", href: "/language/modules" },
                    { label: "Foreign functions", href: "/language/ffi" },
                    { label: "Generics", href: "/language/generics" },
                    { label: "Error handling", href: "/language/error-handling" },
                ],
            },
            {
                label: "Planned language features",
                items: [
                    { label: "Traits · Coming Soon", href: "/language/traits" },
                    { label: "Closures · Coming Soon", href: "/language/closures" },
                    { label: "Lifetimes · Coming Soon", href: "/language/lifetimes" },
                    { label: "Macros · Coming Soon", href: "/language/macros" },
                    { label: "Concurrency · Coming Soon", href: "/language/concurrency" },
                ],
            },
        ],
    },
    {
        label: "Formal specification",
        items: [
            { label: "Specification status", href: "/specification" },
            { label: "Grammar", href: "/specification/grammar" },
            { label: "Name resolution", href: "/specification/name-resolution" },
            { label: "Type system", href: "/specification/type-system" },
            { label: "Evaluation", href: "/specification/evaluation" },
            { label: "Memory model", href: "/specification/memory-model" },
            { label: "Defined behavior", href: "/specification/behavior" },
            { label: "Conformance", href: "/specification/conformance" },
        ],
    },
    {
        label: "Compiler",
        items: [
            { label: "Architecture", href: "/compiler/overview" },
            { label: "CLI reference", href: "/compiler/cli" },
            { label: "Diagnostics", href: "/compiler/diagnostics" },
            { label: "AIF", href: "/compiler/aif" },
            { label: "String representation", href: "/compiler/string-representation" },
            { label: "Bootstrapping", href: "/compiler/bootstrap" },
            { label: "Targets and platforms", href: "/compiler/targets" },
        ],
    },
    {
        label: "Standard library",
        items: [
            { label: "Library status", href: "/stdlib" },
            { label: "Console I/O", href: "/stdlib/io" },
            { label: "Strings", href: "/stdlib/strings" },
            { label: "Lists", href: "/stdlib/lists" },
            { label: "Map", href: "/stdlib/map" },
            { label: "Option and Result", href: "/stdlib/option" },
            {
                label: "Planned modules",
                items: [
                    { label: "Filesystem · Coming Soon", href: "/stdlib/filesystem" },
                    { label: "Networking · Coming Soon", href: "/stdlib/networking" },
                    { label: "Time · Coming Soon", href: "/stdlib/time" },
                    { label: "Concurrency · Coming Soon", href: "/stdlib/concurrency" },
                ],
            },
        ],
    },
    {
        label: "Packages",
        items: [{ label: "Package manager · Coming Soon", href: "/package-manager" }],
    },
    {
        label: "Examples and cookbook",
        items: [
            { label: "Verified examples", href: "/examples" },
            { label: "Control flow", href: "/examples/control-flow" },
            { label: "Owned data", href: "/examples/owned-data" },
            { label: "Optional links", href: "/examples/optional-links" },
            { label: "Cookbook", href: "/cookbook" },
            { label: "CLI arguments", href: "/cookbook/cli-arguments" },
            { label: "C FFI wrapper", href: "/cookbook/c-ffi" },
        ],
    },
    {
        label: "Error reference",
        items: [
            { label: "Error index", href: "/errors" },
            {
                label: "Types and calls",
                items: [
                    { label: "Type mismatch", href: "/errors/type-mismatch" },
                    { label: "Integer width mismatch", href: "/errors/integer-width-mismatch" },
                    { label: "Wrong argument count", href: "/errors/wrong-arity" },
                    { label: "Duplicate overload", href: "/errors/duplicate-overload" },
                    { label: "Unknown identifier", href: "/errors/unknown-name" },
                ],
            },
            {
                label: "Ownership and memory",
                items: [
                    { label: "Use after move", href: "/errors/use-after-move" },
                    { label: "Move from borrow", href: "/errors/move-from-borrow" },
                    { label: "Move in loop", href: "/errors/move-in-loop" },
                    { label: "Invalid drop", href: "/errors/invalid-drop" },
                    { label: "Container ownership", href: "/errors/container-ownership" },
                    { label: "Optional needs unwrap", href: "/errors/optional-needs-unwrap" },
                    { label: "Return local array", href: "/errors/return-local-array" },
                    { label: "Refuted tier pin", href: "/errors/refuted-pin" },
                    { label: "Region budget exceeded", href: "/errors/region-budget-exceeded" },
                    { label: "Aliased unique parameters", href: "/errors/unique-alias" },
                ],
            },
            {
                label: "Syntax and control flow",
                items: [
                    { label: "Missing return", href: "/errors/missing-return" },
                    { label: "Unreachable code", href: "/errors/unreachable-code" },
                    { label: "Immutable assignment", href: "/errors/immutable-assignment" },
                    { label: "Expected declaration", href: "/errors/unexpected-top-level-token" },
                    { label: "Unclosed block", href: "/errors/unclosed-block" },
                    { label: "Unnamed region", href: "/errors/unnamed-region" },
                    { label: "Multiple diagnostics", href: "/errors/multiple-errors" },
                ],
            },
        ],
    },
    {
        label: "Project reference",
        items: [
            { label: "Migration guides", href: "/migration" },
            { label: "Releases and versions", href: "/releases" },
            { label: "Prismio 0.1.0", href: "/releases/0.1.0" },
            { label: "Glossary", href: "/glossary" },
            { label: "FAQ", href: "/faq" },
            { label: "Roadmap", href: "/roadmap" },
        ],
    },
];

export function flattenDocNodes(nodes: DocNavNode[]): Array<{ label: string; href: string }> {
    return nodes.flatMap((node) => [
        ...(node.href ? [{ label: node.label, href: node.href }] : []),
        ...(node.items ? flattenDocNodes(node.items) : []),
    ]);
}

export function firstDocLink(node: DocNavNode): { label: string; href: string } | undefined {
    if (node.href) return { label: node.label, href: node.href };
    return node.items?.map(firstDocLink).find(Boolean);
}

export const flatDocsNav = flattenDocNodes(DocsNavList);
