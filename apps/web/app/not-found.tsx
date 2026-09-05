'use client';

import React from "react";
import Link from "next/link";
import {
    House,
    Users,
    Terminal,
    Package,
    BookOpen,
    Download,
    ArrowRight,
} from "lucide-react";
import Logo from "@prismio/ui/Logo";

const navLinks = [
    { title: "Home",        icon: House,     href: "/",           desc: "Back to the main page" },
    { title: "Community",   icon: Users,     href: "/community",  desc: "Join the conversation" },
    { title: "Playground",  icon: Terminal,  href: "/playground", desc: "Try Prismio in browser" },
    { title: "Packages",    icon: Package,   href: "/packages",   desc: "Browse the ecosystem" },
    { title: "Docs",        icon: BookOpen,  href: "/docs",       desc: "Read the documentation" },
    { title: "Install",     icon: Download,  href: "/install",    desc: "Get Prismio locally" },
];

export default function NotFound() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white flex flex-col overflow-x-clip">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#070709]/60 to-[#070709] pointer-events-none z-0" />

            {/* Minimal header */}
            <header className="relative z-10 px-6 h-16 flex items-center border-b border-white/[0.06]">
                <Logo />
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

                {/* 404 indicator */}
                <span className="font-mono text-sm font-semibold tracking-[0.3em] text-indigo-400 uppercase mb-3 block">
                    404
                </span>

                {/* Heading */}
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                    Nothing here.
                </h1>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-12">
                    The page you are looking for does not exist or may <br className={"hidden md:block"}/> have been moved. Here are some places to go:
                </p>

                {/* Link grid */}
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {navLinks.map(({ title, icon: Icon, href, desc }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/25 transition-all duration-200 text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-indigo-500/30 transition-colors">
                                <Icon size={18} strokeWidth={1.5} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{title}</p>
                                <p className="text-xs text-zinc-500 truncate">{desc}</p>
                            </div>
                            <ArrowRight size={14} strokeWidth={1.5} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}