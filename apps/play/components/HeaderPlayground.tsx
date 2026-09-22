'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, Code2, ExternalLink } from 'lucide-react';
import Logo from '@prismio/ui/Logo';
import { PRISMIO_VERSION, LLVM_VERSION } from '@prismio/utils';
import { Cross as Hamburger } from 'hamburger-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HeaderPlayground() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 h-12 bg-[#070709] border-b border-white/10 flex items-center px-4 sm:px-6 select-none">
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="https://prismio.org" className="flex items-center gap-2 group">
                        <Logo />
                    </Link>

                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 ml-2 border-l border-white/10 text-[11px] font-mono text-zinc-400">
                        <span className="text-[#47d7b5]">{PRISMIO_VERSION}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-500">LLVM {LLVM_VERSION}</span>
                    </div>
                </div>

                {/* Center Title */}
                <div className="hidden md:flex items-center gap-2 mx-auto text-xs font-mono text-zinc-400">
                    <Code2 size={13} className="text-[#47d7b5]" />
                    <span className="text-zinc-200">main.psm</span>
                </div>

                {/* Right actions */}
                <div className="hidden md:flex items-center gap-2 ml-auto">
                    <a
                        href="https://docs.prismio.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        <BookOpen size={13} />
                        Docs
                        <ArrowUpRight size={10} className="opacity-40" />
                    </a>

                    <a
                        href="https://developers.prismio.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        Developers
                        <ArrowUpRight size={10} className="opacity-40" />
                    </a>

                    <a
                        href="https://packages.prismio.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                        Packages
                        <ArrowUpRight size={10} className="opacity-40" />
                    </a>

                    <a
                        href="https://github.com/prismio-lang/prismio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors ml-1"
                        aria-label="GitHub Repository"
                    >
                        <Image src="/icons/github-mark-white.svg" alt="GitHub Repository" width={16} height={16} />
                    </a>
                </div>

                {/* Mobile hamburger */}
                <div className="ml-auto md:hidden z-50">
                    <Hamburger toggled={mobileOpen} toggle={setMobileOpen} size={18} />
                </div>
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-14 z-40 bg-[#070709]/98 border-b border-white/10 p-6 flex flex-col gap-4 backdrop-blur-2xl md:hidden"
                    >
                        <a
                            href="https://docs.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm text-zinc-300 hover:text-white py-2 border-b border-white/[0.06]"
                        >
                            <span>Language Documentation</span>
                            <ExternalLink size={14} className="text-zinc-500" />
                        </a>
                        <a
                            href="https://developers.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm text-zinc-300 hover:text-white py-2 border-b border-white/[0.06]"
                        >
                            <span>Compiler Developer Portal</span>
                            <ExternalLink size={14} className="text-zinc-500" />
                        </a>
                        <a
                            href="https://packages.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm text-zinc-300 hover:text-white py-2 border-b border-white/[0.06]"
                        >
                            <span>Packages Registry</span>
                            <ExternalLink size={14} className="text-zinc-500" />
                        </a>
                        <a
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm text-zinc-300 hover:text-white py-2"
                        >
                            <span>GitHub Repository</span>
                            <Image src="/icons/github-mark-white.svg" alt="GitHub" width={16} height={16} />
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
