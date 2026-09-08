import React from "react";
import { Check, X, Minus } from "lucide-react";

export default function WhyPrismio() {
    const comparisonData = [
        {
            feature: "Memory Model",
            prismio: "Automatic Invalidation Flow (AIF)",
            cpp: "Manual free() / smart pointers",
            rust: "Affine Borrow Checker",
            go: "Concurrent Tracing GC",
            zig: "Manual allocators & defer",
        },
        {
            feature: "GC Pauses / Latency",
            prismio: "Zero (0 ms)",
            cpp: "Zero (0 ms)",
            rust: "Zero (0 ms)",
            go: "Non-zero GC stop/mark",
            zig: "Zero (0 ms)",
        },
        {
            feature: "String Layout",
            prismio: "16B German string (12B inline)",
            cpp: "24B-32B std::string SSO",
            rust: "24B String (no inline)",
            go: "16B string header",
            zig: "16B slice (ptr + len)",
        },
        {
            feature: "Generics Dispatch",
            prismio: "Monomorphized (Zero-cost)",
            cpp: "Templates (Zero-cost)",
            rust: "Monomorphized (Zero-cost)",
            go: "Hybrid gcshape + dict",
            zig: "Comptime duck-typed",
        },
        {
            feature: "Compilation Backend",
            prismio: "LLVM 18/19 AOT (Clang/LLD)",
            cpp: "Clang / GCC / MSVC",
            rust: "LLVM AOT",
            go: "Go Compiler backend",
            zig: "LLVM / Self-hosted",
        },
        {
            feature: "Module Architecture",
            prismio: "Unified Module System (@pkg)",
            cpp: "Header includes / Modules",
            rust: "Cargo Crates & mod",
            go: "Go Packages & modules",
            zig: "Build.zig packages",
        },
        {
            feature: "Grammar Predictability",
            prismio: "Deterministic LL(1) / LR",
            cpp: "Context-sensitive / Most Vexing",
            rust: "Macro-expanded AST",
            go: "Simplified LR",
            zig: "Comptime AST evaluation",
        },
    ];

    return (
        <section className="px-6 py-24 max-w-7xl mx-auto z-20">
            {/* Header */}
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                    Architectural Comparison
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    Where Prismio fits in the systems landscape
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Prismio is deliberately designed to provide the memory predictability of C++, the memory safety invariants of modern languages, and the ergonomics of expressive modern syntax—without GC pauses.
                </p>
            </div>

            {/* Comparison Matrix Table */}
            <div className="bg-[#0b0b10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.08] bg-[#12121a] text-gray-400 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-4 px-5">Dimension</th>
                                <th className="py-4 px-5 bg-indigo-950/40 text-indigo-300 font-bold border-x border-indigo-500/20">
                                    <span className="font-mono text-xs text-indigo-300 tracking-wider">
                                        PRISMIO
                                    </span>
                                </th>
                                <th className="py-4 px-4 text-gray-300">C++20</th>
                                <th className="py-4 px-4 text-gray-300">Rust</th>
                                <th className="py-4 px-4 text-gray-300">Go</th>
                                <th className="py-4 px-4 text-gray-300">Zig</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {comparisonData.map((row) => (
                                <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-5 font-semibold text-white font-mono">
                                        {row.feature}
                                    </td>
                                    <td className="py-4 px-5 bg-indigo-950/20 font-semibold text-indigo-200 border-x border-indigo-500/20 font-mono">
                                        {row.prismio}
                                    </td>
                                    <td className="py-4 px-4 text-gray-400">
                                        {row.cpp}
                                    </td>
                                    <td className="py-4 px-4 text-gray-400">
                                        {row.rust}
                                    </td>
                                    <td className="py-4 px-4 text-gray-400">
                                        {row.go}
                                    </td>
                                    <td className="py-4 px-4 text-gray-400">
                                        {row.zig}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
