import React from "react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@/components/FooterMain";
import { ArrowRight, CheckCircle2, Clock, Terminal, Zap, GitCommit, GitPullRequest, Layers, Code2, Milestone } from "lucide-react";
import Link from "next/link";

interface MilestoneItem {
    title: string;
    description: string;
    badge?: string;
}

interface RoadmapPhase {
    version: string;
    title: string;
    subtitle: string;
    status: "delivered" | "in-progress" | "planned";
    timeline: string;
    items: MilestoneItem[];
    highlight?: string;
}

const phases: RoadmapPhase[] = [
    {
        version: "v0.1",
        title: "Foundations & Core Compiler",
        subtitle: "Production-grade AOT compiler with deterministic semantics",
        status: "delivered",
        timeline: "Shipped",
        highlight: "Core LLVM-backed compiler architecture delivering C/Rust competitive throughput.",
        items: [
            {
                title: "LLVM 18+ Codegen & Native Toolchain",
                description: "Full LLVM IR code generator with native linker integration (Clang/LLD), supporting x86_64 and arm64 targets.",
                badge: "Shipped",
            },
            {
                title: "Automatic Invalidation Flow (AIF)",
                description: "Deterministic compile-time lifetime and resource tracking. Zero garbage collector pauses and zero runtime reference-counting overhead.",
                badge: "Shipped",
            },
            {
                title: "German String Representation",
                description: "High-performance 16-byte strings with 12-byte inline prefix, eliminating pointer chasing and heap allocations for short strings.",
                badge: "Shipped",
            },
            {
                title: "Monomorphized Parametric Generics",
                description: "Specialized code generation for generic data structures and functions with zero dynamic dispatch penalty.",
                badge: "Shipped",
            },
            {
                title: "Unified Module System (UMS)",
                description: "Package-aware module resolution with `@package` syntax, deterministic cyclic import handling, and clean namespaces.",
                badge: "Shipped",
            },
            {
                title: "Standard Library Core",
                description: "Initial foundational data structures including dynamic `List<T>`, open-addressing `Map<K, V>`, UTF-8 string manipulation, and system file I/O.",
                badge: "Shipped",
            },
            {
                title: "40-Workload Benchmark Suite",
                description: "Automated end-to-end benchmarking harness measuring execution wall-time and memory allocation against Clang -O3 and Rustc -O3.",
                badge: "Shipped",
            },
        ],
    },
    {
        version: "v0.2",
        title: "Standard Library Hardening & Developer Ecosystem",
        subtitle: "Expanding data structures, package management, and web tooling",
        status: "in-progress",
        timeline: "In Active Development",
        highlight: "Deepening standard library capabilities and introducing package distribution tooling.",
        items: [
            {
                title: "Advanced Data Structures (`VecDeque`, `BTreeMap`)",
                description: "Double-ended queues with ring buffer allocation and cache-conscious B-Trees for sorted key-value collections.",
                badge: "In Progress",
            },
            {
                title: "Streaming Zero-Copy JSON Parser",
                description: "High-throughput JSON parsing and serialization utilizing German string slices without reallocating token buffers.",
                badge: "In Progress",
            },
            {
                title: "Official Package Registry Client",
                description: "Built-in `prismio pkg` CLI commands with cryptographically verified checksums and seamless integration with packages.prismio.org.",
                badge: "In Progress",
            },
            {
                title: "Interactive WASM Playground",
                description: "Browser-executable compiler frontend compiled to WebAssembly, enabling instant code experimentation without local installation.",
                badge: "In Progress",
            },
            {
                title: "C ABI Struct Layout & Enhanced FFI",
                description: "Complete `extern \"C\"` compatibility with platform-specific struct layout and passing conventions for seamless C/C++ interop.",
                badge: "Planned",
            },
            {
                title: "Language Server Protocol (LSP) Service",
                description: "First-party LSP providing real-time AST diagnostics, hover types, autocompletion, and jump-to-definition in VS Code and Neovim.",
                badge: "Planned",
            },
        ],
    },
    {
        version: "v0.3",
        title: "Concurrency, Scalability & Advanced Horizons",
        subtitle: "Multi-core runtime primitives, cross-compilation, and formal verification",
        status: "planned",
        timeline: "Future Roadmap",
        highlight: "Scaling Prismio to multi-threaded workloads, distributed systems, and verifiable software.",
        items: [
            {
                title: "Fibers & Structured Concurrency",
                description: "Lightweight cooperative user-space green threads with deterministic cancellation and structured task scopes.",
                badge: "Research",
            },
            {
                title: "Prismio Intermediate Representation (PIR)",
                description: "High-level domain-specific intermediate representation for cross-architecture transformations and static analysis before LLVM lowering.",
                badge: "Research",
            },
            {
                title: "Cross-Target Compilation Matrix",
                description: "Single-command cross-compilation targeting Linux musl, macOS Universal, Windows, and RISC-V from any host OS.",
                badge: "Planned",
            },
            {
                title: "Compile-Time Memory Sanitization",
                description: "Built-in static bounds checking and escape-flow assertions with optional debug sanitizers inspired by AddressSanitizer.",
                badge: "Planned",
            },
            {
                title: "Self-Hosting Compiler Frontend",
                description: "Bootstrapping the Prismio lexer, parser, and type checker entirely in Prismio itself.",
                badge: "Horizon",
            },
        ],
    },
];

export default function RoadmapPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#070709]/60 to-[#070709] pointer-events-none z-0" />
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

            <HeaderMain />

            <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-32">
                {/* Hero / Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-medium font-mono mb-6">
                        <Milestone size={14} />
                        Engineering Direction
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        Prismio Roadmap
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                        Prismio is engineered with radical transparency. We prioritize deterministic performance, zero runtime bloat, and developer ergonomically sound tooling. Here is where we are, and where we are heading.
                    </p>
                </div>

                {/* Timeline Roadmap */}
                <div className="space-y-16">
                    {phases.map((phase) => {
                        const isDelivered = phase.status === "delivered";
                        const isInProgress = phase.status === "in-progress";

                        return (
                            <section
                                key={phase.version}
                                className={`relative rounded-2xl border p-8 md:p-10 transition-all ${
                                    isInProgress
                                        ? "bg-gradient-to-b from-[#0f0f18] to-[#0a0a0f] border-indigo-500/30 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)]"
                                        : "bg-[#0b0b0f]/80 border-white/[0.08]"
                                }`}
                            >
                                {/* Header Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06] mb-8">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-bold text-2xl md:text-3xl text-white">
                                            {phase.version}
                                        </span>
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-white">
                                                {phase.title}
                                            </h2>
                                            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                                                {phase.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                                                isDelivered
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : isInProgress
                                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                    : "bg-white/5 text-gray-400 border border-white/10"
                                            }`}
                                        >
                                            {isDelivered && <CheckCircle2 size={13} />}
                                            {isInProgress && <Terminal size={13} />}
                                            {!isDelivered && !isInProgress && <Clock size={13} />}
                                            {phase.timeline}
                                        </span>
                                    </div>
                                </div>

                                {phase.highlight && (
                                    <div className="mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-gray-300 flex items-start gap-3">
                                        <Zap size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                                        <span>{phase.highlight}</span>
                                    </div>
                                )}

                                {/* Grid of Items */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {phase.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className="font-semibold text-white text-sm">
                                                        {item.title}
                                                    </h3>
                                                    {item.badge && (
                                                        <span
                                                            className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                                                                item.badge === "Shipped"
                                                                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
                                                                    : item.badge === "In Progress"
                                                                    ? "bg-indigo-950/40 text-indigo-300 border border-indigo-500/20"
                                                                    : "bg-white/5 text-gray-400 border border-white/5"
                                                            }`}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Callout section */}
                <div className="mt-20 p-8 md:p-10 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-[#101018] to-indigo-950/30 border border-indigo-500/20 text-center max-w-3xl mx-auto">
                    <h3 className="text-xl font-bold text-white mb-2">
                        Help Shape the Future of Prismio
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto mb-6 leading-relaxed">
                        Prismio is fully open source. Feature requests, architecture feedback, and benchmark contributions are welcome on our GitHub discussions and Discord.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a
                            href="https://github.com/prismio-lang/prismio/discussions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            RFCs & Discussions
                            <ArrowRight size={13} />
                        </a>
                        <Link
                            href="/benchmarks"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition-all"
                        >
                            View Benchmarks
                        </Link>
                    </div>
                </div>
            </main>

            <FooterMain />
        </div>
    );
}
