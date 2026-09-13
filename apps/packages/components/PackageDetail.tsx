"use client";

import { useParams } from "next/navigation";
import {
    BadgeCheck,
    Copy,
    Terminal,
    ExternalLink,
    Download,
    Star,
    Clock,
    Scale,
    Check,
} from "lucide-react";
import { useState } from "react";

export function PackageDetail() {
    const params = useParams();
    const rawName = params?.name;
    const name = Array.isArray(rawName) ? rawName[0] : (rawName as string) || "package";
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("readme");

    const handleCopy = () => {
        navigator.clipboard.writeText(`prism add ${name}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 text-zinc-900">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                                    {name}
                                </h1>
                                <BadgeCheck className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-base text-zinc-600">
                                A robust, highly concurrent library module designed for the Prismio compiler and runtime ecosystem.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-100 border border-zinc-300 p-1.5 rounded-xl w-max">
                        <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 font-mono text-xs text-zinc-900 font-semibold">
                            <Terminal className="w-4 h-4 text-zinc-500" />
                            <code>prism add {name}</code>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-zinc-300 transition-all text-zinc-600 hover:text-zinc-950 focus:outline-none cursor-pointer"
                            aria-label="Copy command"
                        >
                            {copied ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 px-1">
                                    <Check size={13} />
                                    Copied!
                                </span>
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-zinc-200 mb-8 overflow-x-auto">
                    {["readme", "documentation", "api", "versions", "dependencies"].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                                activeTab === tab
                                    ? "border-zinc-900 text-zinc-950 font-bold"
                                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="text-zinc-700 leading-relaxed text-sm">
                    {activeTab === "readme" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                                Getting Started
                            </h2>
                            <p className="text-zinc-600">
                                The <code className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-900 font-mono text-xs">{name}</code> package provides a highly optimized,
                                type-safe API. It is designed to integrate directly with Prismio's Adaptive Inference Framework and native LLVM code generation.
                            </p>
                            <div className="space-y-4">
                                <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider block">Usage Example</span>
                                <pre className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                                    <code>{`// Import native module into your source
import { Client, Request, Response } from "${name}"

fn executeTask(endpoint: &str) -> Result<Response, Error> {
    let client = Client.new()
    let response = client.request(endpoint)?
    return Ok(response)
}`}</code>
                                </pre>

                                <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider block pt-2">Manifest Declaration (`build.ums`)</span>
                                <pre className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                                    <code>{`// Add to dependencies block in build.ums
dependencies: {
    "${name}": "^1.0.0"
}`}</code>
                                </pre>
                            </div>

                            <h3 className="text-lg font-bold text-zinc-900 tracking-tight pt-2">
                                Technical Specifications & Guarantees
                            </h3>
                            <ul className="list-disc pl-5 space-y-2 text-zinc-600">
                                <li><strong>Target ABI:</strong> Native Direct C ABI (<code className="font-mono text-xs">c-direct</code>) with zero FFI marshaling penalties.</li>
                                <li><strong>Memory Assurance:</strong> Verified by the Adaptive Inference Framework for zero-leak stack preservation.</li>
                                <li><strong>Compilation:</strong> Statically linkable into single-binary LLVM AOT distributions.</li>
                                <li><strong>Hermetic Isolation:</strong> No dynamic post-install shell script execution.</li>
                            </ul>
                        </div>
                    )}
                    {activeTab !== "readme" && (
                        <div className="py-12 text-center border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
                            <p className="text-zinc-500 font-medium text-xs font-mono">
                                Technical documentation for {activeTab} is generated directly from source docstrings.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80 shrink-0">
                <div className="sticky top-24 flex flex-col gap-6 rounded-xl border border-zinc-300 bg-white p-6">
                    <div className="flex flex-col gap-3.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Registry Metadata</h3>

                        <div className="flex items-center gap-2.5 text-xs">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-zinc-400"
                            >
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>
                            <a href="#" className="text-indigo-600 hover:underline font-medium font-mono text-xs">
                                prismio-core/{name}
                            </a>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                            <a href="#" className="text-indigo-600 hover:underline font-medium font-mono text-xs">
                                packages.prismio.org/{name}
                            </a>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                            <Scale className="w-4 h-4 text-zinc-400" />
                            <span className="text-zinc-600 font-mono text-xs">Apache-2.0 OR MIT</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200" />

                    <div className="flex flex-col gap-2.5 text-xs font-mono">
                        <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Compiler Targets</span>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px]">x86_64</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px]">aarch64</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px]">wasm32</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200" />

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 flex items-center gap-2">
                                <Download className="w-3.5 h-3.5 text-zinc-400" /> Weekly Downloads
                            </span>
                            <span className="font-semibold text-zinc-900 font-mono">345,120</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 flex items-center gap-2">
                                <Star className="w-3.5 h-3.5 text-zinc-400" /> GitHub Stars
                            </span>
                            <span className="font-semibold text-zinc-900 font-mono">4,520</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Last Published
                            </span>
                            <span className="font-medium text-zinc-700">2 days ago</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-100" />

                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Maintainers</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 p-[1px]">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-[10px] text-indigo-700">
                                    PC
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-zinc-900">
                                    prismio-core
                                </div>
                                <div className="text-[11px] text-zinc-400">Core Team</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
