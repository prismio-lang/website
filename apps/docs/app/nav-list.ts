import { docsConfig } from "@/config/docs";
import { flattenNav, firstDocLink as firstLink } from "@prismio/docs-core";
import type { DocNavNode, DocsSection } from "@prismio/docs-core";

export type { DocNavNode, DocsSection };

export const DocsNavList: DocsSection[] = docsConfig.navigation;

export function flattenDocNodes(nodes: DocNavNode[]): Array<{ label: string; href: string }> {
    return flattenNav(nodes);
}

export function firstDocLink(node: DocNavNode): { label: string; href: string } | undefined {
    const link = firstLink(node as DocsSection);
    return link ? { label: node.label, href: link } : undefined;
}

export const flatDocsNav = flattenDocNodes(DocsNavList);
