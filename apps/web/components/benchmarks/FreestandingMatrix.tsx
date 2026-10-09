'use client';

import React, {useMemo, useState} from 'react';
import {ArrowDownUp, ChevronDown, ChevronRight, Search, X} from 'lucide-react';
import {FreestandingItem, formatInstructions} from '@/lib/benchmarks';

interface FreestandingMatrixProps {
    benchmarks: FreestandingItem[];
    categories: {key: string; label: string; count: number}[];
}

type SortKey = 'default' | 'name' | 'category' | 'prismio' | 'c' | 'rust' | 'vs-c' | 'vs-rust';

const PILL = {
    faster: 'bg-emerald-500/15 text-emerald-400',
    slower: 'bg-rose-500/15 text-rose-400',
    parity: 'bg-zinc-800 text-zinc-400',
} as const;

const ARMS: {key: 'prismio' | 'c' | 'rust'; name: string; tone: string}[] = [
    {key: 'prismio', name: 'Prismio', tone: 'text-purple-300'},
    {key: 'c', name: 'C (clang -O3)', tone: 'text-sky-300'},
    {key: 'rust', name: 'Rust (opt-3)', tone: 'text-orange-300'},
];

function valueOf(item: FreestandingItem, key: SortKey): number | string {
    switch (key) {
        case 'name': return item.name;
        case 'category': return item.categoryLabel;
        case 'prismio': return item.prismio;
        case 'c': return item.c;
        case 'rust': return item.rust;
        case 'vs-c': return item.vsCRatio;
        case 'vs-rust': return item.vsRustRatio;
        default: return 0;
    }
}

interface ThProps {
    col: SortKey;
    label: string;
    tone?: string;
    right?: boolean;
    sortKey: SortKey;
    direction: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
}

function Th({col, label, tone = '', right = true, sortKey, direction, onSort}: ThProps) {
    return (
        <th
            scope="col"
            aria-sort={sortKey === col ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            className={`px-4 py-4 ${right ? 'text-right' : 'text-left'}`}
        >
            <button
                type="button"
                onClick={() => onSort(col)}
                className={`inline-flex items-center gap-1.5 rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${right ? 'justify-end' : ''} ${tone}`}
            >
                {label}
                <ArrowDownUp size={11} className={sortKey === col ? 'opacity-100' : 'opacity-60'} aria-hidden />
            </button>
        </th>
    );
}

/**
 * Every freestanding workload with Prismio's instruction count against C's and Rust's.
 * The counts are exact, so there is no stability column; a row opens to show the
 * checksum all three arms returned and each arm's count.
 */
export default function FreestandingMatrix({benchmarks, categories}: FreestandingMatrixProps) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [outcome, setOutcome] = useState('all');
    const [sortKey, setSortKey] = useState<SortKey>('default');
    const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
    const [open, setOpen] = useState<string | null>(null);

    const rows = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = benchmarks.filter((item) => {
            if (category !== 'all' && item.category !== category) return false;
            if (outcome !== 'all' && item.outcome !== outcome) return false;
            if (q && !item.name.toLowerCase().includes(q) && !item.categoryLabel.toLowerCase().includes(q)) return false;
            return true;
        });
        if (sortKey === 'default') return filtered;
        return [...filtered].sort((a, b) => {
            const x = valueOf(a, sortKey);
            const y = valueOf(b, sortKey);
            if (typeof x === 'string' && typeof y === 'string') {
                return direction === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
            }
            return direction === 'asc' ? (x as number) - (y as number) : (y as number) - (x as number);
        });
    }, [benchmarks, search, category, outcome, sortKey, direction]);

    const sortProps = {sortKey, direction, onSort: (key: SortKey) => sortBy(key)};

    const sortBy = (key: SortKey) => {
        if (sortKey === key) setDirection(direction === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setDirection('asc');
        }
    };

    const pill = (active: boolean, tone: string) =>
        `rounded-lg px-2.5 py-1 transition-colors ${active ? tone : 'text-zinc-400 hover:text-white'}`;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
                {[{key: 'all', label: 'All Workloads', count: benchmarks.length}, ...categories].map((cat) => {
                    const active = category === cat.key;
                    return (
                        <button
                            key={cat.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setCategory(cat.key)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                active ? 'bg-white text-black font-semibold' : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                            }`}
                        >
                            <span>{cat.label}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                                {cat.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        aria-label="Search freestanding workloads"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search workload or category..."
                        className="w-full rounded-xl border border-white/10 bg-[#0b0c10] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    {search && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="mr-1 hidden text-zinc-400 md:inline">Outcome:</span>
                    <button type="button" aria-pressed={outcome === 'all'} onClick={() => setOutcome('all')} className={pill(outcome === 'all', 'bg-white/15 text-white font-medium')}>All</button>
                    <button type="button" aria-pressed={outcome === 'prismio-win'} onClick={() => setOutcome('prismio-win')} className={pill(outcome === 'prismio-win', 'bg-emerald-500/20 text-emerald-300 font-medium')}>Fewer instructions</button>
                    <button type="button" aria-pressed={outcome === 'parity'} onClick={() => setOutcome('parity')} className={pill(outcome === 'parity', 'bg-zinc-700/50 text-zinc-200 font-medium')}>Parity</button>
                    <button type="button" aria-pressed={outcome === 'prismio-loss'} onClick={() => setOutcome('prismio-loss')} className={pill(outcome === 'prismio-loss', 'bg-rose-500/20 text-rose-300 font-medium')}>More instructions</button>
                </div>
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
                <span>
                    Showing <strong className="text-white">{rows.length}</strong> of {benchmarks.length} workloads
                </span>
                {(search || category !== 'all' || outcome !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setCategory('all');
                            setOutcome('all');
                        }}
                        className="text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0b0c10]/60">
                <table className="w-full min-w-[52rem] border-collapse text-left text-xs">
                    <caption className="sr-only">
                        Freestanding workloads with guest instructions executed per arm. Column headers sort the table.
                    </caption>
                    <thead>
                        <tr className="select-none border-b border-white/[0.08] bg-white/[0.02] font-medium text-zinc-400">
                            <Th col="name" label="Workload" right={false} {...sortProps} />
                            <Th col="category" label="Category" right={false} {...sortProps} />
                            <Th col="prismio" label="Prismio" tone="text-purple-300" {...sortProps} />
                            <Th col="c" label="C (-O3)" tone="text-sky-300" {...sortProps} />
                            <Th col="rust" label="Rust (opt-3)" tone="text-orange-300" {...sortProps} />
                            <Th col="vs-c" label="vs C" tone="text-sky-300" {...sortProps} />
                            <Th col="vs-rust" label="vs Rust" tone="text-orange-300" {...sortProps} />
                            <th scope="col" className="py-4 pr-6 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-zinc-400">
                                    No workloads match the selected filters.
                                </td>
                            </tr>
                        ) : (
                            rows.map((item) => {
                                const expanded = open === item.name;
                                const best = Math.min(item.prismio, item.c, item.rust);
                                const cell = (count: number, text: string, tone: string) => (
                                    <td className={`px-4 py-4 text-right font-mono text-sm ${tone} ${count === best ? 'font-bold' : ''}`}>{text}</td>
                                );
                                return (
                                    <React.Fragment key={item.name}>
                                        <tr
                                            onClick={() => setOpen(expanded ? null : item.name)}
                                            className={`group cursor-pointer transition-colors hover:bg-white/[0.03] ${expanded ? 'bg-white/[0.04]' : ''}`}
                                        >
                                            <td className="py-4 pl-6 pr-4">
                                                <button
                                                    type="button"
                                                    aria-expanded={expanded}
                                                    aria-controls={`fs-details-${item.name}`}
                                                    aria-label={`${expanded ? 'Hide' : 'Inspect'} ${item.name}`}
                                                    className="flex items-center gap-2.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                                >
                                                    <span className="text-zinc-400 transition-colors group-hover:text-zinc-300">
                                                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </span>
                                                    <span>
                                                        <span className="font-mono text-sm font-medium text-zinc-100">{item.name}</span>
                                                        <span className="ml-2 inline-block rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-zinc-400">
                                                            {item.profile}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-400">{item.categoryLabel}</td>
                                            {cell(item.prismio, item.prismioFormatted, 'text-purple-200')}
                                            {cell(item.c, item.cFormatted, 'text-zinc-300')}
                                            {cell(item.rust, item.rustFormatted, 'text-zinc-300')}
                                            <td className="px-4 py-4 text-right font-mono">
                                                <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${PILL[item.vsCStatus]}`}>{item.vsCLabel}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono">
                                                <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${PILL[item.vsRustStatus]}`}>{item.vsRustLabel}</span>
                                            </td>
                                            <td className="py-4 pr-6 text-right text-zinc-400">{expanded ? 'Hide' : 'Inspect'}</td>
                                        </tr>
                                        {expanded && (
                                            <tr id={`fs-details-${item.name}`} className="bg-[#090a0e]">
                                                <td colSpan={8} className="px-6 pb-6 pt-2">
                                                    <div className="space-y-4 rounded-xl border border-white/[0.08] p-5">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <p className="max-w-2xl text-sm text-zinc-400">{item.description}</p>
                                                            <p className="font-mono text-xs text-zinc-400">
                                                                Checksum: <span className="text-white">{item.result.toLocaleString('en-US')}</span>{' '}
                                                                <span className="text-emerald-400">(identical in all three ✓)</span>
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-3 sm:grid-cols-3">
                                                            {ARMS.map((arm) => {
                                                                const count = item[arm.key];
                                                                return (
                                                                    <div key={arm.key} className="rounded-lg border border-white/[0.06] p-4">
                                                                        <div className={`text-sm font-semibold ${arm.tone}`}>{arm.name}</div>
                                                                        <div className="mt-2 font-mono text-lg text-white">{count.toLocaleString('en-US')}</div>
                                                                        <div className="text-xs text-zinc-400">
                                                                            instructions ({formatInstructions(count)})
                                                                            {arm.key !== 'prismio' && <> · Prismio is {(item.prismio / Math.max(count, 1)).toFixed(3)}×</>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
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
