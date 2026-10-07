import type {ReactNode} from "react";
import {pageMetadata} from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Install Prismio — Native Systems Language Toolchain",
    description: "Install the Prismio native systems programming language toolchain on macOS, Linux, or Windows, or build the compiler from source.",
    path: "/install",
});

export default function InstallLayout({children}: Readonly<{children: ReactNode}>) {
    return children;
}
