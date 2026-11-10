import React from 'react';
import { Cpu, Layers, Gauge, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';
import BenchmarkRunCommands from './BenchmarkRunCommands';
import type {BenchmarkEnvironment} from '@/lib/benchmarks';
import {PRISMIO_VERSION} from '@prismio/utils';

interface BenchmarkMethodologyProps {
    eliminationNs?: number;
    runs?: number;
    environment?: BenchmarkEnvironment;
}

export default function BenchmarkMethodology({
    eliminationNs = 10000,
    runs = 5,
    environment = {},
}: BenchmarkMethodologyProps) {
    return (
        <section aria-labelledby="methodology-heading" className="border-t border-white/[0.08] pt-16 space-y-10">
            {/* Header */}
            <div className="max-w-3xl space-y-3">
                <h2 id="methodology-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                    Test Environment &amp; Benchmark Methodology
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                    Exact host hardware specifications, compiler toolchains,
                    and harness parameters used for the latest checked-in benchmark run.
                </p>
            </div>

            {/* Test Environment Specifications Panel */}
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090a0e]">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
                    {/* Panel 1: Host Environment */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Cpu size={14} className="text-zinc-300" />
                            Host Hardware &amp; OS
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Processor</dt>
                                <dd className="font-mono text-zinc-200">{environment.processor ?? 'Apple M5 (10 cores)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Memory</dt>
                                <dd className="font-mono text-zinc-200">{environment.memory ?? '16 GB Unified Memory'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Operating System</dt>
                                <dd className="font-mono text-zinc-200">{environment.os ?? 'macOS 27.0 (Darwin 26A428)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Target Triple</dt>
                                <dd className="font-mono text-zinc-200">{environment.target ?? 'arm64-apple-darwin'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Power State</dt>
                                <dd className="font-mono text-zinc-200">{environment.power ?? 'AC Power (No throttling)'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Panel 2: Toolchains & Compilers */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Layers size={14} className="text-zinc-300" />
                            Toolchains &amp; Compilers
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Prismio</dt>
                                <dd className="font-mono text-purple-300 font-medium">
                                    {environment.prismio ?? PRISMIO_VERSION.replace(/^v/, '')} <span className="text-zinc-400 font-normal">(LLVM {environment.llvm ?? '23.1.1'})</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Clang++</dt>
                                <dd className="font-mono text-sky-300 font-medium">
                                    {environment.clang ?? '23.1.1'} <span className="text-zinc-400 font-normal">(C++20)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Rustc</dt>
                                <dd className="font-mono text-orange-300 font-medium">
                                    {environment.rustc ?? '1.97.1'} <span className="text-zinc-400 font-normal">(Edition 2021)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Timing Harness</dt>
                                <dd className="font-mono text-zinc-200">{environment.harness ?? 'benchmarks/run.py (v1)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">LLVM Backend</dt>
                                <dd className="font-mono text-zinc-200">{environment.llvm ? `LLVM ${environment.llvm}` : 'Homebrew LLVM 23'}</dd>
                            </div>
                            {environment.prismioProfile && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-zinc-400">Prismio compiler</dt>
                                    <dd className="font-mono text-zinc-200">{environment.prismioProfile} build</dd>
                                </div>
                            )}
                            {environment.source && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-zinc-400">Source</dt>
                                    <dd className="font-mono text-zinc-200">{environment.source}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Panel 3: Measurement Harness */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Gauge size={14} className="text-zinc-300" />
                            Measurement Parameters
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Sampling</dt>
                                <dd className="font-mono text-zinc-200">{runs} independent runs / arm</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Reported Metric</dt>
                                <dd className="font-mono text-zinc-200">Median elapsed nanoseconds</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Memory Metric</dt>
                                <dd className="font-mono text-zinc-200">Peak RSS (task_info)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Correctness</dt>
                                <dd className="font-mono text-zinc-200">64-bit checksum verification</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">DCE Filter</dt>
                                <dd className="font-mono text-zinc-200">≤ {(eliminationNs / 1000).toFixed(0)} µs (excluded)</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Run & Reproduce Locally Section */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090a0e] p-6 space-y-4">
                <div className="flex items-center gap-2 text-zinc-200">
                    <Terminal size={15} className="text-zinc-300" />
                    <h3 className="text-sm font-semibold text-white">
                        Run &amp; Reproduce Locally
                    </h3>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    The harness (<code className="text-zinc-300">benchmarks/run.py</code>), benchmark sources, and checked-in results
                    are part of the open-source repository. To build and execute the entire differential suite locally:
                </p>

                <div className="max-w-xl">
                    <BenchmarkRunCommands />
                </div>
            </div>
        </section>
    );
}
