import type { Metadata } from "next";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import { DocsHomePage } from "@prismio/docs-core";

export const metadata: Metadata = {
    title: "Canonical Prismio compiler and implementation reference",
    description: "Learn the Prismio self-hosted compiler architecture, AIF memory model, LLVM backend, runtime, UMS, and test systems.",
    alternates: { canonical: "/" },
};

export default function Page() {
    return <DocsHomePage config={docsConfig} docs={docs} />;
}
