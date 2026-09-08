import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Terminal, BookOpen, Milestone, BarChart3 } from "lucide-react";

export default function CTA() {
    return (
        <section className="relative px-6 py-20 max-w-5xl mx-auto text-center z-20">
            {/* Tag */}
            <span className="inline-block mb-6 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Open Source • Apache-2.0
            </span>

            {/* Title */}
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5">
                Ready to build with Prismio?
            </h2>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                The Prismio compiler and standard library are developed in the open. Explore our roadmap, run the 40-workload benchmark suite, and start building native systems.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-4 mb-16">
                <Link
                    href="/install"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 text-black font-bold text-xs sm:text-[13px] hover:bg-white transition-all duration-300 shadow-[0_0_25px_-5px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Terminal size={15} />
                    Install Toolchain
                </Link>

                <a
                    href="https://github.com/prismio-lang/prismio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/[0.08] hover:border-white/[0.15] text-xs sm:text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Image src="/icons/github-mark-white.svg" alt="GitHub" width={16} height={16} className="opacity-90" />
                    Star on GitHub
                </a>

                <Link
                    href="/roadmap"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent hover:border-white/[0.05] text-xs sm:text-[13px] font-semibold transition-all duration-300"
                >
                    <Milestone size={15} />
                    View Roadmap
                </Link>

                <Link
                    href="/benchmarks"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent hover:border-white/[0.05] text-xs sm:text-[13px] font-semibold transition-all duration-300"
                >
                    <BarChart3 size={15} />
                    Benchmarks
                </Link>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-6 border-t border-white/5 text-xs text-gray-500 font-mono">
                <span className="px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.05]">
                    Target: <span className="text-gray-300">x86_64 / arm64</span>
                </span>
                <span className="px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.05]">
                    Backend: <span className="text-gray-300">LLVM 18+ AOT</span>
                </span>
                <span className="px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.05]">
                    Memory: <span className="text-gray-300">AIF Deterministic</span>
                </span>
                <span className="px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.05]">
                    License: <span className="text-gray-300">Apache-2.0</span>
                </span>
            </div>
        </section>
    );
}
