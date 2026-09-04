import React from "react";
import { Cpu, Shield, Code2 } from "lucide-react";

export default function Principles() {
    return (
        <section className="px-8 pb-32 max-w-7xl mx-auto z-20">
            <div className="border-y border-white/[0.08] py-16 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] text-left">
                {/* Principle 1 */}
                <div className="group pb-8 md:pb-0 md:pr-10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">01</span>
                        <Cpu size={16} className="text-zinc-600 group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mt-5 mb-2 transition-colors duration-300 group-hover:text-indigo-300">
                        Native Performance
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        No garbage collector. No hidden runtime. LLVM-powered compilation with predictable memory layout.
                    </p>
                </div>

                {/* Principle 2 */}
                <div className="group py-8 md:py-0 md:px-10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">02</span>
                        <Shield size={16} className="text-zinc-600 group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mt-5 mb-2 transition-colors duration-300 group-hover:text-indigo-300">
                        Compiler-Enforced Safety
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Ownership, borrowing, and lifetime rules enforced at compile time — without verbose syntax.
                    </p>
                </div>

                {/* Principle 3 */}
                <div className="group pt-8 md:pt-0 md:pl-10">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">03</span>
                        <Code2 size={16} className="text-zinc-600 group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mt-5 mb-2 transition-colors duration-300 group-hover:text-indigo-300">
                        Readable by Default
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Kotlin-inspired syntax with minimal noise, explicit intent, and strong structure.
                    </p>
                </div>
            </div>
        </section>
    );
}
