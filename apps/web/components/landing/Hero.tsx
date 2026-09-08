'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Terminal, 
    Copy, 
    Check, 
    Play, 
    ArrowRight, 
    ExternalLink, 
    Cpu, 
    ShieldCheck, 
    Zap,
    Code2,
    CheckCircle2
} from 'lucide-react';

interface CodeSample {
    filename: string;
    description: string;
    metrics: {
        compileTime: string;
        execTime: string;
        allocs: string;
        memory: string;
    };
    logs: string[];
    output: string;
    lines: Array<{
        num: number;
        tokens: Array<{ text: string; color: string }>;
    }>;
}

const SAMPLES: CodeSample[] = [
    {
        filename: 'packet.psm',
        description: 'Automatic Invalidation Flow & German Strings',
        metrics: {
            compileTime: '0.04s',
            execTime: '0.82 μs',
            allocs: '0 heap',
            memory: '2.1 MB',
        },
        logs: [
            '[frontend] parsed 18 AST nodes in 0.04ms',
            '[aif-check] verified 0 leaks, 0 dangling references, 0 GC pauses',
            '[llvm-opt] O3 pipeline: inlined 12B prefix comparison, eliminated heap call',
        ],
        output: 'Payload size: 17 bytes (German prefix inlined | 0 allocations)',
        lines: [
            {
                num: 1,
                tokens: [
                    { text: 'import ', color: 'text-purple-400 font-semibold' },
                    { text: 'std.io', color: 'text-sky-300' },
                ],
            },
            {
                num: 2,
                tokens: [
                    { text: 'import ', color: 'text-purple-400 font-semibold' },
                    { text: 'std.string', color: 'text-sky-300' },
                ],
            },
            { num: 3, tokens: [] },
            {
                num: 4,
                tokens: [
                    { text: 'struct ', color: 'text-purple-400 font-semibold' },
                    { text: 'PacketHeader ', color: 'text-yellow-300 font-bold' },
                    { text: '{', color: 'text-zinc-400' },
                ],
            },
            {
                num: 5,
                tokens: [
                    { text: '    magic', color: 'text-zinc-200' },
                    { text: ': ', color: 'text-zinc-500' },
                    { text: 'U32', color: 'text-sky-400' },
                    { text: ',', color: 'text-zinc-500' },
                ],
            },
            {
                num: 6,
                tokens: [
                    { text: '    payload_len', color: 'text-zinc-200' },
                    { text: ': ', color: 'text-zinc-500' },
                    { text: 'Int', color: 'text-sky-400' },
                    { text: ',', color: 'text-zinc-500' },
                ],
            },
            {
                num: 7,
                tokens: [
                    { text: '    checksum', color: 'text-zinc-200' },
                    { text: ': ', color: 'text-zinc-500' },
                    { text: 'U64', color: 'text-sky-400' },
                ],
            },
            {
                num: 8,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
            { num: 9, tokens: [] },
            {
                num: 10,
                tokens: [
                    { text: '// AIF eliminates manual free() without GC pauses', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 11,
                tokens: [
                    { text: 'fn ', color: 'text-purple-400 font-semibold' },
                    { text: 'parseHeader', color: 'text-blue-400 font-semibold' },
                    { text: '(data: ', color: 'text-zinc-300' },
                    { text: 'String borrow', color: 'text-sky-300' },
                    { text: ') -> ', color: 'text-purple-400' },
                    { text: 'PacketHeader ', color: 'text-yellow-300' },
                    { text: '{', color: 'text-zinc-400' },
                ],
            },
            {
                num: 12,
                tokens: [
                    { text: '    return ', color: 'text-purple-400 font-semibold' },
                    { text: 'PacketHeader {', color: 'text-yellow-300' },
                ],
            },
            {
                num: 13,
                tokens: [
                    { text: '        magic: ', color: 'text-zinc-300' },
                    { text: '0x50534D', color: 'text-amber-400 font-mono' },
                    { text: ',', color: 'text-zinc-500' },
                ],
            },
            {
                num: 14,
                tokens: [
                    { text: '        payload_len: ', color: 'text-zinc-300' },
                    { text: 'data.', color: 'text-zinc-200' },
                    { text: 'len', color: 'text-blue-400' },
                    { text: '(),', color: 'text-zinc-400' },
                ],
            },
            {
                num: 15,
                tokens: [
                    { text: '        checksum: ', color: 'text-zinc-300' },
                    { text: '0xABCDEF12', color: 'text-amber-400 font-mono' },
                ],
            },
            {
                num: 16,
                tokens: [{ text: '    }', color: 'text-yellow-300' }],
            },
            {
                num: 17,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
            { num: 18, tokens: [] },
            {
                num: 19,
                tokens: [
                    { text: 'fn ', color: 'text-purple-400 font-semibold' },
                    { text: 'main', color: 'text-blue-400 font-semibold' },
                    { text: '() {', color: 'text-zinc-400' },
                ],
            },
            {
                num: 20,
                tokens: [
                    { text: '    let ', color: 'text-purple-400 font-semibold' },
                    { text: 'raw', color: 'text-zinc-200' },
                    { text: ' = ', color: 'text-purple-400' },
                    { text: '"PRISMIO_PACKET_V1"', color: 'text-emerald-400' },
                ],
            },
            {
                num: 21,
                tokens: [
                    { text: '    let ', color: 'text-purple-400 font-semibold' },
                    { text: 'header', color: 'text-zinc-200' },
                    { text: ' = ', color: 'text-purple-400' },
                    { text: 'parseHeader', color: 'text-blue-400' },
                    { text: '(raw)', color: 'text-zinc-300' },
                ],
            },
            {
                num: 22,
                tokens: [
                    { text: '    println', color: 'text-blue-400' },
                    { text: '("Payload size: " + header.payload_len.', color: 'text-zinc-300' },
                    { text: 'toString', color: 'text-blue-400' },
                    { text: '())', color: 'text-zinc-300' },
                ],
            },
            {
                num: 23,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
        ],
    },
    {
        filename: 'german_strings.psm',
        description: '16-Byte German String Layout (12B Inline)',
        metrics: {
            compileTime: '0.03s',
            execTime: '0.41 μs',
            allocs: '0 heap',
            memory: '1.8 MB',
        },
        logs: [
            '[frontend] parsed German string AST representation',
            '[aif-check] inlining verified for 8-byte string literals',
            '[llvm-opt] constant-time prefix check via 4-byte integer compare',
        ],
        output: 'Prefix match: true (evaluated in 0.41 μs with zero pointer dereference)',
        lines: [
            {
                num: 1,
                tokens: [
                    { text: '// German String Representation:', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 2,
                tokens: [
                    { text: '// [4B Len] [4B Inline Prefix] [8B Ptr / Suffix]', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 3,
                tokens: [
                    { text: '// Strings <= 12B require zero heap allocation.', color: 'text-zinc-500 italic' },
                ],
            },
            { num: 4, tokens: [] },
            {
                num: 5,
                tokens: [
                    { text: 'fn ', color: 'text-purple-400 font-semibold' },
                    { text: 'fastFilter', color: 'text-blue-400 font-semibold' },
                    { text: '(id: ', color: 'text-zinc-300' },
                    { text: 'String borrow', color: 'text-sky-300' },
                    { text: ') -> ', color: 'text-purple-400' },
                    { text: 'Bool ', color: 'text-sky-400' },
                    { text: '{', color: 'text-zinc-400' },
                ],
            },
            {
                num: 6,
                tokens: [
                    { text: '    // Compares 4-byte inline prefix without pointer deref', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 7,
                tokens: [
                    { text: '    if ', color: 'text-purple-400 font-semibold' },
                    { text: '(id.', color: 'text-zinc-300' },
                    { text: 'startsWith', color: 'text-blue-400' },
                    { text: '("sys_")) {', color: 'text-zinc-300' },
                ],
            },
            {
                num: 8,
                tokens: [
                    { text: '        return ', color: 'text-purple-400 font-semibold' },
                    { text: 'true', color: 'text-amber-400' },
                ],
            },
            {
                num: 9,
                tokens: [{ text: '    }', color: 'text-zinc-400' }],
            },
            {
                num: 10,
                tokens: [
                    { text: '    return ', color: 'text-purple-400 font-semibold' },
                    { text: 'false', color: 'text-amber-400' },
                ],
            },
            {
                num: 11,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
            { num: 12, tokens: [] },
            {
                num: 13,
                tokens: [
                    { text: 'fn ', color: 'text-purple-400 font-semibold' },
                    { text: 'main', color: 'text-blue-400 font-semibold' },
                    { text: '() {', color: 'text-zinc-400' },
                ],
            },
            {
                num: 14,
                tokens: [
                    { text: '    let ', color: 'text-purple-400 font-semibold' },
                    { text: 's', color: 'text-zinc-200' },
                    { text: ' = ', color: 'text-purple-400' },
                    { text: '"sys_core"', color: 'text-emerald-400' },
                    { text: ' // 8 bytes -> allocated on stack', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 15,
                tokens: [
                    { text: '    println', color: 'text-blue-400' },
                    { text: '("Prefix match: " + fastFilter(s).', color: 'text-zinc-300' },
                    { text: 'toString', color: 'text-blue-400' },
                    { text: '())', color: 'text-zinc-300' },
                ],
            },
            {
                num: 16,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
        ],
    },
    {
        filename: 'generics.psm',
        description: 'Monomorphized Parametric Generic Collections',
        metrics: {
            compileTime: '0.05s',
            execTime: '1.15 μs',
            allocs: '1 contig',
            memory: '2.4 MB',
        },
        logs: [
            '[frontend] monomorphizing RingBuffer<Int>',
            '[aif-check] single continuous backing buffer, deterministic drop',
            '[llvm-opt] unrolled modular arithmetic loop, vectorized SIMD instructions',
        ],
        output: 'Pushed 10,000 items | Checksum: 49995000 | Zero vtable dispatch',
        lines: [
            {
                num: 1,
                tokens: [
                    { text: 'import ', color: 'text-purple-400 font-semibold' },
                    { text: 'std.collections', color: 'text-sky-300' },
                ],
            },
            { num: 2, tokens: [] },
            {
                num: 3,
                tokens: [
                    { text: '// Monomorphized generic struct — specialized at compile time', color: 'text-zinc-500 italic' },
                ],
            },
            {
                num: 4,
                tokens: [
                    { text: 'struct ', color: 'text-purple-400 font-semibold' },
                    { text: 'RingBuffer', color: 'text-yellow-300 font-bold' },
                    { text: '<', color: 'text-zinc-500' },
                    { text: 'T', color: 'text-sky-400' },
                    { text: '> {', color: 'text-zinc-400' },
                ],
            },
            {
                num: 5,
                tokens: [
                    { text: '    data', color: 'text-zinc-200' },
                    { text: ': ', color: 'text-zinc-500' },
                    { text: 'List<T>', color: 'text-sky-400' },
                    { text: ',', color: 'text-zinc-500' },
                ],
            },
            {
                num: 6,
                tokens: [
                    { text: '    capacity', color: 'text-zinc-200' },
                    { text: ': ', color: 'text-zinc-500' },
                    { text: 'Int', color: 'text-sky-400' },
                ],
            },
            {
                num: 7,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
            { num: 8, tokens: [] },
            {
                num: 9,
                tokens: [
                    { text: 'fn ', color: 'text-purple-400 font-semibold' },
                    { text: 'pushItem', color: 'text-blue-400 font-semibold' },
                    { text: '<T>(', color: 'text-zinc-400' },
                    { text: 'mut ', color: 'text-purple-400 font-semibold' },
                    { text: 'buf: ', color: 'text-zinc-300' },
                    { text: 'RingBuffer<T>', color: 'text-yellow-300' },
                    { text: ', item: ', color: 'text-zinc-300' },
                    { text: 'T', color: 'text-sky-400' },
                    { text: ') {', color: 'text-zinc-400' },
                ],
            },
            {
                num: 10,
                tokens: [
                    { text: '    buf.data.', color: 'text-zinc-300' },
                    { text: 'push', color: 'text-blue-400' },
                    { text: '(item)', color: 'text-zinc-300' },
                ],
            },
            {
                num: 11,
                tokens: [{ text: '}', color: 'text-zinc-400' }],
            },
        ],
    },
];

export default function Hero() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const installCmd = 'curl -fsSL https://prismio.org/install.sh | sh';

    const currentSample = SAMPLES[activeIdx] ?? SAMPLES[0]!;

    const handleCopy = () => {
        navigator.clipboard.writeText(installCmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTriggerRun = () => {
        setIsRunning(true);
        setTimeout(() => {
            setIsRunning(false);
        }, 300);
    };

    return (
        <section className="relative mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-20 md:pb-28 z-20">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-start">
                {/* Left Column: Authoritative Editorial Positioning */}
                <div className="lg:col-span-5 space-y-6">
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.08]">
                        Pure native speed.
                        <br />
                        <span className="text-zinc-300">
                            Zero garbage collection.
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md">
                        Prismio unites LLVM machine-code generation with Automatic Invalidation Flow (AIF)—eliminating runtime GC pauses and manual <code className="text-zinc-200 font-mono text-xs">free()</code> without sacrificing systems control.
                    </p>

                    {/* Quickstart Terminal Command Box */}
                    <div className="pt-2">
                        <div className="p-3 bg-[#0c0d12] border border-white/[0.08] rounded-xl font-mono text-xs shadow-inner">
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.04] text-[11px] text-zinc-500">
                                <span>Install Prismio Compiler</span>
                                <span className="text-zinc-400">macOS / Linux / WSL</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 overflow-x-auto text-zinc-300">
                                    <span className="text-zinc-500 select-none">$</span>
                                    <span className="select-all whitespace-nowrap text-zinc-200">{installCmd}</span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 text-[11px] font-sans"
                                    title="Copy installation command"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={12} className="text-emerald-400" />
                                            <span className="text-emerald-400 font-semibold">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Primary CTAs */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link href="/install">
                            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all shadow-sm cursor-pointer">
                                <Terminal size={14} />
                                Install Toolchain
                            </button>
                        </Link>

                        <Link href="/benchmarks">
                            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer">
                                View 40 Benchmarks
                                <ArrowRight size={13} />
                            </button>
                        </Link>

                        <a
                            href="https://playground.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-2"
                        >
                            <span>Interactive Playground</span>
                            <ExternalLink size={12} className="opacity-60" />
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] text-center">
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-lg font-bold font-mono text-white">0 ms</div>
                            <div className="text-[10px] text-zinc-500 font-mono">GC Pauses</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-lg font-bold font-mono text-indigo-400">2.5x</div>
                            <div className="text-[10px] text-zinc-500 font-mono">Faster vs Clang</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-lg font-bold font-mono text-emerald-400">16 Byte</div>
                            <div className="text-[10px] text-zinc-500 font-mono">German Strings</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: High-Fidelity Compiler Studio */}
                <div className="lg:col-span-7">
                    <div className="relative bg-[#0b0c10] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_0_80px_-20px_rgba(99,102,241,0.15)] ring-1 ring-white/[0.02]">
                        {/* Studio Header Bar */}
                        <div className="bg-[#12131a] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                            
                            <div className="flex items-center gap-4">
                                {/* Traffic Lights (macOS style but muted) */}
                                <div className="flex items-center gap-1.5 hidden sm:flex">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
                                </div>
                                
                                {/* File Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto">
                                    {SAMPLES.map((s, idx) => (
                                        <button
                                            key={s.filename}
                                            onClick={() => {
                                                setActiveIdx(idx);
                                                handleTriggerRun();
                                            }}
                                            className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                                                activeIdx === idx
                                                    ? 'bg-[#1a1b24] text-zinc-100 border border-white/[0.08] shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <Code2 size={12} className={activeIdx === idx ? 'text-indigo-400' : 'opacity-40'} />
                                            <span>{s.filename}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Run Action */}
                            <button
                                onClick={handleTriggerRun}
                                disabled={isRunning}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0 cursor-pointer disabled:opacity-50 disabled:shadow-none"
                            >
                                <Play size={10} fill="currentColor" />
                                <span>{isRunning ? 'COMPILING' : 'RUN'}</span>
                            </button>
                        </div>

                        {/* Editor Body with Syntax Tokens and Line Numbers */}
                        <div className="p-4 font-mono text-[12px] leading-[1.65] bg-[#07080b] overflow-x-auto max-h-[380px] overflow-y-auto">
                            {currentSample.lines.map((line) => (
                                <div key={line.num} className="flex items-start hover:bg-white/[0.02] -mx-4 px-4 transition-colors">
                                    <span className="w-8 select-none text-right pr-4 text-zinc-600 text-[11px] shrink-0 font-mono">
                                        {line.num}
                                    </span>
                                    <span className="whitespace-pre">
                                        {line.tokens.length === 0 ? (
                                            '\u00A0'
                                        ) : (
                                            line.tokens.map((tok, tIdx) => (
                                                <span key={tIdx} className={tok.color}>
                                                    {tok.text}
                                                </span>
                                            ))
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Execution Output Terminal Drawer */}
                        <div className="border-t border-white/[0.08] bg-[#0c0d12] p-4 text-xs font-mono">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04] text-[11px] text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Compiler Diagnostic & Execution Telemetry</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px]">
                                    <span>Compile: <strong className="text-zinc-300">{currentSample.metrics.compileTime}</strong></span>
                                    <span>Wall: <strong className="text-emerald-400">{currentSample.metrics.execTime}</strong></span>
                                    <span>Heap: <strong className="text-zinc-300">{currentSample.metrics.allocs}</strong></span>
                                </div>
                            </div>

                            {/* Compilation Pipeline Steps */}
                            <div className="space-y-1 text-[11px] text-zinc-400 mb-3">
                                {currentSample.logs.map((log, lIdx) => (
                                    <div key={lIdx} className="flex items-center gap-2">
                                        <span className="text-zinc-600">&gt;</span>
                                        <span>{log}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Program Output Banner */}
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] text-zinc-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-400 font-bold">$</span>
                                    <span>{currentSample.output}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500">Exit: 0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
