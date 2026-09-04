"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {ArrowUpRight} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Button} from "@heroui/react";

const HeaderMain: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [
        {label: "Community", href: "/community"},
        {label: "Playground", href: "/playground", icon: ArrowUpRight},
        {label: "Packages", href: "/packages", icon: ArrowUpRight},
        {label: "Docs", href: "/docs", icon: ArrowUpRight}
    ];

    return (
        <>
            {/* ================= HEADER ================= */}
            <header
                className={`
          sticky top-0 z-[80] transition-all duration-300
          ${
                    scrolled
                        ? "bg-[#0b0b0b]/65 backdrop-blur-xl border-b border-white/10"
                        : "bg-transparent border-b border-transparent"
                }
        `}
            >
                <div className="relative px-5 md:px-10 h-17 flex items-center">

                    <div className="flex items-center gap-3 shrink-0">
                        <Logo/>
                    </div>


                    <nav className="w-full hidden md:flex items-center justify-center gap-10">
                        {navLinks.map(({label, href, icon: Icon}) => (
                            <Link
                                key={label}
                                href={href}
                                className="
                  text-base font-medium
                  text-gray-400
                  hover:text-white
                  transition-colors flex items-center gap-1
                "
                            >
                                {label}
                                {Icon && <Icon size={16} className="opacity-70"/>}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-auto hidden md:flex items-center gap-3">

                        <Link href="/install">
                            <Button
                                variant="tertiary"
                                className="
                      h-10 px-6 rounded-full
                      text-gray-800
                      bg-white
                    "
                            >
                                Install
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto md:hidden z-[90]">
                        <Hamburger toggled={isOpen} toggle={setOpen} size={22}/>
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
                        transition={{duration: 0.25, ease: "easeOut"}}
                        className="
              fixed inset-0 z-[70]
              bg-black/95
              backdrop-blur-xl
              px-6 pt-24
            "
                    >
                        <div className="flex flex-col">
                            {/* Nav links */}
                            <div className="flex flex-col gap-1">
                                {navLinks.map(({label, href, icon: Icon}) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-gray-300 hover:text-white transition-colors"
                                    >
                                        <span>{label}</span>
                                        {Icon && <Icon size={15} className="opacity-50" />}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile CTA */}
                            <div className="pt-8">
                                <Link href="/install" onClick={() => setOpen(false)}>
                                    <button className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all">
                                        Install Prismio
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
