import type {Metadata} from "next";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";
import {PackageDetail} from "@/components/PackageDetail";
import {REGISTRY_PACKAGES, findPackage} from "@/lib/packages";

type Params = { name: string[] };

// A static export: one page per listed package, and a name that is not listed is the 404 page.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
    return REGISTRY_PACKAGES.map((p) => ({name: p.name.split("/")}));
}

function packageName(segments: string[]) {
    return decodeURIComponent(segments.join("/"));
}

export async function generateMetadata({params}: { params: Promise<Params> }): Promise<Metadata> {
    const pkg = findPackage(packageName((await params).name));
    return {
        title: pkg ? pkg.name : "Package not found",
        description: pkg?.description,
        // The listing is a preview with example packages: keep these pages out of search and answer engines.
        robots: {index: false, follow: true},
    };
}

export default async function PackagePage({params}: { params: Promise<Params> }) {
    const pkg = findPackage(packageName((await params).name));
    if (!pkg) return null; // unreachable: dynamicParams is false

    return (
        <div className="relative min-h-screen">
            <HeaderMain />
            <main className="relative z-10">
                <PackageDetail pkg={pkg} />
            </main>
            <FooterMain />
        </div>
    );
}
