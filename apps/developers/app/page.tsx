import type { Metadata } from "next";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import { DocsHomePage, generateDocsHomeMetadata } from "@prismio/docs-core";

export const metadata: Metadata = generateDocsHomeMetadata(docsConfig.site, {
    title: "Canonical Prismio compiler and implementation reference",
    description: "Learn the Prismio self-hosted compiler architecture, AIF memory model, LLVM backend, runtime, UMS, and test systems.",
});

export default function Page() {
    return <DocsHomePage config={docsConfig} docsCount={docs.length} />;
}
