'use client';

import React, { useState } from 'react';
import { ShieldCheck, Zap, Boxes, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PillarDetail {
    id: string;
    title: string;
    tag: string;
    summary: string;
    specs: Array<{ label: string; value: string }>;
    diagramType: 'aif' | 'german_string' | 'generics' | 'ums';
    quote: string;
}

const PILLARS: PillarDetail[] = [
    {
        id: 'aif',
        title: 'Automatic Invalidation Flow (AIF)',
        tag: 'Memory Safety Invariant',
        summary: 'Compile-time tracking of resource lifecycles and ownership invalidation. Prismio eliminates both the unpredictable pauses of garbage collectors and the cognitive burden of manual reference management.',
        specs: [
            { label: 'Runtime Overhead', value: '0 ns (Pure compile-time)' },
            { label: 'GC Stop-The-World', value: 'None (0 ms)' },
            { label: 'Reference Counting', value: 'Zero atomic inc/dec' },
            { label: 'Destruction Model', value: 'Deterministic scope drop' },
        ],
        diagramType: 'aif',
        quote: 'Resources are invalidated at the earliest safe boundary proven by the dataflow analyzer, avoiding heap fragmentation and GC pauses entirely.',
    },
    {
        id: 'german_string',
        title: '16-Byte German String Layout',
        tag: 'Data Representation',
        summary: 'Strings use a compact 16-byte representation inspired by Umbra DB. Short strings (≤ 12 bytes) are stored directly on the stack without heap allocation, and long strings inline the first 4 bytes for instant branch pruning.',
        specs: [
            { label: 'Total Header Size', value: '16 Bytes (aligned)' },
            { label: 'Inline Capacity', value: 'Up to 12 Bytes' },
            { label: 'Prefix Check', value: 'O(1) without pointer dereference' },
            { label: 'Heap Overhead for Short', value: '0 Bytes' },
        ],
        diagramType: 'german_string',
        quote: 'Over 70% of strings in web servers and parsers are ≤ 12 bytes. German strings eliminate millions of short-lived malloc calls.',
    },
    {
        id: 'generics',
        title: 'Monomorphized Parametric Generics',
        tag: 'Compiler Codegen',
        summary: 'Generics are specialized into concrete native machine code at compile time. Containers like List<T> and Map<K, V> produce flat, contiguous arrays with zero vtable indirection or boxing overhead.',
        specs: [
            { label: 'Dispatch Model', value: 'Static (0 dynamic dispatch)' },
            { label: 'Boxing Overhead', value: '0 Bytes (unboxed values)' },
            { label: 'Cache Locality', value: '100% contiguous memory' },
            { label: 'SIMD Vectorization', value: 'Enabled via LLVM passes' },
        ],
        diagramType: 'generics',
        quote: 'Full parametric expressiveness with identical assembly output to hand-tuned C structs.',
    },
    {
        id: 'ums',
        title: 'Unified Module System (UMS)',
        tag: 'Toolchain Architecture',
        summary: 'Predictable @package syntax with single-pass compilation. Eliminates circular dependency ambiguities and header parsing overhead, emitting unified LLVM compilation units with fast link times.',
        specs: [
            { label: 'Syntax Anchor', value: '@package / relative imports' },
            { label: 'Cycle Handling', value: 'Deterministic DAG validation' },
            { label: 'Linker Backend', value: 'LLVM LLD / Clang integration' },
            { label: 'Compile Time', value: '2.5x faster than Clang -O3' },
        ],
        diagramType: 'ums',
        quote: 'Modules are resolved once into a semantic symbol graph, providing fast incremental builds and clean API encapsulation.',
    },
];

export default function Principles() {
    const [selectedPillar, setSelectedPillar] = useState<string>('aif');

    const current = PILLARS.find((p) => p.id === selectedPillar) ?? PILLARS[0]!;

    return (
        <section className="px-6 py-24 max-w-7xl mx-auto z-20">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-semibold">
                    Architectural Deep Dive
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    Engineered from first principles
                </h2>
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                    Prismio dispenses with legacy compromises. Explore the four core compiler systems that power deterministic execution.
                </p>
            </div>

            {/* Architecture Workbench Card */}
            <div className="bg-[#0b0c10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                {/* Horizontal Navigation Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/[0.08] bg-[#12131a]">
                    {PILLARS.map((p) => {
                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPillar(p.id)}
                                className={`relative p-6 border-b-2 transition-all duration-300 overflow-hidden text-left ${
                                    selectedPillar === p.id
                                        ? 'border-indigo-500 bg-indigo-500/[0.03] shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]'
                                        : 'border-transparent hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-1">
                                    {p.tag}
                                </div>
                                <div className={`text-xs md:text-sm font-bold truncate ${selectedPillar === p.id ? 'text-white' : 'text-zinc-400'}`}>
                                    {p.title.split(' (')[0]}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Workbench Body */}
                <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left: Deep Specification & Quotes */}
                    <div className="lg:col-span-7 space-y-6 text-left">
                        <div>
                            <div className="inline-block px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono mb-3">
                                {current.tag}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">
                                {current.title}
                            </h3>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                {current.summary}
                            </p>
                        </div>

                        {/* Architectural Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {current.specs.map((spec, sIdx) => (
                                <div key={sIdx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                        {spec.label}
                                    </div>
                                    <div className="text-xs font-semibold text-zinc-200 font-mono mt-0.5">
                                        {spec.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Engineering Note */}
                        <blockquote className="p-4 rounded-xl bg-white/[0.01] border-l-2 border-indigo-500 text-xs text-zinc-400 italic">
                            &ldquo;{current.quote}&rdquo;
                        </blockquote>
                    </div>

                    {/* Right: Concrete Architectural Diagram Box */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#07080b] border border-white/[0.06] rounded-xl p-5 font-mono text-xs">
                            {current.diagramType === 'aif' && (
                                <div className="space-y-4 text-[11px]">
                                    <div className="text-zinc-400 font-semibold border-b border-white/[0.06] pb-2 flex items-center justify-between">
                                        <span>AIF Lifecycle Pipeline</span>
                                        <span className="text-[10px] text-emerald-400">0 Runtime Pauses</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="p-2.5 rounded bg-[#101117] border border-white/[0.04]">
                                            <span className="text-purple-400 font-bold">1. Allocation</span>
                                            <p className="text-zinc-400 text-[10px] mt-0.5">Resource allocated on stack or bump arena.</p>
                                        </div>
                                        <div className="flex justify-center text-zinc-600">↓</div>
                                        <div className="p-2.5 rounded bg-[#101117] border border-white/[0.04]">
                                            <span className="text-blue-400 font-bold">2. Flow Analysis</span>
                                            <p className="text-zinc-400 text-[10px] mt-0.5">Compiler proves exact escape boundaries and borrows.</p>
                                        </div>
                                        <div className="flex justify-center text-zinc-600">↓</div>
                                        <div className="p-2.5 rounded bg-[#101117] border border-emerald-500/20 bg-emerald-950/10">
                                            <span className="text-emerald-400 font-bold">3. Invalidation & Reclamation</span>
                                            <p className="text-zinc-300 text-[10px] mt-0.5">Memory reused or released instantly at scope exit.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {current.diagramType === 'german_string' && (
                                <div className="space-y-4 text-[11px]">
                                    <div className="text-zinc-400 font-semibold border-b border-white/[0.06] pb-2 flex items-center justify-between">
                                        <span>16-Byte Memory Layout</span>
                                        <span className="text-[10px] text-indigo-400">Umbra-Inspired</span>
                                    </div>

                                    {/* Byte Strip */}
                                    <div className="grid grid-cols-3 gap-1 text-center font-bold text-[10px]">
                                        <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30 text-purple-300">
                                            <div>4 Bytes</div>
                                            <div className="text-[9px] font-normal text-zinc-400 mt-1">Length</div>
                                        </div>
                                        <div className="p-2 rounded bg-sky-950/30 border border-sky-500/30 text-sky-300">
                                            <div>4 Bytes</div>
                                            <div className="text-[9px] font-normal text-zinc-400 mt-1">Inline Prefix</div>
                                        </div>
                                        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                                            <div>8 Bytes</div>
                                            <div className="text-[9px] font-normal text-zinc-400 mt-1">Ptr or Suffix</div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded bg-[#101117] border border-white/[0.04] space-y-2 text-[10px]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-400">Short strings (&le; 12B):</span>
                                            <span className="text-emerald-400 font-bold">100% On-Stack</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-400">Prefix mismatch check:</span>
                                            <span className="text-indigo-400 font-bold">1 CPU Cycle</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-400">Pointer chasing:</span>
                                            <span className="text-zinc-300 font-bold">Eliminated</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {current.diagramType === 'generics' && (
                                <div className="space-y-4 text-[11px]">
                                    <div className="text-zinc-400 font-semibold border-b border-white/[0.06] pb-2 flex items-center justify-between">
                                        <span>Generic Monomorphization</span>
                                        <span className="text-[10px] text-yellow-300">Zero Dynamic Dispatch</span>
                                    </div>

                                    <div className="p-3 rounded bg-[#101117] border border-white/[0.04] text-[10px] space-y-2">
                                        <div className="text-zinc-500">// Source generic type:</div>
                                        <div className="text-purple-300 font-bold">struct Container&lt;T&gt; &#123; item: T &#125;</div>
                                        <div className="text-zinc-500 pt-1">// Compiled specialization:</div>
                                        <div className="text-sky-300 font-bold">Container_Int &#8594; [i64 direct store]</div>
                                        <div className="text-emerald-300 font-bold">Container_String &#8594; [16B German inline]</div>
                                    </div>

                                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[10px] text-zinc-400">
                                        No interface tables. No void* pointer boxing. LLVM vectorizes contiguous memory loops automatically.
                                    </div>
                                </div>
                            )}

                            {current.diagramType === 'ums' && (
                                <div className="space-y-4 text-[11px]">
                                    <div className="text-zinc-400 font-semibold border-b border-white/[0.06] pb-2 flex items-center justify-between">
                                        <span>Unified Module System</span>
                                        <span className="text-[10px] text-indigo-400">Single-Pass</span>
                                    </div>

                                    <div className="p-3 rounded bg-[#101117] border border-white/[0.04] text-[10px] space-y-1.5 font-mono">
                                        <div className="text-purple-300">import @std.io</div>
                                        <div className="text-sky-300">import @network.socket</div>
                                        <div className="text-zinc-500 pt-1">// Dependency DAG resolved in parallel</div>
                                        <div className="text-emerald-400">✓ 0 Header re-parsing overhead</div>
                                        <div className="text-emerald-400">✓ Cyclic safety verified at link time</div>
                                    </div>

                                    <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[10px] text-zinc-400">
                                        Compiled into native object archives compatible with standard Clang/LLD toolchains.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
