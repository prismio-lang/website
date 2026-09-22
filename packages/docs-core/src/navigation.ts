import Slugger from "github-slugger";
import { marked } from "marked";
import type { DocNavNode, DocRecord, DocsSection, Heading } from "./types";

const slugger = new Slugger();

export function keyFor(labels: string[]): string {
    return labels.join("/");
}

export function activeBranch(nodes: DocNavNode[], pathname: string, parents: string[] = []): string[] {
    for (const node of nodes) {
        const key = keyFor([...parents, node.label]);
        if (node.href === pathname) {
            return parents.map((_, index) => keyFor(parents.slice(0, index + 1)));
        }
        if (node.items) {
            const child = activeBranch(node.items, pathname, [...parents, node.label]);
            if (child.length) {
                return [key, ...child.filter((item) => item !== key)];
            }
        }
    }
    return [];
}

export function flattenNav(nodes: DocNavNode[]): Array<{ label: string; href: string }> {
    const flattened: Array<{ label: string; href: string }> = [];
    for (const node of nodes) {
        if (node.href) {
            flattened.push({ label: node.label, href: node.href });
        }
        if (node.items) {
            flattened.push(...flattenNav(node.items));
        }
    }
    return flattened;
}

export function firstDocLink(section: DocsSection): string | undefined {
    for (const item of section.items) {
        if (item.href) return item.href;
        if (item.items) {
            const nested = flattenNav(item.items);
            if (nested[0]?.href) return nested[0].href;
        }
    }
    return undefined;
}

export function getHeadings(markdownText: string | undefined): Heading[] {
    const headings: Heading[] = [];
    if (!markdownText) return headings;

    slugger.reset();
    const tokens = marked.lexer(markdownText);

    tokens.forEach((token) => {
        if (token.type === "heading") {
            headings.push({
                level: token.depth,
                text: token.text,
                id: slugger.slug(token.text),
            });
        }
    });

    return headings;
}

export function createDocsNavigation(docs: DocRecord[], navList: DocsSection[]) {
    const flatNav = flattenNav(navList);
    const uniqueNav = flatNav.filter(
        (item, index, all) => all.findIndex((candidate) => candidate.href === item.href) === index,
    );

    function findDoc(slug: string): DocRecord | undefined {
        return docs.find((doc) => doc.slug === slug);
    }

    function getPager(slug: string) {
        const normalized = slug.startsWith("/") ? slug : `/${slug}`;
        const index = uniqueNav.findIndex((item) => item.href === normalized);

        return {
            previous: index > 0 ? uniqueNav[index - 1] : undefined,
            next: index >= 0 && index < uniqueNav.length - 1 ? uniqueNav[index + 1] : undefined,
        };
    }

    function getSection(slug: string): DocsSection | undefined {
        const normalized = slug.startsWith("/") ? slug : `/${slug}`;
        const contains = (nodes: DocNavNode[]): boolean =>
            nodes.some((node) => node.href === normalized || Boolean(node.items && contains(node.items)));

        return navList.find((section) => contains(section.items));
    }

    function getRelated(doc: DocRecord): DocRecord[] {
        return doc.related
            .map((slug) => findDoc(slug))
            .filter((item): item is DocRecord => Boolean(item));
    }

    return {
        flatNav: uniqueNav,
        findDoc,
        getPager,
        getSection,
        getRelated,
    };
}
