import React from "react";
import Link from "next/link";
import {ArrowRight} from "lucide-react";
import Logo from "@prismio/ui/Logo";
import type {Metadata} from "next";
import RequestedPath from "../components/not-found/RequestedPath";

// Next adds `noindex` to this page itself.
export const metadata: Metadata = {
    title: "Page not found · Prismio Packages",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

const HELP = [
    {name: "Packages", href: "/", desc: "The package registry, coming soon"},
    {name: "Home", href: "https://prismio.org", desc: "The Prismio front page"},
    {name: "Docs", href: "https://docs.prismio.org", desc: "Read the documentation"},
    {name: "Install", href: "https://prismio.org/install", desc: "Get Prismio locally"},
    {name: "Playground", href: "https://play.prismio.org", desc: "Try Prismio in the browser"},
    {name: "Community", href: "https://prismio.org/community", desc: "Ask, or follow along"},
];

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-[#070709] text-white">
            <header className="flex h-16 items-center border-b border-white/[0.06] px-6">
                <Logo />
            </header>

            <main className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
                <div className="min-w-0 lg:col-span-5">
                    <h1 className="text-5xl font-semibold tracking-[-0.035em] text-white md:text-6xl">
                        That page isn&apos;t here.
                    </h1>
                    <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
                        The link may be old, or the page may have moved. <span className="max-md:hidden">Pick up from one of the places on the right.</span><span className="md:hidden">Pick up from one of the places below.</span>
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            href="/"
                            className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                        >
                            Back to Packages
                            <ArrowRight size={14} />
                        </Link>
                        <a
                            href="https://docs.prismio.org"
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.06] ${FOCUS}`}
                        >
                            Read the docs
                        </a>
                    </div>
                </div>

                {/* Written the way the compiler would say it. */}
                <div className="min-w-0 lg:col-span-7">
                    <div className="overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                        <div className="px-6 pt-6 font-mono text-sm leading-7 sm:px-8 sm:pt-8">
                            <p>
                                <span className="font-semibold text-rose-400">error[404]</span>
                                <span className="font-semibold text-white">: cannot find page </span>
                                <span className="font-semibold text-white">
                                    <RequestedPath fallback="this address" />
                                </span>
                            </p>
                            <p className="mt-1 text-zinc-500">
                                <span className="select-none">&nbsp;&nbsp;--&gt; </span>
                                <span className="text-zinc-400">packages.prismio.org</span>
                            </p>
                            <p className="mt-5">
                                <span className="font-semibold text-emerald-400">help</span>
                                <span className="text-zinc-300">: these exist</span>
                            </p>
                        </div>

                        <ul className="mt-3 pb-3 font-mono text-sm">
                            {HELP.map((item) => (
                                <li key={item.href}>
                                    <a
                                        href={item.href}
                                        className={`group flex items-baseline gap-4 px-6 py-2.5 transition-colors hover:bg-white/[0.04] focus-visible:ring-inset sm:px-8 ${FOCUS}`}
                                    >
                                        <span className="w-24 shrink-0 font-medium text-indigo-300 transition-colors group-hover:text-indigo-200">
                                            {item.name}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate font-sans text-sm text-zinc-500 transition-colors group-hover:text-zinc-300">
                                            {item.desc}
                                        </span>
                                        <ArrowRight
                                            size={14}
                                            className="shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-300"
                                        />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
