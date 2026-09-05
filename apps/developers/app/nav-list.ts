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
        label: "Compiler",
        items: [
            { label: "Architecture", href: "/compiler/overview" },
            { label: "CLI reference", href: "/compiler/cli" },
            { label: "Diagnostics", href: "/compiler/diagnostics" },
            { label: "AIF internals", href: "/compiler/aif-internals" },
            { label: "String representation", href: "/compiler/string-representation" },
            { label: "Loop guards", href: "/compiler/loop-guards" },
            { label: "Bootstrapping", href: "/compiler/bootstrap" },
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
