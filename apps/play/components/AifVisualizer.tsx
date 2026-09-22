'use client';

import React, { useState } from 'react';
import { AifReport, StorageTier } from '../lib/compiler/types';
import { ShieldCheck, Info, CheckCircle2, Layers, Cpu, Database } from 'lucide-react';

interface AifVisualizerProps {
    report: AifReport;
    optionsVerify: boolean;
}

const TIER_COLORS: Record<StorageTier, { bg: string; text: string; border: string }> = {
    'Stack': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'Arena': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    'Unique Heap': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Scoped Heap': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    'Shared Heap': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    'Cycle-Managed Heap': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    'Cross-Thread Heap': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

export default function AifVisualizer({ report, optionsVerify }: AifVisualizerProps) {
    const [filterTier, setFilterTier] = useState<string>('all');

    const filteredAllocations = filterTier === 'all'
        ? report.allocations
        : report.allocations.filter((a) => a.storage === filterTier);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* Header / Intro banner */}
            <div className="p-4 rounded-xl bg-[#0c0e14] border border-white/[0.08]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Adaptive Inference Framework</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#47d7b5]/10 text-[#47d7b5] border border-[#47d7b5]/25">
                                AIF v0.1.0
                            </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed max-w-xl">
                            Prismio does not use a traditional tracing garbage collector or mandatory borrow annotations.
                            Instead, AIF performs escape analysis and value provenance inference at compile time, deciding optimal
                            storage tiers for every allocation.
                        </p>
                    </div>

                    {optionsVerify && (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300 shrink-0">
                            <ShieldCheck size={14} className="text-indigo-400" />
                            <span>--verify active</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Storage Tier Counts Grid */}
            <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
                    Storage Tier Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(report.storagePlan).map(([tier, count]) => {
                        const style = TIER_COLORS[tier as StorageTier];
                        const isSelected = filterTier === tier;

                        return (
                            <button
                                key={tier}
                                type="button"
                                onClick={() => setFilterTier(isSelected ? 'all' : tier)}
                                className={`cursor-pointer text-left p-3 rounded-xl border transition-all ${
                                    isSelected
                                        ? 'bg-white/[0.06] border-white/20 shadow-md ring-1 ring-white/10'
                                        : 'bg-[#090a0f] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-medium font-mono ${style.text}`}>
                                        {tier}
                                    </span>
                                    <span className={`text-sm font-bold font-mono ${count > 0 ? style.text : 'text-zinc-600'}`}>
                                        {count}
                                    </span>
                                </div>
                                <div className="mt-2 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${count > 0 ? style.bg.replace('/10', '') : 'bg-transparent'}`}
                                        style={{ width: `${Math.min(100, count * 35)}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Allocations Table */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Inferred Allocation Decisions ({filteredAllocations.length})
                    </h3>
                    {filterTier !== 'all' && (
                        <button
                            type="button"
                            onClick={() => setFilterTier('all')}
                            className="cursor-pointer text-[11px] font-mono text-zinc-400 hover:text-white underline underline-offset-2"
                        >
                            Show all tiers
                        </button>
                    )}
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#090a0f] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-[#0e0f16] border-b border-white/[0.06] text-zinc-400 text-[11px]">
                                <tr>
                                    <th className="py-2.5 px-3 w-10">ID</th>
                                    <th className="py-2.5 px-3">Symbol</th>
                                    <th className="py-2.5 px-3">Location</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Storage Tier</th>
                                    <th className="py-2.5 px-3">Inference Rationale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filteredAllocations.map((alloc) => {
                                    const style = TIER_COLORS[alloc.storage];

                                    return (
                                        <tr key={alloc.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2.5 px-3 text-zinc-500 font-semibold">{alloc.id}</td>
                                            <td className="py-2.5 px-3 text-zinc-200 font-medium">{alloc.symbol}</td>
                                            <td className="py-2.5 px-3 text-zinc-400">main.psm:{alloc.line}:{alloc.col}</td>
                                            <td className="py-2.5 px-3 text-[#47d7b5]">{alloc.type}</td>
                                            <td className="py-2.5 px-3">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] border ${style.bg} ${style.text} ${style.border}`}
                                                >
                                                    {alloc.storage}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-zinc-300">{alloc.reason}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Storage Footprint & Lifecycle Metric */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/[0.06] flex items-center gap-3">
                    <Database size={18} className="text-[#47d7b5] shrink-0" />
                    <div>
                        <div className="text-[11px] text-zinc-400">Total Stack Allocation Frame</div>
                        <div className="text-sm font-semibold font-mono text-zinc-100">{report.stackBytes} bytes</div>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090a0f] border border-white/[0.06] flex items-center gap-3">
                    <Cpu size={18} className="text-indigo-400 shrink-0" />
                    <div>
                        <div className="text-[11px] text-zinc-400">Heap Allocation Overhead</div>
                        <div className="text-sm font-semibold font-mono text-zinc-100">{report.heapBytes} bytes (Zero GC sweeps)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
