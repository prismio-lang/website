"use client";

import React, {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import Logo from "@prismio/ui/Logo";

const Header = () => {
    const [isOpen, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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
                <div className="relative px-8 md:px-10 h-17 flex items-center">

                    <div className="flex items-center gap-3 shrink-0">
                        <Logo/>
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
                        <div className="flex flex-col gap-6">

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;