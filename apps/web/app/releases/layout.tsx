import type {ReactNode} from "react";
import ReleasesShell from "@/components/releases/ReleasesShell";

export default function ReleasesLayout({children}: Readonly<{children: ReactNode}>) {
    return <ReleasesShell>{children}</ReleasesShell>;
}
