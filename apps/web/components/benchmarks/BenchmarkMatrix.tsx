'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    ChevronDown,
    ChevronRight,
    ArrowDownUp,
    X,
} from 'lucide-react';
import { BenchmarkItem, CategorySummary, formatBytes, formatDuration } from '@/lib/benchmarks';

/**
 * Below 768px the table is read as a list of cards: every row becomes a three-column grid and each
 * value carries its column name (from `data-label`), since the header row turns into a strip of sort chips.
 */
const PHONE_CELL = 'max-md:p-0 max-md:text-left';
const PHONE_LABEL =
    'max-md:before:mb-1 max-md:before:block max-md:before:font-sans max-md:before:text-[11px] max-md:before:font-medium max-md:before:uppercase max-md:before:tracking-wider max-md:before:text-zinc-400 max-md:before:content-[attr(data-label)]';
const PHONE_CHIP = 'max-md:min-h-10 max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3.5 max-md:text-sm';

interface BenchmarkMatrixProps {
    benchmarks: BenchmarkItem[];
    categories: CategorySummary[];
}

interface SortThProps {
    col: string;
    label: string;
    align?: 'left' | 'right';
    tone?: string;
    dot?: string;
    className: string;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    onSort: (col: string) => void;
}

function SortTh({col, label, align = 'right', tone = '', dot, className, sortColumn, sortDirection, onSort}: SortThProps) {
    const active = sortColumn === col;
    const ariaSort = active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';
    return (
        <th scope="col" aria-sort={ariaSort} className={`${className} max-md:shrink-0 max-md:p-0`}>
            <button
                type="button"
                onClick={() => onSort(col)}
                className={`inline-flex items-center gap-1.5 rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 max-md:min-h-10 max-md:whitespace-nowrap max-md:rounded-lg max-md:border max-md:px-3 ${
                    active ? 'max-md:border-white/25 max-md:bg-white/[0.07]' : 'max-md:border-white/[0.08]'
                } ${
                    align === 'right' ? 'justify-end' : ''
                } ${tone}`}
            >
                {dot && <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />}
                {label}
                <ArrowDownUp size={11} className={active ? 'opacity-100' : 'opacity-60'} aria-hidden />
            </button>
        </th>
    );
}

export default function BenchmarkMatrix({ benchmarks, categories }: BenchmarkMatrixProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<string>('default');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filtering
    const filteredBenchmarks = useMemo(() => {
        const q = search.toLowerCase().trim();
        return benchmarks.filter((item) => {
            if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
            if (selectedOutcome !== 'all' && item.outcome !== selectedOutcome) return false;
            if (q) {
                const matchName = item.name.toLowerCase().includes(q);
                const matchCat = item.categoryLabel.toLowerCase().includes(q);
                const matchProf = item.profile.toLowerCase().includes(q);
                if (!matchName && !matchCat && !matchProf) return false;
            }
            return true;
        });
    }, [benchmarks, search, selectedCategory, selectedOutcome]);

    // Sorting
    const sortedBenchmarks = useMemo(() => {
        const items = [...filteredBenchmarks];
        if (sortColumn === 'default') {
            return items;
        }

        items.sort((a, b) => {
            let valA: number | string = 0;
            let valB: number | string = 0;

            switch (sortColumn) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'category':
                    valA = a.categoryLabel;
                    valB = b.categoryLabel;
                    break;
                case 'prismio':
                    valA = a.prismioNs;
                    valB = b.prismioNs;
                    break;
                case 'cpp':
                    valA = a.cppNs;
                    valB = b.cppNs;
                    break;
                case 'rust':
                    valA = a.rustNs;
                    valB = b.rustNs;
                    break;
                case 'vs-cpp':
                    valA = a.vsCppRatio;
                    valB = b.vsCppRatio;
                    break;
                case 'vs-rust':
                    valA = a.vsRustRatio;
                    valB = b.vsRustRatio;
                    break;
                case 'jitter':
                    valA = a.jitterPct ?? 0;
                    valB = b.jitterPct ?? 0;
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            return sortDirection === 'asc'
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return items;
    }, [filteredBenchmarks, sortColumn, sortDirection]);

    const handleSort = (col: string) => {
        if (sortColumn === col) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(col);
            setSortDirection('asc');
        }
    };

    const toggleRow = (name: string) => {
        setExpandedRow(expandedRow === name ? null : name);
    };

    const sortProps = {sortColumn, sortDirection, onSort: handleSort};

    return (
        <div className="space-y-6">
            {/* Category Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4 max-md:flex-nowrap max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
                <button
                    type="button"
                    aria-pressed={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${PHONE_CHIP} ${
                        selectedCategory === 'all'
                            ? 'bg-white text-black font-semibold'
                            : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                >
                    <span>All Workloads</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                        selectedCategory === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
                    }`}>
                        {benchmarks.length}
                    </span>
                </button>

                {categories.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${PHONE_CHIP} ${
                                isActive
                                    ? 'bg-white text-black font-semibold'
                                    : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                            }`}
                        >
                            <span>{cat.label}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                                isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
                            }`}>
                                {cat.implemented}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        aria-label="Search workloads"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search workload, category, or profile..."
                        className="w-full rounded-xl border border-white/10 bg-[#0b0c10] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 max-md:py-2.5 max-md:pr-11 max-md:text-base"
                    />
                    {search && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white max-md:right-0.5 max-md:inline-flex max-md:size-10 max-md:items-center max-md:justify-center"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Outcome Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs max-md:grid max-md:grid-cols-2 max-md:gap-1 max-md:rounded-xl max-md:bg-white/[0.03] max-md:p-1 max-md:text-sm max-md:ring-1 max-md:ring-white/[0.08]">
                    <span className="text-zinc-400 mr-1 hidden md:inline">Outcome:</span>
                    <button
                        type="button"
                        aria-pressed={selectedOutcome === 'all'}
                        onClick={() => setSelectedOutcome('all')}
                        className={`rounded-lg px-2.5 py-1 transition-colors max-md:min-h-10 ${
                            selectedOutcome === 'all'
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        aria-pressed={selectedOutcome === 'prismio-win'}
                        onClick={() => setSelectedOutcome('prismio-win')}
                        className={`rounded-lg px-2.5 py-1 transition-colors max-md:min-h-10 ${
                            selectedOutcome === 'prismio-win'
                                ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                                : 'text-zinc-400 hover:text-emerald-300'
                        }`}
                    >
                        Prismio Leads
                    </button>
                    <button
                        type="button"
                        aria-pressed={selectedOutcome === 'parity'}
                        onClick={() => setSelectedOutcome('parity')}
                        className={`rounded-lg px-2.5 py-1 transition-colors max-md:min-h-10 ${
                            selectedOutcome === 'parity'
                                ? 'bg-zinc-700/50 text-zinc-200 font-medium'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Parity
                    </button>
                    <button
                        type="button"
                        aria-pressed={selectedOutcome === 'prismio-loss'}
                        onClick={() => setSelectedOutcome('prismio-loss')}
                        className={`rounded-lg px-2.5 py-1 transition-colors max-md:min-h-10 ${
                            selectedOutcome === 'prismio-loss'
                                ? 'bg-rose-500/20 text-rose-300 font-medium'
                                : 'text-zinc-400 hover:text-rose-300'
                        }`}
                    >
                        Prismio Slower
                    </button>
                </div>
            </div>

            {/* Results Count & Quick Stats Bar */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>
                    Showing <strong className="text-white">{sortedBenchmarks.length}</strong> of{' '}
                    {benchmarks.length} workloads
                </span>
                {(search || selectedCategory !== 'all' || selectedOutcome !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setSelectedCategory('all');
                            setSelectedOutcome('all');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors max-md:-my-2 max-md:min-h-10 max-md:px-1"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {/* Workload Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0b0c10]/60">
                <table className="w-full min-w-[58rem] border-collapse text-left text-xs max-md:block max-md:min-w-0">
                    <caption className="sr-only">
                        Benchmark workloads with median elapsed time per arm. Column headers sort the table.
                    </caption>
                    <thead className="max-md:block">
                        <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-medium select-none max-md:flex max-md:gap-2 max-md:overflow-x-auto max-md:px-3 max-md:py-3 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
                            <SortTh col="name" label="Workload" align="left" className="py-4 pl-6 pr-4 text-left" {...sortProps} />
                            <SortTh col="category" label="Category" align="left" className="px-4 py-4 text-left" {...sortProps} />
                            <SortTh col="prismio" label="Prismio" tone="text-purple-300" dot="bg-purple-400" className="px-4 py-4 text-right" {...sortProps} />
                            <SortTh col="cpp" label="C++20 (-O3)" tone="text-sky-300" dot="bg-sky-400" className="px-4 py-4 text-right" {...sortProps} />
                            <SortTh col="rust" label="Rust (opt-3)" tone="text-orange-300" dot="bg-orange-400" className="px-4 py-4 text-right" {...sortProps} />
                            <SortTh col="vs-cpp" label="vs C++" tone="text-sky-300" dot="bg-sky-400" className="px-4 py-4 text-right" {...sortProps} />
                            <SortTh col="vs-rust" label="vs Rust" tone="text-orange-300" dot="bg-orange-400" className="px-4 py-4 text-right" {...sortProps} />
                            <th scope="col" className="py-4 pr-6 text-right max-md:hidden">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] max-md:block">
                        {sortedBenchmarks.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-zinc-400 max-md:block max-md:px-4">
                                    No benchmark workloads match the selected filter criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedBenchmarks.map((item) => {
                                const isExpanded = expandedRow === item.name;

                                return (
                                    <React.Fragment key={item.name}>
                                        <tr
                                            onClick={() => toggleRow(item.name)}
                                            className={`group cursor-pointer transition-colors hover:bg-white/[0.03] max-md:grid max-md:grid-cols-3 max-md:gap-x-3 max-md:gap-y-2.5 max-md:px-4 max-md:pb-4 max-md:pt-1.5 ${
                                                isExpanded ? 'bg-white/[0.04]' : ''
                                            }`}
                                        >
                                            {/* Workload Name & Profile */}
                                            <td className="py-4 pl-6 pr-4 max-md:col-span-3 max-md:p-0">
                                                <button
                                                    type="button"
                                                    aria-expanded={isExpanded}
                                                    aria-controls={`bm-details-${item.name}`}
                                                    aria-label={`${isExpanded ? 'Hide' : 'Inspect'} ${item.name}`}
                                                    className="flex items-center gap-2.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 max-md:min-h-11 max-md:w-full"
                                                >
                                                    <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </span>
                                                    <div>
                                                        <span className="font-mono text-sm font-medium text-zinc-100">
                                                            {item.name}
                                                        </span>
                                                        <span className="ml-2 inline-block rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-zinc-400">
                                                            {item.profile}
                                                        </span>
                                                    </div>
                                                </button>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-4 text-sm text-zinc-400 max-md:col-span-3 max-md:-mt-3 max-md:p-0 max-md:pl-6">
                                                {item.categoryLabel}
                                            </td>

                                            {/* Prismio Elapsed Median */}
                                            <td data-label="Prismio" className={`px-4 py-4 text-right font-mono text-sm font-medium text-purple-200 ${PHONE_CELL} ${PHONE_LABEL}`}>
                                                <div className="flex items-center justify-end gap-2 max-md:flex-wrap max-md:justify-start max-md:gap-1.5">
                                                    <span>{item.prismioFormatted}</span>
                                                    {item.jitterPct !== null && item.jitterPct <= 2.5 && (
                                                        <span
                                                            className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-zinc-300 font-sans"
                                                            title={`Run consistency (IQR / median): ±${item.jitterPct.toFixed(1)}%`}
                                                        >
                                                            {item.stabilityText}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* C++ Elapsed Median */}
                                            <td data-label="C++20" className={`px-4 py-4 text-right font-mono text-sm text-zinc-300 ${PHONE_CELL} ${PHONE_LABEL}`}>
                                                {item.cppFormatted}
                                            </td>

                                            {/* Rust Elapsed Median */}
                                            <td data-label="Rust" className={`px-4 py-4 text-right font-mono text-sm text-zinc-300 ${PHONE_CELL} ${PHONE_LABEL}`}>
                                                {item.rustFormatted}
                                            </td>

                                            {/* vs C++ Delta Pill */}
                                            <td data-label="vs C++" className={`px-4 py-4 text-right font-mono ${PHONE_CELL} max-md:col-start-2 max-md:row-start-4 max-md:-mt-1`}>
                                                <span
                                                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold max-md:whitespace-nowrap max-md:px-1.5 max-md:text-[11px] ${
                                                        item.vsCppStatus === 'faster'
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : item.vsCppStatus === 'slower'
                                                            ? 'bg-rose-500/15 text-rose-400'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                                >
                                                    {item.vsCppSpeedup}
                                                </span>
                                            </td>

                                            {/* vs Rust Delta Pill */}
                                            <td data-label="vs Rust" className={`px-4 py-4 text-right font-mono ${PHONE_CELL} max-md:col-start-3 max-md:row-start-4 max-md:-mt-1`}>
                                                <span
                                                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold max-md:whitespace-nowrap max-md:px-1.5 max-md:text-[11px] ${
                                                        item.vsRustStatus === 'faster'
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : item.vsRustStatus === 'slower'
                                                            ? 'bg-rose-500/15 text-rose-400'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                                >
                                                    {item.vsRustSpeedup}
                                                </span>
                                            </td>

                                            {/* Action / Chevron */}
                                            <td className="py-4 pr-6 text-right text-zinc-400 max-md:hidden">
                                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
                                                    {isExpanded ? 'Hide' : 'Inspect'}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Expanded Details Sub-Panel */}
                                        {isExpanded && (
                                            <tr id={`bm-details-${item.name}`} className="bg-black/40 max-md:block">
                                                <td colSpan={8} className="px-6 py-4 max-md:block max-md:px-3 max-md:py-3">
                                                    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#090a0e] p-5 max-md:p-3.5">
                                                        {/* Clean Header: Workload & Raw Checksum */}
                                                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs max-md:flex-wrap max-md:gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-medium text-white">{item.name}</span>
                                                                <span className="font-mono text-xs text-zinc-400">({item.profile})</span>
                                                            </div>

                                                            {item.result !== undefined && (
                                                                <div className="font-mono text-xs text-zinc-400">
                                                                    <span className="text-zinc-400">Checksum:</span>{' '}
                                                                    <span className="text-zinc-200">{item.result.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 3 Compiler Arm Columns */}
                                                        <div className="grid gap-3 md:grid-cols-3">
                                                            {/* Prismio */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-purple-300">Prismio</span>
                                                                    <span className="font-mono text-xs text-zinc-400">Target</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.prismioFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.prismioRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-xs text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-400">Jitter (MAD):</span>
                                                                    <span className="font-mono text-zinc-300">{item.stabilityText}</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-400 text-xs uppercase tracking-wider">Samples ({item.prismioSamples.length} runs)</div>
                                                                    <div className="font-mono text-xs text-zinc-400 break-words leading-relaxed">
                                                                        {item.prismioSamples.map((s) => {
                                                                            const isMedian = s === item.prismioNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Clang++ */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-sky-300">Clang++ (-O3)</span>
                                                                    <span className="font-mono text-xs text-zinc-400">{item.vsCppSpeedup}</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.cppFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.cppRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-xs text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-400">Dialect:</span>
                                                                    <span className="font-mono text-zinc-300">C++20</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-400 text-xs uppercase tracking-wider">Samples ({item.cppSamples.length} runs)</div>
                                                                    <div className="font-mono text-xs text-zinc-400 break-words leading-relaxed">
                                                                        {item.cppSamples.map((s) => {
                                                                            const isMedian = s === item.cppNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rust */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-orange-300">Rustc (opt-3)</span>
                                                                    <span className="font-mono text-xs text-zinc-400">{item.vsRustSpeedup}</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.rustFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs uppercase tracking-wider text-zinc-400">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.rustRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-xs text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-400">Edition:</span>
                                                                    <span className="font-mono text-zinc-300">Rust 2021</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-400 text-xs uppercase tracking-wider">Samples ({item.rustSamples.length} runs)</div>
                                                                    <div className="font-mono text-xs text-zinc-400 break-words leading-relaxed">
                                                                        {item.rustSamples.map((s) => {
                                                                            const isMedian = s === item.rustNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
