import React from "react";
import { AlertCircle } from "lucide-react";

export default function WhyPrismio() {
    return (
        <section className="px-8 pb-32 max-w-7xl mx-auto">
            {/* Header */}
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Why Prismio exists
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Systems programming today is powerful — but unnecessarily painful.
                    Prismio removes accidental complexity without sacrificing performance, control, or correctness.
                </p>
            </div>

            {/* Problems Grid Box */}
            <div className="max-w-4xl mx-auto mb-20">
                <div
                    className="relative rounded-3xl p-8 bg-[#0c0c0e]/60 border border-white/[0.06] hover:border-red-500/20 hover:shadow-[0_0_50px_rgba(239,68,68,0.02)] backdrop-blur-xl transition-all duration-300 text-left">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2.5 text-red-400">
                        <AlertCircle size={18} className="opacity-90" />
                        The problems today
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-red-400/80 font-mono text-xs uppercase tracking-wider font-bold">
                                <span>01</span>
                                <span>Memory Safety</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                C++ gives low-level control, but easily invites undefined behavior, memory leaks, and segmentation faults.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-red-400/80 font-mono text-xs uppercase tracking-wider font-bold">
                                <span>02</span>
                                <span>Steep Complexity</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Rust enforces strict compile-time safety, but requires steep cognitive overhead and verbose compiler syntax.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-red-400/80 font-mono text-xs uppercase tracking-wider font-bold">
                                <span>03</span>
                                <span>Runtime Overhead</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                High-level languages hide performance-critical hardware details, introducing garbage collection pauses and heavy VM memory requirements.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-red-400/80 font-mono text-xs uppercase tracking-wider font-bold">
                                <span>04</span>
                                <span>Outdated Tooling</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Traditional build systems and compilers are not designed for structural code transformations, stable AST parsing, and AI-assisted refactoring.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="max-w-4xl mx-auto bg-[#0c0c0e]/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] sm:min-w-[600px] border-collapse text-left text-xs sm:text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02] select-none">
                                <th className="p-4 sm:p-5 font-semibold text-gray-400">Feature</th>
                                <th className="p-4 sm:p-5 font-semibold text-[#10b981]">Prismio</th>
                                <th className="p-4 sm:p-5 font-semibold text-zinc-500">Others</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-gray-300">
                            <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 sm:p-5 font-medium text-white">Performance</td>
                                <td className="p-4 sm:p-5 text-[#10b981] font-semibold">Native (LLVM-backed)</td>
                                <td className="p-4 sm:p-5 text-zinc-500 line-through decoration-zinc-600">Varies (VM / GC pauses)</td>
                            </tr>
                            <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 sm:p-5 font-medium text-white">Safety</td>
                                <td className="p-4 sm:p-5 text-[#10b981] font-semibold">Compile-time (lifetimes)</td>
                                <td className="p-4 sm:p-5 text-zinc-500 line-through decoration-zinc-600">Manual / Verbose safety checks</td>
                            </tr>
                            <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 sm:p-5 font-medium text-white">Syntax</td>
                                <td className="p-4 sm:p-5 text-[#10b981] font-semibold">Readable (Kotlin-like)</td>
                                <td className="p-4 sm:p-5 text-zinc-500 line-through decoration-zinc-600">Complex / Boilerplate syntax</td>
                            </tr>
                            <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 sm:p-5 font-medium text-white">AI Readiness</td>
                                <td className="p-4 sm:p-5 text-[#10b981] font-semibold">First-class (Stable AST)</td>
                                <td className="p-4 sm:p-5 text-zinc-500 line-through decoration-zinc-600">Afterthought integration</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
