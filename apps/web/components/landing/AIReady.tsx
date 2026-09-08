import React from "react";
import { Terminal, Binary, FileCode2, ShieldCheck } from "lucide-react";

export default function AIReady() {
    return (
        <section className="px-6 py-24 max-w-7xl mx-auto z-20">
            {/* Title & Subtitle */}
            <div className="max-w-3xl mx-auto mb-16 text-center space-y-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-semibold">
                    Tooling & Agent Architecture
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    Engineered for machine reasoning & tooling
                </h2>
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                    Most systems languages were designed before modern autonomous coding agents. Prismio provides unambiguous token streams, lossless semantic graphs, and compile-time verification gates.
                </p>
            </div>

            {/* Architecture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Fact 1 */}
                <div className="group p-6 rounded-2xl bg-[#0b0c10] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-[#0c0d12] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-[0.15em] font-bold">01 / GRAMMAR</span>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-300">
                            <Binary size={15} />
                        </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-zinc-100 mb-2 relative z-10 group-hover:text-white transition-colors">Deterministic Grammar</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed relative z-10">
                        Prismio eliminates macro-expansion ambiguities, operator precedence traps, and context-sensitive parsing. Both LLMs and static parsers construct unambiguous syntax trees without multi-pass guessing.
                    </p>
                    <div className="mt-5 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500 relative z-10">
                        LL(1) / Single-Pass Grammar
                    </div>
                </div>

                {/* Fact 2 */}
                <div className="group p-6 rounded-2xl bg-[#0b0c10] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-[#0c0d12] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-[0.15em] font-bold">02 / CLI TOOLS</span>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-300">
                            <FileCode2 size={15} />
                        </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-zinc-100 mb-2 relative z-10 group-hover:text-white transition-colors">Lossless Structured AST</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed relative z-10">
                        CLI-level semantic export (<code className="text-zinc-200 font-mono text-[11px] px-1 py-0.5 rounded bg-white/[0.04] border border-white/5">prismio dump-ast --json</code>) exposes exact symbol tables and source spans. Agents and LSPs perform semantic transforms without lossy string munging.
                    </p>
                    <div className="mt-5 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500 relative z-10">
                        First-Class CLI Exporters
                    </div>
                </div>

                {/* Fact 3 */}
                <div className="group p-6 rounded-2xl bg-[#0b0c10] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-[#0c0d12] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-[0.15em] font-bold">03 / VERIFICATION</span>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-300">
                            <ShieldCheck size={15} />
                        </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-zinc-100 mb-2 relative z-10 group-hover:text-white transition-colors">Deterministic Safety Gates</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed relative z-10">
                        Automatic Invalidation Flow provides a mathematical compiler verification gate. Agent-generated code is checked for memory leaks and invalid lifetime transfers with zero undefined behavior.
                    </p>
                    <div className="mt-5 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500 relative z-10">
                        Compile-Time Leak Invariance
                    </div>
                </div>
            </div>
        </section>
    );
}
