import type { Metadata } from "next";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import { DocsHomePage, generateDocsHomeMetadata } from "@prismio/docs-core";

export const metadata: Metadata = generateDocsHomeMetadata(docsConfig.site, {
    title: "Canonical Prismio language and compiler reference",
    description: "Learn Prismio 0.2 from compiler-audited guides, language rules, formal semantics, verified examples, and permanent diagnostic pages.",
});

export default function Page() {
    return <DocsHomePage config={docsConfig} docsCount={docs.length} />;
}
