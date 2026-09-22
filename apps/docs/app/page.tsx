import type { Metadata } from "next";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import { DocsHomePage } from "@prismio/docs-core";

export const metadata: Metadata = {
    title: "Canonical Prismio language and compiler reference",
    description: "Learn Prismio 0.1 from compiler-audited guides, language rules, formal semantics, verified examples, and permanent diagnostic pages.",
    alternates: { canonical: "/" },
};

export default function Page() {
    return <DocsHomePage config={docsConfig} docs={docs} />;
}
