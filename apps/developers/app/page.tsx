import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, FileWarning, GitBranch } from "lucide-react";
import { siteConfig } from "@/config/site";
import { docs } from "@/libs/velite";

export const metadata: Metadata = {
    title: "Prismio compiler developer reference",
    description: "Build, inspect, test, and extend the self-hosted Prismio compiler, AIF, LLVM backend, runtime, and UMS project system.",
    alternates: { canonical: "/" },
};

const foundations = [
    { href: "/start/repository-tour", label: "Tour the repository", detail: "Find the compiler stage, runtime component, test, or evidence record that owns a change." },
    { href: "/start/local-compiler-loop", label: "Build the local compiler", detail: "Use UMS host routing, staged promotion, and an explicit test generation." },
    { href: "/start/first-compiler-change", label: "Trace one change end to end", detail: "Carry behavior through the frontend, semantics, AIF, LLVM, runtime, tests, and docs." },
];

const reference = [
    { href: "/compiler/overview", label: "Compiler internals", detail: "Frontend, semantic analysis, ownership, generics, traits, closures, and lowering." },
    { href: "/aif/overview", label: "AIF and memory", detail: "Allocation tiers, facts, regions, views, layout, reuse, reports, and verification." },
    { href: "/llvm/overview", label: "LLVM backend", detail: "IR types, calls, control flow, the C API bridge, DWARF, and optimization." },
    { href: "/tooling/ums-overview", label: "UMS and tooling", detail: "Manifests, build graphs, compiler promotion, diagnostics, IDEs, and targets." },
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
                <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-[-0.055em] text-zinc-950 sm:text-7xl dark:text-white">
                    Work on the compiler with the whole system in view.
                </h1>
                <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-600 sm:text-xl dark:text-zinc-300">
                    A source-linked reference for Prismio contributors: frontend, semantics, AIF, LLVM, runtime, UMS, testing, performance, and self-hosting.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                    <Link href="/start" className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                        Start reading <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                    <Link href="/releases/0.1.0" className="inline-flex h-11 items-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                        Read the 0.1.0 baseline
                    </Link>
                </div>
            </section>

            <section aria-labelledby="status-heading" className="grid gap-px overflow-hidden border-b border-zinc-200 bg-zinc-200 md:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
                <h2 id="status-heading" className="sr-only">Documentation status</h2>
                <StatusFact icon={<Check size={17} />} value="Implemented" detail="Self-hosted compiler, LLVM 22 backend, UMS projects, native tasks, and typed channels" />
                <StatusFact icon={<FlaskConical size={17} />} value="Experimental" detail="AIF policy, automatic layout choices, regions, and advanced memory optimization" />
                <StatusFact icon={<FileWarning size={17} />} value="Unsupported" detail="Async I/O, networking, regex, JSON, user atomics, explicit SIMD, and registry solving" />
            </section>

            <section aria-labelledby="path-heading" className="grid gap-10 border-b border-zinc-200 py-16 lg:grid-cols-[0.7fr_1.3fr] dark:border-zinc-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300">Learning path</p>
                    <h2 id="path-heading" className="mt-3 text-3xl font-bold tracking-tight">From zero to owned data.</h2>
                    <p className="mt-4 max-w-md leading-7 text-zinc-600 dark:text-zinc-300">A short route from checkout to a tested compiler change.</p>
                </div>
                <ol className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {foundations.map((item, index) => (
                        <li key={item.href}>
                            <Link href={item.href} className="group grid grid-cols-[2.25rem_1fr_auto] items-start gap-4 py-5">
                                <span className="font-mono text-sm text-zinc-400">0{index + 1}</span>
                                <span>
                                    <span className="block font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-300">{item.label}</span>
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
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{docs.length} source-linked implementation pages</p>
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
                <p>Prismio {siteConfig.currentVersion} implementation reference · Updated 8 Sep 2026</p>
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
