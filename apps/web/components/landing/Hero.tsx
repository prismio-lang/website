'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight, Check, Copy, Terminal} from 'lucide-react';

const QUICKSTART = 'prismio init hello && cd hello && prismio run';

const SOURCE = [
    'struct Point {',
    '    x: Int,',
    '    y: Int',
    '}',
    '',
    'fn sumLocal() -> Int {',
    '    let point = Point { x: 3, y: 4 }',
    '    return point.x + point.y',
    '}',
];

export default function Hero() {
    const [copied, setCopied] = useState(false);

    const copyQuickstart = async () => {
        await navigator.clipboard.writeText(QUICKSTART);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <section className="relative mx-auto max-w-7xl px-6 pb-28 pt-14 md:pb-36 md:pt-20">
            <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-6 lg:pt-2">
                    <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-[4rem]">
                        Serious performance.
                    </h1>
                    <h1 className="max-w-3xl mt-2 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white opacity-50 sm:text-6xl lg:text-[4rem]">
                        Friendly design.
                    </h1>

                    <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
                        Prismio. Statically typed language that compiles to native
                        machine code through LLVM. Its Adaptive Inference Framework decides where
                        values live, explains every placement, and can verify those decisions at runtime.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-3">
                        <Link
                            href="/install"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <Terminal size={16}/>
                            Install Prismio
                        </Link>
                        <a
                            href="https://docs.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Read the language guide
                            <ArrowRight size={15}/>
                        </a>
                        <a
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-2 px-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <Image src="/icons/github-mark-white.svg" alt="" width={16} height={16}/>
                            View source
                        </a>
                    </div>

                    <div className="mt-9 max-w-2xl border-t border-white/[0.08] pt-6">
                        <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                            <span>Start a project</span>
                            <span>v0.1 · active development</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#0c0d11] px-4 py-3 ring-1 ring-white/[0.08]">
                            <code className="min-w-0 overflow-x-auto whitespace-nowrap text-xs text-zinc-300 sm:text-sm">
                                <span className="mr-2 select-none text-indigo-400">$</span>
                                {QUICKSTART}
                            </code>
                            <button
                                type="button"
                                onClick={copyQuickstart}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                aria-label="Copy quickstart command"
                            >
                                {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-5 text-sm">
                        <div>
                            <dt className="text-zinc-500">Compiler</dt>
                            <dd className="mt-1 font-medium text-zinc-200">Self-hosted</dd>
                        </div>
                        <div>
                            <dt className="text-zinc-500">Backend</dt>
                            <dd className="mt-1 font-medium text-zinc-200">LLVM 22 AOT</dd>
                        </div>
                        <div>
                            <dt className="text-zinc-500">Interop</dt>
                            <dd className="mt-1 font-medium text-zinc-200">Direct C ABI</dd>
                        </div>
                    </dl>
                </div>

                <div className="lg:col-span-6">
                    <div className="overflow-hidden rounded-2xl bg-[#0b0c10] shadow-[0_24px_80px_-32px_rgba(67,56,202,0.38)] ring-1 ring-white/[0.09]">
                        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5 text-xs">
                            <span className="font-mono text-zinc-300">stack-placement.psm</span>
                            <span className="text-zinc-500">real compiler behavior</span>
                        </div>

                        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                            <div className="border-b border-white/[0.07] p-5 md:border-b-0 md:border-r">
                                <pre className="overflow-x-auto text-[12px] leading-6 text-zinc-300 sm:text-[13px]">
                                    {SOURCE.map((line, index) => (
                                        <div key={`${index}-${line}`} className="flex">
                                            <span className="mr-5 w-4 select-none text-right text-zinc-700">{index + 1}</span>
                                            <code>{line}</code>
                                        </div>
                                    ))}
                                </pre>
                            </div>

                            <div className="p-5 font-mono text-[11px] leading-5 sm:text-xs">
                                <div className="text-zinc-500">$ prismio aif stack-placement.psm</div>
                                <div className="mt-5 text-zinc-200">Storage plan</div>
                                <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-zinc-400">
                                    <span>Stack</span><span className="text-emerald-400">1</span>
                                    <span>Arena</span><span>0</span>
                                    <span>Unique heap</span><span>0</span>
                                    <span>Shared heap</span><span>0</span>
                                </div>
                                <div className="mt-6 border-t border-white/[0.07] pt-4">
                                    <div className="text-zinc-200">Point → stack</div>
                                    <p className="mt-1 font-sans text-xs leading-5 text-zinc-500">
                                        Small value does not escape its frame.
                                    </p>
                                </div>
                                <div className="mt-5 rounded-xl bg-indigo-500/[0.07] p-3 text-indigo-200 ring-1 ring-indigo-400/15">
                                    Use <span className="text-white">--why=1</span> to inspect the derivation.
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.07] bg-white/[0.015] px-5 py-3 text-[11px] text-zinc-500">
                            <span>Parsed</span>
                            <span>Type checked</span>
                            <span>AIF converged</span>
                            <span className="ml-auto text-emerald-400">No runtime bookkeeping</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
