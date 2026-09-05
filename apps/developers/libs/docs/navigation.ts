import { docs, type Docs } from "@/libs/velite";
import { DocsNavList, flatDocsNav, type DocNavNode } from "@/app/nav-list";

export function findDoc(slug: string): Docs | undefined {
    return (docs as Docs[]).find((doc) => doc.slug === slug);
}

export function getPager(slug: string) {
    const unique = flatDocsNav.filter(
        (item, index, all) => all.findIndex((candidate) => candidate.href === item.href) === index,
    );
    const index = unique.findIndex((item) => item.href === `/${slug}`);

    return {
        previous: index > 0 ? unique[index - 1] : undefined,
        next: index >= 0 && index < unique.length - 1 ? unique[index + 1] : undefined,
    };
}

export function getSection(slug: string) {
    const contains = (nodes: DocNavNode[]): boolean => nodes.some((node) =>
        node.href === `/${slug}` || Boolean(node.items && contains(node.items)),
    );
    return DocsNavList.find((section) => contains(section.items));
}

export function getRelated(doc: Docs): Docs[] {
    return doc.related
        .map((slug) => findDoc(slug))
        .filter((item): item is Docs => Boolean(item));
}
