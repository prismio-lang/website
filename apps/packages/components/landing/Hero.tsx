'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {motion, useReducedMotion} from 'framer-motion';
import {ArrowRight, Check, Copy, Search, X} from 'lucide-react';
import {PRISMIO_VERSION} from '@prismio/utils';
import {
    ABI_LABEL,
    CATEGORIES,
    MEMORY_LABEL,
    REGISTRY_PACKAGES,
    type PackageMeta,
} from '@/lib/packages';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
const SPRING = {type: 'spring', bounce: 0, duration: 0.35} as const;

function useCopy() {
    const [copied, setCopied] = useState<string | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const copy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return; // clipboard blocked (insecure context or denied): do not claim it copied
        }
        setCopied(id);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(null), 1600);
    };
    return {copied, copy};
}

export default function Hero() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string>('all');
    const searchRef = useRef<HTMLInputElement>(null);
    const reduce = useReducedMotion();
    const {copied, copy} = useCopy();

    // "/" jumps to search, like the docs.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            if (e.key === '/' && !/INPUT|TEXTAREA/.test(el.tagName)) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return REGISTRY_PACKAGES.filter((p) => {
            if (category !== 'all' && p.category !== category) return false;
            return !q || `${p.name} ${p.description} ${p.author}`.toLowerCase().includes(q);
        });
    }, [query, category]);

    return (
        <div className="mx-auto w-full max-w-7xl px-6">
            {/* ── Hero ── */}
            <section className="pb-14 pt-16 md:pb-20 md:pt-24 max-md:pt-10">
                <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-[4.25rem] max-md:text-[clamp(2.25rem,11vw,3rem)] max-md:leading-[1.02]">
                    Native libraries.
                    <span className="mt-2 block opacity-50 max-md:mt-1">Checked by the compiler.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
                    Find Prismio modules, runtime extensions and C ABI bindings. Every package is described by a
                    declarative <code className="rounded bg-zinc-950/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-900">build.ums</code> manifest,
                    so installing one never runs a script.
                </p>

                <div className="mt-10 max-w-3xl">
                    <label htmlFor="registry-search" className="sr-only">Search packages</label>
                    <div className="group relative">
                        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-teal-600"/>
                        <input
                            id="registry-search"
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search packages"
                            autoComplete="off"
                            spellCheck={false}
                            className="h-14 w-full rounded-2xl bg-white pl-12 pr-16 text-base text-zinc-950 ring-1 ring-zinc-200 transition-shadow placeholder:text-zinc-500 hover:ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        {query ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    searchRef.current?.focus();
                                }}
                                aria-label="Clear search"
                                className={`absolute right-2 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-950/[0.06] hover:text-zinc-950 ${FOCUS}`}
                            >
                                <X size={16}/>
                            </button>
                        ) : (
                            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-zinc-200 bg-zinc-950/[0.03] px-2 py-0.5 font-mono text-xs text-zinc-500 md:block">/</kbd>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Registry ── */}
            <section aria-labelledby="registry-heading" className="pb-24 md:pb-32">
                <div className="flex flex-col gap-5 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
                    <h2 id="registry-heading" className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                        Packages
                        <span className="ml-3 text-base font-normal tracking-normal text-zinc-500" aria-live="polite">
                            {results.length} of {REGISTRY_PACKAGES.length}
                        </span>
                    </h2>

                    <div role="group" aria-label="Category" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {CATEGORIES.map((c) => {
                            const active = category === c.id;
                            return (
                                <button
                                    key={c.id}
                                    aria-pressed={active}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    className={`relative min-h-10 shrink-0 cursor-pointer rounded-lg px-3.5 text-sm font-medium transition-[color,transform] duration-100 active:scale-[0.97] ${FOCUS} ${active ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'}`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="category-pill"
                                            transition={reduce ? {duration: 0} : SPRING}
                                            className="absolute inset-0 rounded-lg bg-zinc-950/[0.06] ring-1 ring-zinc-300"
                                        />
                                    )}
                                    <span className="relative">{c.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {results.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-lg font-medium text-zinc-950">No package matches “{query}”.</p>
                        <p className="mt-2 text-sm text-zinc-500">Try a shorter name, or clear the category filter.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setCategory('all');
                            }}
                            className={`mt-6 inline-flex h-11 cursor-pointer items-center rounded-xl border border-zinc-200 bg-zinc-950/[0.02] px-5 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-950/[0.05] ${FOCUS}`}
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-200">
                        {results.map((pkg) => (
                            <PackageRow key={pkg.name} pkg={pkg} copied={copied === pkg.name} onCopy={() => copy(`prismio add ${pkg.name}`, pkg.name)}/>
                        ))}
                    </ul>
                )}
            </section>

            <Manifest/>
            <Publishing/>
        </div>
    );
}

function PackageRow({pkg, copied, onCopy}: { pkg: PackageMeta; copied: boolean; onCopy: () => void }) {
    return (
        <li className="group relative grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-5 transition-colors md:grid-cols-[minmax(0,1fr)_auto_7rem_3rem] md:gap-x-8 md:px-4 md:-mx-4 md:rounded-2xl md:hover:bg-zinc-50">
            <div className="min-w-0">
                <Link
                    href={`/package/${pkg.name}`}
                    className={`rounded font-mono text-[15px] font-semibold text-zinc-950 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-teal-700 ${FOCUS}`}
                >
                    {pkg.name}
                </Link>
                <span className="ml-2.5 font-mono text-xs text-zinc-500">{pkg.version}</span>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">{pkg.description}</p>
                <p className="mt-2 text-xs text-zinc-500 md:hidden">
                    {ABI_LABEL[pkg.abi]} · {MEMORY_LABEL[pkg.aifMemory]} · {pkg.downloads} weekly
                </p>
            </div>

            <div className="hidden items-center gap-2 text-xs md:flex">
                <span className="rounded-md bg-zinc-950/[0.04] px-2 py-1 text-zinc-600 ring-1 ring-zinc-200">{ABI_LABEL[pkg.abi]}</span>
                <span className="rounded-md bg-teal-500/10 px-2 py-1 text-teal-700 ring-1 ring-teal-600/20">{MEMORY_LABEL[pkg.aifMemory]}</span>
            </div>

            <div className="hidden text-right md:block">
                <div className="font-mono text-sm text-zinc-800">{pkg.downloads}</div>
                <div className="text-xs text-zinc-500">weekly</div>
            </div>

            <button
                type="button"
                onClick={onCopy}
                aria-label={`Copy install command for ${pkg.name}`}
                className={`relative z-10 flex size-11 cursor-pointer items-center justify-center rounded-xl text-zinc-500 transition-[color,background-color,transform] duration-100 hover:bg-zinc-950/[0.06] hover:text-zinc-950 active:scale-[0.94] ${FOCUS}`}
            >
                {copied ? <Check size={16} className="text-teal-700"/> : <Copy size={16}/>}
            </button>
        </li>
    );
}

function Manifest() {
    return (
        <section className="grid items-center gap-12 border-t border-zinc-200 py-24 lg:grid-cols-12 lg:gap-20 md:py-32">
            <div className="lg:col-span-5">
                <h2 className="text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-zinc-950 sm:text-4xl">
                    One manifest.
                    <span className="mt-1 block opacity-50">No install scripts.</span>
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-zinc-600">
                    A project is whatever its <code className="font-mono text-[0.9em] text-zinc-900">build.ums</code> says
                    it is. Versions, targets and linker inputs are data the resolver reads, so the same lockfile
                    produces the same build on every machine.
                </p>
                <dl className="mt-8 max-w-md divide-y divide-zinc-200 border-y border-zinc-200 text-sm">
                    {[
                        ['Resolution', 'Constraint solver, no phantom dependencies'],
                        ['Isolation', 'No network or arbitrary writes during builds'],
                        ['Lockfile', 'Exact versions and digests, committed with your code'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
                            <dt className="font-medium text-zinc-950">{k}</dt>
                            <dd className="text-right text-zinc-500">{v}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="lg:col-span-7">
                <div className="overflow-hidden rounded-2xl bg-[#0c0d11] ring-1 ring-white/[0.08] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 font-mono text-xs text-zinc-500">
                        <span className="text-zinc-300">build.ums</span>
                        <span>your project</span>
                    </div>
                    <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-zinc-300">
                        <code>
                            <span className="text-indigo-400">project</span>{' {'}{'\n'}
                            {'    '}name = <span className="text-emerald-400">&quot;app&quot;</span>{'\n'}
                            {'    '}version = <span className="text-emerald-400">&quot;0.1.0&quot;</span>{'\n'}
                            {'    '}prismio = <span className="text-emerald-400">&quot;{PRISMIO_VERSION.replace(/^v/, '').split('.').slice(0, 2).join('.')}&quot;</span>{'\n'}
                            {'}'}{'\n'}
                            {'\n'}
                            <span className="text-indigo-400">dependencies</span>{' {'}{'\n'}
                            {'    '}<span className="text-zinc-100">implementation</span>(<span className="text-emerald-400">&quot;@prismio/net-http&quot;</span>, <span className="text-emerald-400">&quot;1.4.0&quot;</span>){'\n'}
                            {'    '}<span className="text-zinc-100">implementation</span>(<span className="text-emerald-400">&quot;zstd-native&quot;</span>, <span className="text-emerald-400">&quot;1.5.6&quot;</span>){'\n'}
                            {'}'}
                        </code>
                    </pre>
                </div>
            </div>
        </section>
    );
}

function Publishing() {
    const {copied, copy} = useCopy();
    const steps = [
        {cmd: 'prismio auth login', note: 'Authenticate the toolchain.'},
        {cmd: 'prismio package verify', note: 'Run the allocation pre-flight and manifest checks.'},
        {cmd: 'prismio publish', note: 'Sign and publish the version.'},
    ];
    return (
        <section id="publishing" className="scroll-mt-24 border-t border-zinc-200 py-24 md:py-32">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-5">
                    <h2 className="text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-zinc-950 sm:text-4xl">
                        Publish in
                        <span className="block opacity-50">three commands.</span>
                    </h2>
                    <p className="mt-6 max-w-md text-base leading-7 text-zinc-600">
                        Verification runs on your machine before anything leaves it. If the compiler cannot
                        explain where a package&apos;s values live, it tells you before your users find out.
                    </p>
                    <a
                        href="https://docs.prismio.org/package-manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-zinc-950 transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.97] ${FOCUS}`}
                    >
                        Read the manifest spec
                        <ArrowRight size={15}/>
                    </a>
                </div>

                <ol className="lg:col-span-7 space-y-3">
                    {steps.map((s, i) => (
                        <li key={s.cmd} className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 transition-shadow hover:ring-zinc-300">
                            <p className="text-sm text-zinc-500">
                                <span className="mr-2 font-mono text-zinc-400">{i + 1}.</span>{s.note}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-sm">
                                    <span className="mr-2 select-none font-bold text-indigo-600">$</span>
                                    <span className="font-semibold text-zinc-950">{s.cmd}</span>
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copy(s.cmd, s.cmd)}
                                    aria-label={`Copy ${s.cmd}`}
                                    className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-[color,background-color,transform] duration-100 hover:bg-zinc-950/[0.06] hover:text-zinc-950 active:scale-[0.94] ${FOCUS}`}
                                >
                                    {copied === s.cmd ? <Check size={15} className="text-teal-700"/> : <Copy size={15}/>}
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
