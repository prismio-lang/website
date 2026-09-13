import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    CircleSlash2,
    FileText,
    Gauge,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";

const RESULTS = [
    {
        name: "tokenization",
        profile: "CPU + allocation",
        prismio: "147.8 μs",
        cpp: "265.1 μs",
        rust: "1.02 ms",
        reading: "Prismio leads this string-scanning workload in the checked-in run.",
    },
    {
        name: "recursive_tree_rebuild",
        profile: "Allocation + ownership",
        prismio: "393.7 μs",
        cpp: "874.1 μs",
        rust: "494.7 μs",
        reading: "A reuse-oriented tree update is faster than both comparison arms here.",
    },
    {
        name: "binary_search",
        profile: "CPU + memory",
        prismio: "89.81 ms",
        cpp: "73.06 ms",
        rust: "132.71 ms",
        reading: "C++ is faster; Prismio is faster than Rust in this run.",
    },
    {
        name: "fibonacci",
        profile: "CPU",
        prismio: "12.70 ms",
        cpp: "11.57 ms",
        rust: "11.52 ms",
        reading: "All three implementations land in the same range.",
    },
];

const COVERAGE = [
    { label: "Algorithms", implemented: 13, unsupported: 1 },
    { label: "Data structures", implemented: 6, unsupported: 5 },
    { label: "Compute", implemented: 14, unsupported: 4 },
    { label: "Memory", implemented: 6, unsupported: 1 },
    { label: "I/O and parsing", implemented: 6, unsupported: 5 },
    { label: "Adversarial", implemented: 12, unsupported: 0 },
];

const UNAVAILABLE = [
    {
        title: "Standard containers and parsing",
        detail: "Deque/linked lists, ordered maps and sets, priority queues, map deletion, regular expressions, JSON, and generic serialization.",
    },
    {
        title: "Advanced concurrency",
        detail: "User-facing atomics, mutexes, work-stealing pools, and an async I/O runtime. The supported model is native OS threads with blocking typed channels.",
    },
    {
        title: "System and optimization APIs",
        detail: "Sockets, memory-mapped I/O, explicit SIMD types, and custom collection allocators.",
    },
];

export default function BenchmarksPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(ellipse_at_26%_6%,rgba(67,56,202,0.18),transparent_54%)]"/>

            <HeaderMain/>

            <main className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-16 md:pt-24">
                <section className="grid gap-10 border-b border-white/[0.09] pb-16 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                            Results, context, and the workloads Prismio cannot run yet.
                        </h1>
                        <p className="mt-7 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
                            The maintained suite compares the same algorithm in Prismio, C++, and Rust.
                            It reports medians instead of a single winning number—and marks missing language
                            or standard-library capabilities as unsupported rather than replacing them with stand-ins.
                        </p>
                    </div>

                    <aside className="self-end border-l border-white/[0.1] pl-5 lg:col-span-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                            <Gauge size={16} className="text-indigo-300"/>
                            Latest checked-in run
                        </div>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Generated</dt>
                                <dd className="text-zinc-200">07 Sep 2026</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Samples per arm</dt>
                                <dd className="text-zinc-200">5</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Reported value</dt>
                                <dd className="text-zinc-200">Elapsed median</dd>
                            </div>
                        </dl>
                    </aside>
                </section>

                <section className="py-20" aria-labelledby="coverage-heading">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="coverage-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                Coverage is part of the result.
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                                57 of 73 cataloged workloads are implemented. The remaining 16 make an
                                absence visible instead of allowing a bespoke benchmark-only substitute.
                            </p>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 border-y border-white/[0.08] text-xs text-zinc-500">
                                <div className="py-3">Category</div>
                                <div className="py-3 text-right">Implemented</div>
                                <div className="py-3 text-right">Unsupported</div>
                            </div>
                            {COVERAGE.map((item) => (
                                <div key={item.label} className="grid grid-cols-[1fr_auto_auto] gap-x-5 border-b border-white/[0.08] text-sm">
                                    <div className="py-4 text-zinc-200">{item.label}</div>
                                    <div className="py-4 text-right text-emerald-300">{item.implemented}</div>
                                    <div className="py-4 text-right text-zinc-500">{item.unsupported || "—"}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.09] py-20" aria-labelledby="results-heading">
                    <div className="max-w-3xl">
                        <h2 id="results-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                            Four readings from the current suite.
                        </h2>
                        <p className="mt-5 text-base leading-7 text-zinc-400">
                            These examples deliberately include wins, losses, and parity. Units are elapsed-time medians;
                            they are only meaningful in the context of the full checked-in harness.
                        </p>
                    </div>

                    <div className="mt-12 overflow-x-auto border-y border-white/[0.09]">
                        <table className="w-full min-w-[46rem] text-left">
                            <thead className="border-b border-white/[0.08] text-xs text-zinc-500">
                                <tr>
                                    <th className="px-0 py-4 font-medium">Workload</th>
                                    <th className="px-4 py-4 text-right font-medium">Prismio</th>
                                    <th className="px-4 py-4 text-right font-medium">C++20</th>
                                    <th className="px-4 py-4 text-right font-medium">Rust</th>
                                    <th className="py-4 pl-8 font-medium">Reading</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RESULTS.map((result) => (
                                    <tr key={result.name} className="border-b border-white/[0.08] last:border-b-0">
                                        <td className="py-6 pr-4">
                                            <div className="font-mono text-sm font-medium text-zinc-100">{result.name}</div>
                                            <div className="mt-1 text-xs text-zinc-500">{result.profile}</div>
                                        </td>
                                        <td className="px-4 py-6 text-right font-mono text-sm font-medium text-white">{result.prismio}</td>
                                        <td className="px-4 py-6 text-right font-mono text-sm text-zinc-400">{result.cpp}</td>
                                        <td className="px-4 py-6 text-right font-mono text-sm text-zinc-400">{result.rust}</td>
                                        <td className="py-6 pl-8 text-sm leading-6 text-zinc-400">{result.reading}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid gap-10 border-t border-white/[0.09] py-20 lg:grid-cols-12 lg:gap-16" aria-labelledby="unsupported-heading">
                    <div className="lg:col-span-4">
                        <h2 id="unsupported-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                            Unsupported means exactly that.
                        </h2>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                            The suite does not award a comparison result when Prismio lacks the ordinary feature
                            the workload is meant to evaluate.
                        </p>
                    </div>
                    <div className="divide-y divide-white/[0.08] lg:col-span-8">
                        {UNAVAILABLE.map((item) => (
                            <article key={item.title} className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[1.15rem_1fr]">
                                <CircleSlash2 size={16} className="mt-1 text-amber-200"/>
                                <div>
                                    <h3 className="font-medium text-zinc-200">{item.title}</h3>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{item.detail}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="border-t border-white/[0.09] py-20" aria-labelledby="method-heading">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="method-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                How to read the numbers.
                            </h2>
                        </div>
                        <div className="divide-y divide-white/[0.08] lg:col-span-8">
                            <article className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[10rem_1fr]">
                                <h3 className="text-sm font-medium text-zinc-200">Equivalent programs</h3>
                                <p className="text-sm leading-6 text-zinc-400">The suite requires the three arms to express the same algorithm, not merely return the same checksum. Checksums are validated on each run.</p>
                            </article>
                            <article className="grid gap-4 py-5 sm:grid-cols-[10rem_1fr]">
                                <h3 className="text-sm font-medium text-zinc-200">Build commands</h3>
                                <p className="text-sm leading-6 text-zinc-400">The checked-in run uses Prismio’s native build path, Clang with <code className="font-mono text-zinc-300">-O3 -std=c++20 -pthread</code>, and Rust with <code className="font-mono text-zinc-300">-C opt-level=3</code>.</p>
                            </article>
                            <article className="grid gap-4 py-5 sm:grid-cols-[10rem_1fr]">
                                <h3 className="text-sm font-medium text-zinc-200">Caveats matter</h3>
                                <p className="text-sm leading-6 text-zinc-400">Container policies differ across languages; file workloads depend on page cache; and native-task tests include thread creation and joining. A small delta is not a universal language verdict.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.09] py-16">
                    <div className="grid gap-8 rounded-2xl bg-[#0b0c10] p-7 ring-1 ring-white/[0.08] md:grid-cols-[1fr_auto] md:items-center md:p-10">
                        <div>
                            <div className="flex items-center gap-2 text-zinc-200">
                                <FileText size={17} className="text-indigo-300"/>
                                <h2 className="text-xl font-semibold tracking-[-0.02em]">Reproduce or challenge a result.</h2>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                                The harness, benchmark sources, unsupported-workload records, and raw checked-in results
                                are part of the Prismio repository.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://github.com/prismio-lang/prismio/tree/main/benchmarks"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Open the suite
                                <ArrowUpRight size={16}/>
                            </a>
                            <Link
                                href="/roadmap"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Read the roadmap
                                <ArrowRight size={16}/>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain/>
        </div>
    );
}
