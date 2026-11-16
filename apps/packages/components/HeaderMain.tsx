"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {ArrowUpRight, Package, Terminal, User, UploadCloud} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Button, Chip} from "@heroui/react";
import Logo from "@prismio/ui/Logo";
import UserMenu from "@/components/auth/UserMenu";
import Image from "next/image";

interface NavItem {
    label: string;
    href: string;
    isExternal?: boolean;
    isActive?: boolean;
    wideOnly?: boolean;
}

const HeaderMain: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks: NavItem[] = [
        {label: "Explore", href: "/", isActive: pathname === "/"},
        {label: "Publishing", href: "/#publishing"},
        {label: "Manifest Spec", href: "https://docs.prismio.org/package-manager", isExternal: true},
        {label: "Documentation", href: "https://docs.prismio.org", isExternal: true},
        {label: "Prismio.org", href: "https://prismio.org", isExternal: true, wideOnly: true},
    ];

    return (
        <>
            <header
                className={`
                sticky top-0 z-[80] transition-all duration-300
                ${scrolled ? "bg-white/75 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_-1px_0_rgb(24_24_27/0.06)]" : "bg-transparent"}`}>

                <div className="relative px-5 md:px-10 h-17 flex items-center">
                    {/* Brand */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Logo/>
                        <Link href="/" className="-ml-1 text-xl font-semibold tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-950">Packages</Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 ml-10 whitespace-nowrap">
                        {navLinks.map(({label, href, isExternal, isActive, wideOnly}) => {
                            if (isExternal) {
                                return (
                                    <Link
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors items-center gap-1 ${wideOnly ? "hidden xl:flex" : "flex"}`}>
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
                                        isActive ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
                                    }`}>
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="hidden lg:flex items-center gap-3 whitespace-nowrap">
                        <Link
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-950/[0.05] transition-all"
                            aria-label="GitHub Repository">
                            <Image src="/icons/github-mark.svg" alt="GitHub Repository" height={20} width={20}/>
                        </Link>

                        <UserMenu/>

                        {/* Publish / CLI CTA */}
                        <Link href="/#publishing">
                            <Button
                                variant="tertiary"
                                className="h-9 px-4 rounded-lg text-white bg-zinc-950 hover:bg-zinc-800 active:scale-[0.97] font-semibold text-xs transition-colors flex items-center gap-1.5">
                                <UploadCloud size={13} className="text-zinc-700" />
                                <span>Publish</span>
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto lg:hidden z-[90]">
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
                        className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-2xl px-6 pt-24 overflow-y-auto"
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
                                            className="flex items-center justify-between py-3.5 border-b border-zinc-200 text-base font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
                                        >
                                            <span>{label}</span>
                                            <ArrowUpRight size={14} className="opacity-50"/>
                                        </a>
                                    ) : (
                                        <Link
                                            key={label}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between py-3.5 border-b border-zinc-200 text-base font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
                                        >
                                            <span>{label}</span>
                                        </Link>
                                    )
                                ))}
                            </div>

                            {/* Mobile Auth & Publish CTAs */}
                            <div className="pt-8 flex flex-col gap-3">
                                <Link
                                    href="/auth"
                                    onClick={() => setOpen(false)}
                                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 text-zinc-950 font-medium text-sm hover:bg-zinc-950/[0.04] transition-all"
                                >
                                    <User size={14}/>
                                    <span>Sign in to Registry</span>
                                </Link>

                                <Link href="/#publishing" onClick={() => setOpen(false)}>
                                    <button
                                        className="w-full h-11 rounded-xl bg-zinc-950 text-white font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
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
