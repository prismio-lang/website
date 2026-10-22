import Link from "next/link";
import type { Metadata } from "next";
import { EntryList } from "@/components/EntryList";
import { JsonLd } from "@/components/JsonLd";
import { kinds, site } from "@/config/site";
import { homeJsonLd } from "@/libs/seo";
import { entries } from "@/libs/velite";

export const metadata: Metadata = {
    title: { absolute: `${site.name}: measured results from the Prismio compiler` },
    description: site.description,
    alternates: { canonical: "/" },
};

export default function Page() {
    return (
        <div className="frame">
            <JsonLd data={homeJsonLd(entries)} />
            <section className="masthead">
                <h1>What we measured, and how to check it.</h1>
                <p className="lede">
                    {site.entity} This is where its design decisions meet evidence: the memory analysis, the
                    benchmarks, and the experiments that did not work.
                </p>
            </section>

            <h2 className="section-title">Latest</h2>
            <EntryList entries={entries} />

            <div className="column closing">
                <p>
                    Every result names the version it was measured on and where its code lives. Read the{" "}
                    <Link href="/papers">{kinds.papers.label.toLowerCase()}</Link> for the full method, or the{" "}
                    <Link href="/notes">{kinds.notes.label.toLowerCase()}</Link> for shorter records.
                </p>
            </div>
        </div>
    );
}
