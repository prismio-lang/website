import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/config/site";
import { absolute } from "@/libs/seo";

export const metadata: Metadata = {
    title: "About",
    description: `What ${site.name} publishes, how its results are checked, and how to cite them.`,
    alternates: { canonical: "/about" },
};

export default function Page() {
    return (
        <div className="shell">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "AboutPage",
                    url: absolute("/about"),
                    name: `About ${site.name}`,
                    isPartOf: { "@type": "WebSite", url: site.url, name: site.name },
                }}
            />
            <section className="masthead">
                <p className="eyebrow">About</p>
                <h1>A record of what the compiler taught us.</h1>
            </section>
            <div className="prose">
                <p>
                    {site.entity} Building it produces results that do not fit a reference page: why one memory
                    layout beat another, how a benchmark number can lie, which experiment was rejected and why.
                    This site keeps those results, with the method that produced them.
                </p>
                <h2>What is published here</h2>
                <p>
                    <strong>Papers</strong> state a question, the method, the measurements and what they do and do not
                    show. <strong>Notes</strong> are shorter: a decision, a negative result, a measurement trap.
                    Neither replaces the <a href={site.links.developers}>compiler reference</a>, which describes how
                    the system works today. Research explains why it works that way.
                </p>
                <h2>How results are checked</h2>
                <ul>
                    <li>Each page names the Prismio version it was measured on.</li>
                    <li>Numbers come with the command, benchmark or test that produced them, in the repository.</li>
                    <li>A page that is later found wrong is revised in place, with the change dated.</li>
                </ul>
                <h2>Citing and reusing</h2>
                <p>
                    Every page ends with a citation and a BibTeX entry, and is available as plain Markdown at its URL
                    with <code>.md</code> added. The text is under the{" "}
                    <a href={site.license} rel="license">{site.licenseName} license</a>. The whole corpus is at{" "}
                    <a href="/llms-full.txt">/llms-full.txt</a>; new pages appear in the <a href="/feed.xml">feed</a>.
                </p>
                <h2>Contact</h2>
                <p>
                    <a href={`mailto:${site.email}`}>{site.email}</a>, or open an issue on{" "}
                    <a href={site.links.github}>GitHub</a>.
                </p>
            </div>
        </div>
    );
}
