import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, FileWarning, GitBranch } from "lucide-react";
import { siteConfig } from "@/config/site";
import { docs } from "@/libs/velite";

export const metadata: Metadata = {
    title: "Canonical Prismio language and compiler reference",
    description: "Learn Prismio 0.1 from compiler-audited guides, language rules, formal semantics, verified examples, and permanent diagnostic pages.",
    alternates: { canonical: "/" },
};

const foundations = [
    { href: "/start/installation", label: "Install and bootstrap", detail: "Configure LLVM 22 and build the self-hosted compiler." },
    { href: "/tutorials/first-program", label: "Write a complete program", detail: "Use functions, ranges, mutable bindings, and output." },
    { href: "/language/ownership-and-borrowing", label: "Understand ownership", detail: "Learn default borrows, sink transfers, inout, and drop." },
];

const reference = [
    { href: "/language", label: "Language reference", detail: "Accepted syntax and compiler behavior, feature by feature." },
    { href: "/specification", label: "Draft specification", detail: "Grammar, types, names, evaluation, memory, and conformance." },
    { href: "/errors", label: "Error reference", detail: "Permanent pages for every negative-suite failure class." },
    { href: "/compiler/overview", label: "Compiler internals", detail: "Self-hosting, AIF, LLVM generation, bootstrap, and targets." },
];

export default function DocsHomePage() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.siteUrl,
        description: siteConfig.description,
        potentialAction: {
            "@type": "SearchAction",
            target: `${siteConfig.siteUrl}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };

    return (
        <div className="mx-auto max-w-6xl pb-16 pt-4 sm:pt-10">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <section className="border-b border-zinc-200 pb-16 dark:border-zinc-800">
                <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300">
                    <span>Prismio {siteConfig.currentVersion}</span>
                    <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">/</span>
                    <span className="text-zinc-500 dark:text-zinc-400">Compiler-audited reference</span>
                </div>
                <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-[-0.055em] text-zinc-950 sm:text-7xl dark:text-white">
                    One source of truth for Prismio.
                </h1>
                <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-600 sm:text-xl dark:text-zinc-300">
                    Documentation derived from the self-hosted compiler and its tests—written for developers, searchable by machines, and honest about what has not shipped.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                    <Link href="/start/overview" className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                        Start reading <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                    <Link href="/releases/0.1.0" className="inline-flex h-11 items-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                        Read the 0.1.0 baseline
                    </Link>
                </div>
            </section>

            <section aria-labelledby="status-heading" className="grid gap-px overflow-hidden border-b border-zinc-200 bg-zinc-200 md:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
                <h2 id="status-heading" className="sr-only">Documentation status</h2>
                <StatusFact icon={<Check size={17} />} value="Implemented" detail="Native compiler, core language, ownership, imports, FFI" />
                <StatusFact icon={<FlaskConical size={17} />} value="Experimental" detail="AIF memory policy and WebAssembly targeting" />
                <StatusFact icon={<FileWarning size={17} />} value="Coming Soon" detail="Traits, generics, packages, std modules, concurrency" />
            </section>

            <section aria-labelledby="path-heading" className="grid gap-10 border-b border-zinc-200 py-16 lg:grid-cols-[0.7fr_1.3fr] dark:border-zinc-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300">Learning path</p>
                    <h2 id="path-heading" className="mt-3 text-3xl font-bold tracking-tight">From zero to owned data.</h2>
                    <p className="mt-4 max-w-md leading-7 text-zinc-600 dark:text-zinc-300">A short route through the toolchain and the language rules that matter first.</p>
                </div>
                <ol className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {foundations.map((item, index) => (
                        <li key={item.href}>
                            <Link href={item.href} className="group grid grid-cols-[2.25rem_1fr_auto] items-start gap-4 py-5">
                                <span className="font-mono text-sm text-zinc-400">0{index + 1}</span>
                                <span>
                                    <span className="block font-semibold group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-300">{item.label}</span>
                                    <span className="mt-1 block text-sm leading-6 text-zinc-500 dark:text-zinc-300">{item.detail}</span>
                                </span>
                                <ArrowRight aria-hidden="true" size={16} className="mt-1 text-zinc-400 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </li>
                    ))}
                </ol>
            </section>

            <section aria-labelledby="reference-heading" className="py-16">
                <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300">Canonical reference</p>
                        <h2 id="reference-heading" className="mt-3 text-3xl font-bold tracking-tight">Find the rule, not a guess.</h2>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{docs.length} versioned Markdown pages</p>
                </div>
                <div className="grid border-l border-t border-zinc-200 sm:grid-cols-2 dark:border-zinc-800">
                    {reference.map((item) => (
                        <Link key={item.href} href={item.href} className="group min-h-44 border-b border-r border-zinc-200 p-6 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-white/[0.025]">
                            <GitBranch aria-hidden="true" size={18} className="text-violet-700 dark:text-violet-300" />
                            <h3 className="mt-8 text-lg font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">{item.label}</h3>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-300">{item.detail}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <footer className="flex flex-col justify-between gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 sm:flex-row dark:border-zinc-800 dark:text-zinc-300">
                <p>Canonical for Prismio 0.1.0 · Last compiler audit: 9 Aug 2026</p>
                <div className="flex gap-5">
                    <Link href="/glossary" className="hover:text-zinc-950 dark:hover:text-white">Glossary</Link>
                    <Link href="/faq" className="hover:text-zinc-950 dark:hover:text-white">FAQ</Link>
                    <Link href="/roadmap" className="hover:text-zinc-950 dark:hover:text-white">Roadmap</Link>
                </div>
            </footer>
        </div>
    );
}

function StatusFact({ icon, value, detail }: { icon: React.ReactNode; value: string; detail: string }) {
    return (
        <div className="min-h-36 bg-white p-6 dark:bg-[#0b0b0d]">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{icon}{value}</div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-300">{detail}</p>
        </div>
    );
}
