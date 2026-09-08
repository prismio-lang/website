import React from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, Zap, CheckCircle2, Clock } from "lucide-react";

interface BenchmarkItem {
    name: string;
    category: string;
    profile: string;
    prismioNs: number;
    prismioDisplay: string;
    cppDisplay: string;
    rustDisplay: string;
    advantage: string;
    prismioPercent: number; // For relative bar width
    cppPercent: number;
    rustPercent: number;
}

const FEATURED: BenchmarkItem[] = [
    {
        name: "binary_search",
        category: "Algorithms",
        profile: "cpu-memory",
        prismioNs: 91603375,
        prismioDisplay: "91.6 ms",
        cppDisplay: "72.5 ms",
        rustDisplay: "132.2 ms",
        advantage: "30% faster than Rust",
        prismioPercent: 69,
        cppPercent: 55,
        rustPercent: 100,
    },
    {
        name: "recursive_tree_rebuild",
        category: "Memory",
        profile: "allocation",
        prismioNs: 346084,
        prismioDisplay: "346 μs",
        cppDisplay: "851 μs",
        rustDisplay: "486 μs",
        advantage: "2.4x faster than C++",
        prismioPercent: 41,
        cppPercent: 100,
        rustPercent: 57,
    },
    {
        name: "tokenization",
        category: "I/O",
        profile: "cpu-allocation",
        prismioNs: 150083,
        prismioDisplay: "150 μs",
        cppDisplay: "276 μs",
        rustDisplay: "968 μs",
        advantage: "1.8x faster than C++, 6.4x vs Rust",
        prismioPercent: 16,
        cppPercent: 29,
        rustPercent: 100,
    },
    {
        name: "fibonacci",
        category: "Compute",
        profile: "cpu",
        prismioNs: 11517125,
        prismioDisplay: "11.51 ms",
        cppDisplay: "11.50 ms",
        rustDisplay: "11.47 ms",
        advantage: "LLVM Machine Parity",
        prismioPercent: 100,
        cppPercent: 100,
        rustPercent: 100,
    },
];

export default function BenchmarkTeaser() {
    return (
        <section className="px-6 py-20 max-w-7xl mx-auto z-20">
            <div className="rounded-2xl bg-[#0b0c10] border border-white/[0.08] p-6 md:p-10 shadow-2xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-white/[0.06]">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono mb-3">
                            <BarChart3 size={13} />
                            <span>Transparent Verification</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            Raw speed. Verified against Clang and Rustc.
                        </h2>
                        <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
                            Evaluated across 40 standardized workloads against Clang <code className="text-zinc-200 font-mono text-xs">-O3</code> and Rustc <code className="text-zinc-200 font-mono text-xs">opt-level=3</code> with median outlier rejection.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <Link
                            href="/benchmarks"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 text-black font-bold text-xs sm:text-[13px] hover:bg-white transition-all duration-300 shadow-[0_0_25px_-5px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Explore Full 40-Workload Suite</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Compile Throughput</div>
                        <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">2.5x Faster</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">0.81s (Prismio) vs 2.03s (Clang -O3)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Memory Pauses</div>
                        <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0 ms</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Zero GC pauses via compile-time AIF model</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Canonical Coverage</div>
                        <div className="text-2xl font-bold font-mono text-white mt-1">34 / 40 Shipped</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Remaining 6 targeted for v0.2 stdlib</div>
                    </div>
                </div>

                {/* Visual Telemetry Bars */}
                <div className="space-y-4">
                    {FEATURED.map((item) => (
                        <div
                            key={item.name}
                            className="p-4 rounded-xl bg-[#07080b] border border-white/[0.04] space-y-2.5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <div className="flex items-center gap-2 font-mono">
                                    <span className="font-bold text-white">{item.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/5">
                                        {item.category}
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                                    {item.advantage}
                                </span>
                            </div>

                            {/* Comparison Progress Bars */}
                            <div className="space-y-1.5 font-mono text-[11px]">
                                {/* Prismio */}
                                <div className="flex items-center gap-3">
                                    <span className="w-16 text-indigo-400 font-semibold text-[10px]">Prismio</span>
                                    <div className="flex-1 bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all"
                                            style={{ width: `${item.prismioPercent}%` }}
                                        />
                                    </div>
                                    <span className="w-16 text-right text-white font-bold text-[10px]">
                                        {item.prismioDisplay}
                                    </span>
                                </div>

                                {/* C++ */}
                                <div className="flex items-center gap-3">
                                    <span className="w-16 text-zinc-500 text-[10px]">C++20</span>
                                    <div className="flex-1 bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-zinc-600 h-full rounded-full transition-all"
                                            style={{ width: `${item.cppPercent}%` }}
                                        />
                                    </div>
                                    <span className="w-16 text-right text-zinc-400 text-[10px]">
                                        {item.cppDisplay}
                                    </span>
                                </div>

                                {/* Rust */}
                                <div className="flex items-center gap-3">
                                    <span className="w-16 text-zinc-500 text-[10px]">Rust</span>
                                    <div className="flex-1 bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-zinc-700 h-full rounded-full transition-all"
                                            style={{ width: `${item.rustPercent}%` }}
                                        />
                                    </div>
                                    <span className="w-16 text-right text-zinc-400 text-[10px]">
                                        {item.rustDisplay}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/benchmarks"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                        <span>View the complete 40-benchmark suite with Compute, I/O, and Memory metrics</span>
                        <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
