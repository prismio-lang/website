'use client';

import React from "react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";
import Link from "next/link";
import { ArrowRight, Users, Code2 } from "lucide-react";

export default function CommunityPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-clip flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white">
            {/* Background Decors */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#070709]/50 to-[#070709] z-0 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

            <HeaderMain />

            <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-20 md:py-28 flex flex-col gap-16">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <div className="text-center space-y-5 max-w-3xl mx-auto">

                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                        Built in the open,{" "}
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 to-sky-500 bg-clip-text text-transparent">
                            driven by developers.
                        </span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                        Share ideas, ask questions, and help shape the future of Prismio alongside the core team
                        and the broader systems programming community.
                    </p>
                </div>

                {/* ── Community Hub Cards ───────────────────────────────── */}
                <div className="grid md:grid-cols-5 gap-6 items-stretch">

                    {/* Discord Card — 3/5 */}
                    <div className="md:col-span-3 flex flex-col justify-between bg-[#0c0c0e]/80 border border-white/[0.08] hover:border-[#5865F2]/30 rounded-3xl p-8 backdrop-blur-2xl transition-all duration-300 group">
                        <div className="space-y-5">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/20 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/icons/discord.svg" alt="Discord" className="w-6 h-6 invert" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Discord Server</h2>
                                        <p className="text-xs text-zinc-400 mt-0.5">The primary community hub</p>
                                    </div>
                                </div>
                                <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Active
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Ask questions, discuss language proposals, report bugs, and get help from the core maintainer.
                                The Discord is where active Prismio development happens.
                            </p>

                            {/* What to expect */}
                            <div className="bg-black/30 border border-white/[0.04] rounded-2xl p-5 space-y-3 text-xs font-mono text-zinc-400">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold block">What to expect</span>
                                <div className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-px">→</span>
                                    <span>Language design & RFC discussions</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-px">→</span>
                                    <span>Bug reports & compiler help</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-px">→</span>
                                    <span>Project updates from the maintainer</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/[0.04]">
                            <a
                                href="https://discord.gg/RUXJjnJF"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold rounded-full shadow-lg shadow-[#5865F2]/10 hover:shadow-[#5865F2]/20 transition-all text-sm"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/discord.svg" alt="" className="w-4 h-4 invert" />
                                Join Discord
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* X / Twitter Card — 2/5 */}
                    <div className="md:col-span-2 flex flex-col justify-between bg-[#0c0c0e]/80 border border-white/[0.08] hover:border-zinc-700/50 rounded-3xl p-8 backdrop-blur-2xl transition-all duration-300">
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/icons/x.svg" alt="X" className="w-5 h-5 invert opacity-90" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">X / Twitter</h2>
                                    <p className="text-xs text-zinc-500 mt-0.5">Coming soon</p>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm leading-relaxed">
                                The official Prismio X community is in the works. Follow updates and announcements from the
                                core team once it launches.
                            </p>

                            <div className="bg-black/20 border border-white/[0.03] rounded-2xl px-5 py-4">
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block mb-3">Status</span>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
                                    <span className="text-xs text-zinc-500 font-mono">X community not yet available</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/[0.04]">
                            <Link
                                href="/community"
                                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 border border-white/10 text-zinc-500 rounded-full transition-all text-xs font-medium cursor-default"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/x.svg" alt="" className="w-3.5 h-3.5 invert opacity-50" />
                                Coming Soon
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── GitHub Contribution Section ───────────────────────── */}
                <div className="w-full border border-white/[0.08] hover:border-indigo-500/20 rounded-3xl overflow-hidden backdrop-blur-2xl transition-all duration-500">

                    {/* Top accent bar */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 md:gap-16 justify-between">

                        {/* Left: Info */}
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 mb-3">
                                    <Code2 size={13} />
                                    <span>Open Source</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    Contribute to Prismio
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed mt-3">
                                    Prismio is an open-source, self-hosted programming language currently in active development. The compiler is written in Prismio itself, with parts of the ecosystem and bootstrap tooling implemented in C. Contributions are welcome across the entire project.
                                </p>
                            </div>


                        </div>

                        {/* Right: CTAs */}
                        <div className="flex flex-col gap-3 justify-center shrink-0 w-full md:w-44">
                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all text-xs"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/github-mark.svg" alt="" className="w-4 h-4" />
                                Browse GitHub
                            </a>
                            <a
                                href="https://github.com/prismio-lang/prismio/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-5 py-3 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-full transition-all text-xs"
                            >
                                Open Issues
                            </a>
                        </div>
                    </div>
                </div>

            </main>

            <FooterMain />
        </div>
    );
}



