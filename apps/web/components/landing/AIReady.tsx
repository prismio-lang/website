import React from "react";

export default function AIReady() {
    return (
        <section className="px-8 py-32 max-w-7xl mx-auto text-center">
            {/* Title & Subtitle */}
            <div className="max-w-3xl mx-auto mb-20 text-center space-y-4">

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Designed for AI-native development
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Prismio’s deterministic grammar, structured AST, and semantic clarity
                    make it inherently compatible with AI code generation, refactoring,
                    static analysis, and automated tooling.
                </p>
            </div>

            {/* Bordered Grid */}
            <div className="border-y border-white/[0.08] py-16 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] text-left">
                {/* Item 1 */}
                <div className="pb-8 md:pb-0 md:pr-10">
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">01</span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">Model-Friendly Grammar</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Low ambiguity syntax with strong semantic signals that improve generation reliability and prevent model hallucination.
                    </p>
                </div>

                {/* Item 2 */}
                <div className="py-8 md:py-0 md:px-10">
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">02</span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">Stable AST</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Designed to be consumed by compilers, tooling systems, and LLMs directly without lossy intermediate transforms.
                    </p>
                </div>

                {/* Item 3 */}
                <div className="pt-8 md:pt-0 md:pl-10">
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">03</span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">Refactor-Safe Design</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Strict compile-time structural guarantees support automated transformations, code migrations, and high-confidence edits.
                    </p>
                </div>
            </div>
        </section>
    );
}
