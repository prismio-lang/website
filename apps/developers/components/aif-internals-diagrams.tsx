import {
    ArrowDown,
    Braces,
    Code2,
    GitBranch,
    Layers,
    Network,
    Scale,
    ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

function DiagramShell({
    labelledBy,
    title,
    badge,
    description,
    caption,
    children,
}: {
    labelledBy: string;
    title: string;
    badge?: string;
    description: string;
    caption: ReactNode;
    children: ReactNode;
}) {
    return (
        <figure
            aria-labelledby={labelledBy}
            className="not-prose my-10 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-950"
        >
            {/* Engineering Header Bar */}
            <div className="border-b border-zinc-200 bg-white px-5 py-5 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <span className="flex size-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                        AIF COMPILER PASS ARCHITECTURE
                    </div>
                    {badge && (
                        <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {badge}
                        </span>
                    )}
                </div>
                <h3
                    id={labelledBy}
                    className="mt-2 text-balance text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl dark:text-zinc-50"
                >
                    {title}
                </h3>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {description}
                </p>
            </div>

            {/* Diagram Canvas */}
            <div className="p-4 sm:p-6">{children}</div>

            {/* Technical Caption Footer */}
            <figcaption className="flex items-start gap-2.5 border-t border-zinc-200 bg-white/70 px-5 py-3.5 text-xs leading-relaxed text-zinc-600 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <span className="mt-0.5 font-mono font-bold text-violet-600 dark:text-violet-400">§</span>
                <div>{caption}</div>
            </figcaption>
        </figure>
    );
}

// ---------------------------------------------------------------------------
// 1. AIF Pipeline Diagram
// ---------------------------------------------------------------------------

interface PipelineStageProps {
    index: string;
    name: string;
    subtitle: string;
    icon: ReactNode;
    inTag: string;
    outTag: string;
    bullets: string[];
    accentColor: "zinc" | "cyan" | "violet" | "amber" | "emerald";
}

function PipelineStageCard({
    index,
    name,
    subtitle,
    icon,
    inTag,
    outTag,
    bullets,
    accentColor,
}: PipelineStageProps) {
    const accentBorder = {
        zinc: "border-zinc-200 dark:border-zinc-800",
        cyan: "border-cyan-200/80 dark:border-cyan-900/60",
        violet: "border-violet-200/80 dark:border-violet-900/60",
        amber: "border-amber-200/80 dark:border-amber-900/60",
        emerald: "border-emerald-200/80 dark:border-emerald-900/60",
    }[accentColor];

    const accentBadge = {
        zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        cyan: "bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60",
        violet: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60",
        amber: "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
        emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
    }[accentColor];

    return (
        <div
            className={`flex flex-col justify-between rounded-lg border bg-white p-4 transition-colors dark:bg-zinc-900/90 ${accentBorder}`}
        >
            <div>
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight ${accentBadge}`}
                    >
                        STAGE {index}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
                </div>

                <div className="mt-3">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {name}
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                </div>

                <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-[11px] leading-snug text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400">
                    {bullets.map((b) => (
                        <li key={b} className="flex items-start gap-1.5">
                            <span className="mt-1 size-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-800/60 dark:text-zinc-500">
                <span>
                    IN: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{inTag}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">→</span>
                <span>
                    OUT: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{outTag}</strong>
                </span>
            </div>
        </div>
    );
}

export function AifPipelineDiagram() {
    return (
        <DiagramShell
            labelledBy="aif-pipeline-diagram-title"
            title="AIF Execution Pipeline & Intermediate Representations"
            badge="IR Pipeline Seam"
            description="AIF operates between semantic ownership verification and LLVM IR generation. It computes allocation, lifetime, and placement tables that code generation queries by AST node."
            caption="Deterministic worklist convergence guarantees identical binaries regardless of build machine concurrency or hash collisions. Truncated budgets widen safely upward."
        >
            {/* Phase 1: Frontend Abstract Interpretation */}
            <div>
                <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-cyan-500" />
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Phase I · Frontend Abstract Interpretation (Self-Hosted)
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">src/aif/*.psm</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <PipelineStageCard
                        index="01"
                        name="Declare"
                        subtitle="Index stable identities"
                        icon={<Braces size={16} strokeWidth={2} />}
                        inTag="AST"
                        outTag="SymTable"
                        accentColor="zinc"
                        bullets={[
                            "Functions & lexical scopes",
                            "Nominal type reference graph",
                            "FFI ownership contracts",
                        ]}
                    />

                    <PipelineStageCard
                        index="02"
                        name="Build"
                        subtitle="Formulate fact graph"
                        icon={<Network size={16} strokeWidth={2} />}
                        inTag="SymTable"
                        outTag="Graph"
                        accentColor="cyan"
                        bullets={[
                            "Allocation sites & keys",
                            "Value sets & points-to edges",
                            "Provenance & call boundaries",
                        ]}
                    />

                    <PipelineStageCard
                        index="03"
                        name="Solve & Infer"
                        subtitle="Fixed-point lattice solve"
                        icon={<GitBranch size={16} strokeWidth={2} />}
                        inTag="Graph"
                        outTag="LatticeFacts"
                        accentColor="violet"
                        bullets={[
                            "Points-to graph settles first",
                            "Monotone transfer: E, A, T, C",
                            "Conservative budget widening",
                        ]}
                    />
                </div>
            </div>

            {/* Inter-phase Transition Bar */}
            <div className="my-3.5 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-[10px] font-semibold text-violet-800 dark:border-violet-900/80 dark:bg-violet-950/50 dark:text-violet-300">
                    <span>Solved Lattices (E × A × T × C)</span>
                    <ArrowDown size={13} strokeWidth={2.5} />
                    <span>Native Query Tables</span>
                </div>
            </div>

            {/* Phase 2: Native Optimization & Code Generation */}
            <div>
                <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Phase II · Physical Strategy Selection & Lowering
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">runtime/aif_support.c + src/ir/*</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <PipelineStageCard
                        index="04"
                        name="Select & Place"
                        subtitle="Physical memory layout"
                        icon={<Layers size={16} strokeWidth={2} />}
                        inTag="LatticeFacts"
                        outTag="Placements"
                        accentColor="amber"
                        bullets={[
                            "Field layout & hot/cold splits",
                            "Cost-modeled arena extents",
                            "Call-site bracket verification",
                        ]}
                    />

                    <PipelineStageCard
                        index="05"
                        name="Lower"
                        subtitle="LLVM code-generation"
                        icon={<Code2 size={16} strokeWidth={2} />}
                        inTag="Placements"
                        outTag="LLVM IR"
                        accentColor="emerald"
                        bullets={[
                            "Entry-block alloca (T0)",
                            "Arena push/pop & hint bounds",
                            "Container element dispositions",
                        ]}
                    />

                    <PipelineStageCard
                        index="06"
                        name="Audit & Verify"
                        subtitle="CI manifest & proofs"
                        icon={<ShieldCheck size={16} strokeWidth={2} />}
                        inTag="LLVM IR"
                        outTag="Ledger"
                        accentColor="zinc"
                        bullets={[
                            "Stable manifest for CI diffing",
                            "Causal witnesses via --why",
                            "Runtime ledger verification",
                        ]}
                    />
                </div>
            </div>
        </DiagramShell>
    );
}

// ---------------------------------------------------------------------------
// 2. AIF Tier Decision Diagram
// ---------------------------------------------------------------------------

interface LatticeCardProps {
    symbol: string;
    name: string;
    description: string;
    values: string[];
    joinRule: string;
}

function LatticeCard({ symbol, name, description, values, joinRule }: LatticeCardProps) {
    return (
        <div className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/70">
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded border border-violet-200 bg-violet-50 font-mono text-xs font-bold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/60 dark:text-violet-300">
                            {symbol}
                        </span>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{name}</h4>
                    </div>
                    <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                        Lattice
                    </span>
                </div>

                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">{description}</p>

                {/* Lattice Progression Ladder */}
                <div className="mt-3 flex items-center gap-1 font-mono text-[10px]">
                    {values.map((v, i) => (
                        <div key={v} className="flex items-center gap-1">
                            {i > 0 && <span className="text-zinc-300 dark:text-zinc-600">→</span>}
                            <span
                                className={`rounded px-1.5 py-0.5 border ${
                                    i === 0
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                                        : i === values.length - 1
                                          ? "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                          : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                                }`}
                            >
                                {v}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 border-t border-zinc-100 pt-2 font-mono text-[9px] text-zinc-400 dark:border-zinc-800/60 dark:text-zinc-500">
                Join: <span className="text-zinc-600 dark:text-zinc-400">{joinRule}</span>
            </div>
        </div>
    );
}

export function AifTierDecisionDiagram() {
    return (
        <DiagramShell
            labelledBy="aif-tier-decision-diagram-title"
            title="Monotone Fact Transfer to First-Match Strategy Ladder"
            badge="Formal Abstract Lattice"
            description="Four independent fact domains are resolved concurrently. As analysis proceeds, facts can only rise monotonically toward conservative upper bounds. The first matching tier in the priority ladder selects the physical allocation mechanism."
            caption="T4a and T4b handle orthogonal dimensions: T4a charges atomic operations for multithreaded data, while T4b activates trial-deletion cycle collection for potentially cyclic types."
        >
            {/* Part 1: The Four Domains */}
            <div>
                <div className="flex items-center gap-2 pb-2.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        1. Four Monotonic Fact Domains (Transfer Only Rises: ⊥ → ⊤)
                    </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <LatticeCard
                        symbol="E"
                        name="Escape Scope"
                        description="Latest lexical region containing the allocation."
                        values={["Region", "Caller", "Global"]}
                        joinRule="Lexical LCA / Caller"
                    />
                    <LatticeCard
                        symbol="A"
                        name="Aliasing"
                        description="Degree of simultaneous concurrent references."
                        values={["Unique", "Borrowed", "Shared"]}
                        joinRule="Max concurrent holders"
                    />
                    <LatticeCard
                        symbol="T"
                        name="Thread Affinity"
                        description="Cross-task concurrency and transfer boundaries."
                        values={["Isolated", "Transferred", "CrossThread"]}
                        joinRule="Structured spawn reachability"
                    />
                    <LatticeCard
                        symbol="C"
                        name="Cyclicity"
                        description="SCC membership in the nominal type reference graph."
                        values={["Acyclic", "MaybeCyclic"]}
                        joinRule="Strongly Connected Component"
                    />
                </div>
            </div>

            {/* Synthesizer Arrow */}
            <div className="my-4 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 font-mono text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <span>E × A × T × C Fact Tuple</span>
                    <ArrowDown size={13} strokeWidth={2.5} />
                    <span>First-Match Ladder Evaluation</span>
                </div>
            </div>

            {/* Part 2: The Strategy Ladder */}
            <div>
                <div className="flex items-center justify-between pb-2.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        2. First-Match Physical Strategy Ladder
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">Evaluated Top to Bottom</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] border-b border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <span>Tier</span>
                        <span>Preconditions</span>
                        <span>Emitted LLVM/Runtime Primitive</span>
                        <span className="text-right">Runtime Overhead</span>
                    </div>

                    <div className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800/80">
                        {/* T0 */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">T0</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                Own scope · A ≤ Borrowed · Sz ≤ 256B
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
                                    alloca
                                </code>{" "}
                                in entry block; zero free call
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                0 B · 0 ns
                            </span>
                        </div>

                        {/* T1 */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">T1</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                E = Region(r) · Fits arena scope
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
                                    arena_alloc
                                </code>{" "}
                                pointer bump; bulk teardown
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                                ~1 bump instr
                            </span>
                        </div>

                        {/* T2 */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-violet-600 dark:text-violet-400">T2</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                A ≤ Borrowed · T ≤ Transferred
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                Unique heap owner; static scope drop
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                                malloc / free
                            </span>
                        </div>

                        {/* T3 */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">T3</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                T ≤ Transferred · C = Acyclic
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                Non-atomic thread-local reference count
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                non-atomic inc
                            </span>
                        </div>

                        {/* T4a */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">T4a</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                T = CrossThread
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                Atomic reference count (ARC)
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                atomic CAS
                            </span>
                        </div>

                        {/* T4b */}
                        <div className="grid grid-cols-[3.5rem_1.4fr_1.5fr_1fr] items-center px-3.5 py-2.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">T4b</span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                C = MaybeCyclic
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                RC + trial-deletion cycle collector (MarkGrey/Scan)
                            </span>
                            <span className="text-right font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                cyclic buffer
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </DiagramShell>
    );
}

// ---------------------------------------------------------------------------
// 3. AIF Region Placement Diagram
// ---------------------------------------------------------------------------

export function AifRegionPlacementDiagram() {
    return (
        <DiagramShell
            labelledBy="aif-region-placement-diagram-title"
            title="Arena Region Placement & Call-Site Bracketing"
            badge="Memory Model"
            description="Arenas are dynamically scoped at runtime, but admission is governed by static lifetime proofs. Memory allocated in a region is bulk-reclaimed upon region exit without individual deallocation passes."
            caption="Call-site bracketing proves a callee extent runs strictly under a single caller region. The callee allocates directly from the caller's active arena without modifying the callee signature."
        >
            <div className="grid gap-3.5 lg:grid-cols-3">
                {/* Case 1: Lexical Region */}
                <div className="flex flex-col justify-between rounded-lg border border-cyan-200/80 bg-white p-4 dark:border-cyan-900/60 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300">
                                01 · LEXICAL
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                                Proven Scope-Local
                            </span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Local Region Containment
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Allocation is syntactically inside the region scope and does not escape or transfer out.
                        </p>

                        <div className="mt-3 overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            <span className="text-violet-600 dark:text-violet-400">region</span> worker_arena &#123;
                            <br />
                            &nbsp;&nbsp;arena_push(worker_arena)
                            <br />
                            &nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">let</span> node ={" "}
                            <span className="font-bold">arena_alloc()</span>
                            <br />
                            &nbsp;&nbsp;arena_pop() <span className="text-zinc-400">// bulk free</span>
                            <br />
                            &#125;
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Result</span>
                        <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                            region:auto → arena_alloc
                        </span>
                    </div>
                </div>

                {/* Case 2: Bracketed Callee Extent */}
                <div className="flex flex-col justify-between rounded-lg border border-violet-200/80 bg-white p-4 dark:border-violet-900/60 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300">
                                02 · BRACKETED
                            </span>
                            <span className="font-mono text-[10px] text-violet-600 dark:text-violet-400">
                                Proven Callee Extent
                            </span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Call-Site Arena Extent
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Callee executes strictly within caller region lifetime. Callee uses active dynamic arena.
                        </p>

                        <div className="mt-3 overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            <span className="text-zinc-400">// Caller:</span>
                            <br />
                            <span className="text-violet-600 dark:text-violet-400">region</span> req &#123;
                            <br />
                            &nbsp;&nbsp;parse_payload(data){" "}
                            <span className="text-violet-600 dark:text-violet-400">→ hints active arena</span>
                            <br />
                            &#125;
                            <br />
                            <span className="text-zinc-400">// Callee borrows arena:</span>
                            <br />
                            <span className="text-emerald-600 dark:text-emerald-400">fn</span> parse_payload() &#123;
                            tokens.push() &#125;
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Result</span>
                        <span className="font-semibold text-violet-700 dark:text-violet-300">
                            placed call → callee arena
                        </span>
                    </div>
                </div>

                {/* Case 3: Conservative Fallback */}
                <div className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                03 · FALLBACK
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">Safety Guarantee</span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Individual Scoped Heap
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Unproven lifetime, negative cost benefit, or global escape falls back to heap or RC.
                        </p>

                        <div className="mt-3 space-y-1.5 rounded border border-zinc-200 bg-zinc-50 p-2.5 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-zinc-400" />
                                <span>No fabricated lifetimes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-zinc-400" />
                                <span>Zero risk of use-after-free</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-zinc-400" />
                                <span>Reported honestly as region:none</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Result</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            region:none (heap / RC)
                        </span>
                    </div>
                </div>
            </div>

            {/* Static Cost Model Formula Bar */}
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Scale size={15} strokeWidth={2} />
                    </span>
                    <div>
                        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Placement Cost Model
                        </span>
                        <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            Benefit = (Allocs × 87) − (Entries × 40) − (0.02 × ΔPeakBytes)
                        </span>
                    </div>
                </div>
                <div className="rounded bg-zinc-100 px-2.5 py-1 text-right font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Threshold: <strong className="text-emerald-600 dark:text-emerald-400">&gt; 0</strong> to admit
                </div>
            </div>
        </DiagramShell>
    );
}

