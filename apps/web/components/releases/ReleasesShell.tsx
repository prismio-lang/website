import type {ReactNode} from "react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

/** The page frame the install page uses: dark ground, a glow and a grid behind the header, then the footer. */
export default function ReleasesShell({children}: {children: ReactNode}) {
    return (
        <div className="relative min-h-screen overflow-x-clip bg-[#070709] text-[#e4e4e7] selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(67,56,202,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            <HeaderMain />
            {children}
            <FooterMain />
        </div>
    );
}
