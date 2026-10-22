import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryList } from "@/components/EntryList";
import { JsonLd } from "@/components/JsonLd";
import { kinds, site, type Kind } from "@/config/site";
import { indexJsonLd } from "@/libs/seo";
import { byKind } from "@/libs/velite";

export const dynamicParams = false;

export function generateStaticParams() {
    return Object.keys(kinds).map((kind) => ({ kind }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
    const { kind } = await params;
    const info = kinds[kind as Kind];
    if (!info) return {};
    return {
        title: info.label,
        description: `${info.blurb} ${site.name}.`,
        alternates: { canonical: `/${kind}` },
    };
}

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
    const { kind } = await params;
    const info = kinds[kind as Kind];
    if (!info) notFound();
    const entries = byKind(kind);
    return (
        <div className="frame">
            <JsonLd data={indexJsonLd(kind as Kind, entries)} />
            <section className="masthead">
                <h1>{info.label}</h1>
                <p className="lede">{info.blurb}</p>
            </section>
            <EntryList entries={entries} />
        </div>
    );
}
