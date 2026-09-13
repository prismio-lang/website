"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {ArrowUpRight, Package, Terminal, User, UploadCloud} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Button, Chip} from "@heroui/react";
import Logo from "@prismio/ui/Logo";
import Image from "next/image";

interface NavItem {
    label: string;
    href: string;
    isExternal?: boolean;
    isActive?: boolean;
}

const HeaderMain: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks: NavItem[] = [
        {label: "Explore", href: "/", isActive: true},
        {label: "Publishing", href: "#publishing"},
        {label: "Manifest Spec", href: "https://docs.prismio.org/package-manager", isExternal: true},
        {label: "Documentation", href: "https://docs.prismio.org", isExternal: true},
        {label: "Prismio.org", href: "https://prismio.org", isExternal: true},
    ];

    return (
        <>
            <header
                className={`
                sticky top-0 z-[80] transition-all duration-300
                ${ scrolled && "backdrop-blur-xl border-b border-black/5"}`}>

                <div className="relative px-5 md:px-10 h-17 flex items-center">
                    {/* Brand */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo/>
                            <span className="font-bold text-xl text-blue-500">Packages</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex flex-1 items-center justify-center gap-9">
                        {navLinks.map(({label, href, isExternal, isActive}) => {
                            if (isExternal) {
                                return (
                                    <Link
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                                        {label}
                                        <ArrowUpRight size={11} className="opacity-50"/>
                                    </Link>
                                );
                            }
                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                                        isActive ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                                    }`}>
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="hidden md:flex items-center gap-3.5">
                        <Link
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                            aria-label="GitHub Repository">
                            <Image src="/icons/github-mark-white.svg" alt="GitHub Repository" height={20} width={20}/>
                        </Link>

                        {/* Sign In / Auth */}
                        <Link
                            href="#auth"
                            className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors flex items-center gap-1.5">
                            <User size={13} className="text-zinc-400" />
                            <span>Sign in</span>
                        </Link>

                        {/* Publish / CLI CTA */}
                        <Link href="#publishing">
                            <Button
                                variant="tertiary"
                                className="h-9 px-4 rounded-lg text-zinc-950 bg-white hover:bg-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5">
                                <UploadCloud size={13} className="text-zinc-800" />
                                <span>Publish</span>
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto md:hidden z-[90]">
                        <Hamburger toggled={isOpen} toggle={setOpen} size={20}/>
                    </div>
                </div>
            </header>

            {/* ================= MOBILE MENU ================= */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -12}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -12}}
                        transition={{duration: 0.2, ease: "easeOut"}}
                        className="fixed inset-0 z-[70] bg-[#070709]/95 backdrop-blur-2xl px-6 pt-24 overflow-y-auto"
                    >
                        <div className="flex flex-col pb-12">
                            {/* Nav links */}
                            <div className="flex flex-col gap-1">
                                {navLinks.map(({label, href, isExternal}) => (
                                    isExternal ? (
                                        <a
                                            key={label}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                        >
                                            <span>{label}</span>
                                            <ArrowUpRight size={14} className="opacity-50"/>
                                        </a>
                                    ) : (
                                        <Link
                                            key={label}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                        >
                                            <span>{label}</span>
                                        </Link>
                                    )
                                ))}
                            </div>

                            {/* Mobile Auth & Publish CTAs */}
                            <div className="pt-8 flex flex-col gap-3">
                                <Link
                                    href="#auth"
                                    onClick={() => setOpen(false)}
                                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-white/15 text-white font-medium text-sm hover:bg-white/[0.05] transition-all"
                                >
                                    <User size={14}/>
                                    <span>Sign in to Registry</span>
                                </Link>

                                <Link href="#publishing" onClick={() => setOpen(false)}>
                                    <button
                                        className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                                        <UploadCloud size={14}/>
                                        <span>Publish a Package</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeaderMain;
