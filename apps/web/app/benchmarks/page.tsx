'use client';

import React, { useState, useMemo } from 'react';
import HeaderMain from '@/components/HeaderMain';
import FooterMain from '@/components/FooterMain';
import { 
    BarChart3, 
    Zap, 
    Cpu, 
    Search, 
    Filter, 
    ArrowUpDown, 
    CheckCircle2, 
    Clock, 
    ExternalLink, 
    Terminal, 
    Info 
} from 'lucide-react';
import Link from 'next/link';

interface BenchmarkData {
    name: string;
    category: 'algorithms' | 'data_structures' | 'compute' | 'memory' | 'io';
    profile: string;
    status: 'implemented' | 'unsupported';
    missing_feature?: string;
    prismio_ns?: number;
    cpp_ns?: number;
    rust_ns?: number;
}

const rawBenchmarks: BenchmarkData[] = [
    { name: 'fibonacci', category: 'algorithms', profile: 'cpu', status: 'implemented', prismio_ns: 11517125, cpp_ns: 11499958, rust_ns: 11474875 },
    { name: 'prime_sieve', category: 'algorithms', profile: 'cpu-memory', status: 'implemented', prismio_ns: 809334, cpp_ns: 516542, rust_ns: 819834 },
    { name: 'gcd_lcm', category: 'algorithms', profile: 'cpu', status: 'implemented', prismio_ns: 24465625, cpp_ns: 22883958, rust_ns: 24966583 },
    { name: 'binary_search', category: 'algorithms', profile: 'cpu-memory', status: 'implemented', prismio_ns: 91603375, cpp_ns: 72465417, rust_ns: 132231791 },
    { name: 'quicksort', category: 'algorithms', profile: 'cpu-memory', status: 'implemented', prismio_ns: 4817958, cpp_ns: 4453750, rust_ns: 4450791 },
    { name: 'mergesort', category: 'algorithms', profile: 'cpu-memory', status: 'implemented', prismio_ns: 5858666, cpp_ns: 3679459, rust_ns: 5019209 },
    { name: 'string_search', category: 'algorithms', profile: 'cpu-allocation', status: 'implemented', prismio_ns: 124583, cpp_ns: 92084, rust_ns: 164542 },
    { name: 'graph_bfs', category: 'algorithms', profile: 'memory', status: 'implemented', prismio_ns: 747334, cpp_ns: 599666, rust_ns: 596542 },
    { name: 'knapsack', category: 'algorithms', profile: 'cpu-memory', status: 'implemented', prismio_ns: 148500, cpp_ns: 146125, rust_ns: 435208 },
    { name: 'tree_traversal', category: 'algorithms', profile: 'memory', status: 'implemented', prismio_ns: 400000, cpp_ns: 409250, rust_ns: 381167 },

    { name: 'hashmap_insert_lookup', category: 'data_structures', profile: 'memory-allocation', status: 'implemented', prismio_ns: 9771125, cpp_ns: 8146666, rust_ns: 8309916 },
    { name: 'vector_growth', category: 'data_structures', profile: 'allocation', status: 'implemented', prismio_ns: 11437542, cpp_ns: 11306791, rust_ns: 10270917 },
    { name: 'vector_iteration', category: 'data_structures', profile: 'memory', status: 'implemented', prismio_ns: 76427542, cpp_ns: 77053083, rust_ns: 74835667 },
    { name: 'key_value_update', category: 'data_structures', profile: 'memory', status: 'implemented', prismio_ns: 11062625, cpp_ns: 5641625, rust_ns: 8622459 },
    { name: 'linked_list', category: 'data_structures', profile: 'allocation', status: 'unsupported', missing_feature: 'Standard LinkedList / Deque container (targeted for v0.2)' },
    { name: 'binary_search_tree', category: 'data_structures', profile: 'memory-allocation', status: 'unsupported', missing_feature: 'Ordered balanced BTreeMap container (targeted for v0.2)' },
    { name: 'priority_queue', category: 'data_structures', profile: 'cpu-memory', status: 'unsupported', missing_feature: 'Binary heap PriorityQueue in stdlib (targeted for v0.2)' },
    { name: 'mixed_map_removal', category: 'data_structures', profile: 'memory-allocation', status: 'unsupported', missing_feature: 'Map tombstone/shift deletion API (targeted for v0.2)' },

    { name: 'matrix_multiply', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 4316042, cpp_ns: 4290375, rust_ns: 4314875 },
    { name: 'mandelbrot', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 3825375, cpp_ns: 2969709, rust_ns: 3835084 },
    { name: 'fft', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 4785125, cpp_ns: 2681416, rust_ns: 3023917 },
    { name: 'numerical_integration', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 2182167, cpp_ns: 2152292, rust_ns: 2159708 },
    { name: 'vector_dot', category: 'compute', profile: 'cpu-memory', status: 'implemented', prismio_ns: 14634167, cpp_ns: 19968291, rust_ns: 11658584 },
    { name: 'convolution', category: 'compute', profile: 'cpu-memory', status: 'implemented', prismio_ns: 4339458, cpp_ns: 3463709, rust_ns: 3345667 },
    { name: 'monte_carlo', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 43940958, cpp_ns: 43803916, rust_ns: 44039375 },
    { name: 'polynomial_evaluation', category: 'compute', profile: 'cpu', status: 'implemented', prismio_ns: 23141084, cpp_ns: 23046834, rust_ns: 22957542 },
    { name: 'ecs_component_update', category: 'compute', profile: 'memory', status: 'implemented', prismio_ns: 3315917, cpp_ns: 3502375, rust_ns: 3358083 },
    { name: 'parallel_reduction', category: 'compute', profile: 'cpu-concurrency', status: 'implemented', prismio_ns: 7363917, cpp_ns: 7457125, rust_ns: 7385917 },

    { name: 'transient_allocation', category: 'memory', profile: 'allocation', status: 'implemented', prismio_ns: 2149125, cpp_ns: 1799375, rust_ns: 1851000 },
    { name: 'struct_creation', category: 'memory', profile: 'allocation', status: 'implemented', prismio_ns: 6074875, cpp_ns: 6479708, rust_ns: 5276042 },
    { name: 'allocation_mutation', category: 'memory', profile: 'allocation-memory', status: 'implemented', prismio_ns: 7038959, cpp_ns: 6379375, rust_ns: 6403041 },
    { name: 'nested_collection', category: 'memory', profile: 'allocation-memory', status: 'implemented', prismio_ns: 2999916, cpp_ns: 2397708, rust_ns: 2411333 },
    { name: 'large_buffer_copy', category: 'memory', profile: 'memory', status: 'implemented', prismio_ns: 8126083, cpp_ns: 5750125, rust_ns: 6610333 },
    { name: 'recursive_tree_rebuild', category: 'memory', profile: 'allocation', status: 'implemented', prismio_ns: 346084, cpp_ns: 851459, rust_ns: 485750 },

    { name: 'file_read', category: 'io', profile: 'io', status: 'implemented', prismio_ns: 686834, cpp_ns: 1252958, rust_ns: 680375 },
    { name: 'file_write', category: 'io', profile: 'io-allocation', status: 'implemented', prismio_ns: 988292, cpp_ns: 1281375, rust_ns: 993417 },
    { name: 'line_processing', category: 'io', profile: 'io-allocation', status: 'implemented', prismio_ns: 348625, cpp_ns: 980875, rust_ns: 349833 },
    { name: 'tokenization', category: 'io', profile: 'cpu-allocation', status: 'implemented', prismio_ns: 150083, cpp_ns: 276500, rust_ns: 967500 },
    { name: 'json_parse', category: 'io', profile: 'cpu-allocation', status: 'unsupported', missing_feature: 'Streaming zero-copy JSON parser in stdlib (targeted for v0.2)' },
    { name: 'json_serialize', category: 'io', profile: 'cpu-allocation', status: 'unsupported', missing_feature: 'Standard JSON serializer in stdlib (targeted for v0.2)' },
];

function formatDuration(ns?: number) {
    if (!ns) return '—';
    if (ns < 1_000) return `${ns} ns`;
    if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)} μs`;
    return `${(ns / 1_000_000).toFixed(2)} ms`;
}

export default function BenchmarksPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'implemented' | 'unsupported'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const categories = [
        { id: 'all', label: 'All Categories' },
        { id: 'algorithms', label: 'Algorithms' },
        { id: 'data_structures', label: 'Data Structures' },
        { id: 'compute', label: 'Compute' },
        { id: 'memory', label: 'Memory' },
        { id: 'io', label: 'I/O & Parsing' },
    ];

    const filteredBenchmarks = useMemo(() => {
        return rawBenchmarks.filter((item) => {
            if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchesName = item.name.toLowerCase().includes(q);
                const matchesCat = item.category.toLowerCase().includes(q);
                const matchesProfile = item.profile.toLowerCase().includes(q);
                if (!matchesName && !matchesCat && !matchesProfile) return false;
            }
            return true;
        });
    }, [selectedCategory, statusFilter, searchQuery]);

    // Metrics summary
    const implementedCount = rawBenchmarks.filter((b) => b.status === 'implemented').length;
    const roadmapCount = rawBenchmarks.filter((b) => b.status === 'unsupported').length;

    return (
        <div className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#070709]/60 to-[#070709] pointer-events-none z-0" />
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

            <HeaderMain />

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-medium font-mono mb-6">
                        <BarChart3 size={14} />
                        Transparent Verification
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        Canonical Benchmark Suite
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                        Prismio is systematically evaluated against Clang <code className="text-gray-200 font-mono">-O3</code> and Rustc <code className="text-gray-200 font-mono">opt-level=3</code> across 40 standardized workloads. Real wall-clock times, zero synthetic smoothing.
                    </p>
                </div>

                {/* Key Summary Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="p-6 rounded-2xl bg-[#0b0b0f] border border-white/[0.08]">
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">Workload Coverage</div>
                        <div className="text-3xl font-mono font-bold text-white mb-1">
                            {implementedCount} <span className="text-sm font-normal text-gray-500">/ {rawBenchmarks.length}</span>
                        </div>
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            34 Active Implementations
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#0b0b0f] border border-white/[0.08]">
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">Compile Throughput</div>
                        <div className="text-3xl font-mono font-bold text-indigo-400 mb-1">
                            2.5x <span className="text-sm font-normal text-gray-500">vs Clang -O3</span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span>0.81s (Prismio) vs 2.03s (C++)</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#0b0b0f] border border-white/[0.08]">
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">Memory Latency</div>
                        <div className="text-3xl font-mono font-bold text-emerald-400 mb-1">
                            0 ms
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <Zap size={13} className="text-emerald-400" />
                            Zero Garbage Collection Pauses
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#0b0b0f] border border-white/[0.08]">
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">Roadmap Target</div>
                        <div className="text-3xl font-mono font-bold text-gray-300 mb-1">
                            {roadmapCount} <span className="text-sm font-normal text-gray-500">Workloads</span>
                        </div>
                        <Link href="/roadmap" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            Targeted for v0.2 standard library
                            <Clock size={12} />
                        </Link>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-[#0b0b0f] border border-white/[0.08] rounded-2xl p-4 md:p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Category Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        selectedCategory === cat.id
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search and Status Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter benchmarks..."
                                    className="pl-8 pr-3 py-1.5 bg-[#14141c] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors w-48 sm:w-60 font-mono"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-1.5 bg-[#14141c] border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="all">All Statuses</option>
                                <option value="implemented">Implemented Only ({implementedCount})</option>
                                <option value="unsupported">v0.2 Roadmap Only ({roadmapCount})</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-[#0b0b0f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-gray-400 font-mono uppercase tracking-wider text-[11px]">
                                    <th className="py-4 px-6">Benchmark</th>
                                    <th className="py-4 px-4">Category</th>
                                    <th className="py-4 px-4">Profile</th>
                                    <th className="py-4 px-4 text-right">Prismio (AIF)</th>
                                    <th className="py-4 px-4 text-right">C++20 (Clang -O3)</th>
                                    <th className="py-4 px-4 text-right">Rust (opt=3)</th>
                                    <th className="py-4 px-6 text-center">Status / Delta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] font-mono">
                                {filteredBenchmarks.map((bench) => {
                                    const isImplemented = bench.status === 'implemented';
                                    
                                    // Delta relative to C++
                                    let deltaBadge = null;
                                    if (isImplemented && bench.prismio_ns && bench.cpp_ns) {
                                        const ratio = bench.prismio_ns / bench.cpp_ns;
                                        if (ratio <= 0.8) {
                                            deltaBadge = (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                                    {(bench.cpp_ns / bench.prismio_ns).toFixed(1)}x faster than C++
                                                </span>
                                            );
                                        } else if (ratio <= 1.15) {
                                            deltaBadge = (
                                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                                    Parity with C++
                                                </span>
                                            );
                                        } else {
                                            deltaBadge = (
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 text-[10px]">
                                                    {ratio.toFixed(2)}x of C++
                                                </span>
                                            );
                                        }
                                    }

                                    return (
                                        <tr 
                                            key={bench.name}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3.5 px-6 font-semibold text-white">
                                                <span className="text-gray-200">{bench.name}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-400 font-sans capitalize">
                                                {bench.category.replace('_', ' ')}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-400">
                                                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-gray-400 border border-white/5">
                                                    {bench.profile}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-white">
                                                {isImplemented ? formatDuration(bench.prismio_ns) : '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-gray-400">
                                                {isImplemented ? formatDuration(bench.cpp_ns) : '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-gray-400">
                                                {isImplemented ? formatDuration(bench.rust_ns) : '—'}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                {isImplemented ? (
                                                    deltaBadge
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20 text-[10px] font-sans">
                                                        v0.2 Roadmap
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Methodology Disclosure */}
                <div className="mt-16 bg-[#0b0b0f]/60 border border-white/[0.06] rounded-2xl p-8 max-w-4xl mx-auto">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                        <Info size={16} className="text-indigo-400" />
                        Benchmarking Methodology & Rigor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400 leading-relaxed">
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Harness Isolation</h4>
                            <p>
                                Each benchmark executes 7 to 9 iterations. Outliers caused by OS thread scheduling and thermal throttling are eliminated using median timing across warm cache runs.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Compiler Flags</h4>
                            <p>
                                Compilers are invoked with maximum optimization: Clang 18+ with <code className="font-mono text-gray-300">-O3 -std=c++20</code>, Rustc with <code className="font-mono text-gray-300">-C opt-level=3</code>, and Prismio via LLVM AOT optimization passes.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Deterministic Memory Validation</h4>
                            <p>
                                Memory benchmarks measure allocation overhead and heap churn under continuous execution. Prismio’s Automatic Invalidation Flow eliminates GC stop-the-world stalls without manual <code className="font-mono text-gray-300">free()</code>.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Reproducibility</h4>
                            <p>
                                The entire benchmark suite is open source in <code className="font-mono text-gray-300">prismio/benchmarks</code>. You can run <code className="font-mono text-gray-300">python3 run.py</code> locally to reproduce these figures on your own machine.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <FooterMain />
        </div>
    );
}
