"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowLeft, Check, Copy, Terminal} from "lucide-react";
import {PRISMIO_VERSION} from "@prismio/utils";
import {ABI_LABEL, MEMORY_LABEL, type PackageMeta} from "@/lib/packages";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function CopyCommand({text}: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-xl bg-zinc-950 py-2 pl-4 pr-2 ring-1 ring-zinc-800">
            <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-sm text-zinc-100">
                <Terminal size={14} className="mr-2 inline text-zinc-500"/>
                {text}
            </code>
            <button
                type="button"
                aria-label="Copy install command"
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(text);
                    } catch {
                        return;
                    }
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                }}
                className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-[color,background-color,transform] duration-100 hover:bg-white/10 hover:text-white active:scale-[0.94] ${FOCUS}`}
            >
                {copied ? <Check size={15} className="text-emerald-400"/> : <Copy size={15}/>}
            </button>
        </div>
    );
}

export function PackageDetail({pkg}: { pkg: PackageMeta }) {
    const minor = PRISMIO_VERSION.replace(/^v/, "").split(".").slice(0, 2).join(".");

    return (
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 text-zinc-900 md:pt-14">
            <Link href="/" className={`inline-flex items-center gap-1.5 rounded text-sm text-zinc-500 transition-colors hover:text-zinc-950 ${FOCUS}`}>
                <ArrowLeft size={14}/>
                All packages
            </Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="min-w-0 lg:col-span-8">
                    <h1 className="break-words font-mono text-3xl font-semibold tracking-[-0.02em] text-zinc-950 md:text-4xl">
                        {pkg.name}
                        <span className="ml-3 align-middle text-base font-normal text-zinc-500">{pkg.version}</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">{pkg.description}</p>

                    <div className="mt-8">
                        <CopyCommand text={`prismio add ${pkg.name}`}/>
                    </div>

                    <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em] text-zinc-950">Use it</h2>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
                        Add the package to the <code className="rounded bg-zinc-950/[0.05] px-1.5 py-0.5 font-mono text-[0.85em]">dependencies</code> block of your project&apos;s <code className="rounded bg-zinc-950/[0.05] px-1.5 py-0.5 font-mono text-[0.85em]">build.ums</code>.
                    </p>
                    <pre className="mt-5 overflow-x-auto rounded-2xl bg-[#0c0d11] p-5 font-mono text-[13px] leading-7 text-zinc-300 ring-1 ring-zinc-800">
                        <code>{`project {
    name = "app"
    version = "0.1.0"
    prismio = "${minor}"
}

dependencies {
    implementation("${pkg.name}", "${pkg.version}")
}`}</code>
                    </pre>

                    <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em] text-zinc-950">What it guarantees</h2>
                    <dl className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200 text-sm">
                        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                            <dt className="font-medium text-zinc-950">Interface</dt>
                            <dd className="text-zinc-600">{ABI_LABEL[pkg.abi]}</dd>
                        </div>
                        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                            <dt className="font-medium text-zinc-950">Memory</dt>
                            <dd className="text-zinc-600">{MEMORY_LABEL[pkg.aifMemory]}, as reported by the compiler&apos;s allocation analysis.</dd>
                        </div>
                        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                            <dt className="font-medium text-zinc-950">Install</dt>
                            <dd className="text-zinc-600">Declared in the manifest. Installing never runs a script.</dd>
                        </div>
                    </dl>
                </div>

                <aside className="lg:col-span-4">
                    <div className="sticky top-24 flex flex-col gap-6 rounded-2xl p-6 ring-1 ring-zinc-200">
                        <dl className="flex flex-col gap-4 text-sm">
                            {[
                                ["Weekly downloads", pkg.downloads],
                                ["Stars", pkg.stars],
                                ["Updated", pkg.updatedAt],
                                ["Maintainer", pkg.author],
                                ["License", "Apache-2.0 OR MIT"],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-baseline justify-between gap-4">
                                    <dt className="text-zinc-500">{k}</dt>
                                    <dd className="text-right font-medium text-zinc-900">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="h-px bg-zinc-200"/>
                        <div>
                            <p className="text-sm text-zinc-500">Targets</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {["x86_64", "aarch64", "wasm32"].map((t) => (
                                    <span key={t} className="rounded-md bg-zinc-950/[0.04] px-2 py-1 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
