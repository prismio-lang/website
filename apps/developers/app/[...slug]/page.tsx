import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import {
    DocsArticlePage,
    createDocsNavigation,
    generateDocMetadata,
    generateDocStaticParams,
} from "@prismio/docs-core";

const navigation = createDocsNavigation(docs, docsConfig.navigation);

interface PageProps {
    params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
    return generateDocStaticParams(docs);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const doc = navigation.findDoc(slug.join("/"));
    return generateDocMetadata(doc, docsConfig.site);
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params;
    const doc = navigation.findDoc(slug.join("/"));
    if (!doc) notFound();

    return (
        <DocsArticlePage
            doc={doc}
            config={docsConfig}
            pager={navigation.getPager(doc.slug)}
            section={navigation.getSection(doc.slug)}
            related={navigation.getRelated(doc)}
            breadcrumbRootLabel="Developers"
        />
    );
}
