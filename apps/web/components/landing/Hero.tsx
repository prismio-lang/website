import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative mx-auto max-w-7xl px-6 pt-28 md:pt-40 pb-28 md:pb-48 text-center z-20">
            {/* Heading */}
            <h1 className="mx-auto max-w-5xl text-balance font-bold leading-[1.1] md:leading-[1.05] text-white
                 text-[2rem] md:text-5xl tracking-tight">
                Serious performance.
                <br/>
                <span className="bg-gradient-to-r from-indigo-400 to-sky-500 bg-clip-text text-transparent">
                    Friendly design.
                </span>
            </h1>

            {/* Subheading / Value */}
            <p className="mx-auto mt-6 md:mt-10 max-w-3xl text-sm md:text-lg text-gray-300 leading-relaxed px-2 md:px-0">
                Prismio unifies <span className="text-white font-medium">native performance</span>,
                <span className="text-white font-medium"> memory safety</span>,
                and
                <span className="text-white font-medium"> AI-native tooling </span> <br className={"hidden md:block"}/>
                into a single toolchain without sacrificing control.
            </p>

            <div className="mx-auto mt-6 md:mt-12 flex items-center justify-center gap-3 text-sm md:text-lg font-medium">
                <span className="text-sky-400">Built for systems</span>
                <span className="text-gray-500 select-none">|</span>
                <span className="text-purple-400">Designed for humans</span>
            </div>

            {/* CTAs */}
            <div className="mt-10 md:mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6 px-4 sm:px-0">
                <Link href={'/install'} className="w-full sm:w-auto">
                    <button
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-full
                     bg-white px-5 py-2.5 md:px-7 md:py-4 text-sm font-semibold text-black
                     shadow-lg shadow-white/10 cursor-pointer
                     transition-all hover:-translate-y-[2px] hover:bg-gray-200">
                        Install Prismio
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/>
                    </button>
                </Link>

                <Link href={"/docs"} className="w-full sm:w-auto">
                    <button
                        className="w-full inline-flex items-center justify-center rounded-full
                     border border-white/15 px-5 py-2.5 md:px-7 md:py-4 text-sm font-medium
                     text-gray-300 backdrop-blur cursor-pointer
                     transition-all hover:border-white/30 hover:text-white">
                        Read the Docs
                    </button>
                </Link>
            </div>
        </section>
    );
}
