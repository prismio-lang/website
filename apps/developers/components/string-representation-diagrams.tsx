import {
    ArrowDown,
    ArrowRight,
    Check,
    Cpu,
    ExternalLink,
    Layers,
    Share2,
    ShieldCheck,
    Zap,
} from "lucide-react";
import type { ReactNode } from "react";

function DiagramShell({
    title,
    badge,
    description,
    children,
    caption,
    labelledBy,
}: {
    title: string;
    badge?: string;
    description: string;
    children: ReactNode;
    caption: ReactNode;
    labelledBy: string;
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
                        <span className="flex size-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />
                        PRISMIO RUNTIME · STRING MEMORY SPECIFICATION
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

            {/* Canvas */}
            <div className="p-4 sm:p-6">{children}</div>

            {/* Technical Caption Footer */}
            <figcaption className="flex items-start gap-2.5 border-t border-zinc-200 bg-white/70 px-5 py-3.5 text-xs leading-relaxed text-zinc-600 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <span className="mt-0.5 font-mono font-bold text-cyan-600 dark:text-cyan-400">§</span>
                <div>{caption}</div>
            </figcaption>
        </figure>
    );
}

// ---------------------------------------------------------------------------
// 1. StringStorageDiagram (16-Byte German String Layout)
// ---------------------------------------------------------------------------

export function StringStorageDiagram() {
    return (
        <DiagramShell
            labelledBy="string-storage-diagram-title"
            title="16-Byte Tagged String Pair: Inline, Owned & View Layouts"
            badge="Umbra / German String"
            description="Every String value in Prismio occupies exactly two 64-bit machine words (%prismio.str = { ptr, i64 }). Discriminant tag bits in Word 1 govern whether bytes live inline, on the heap, or inside a borrowed base buffer."
            caption="All three variants occupy identical 16-byte stack/register footprints. Consumers check the INLINE tag (bit 31) first; only long-form strings with VIEW=0 trigger runtime deallocation."
        >
            {/* Bitfield Header Specification */}
            <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center justify-between pb-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        16-Byte Physical Memory Layout (%prismio.str = &#123; ptr, i64 &#125;)
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">Target: 64-bit little-endian</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    {/* Word 0 */}
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Word 0 (Bytes 0..7)</span>
                            <span className="text-zinc-400">64 bits</span>
                        </div>
                        <div className="mt-1.5 rounded border border-zinc-200 bg-white px-2 py-1.5 text-center font-mono text-[11px] font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                            INLINE ? data[0..7] : 64-bit Pointer
                        </div>
                    </div>

                    {/* Word 1 */}
                    <div className="rounded border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Word 1 (Bytes 8..15)</span>
                            <span className="text-zinc-400">64 bits</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-[1.2fr_0.8fr_1fr] gap-1 font-mono text-[10px]">
                            <span className="rounded border border-zinc-200 bg-white py-1.5 text-center dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                                bits 33..63
                            </span>
                            <span className="rounded border border-cyan-200 bg-cyan-50 py-1.5 text-center font-bold text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                b32 / b31
                            </span>
                            <span className="rounded border border-zinc-200 bg-white py-1.5 text-center dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                                len (0..30)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Three Storage Classes */}
            <div className="grid gap-3.5 lg:grid-cols-3">
                {/* 1. Inline Form */}
                <div className="flex flex-col justify-between rounded-lg border border-emerald-200/80 bg-white p-4 dark:border-emerald-900/60 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                                INLINE SSO
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                0 .. 12 Bytes
                            </span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Small String Optimization
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Entire string is packed directly in registers. Zero heap traffic, zero deallocation.
                        </p>

                        {/* Word 0 breakdown */}
                        <div className="mt-3">
                            <div className="font-mono text-[10px] text-zinc-400">Word 0 · Bytes 0..7 (ASCII / UTF-8)</div>
                            <div className="mt-1 grid grid-cols-8 overflow-hidden rounded border border-emerald-200 bg-emerald-50/50 text-center font-mono text-xs font-semibold text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/30 dark:text-emerald-200">
                                {["P", "r", "i", "s", "m", "i", "o", "!"].map((c, i) => (
                                    <span key={i} className="border-r border-emerald-200/60 py-1.5 last:border-r-0 dark:border-emerald-800/60">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Word 1 breakdown */}
                        <div className="mt-2.5">
                            <div className="font-mono text-[10px] text-zinc-400">Word 1 · Bytes 8..11 + Tag + Length</div>
                            <div className="mt-1 grid grid-cols-[repeat(4,1fr)_1fr_1.2fr] gap-1 font-mono text-[10px] text-center">
                                {[8, 9, 10, 11].map((idx) => (
                                    <span
                                        key={idx}
                                        className="rounded border border-emerald-200/60 bg-emerald-50/50 py-1 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    >
                                        d{idx}
                                    </span>
                                ))}
                                <span className="rounded border border-emerald-300 bg-emerald-100 py-1 font-bold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                                    I=1
                                </span>
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    len=8
                                </span>
                            </div>
                        </div>

                        {/* Invariant Note */}
                        <div className="mt-3 rounded border border-zinc-100 bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                            <strong>Zero-tail invariant:</strong> Bytes after length are always 0. Enables 2-instruction register equality (<code className="font-mono text-[10px]">cmp</code>) in 193 µs.
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Creation Cost</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">0 allocs · register copy</span>
                    </div>
                </div>

                {/* 2. Owned Form */}
                <div className="flex flex-col justify-between rounded-lg border border-cyan-200/80 bg-white p-4 dark:border-cyan-900/60 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300">
                                OWNED HEAP
                            </span>
                            <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                                13 B .. 2 GiB
                            </span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Unique Heap Buffer
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Owns an independent heap buffer. Guarantees null-termination for standard C ABI compatibility.
                        </p>

                        {/* Word 0 */}
                        <div className="mt-3">
                            <div className="font-mono text-[10px] text-zinc-400">Word 0 · Heap Data Pointer</div>
                            <div className="mt-1 rounded border border-cyan-200 bg-cyan-50/50 py-1.5 text-center font-mono text-xs font-semibold text-cyan-950 dark:border-cyan-800/80 dark:bg-cyan-950/30 dark:text-cyan-200">
                                0x7fff_cafe_0020
                            </div>
                        </div>

                        {/* Word 1 */}
                        <div className="mt-2.5">
                            <div className="font-mono text-[10px] text-zinc-400">Word 1 · Control Tags + Length</div>
                            <div className="mt-1 grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-1 font-mono text-[10px] text-center">
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                                    res(31b)
                                </span>
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
                                    V=0
                                </span>
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
                                    I=0
                                </span>
                                <span className="rounded border border-cyan-200 bg-cyan-50 py-1 font-semibold text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                    len=n
                                </span>
                            </div>
                        </div>

                        {/* Pointer Arrow */}
                        <div className="mt-2.5 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
                            <ArrowDown size={14} strokeWidth={2.5} />
                        </div>

                        {/* Heap Buffer */}
                        <div className="mt-1 flex items-center justify-center gap-1.5 rounded border border-cyan-200 bg-cyan-50/60 py-2 font-mono text-xs font-semibold text-cyan-900 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-100">
                            <span>heap_buffer[len]</span>
                            <span className="rounded bg-cyan-200/80 px-1 py-0.5 text-[10px] text-cyan-950 dark:bg-cyan-800 dark:text-cyan-200">
                                \0
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Lifecycle</span>
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400">Released on drop</span>
                    </div>
                </div>

                {/* 3. View Form */}
                <div className="flex flex-col justify-between rounded-lg border border-violet-200/80 bg-white p-4 dark:border-violet-900/60 dark:bg-zinc-900/80">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300">
                                STRING VIEW
                            </span>
                            <span className="font-mono text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                                13 B .. 2 GiB
                            </span>
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Borrowed Interior Slice
                        </h4>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Zero-copy slice pointing directly into base storage. Lifetime is proven by AIF analysis.
                        </p>

                        {/* Word 0 */}
                        <div className="mt-3">
                            <div className="font-mono text-[10px] text-zinc-400">Word 0 · Interior Pointer</div>
                            <div className="mt-1 rounded border border-violet-200 bg-violet-50/50 py-1.5 text-center font-mono text-xs font-semibold text-violet-950 dark:border-violet-800/80 dark:bg-violet-950/30 dark:text-violet-200">
                                base_ptr + byte_offset
                            </div>
                        </div>

                        {/* Word 1 */}
                        <div className="mt-2.5">
                            <div className="font-mono text-[10px] text-zinc-400">Word 1 · Control Tags + Length</div>
                            <div className="mt-1 grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-1 font-mono text-[10px] text-center">
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                                    res(31b)
                                </span>
                                <span className="rounded border border-violet-300 bg-violet-100 py-1 font-bold text-violet-900 dark:border-violet-700 dark:bg-violet-900/60 dark:text-violet-200">
                                    V=1
                                </span>
                                <span className="rounded border border-zinc-200 bg-zinc-100 py-1 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950">
                                    I=0
                                </span>
                                <span className="rounded border border-violet-200 bg-violet-50 py-1 font-semibold text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300">
                                    len=k
                                </span>
                            </div>
                        </div>

                        {/* Pointer Arrow */}
                        <div className="mt-2.5 flex items-center justify-center text-violet-500 dark:text-violet-400">
                            <ArrowDown size={14} strokeWidth={2.5} />
                        </div>

                        {/* Slice Window */}
                        <div className="mt-1 grid grid-cols-[0.8fr_1.5fr_0.8fr] items-center overflow-hidden rounded border border-zinc-200 bg-zinc-100 font-mono text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                            <span className="py-2 text-center text-zinc-400">base...</span>
                            <span className="border-x border-violet-300 bg-violet-100/90 py-2 text-center font-bold text-violet-900 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-200">
                                [slice window]
                            </span>
                            <span className="py-2 text-center text-zinc-400">...tail</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-[10px] dark:border-zinc-800">
                        <span className="text-zinc-500">Deallocation</span>
                        <span className="font-semibold text-violet-600 dark:text-violet-400">No-op (base owns buffer)</span>
                    </div>
                </div>
            </div>

            {/* Tag Evaluation Decision Tree */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded border border-zinc-200 bg-zinc-100 font-mono text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        ?
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Discriminant Evaluation:
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        1. <code className="font-bold">word1 & (1 &lt;&lt; 31)</code> ? →{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">INLINE</strong>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        2. <code className="font-bold">word1 & (1 &lt;&lt; 32)</code> ? →{" "}
                        <strong className="text-violet-600 dark:text-violet-400">VIEW</strong>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                        3. Else → <strong className="text-cyan-600 dark:text-cyan-400">OWNED</strong>
                    </span>
                </div>
            </div>
        </DiagramShell>
    );
}

// ---------------------------------------------------------------------------
// 2. StringViewLifetimeDiagram (AIF Provenance & ABI Gates)
// ---------------------------------------------------------------------------

export function StringViewLifetimeDiagram() {
    return (
        <DiagramShell
            labelledBy="string-view-lifetime-diagram-title"
            title="Zero-Copy StringView Lifetime Extension & ABI Boundaries"
            badge="Ownership Provenance"
            description="String views borrow internal buffer slices without copying bytes. The AIF compiler pass tracks allocation provenance, ensuring the backing storage is kept alive across the full duration of every view."
            caption="Application code never manages lifetime bounds or NUL terminators manually. If a view enters a container or crosses an external C boundary, the compiler automatically synthesizes an owned or NUL-terminated copy."
        >
            {/* Top Flow: Provenance Lifetime Extension */}
            <div>
                <div className="flex items-center justify-between pb-2.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        1. Zero-Copy View Provenance Graph
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">__builtin_string_view</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] lg:items-center">
                    {/* Node 1: Source String */}
                    <div className="rounded-lg border border-cyan-200/80 bg-white p-3.5 dark:border-cyan-900/60 dark:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300">
                                OWNER
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">source: String</span>
                        </div>
                        <h5 className="mt-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Owned Base Allocation
                        </h5>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Heap buffer with NUL termination.
                        </p>
                        <div className="mt-2.5 rounded border border-cyan-200 bg-cyan-50/50 p-2 font-mono text-[10px] text-cyan-900 dark:border-cyan-800/80 dark:bg-cyan-950/30 dark:text-cyan-200">
                            ["Prismio", "Compiler", "Token\0"]
                        </div>
                    </div>

                    {/* Connector Arrow 1 */}
                    <div className="flex flex-col items-center justify-center py-1 text-zinc-400 lg:py-0">
                        <span className="font-mono text-[9px] font-semibold text-zinc-500">.slice()</span>
                        <ArrowRight size={18} strokeWidth={2} className="rotate-90 lg:rotate-0" />
                    </div>

                    {/* Node 2: Interior View */}
                    <div className="rounded-lg border border-violet-200/80 bg-white p-3.5 dark:border-violet-900/60 dark:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300">
                                VIEW
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">tok: String</span>
                        </div>
                        <h5 className="mt-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Interior Slice Pointer
                        </h5>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            base_ptr + 8, len = 8 (no copy, no free)
                        </p>
                        <div className="mt-2.5 rounded border border-violet-200 bg-violet-50/50 p-2 font-mono text-[10px] font-bold text-violet-900 dark:border-violet-800/80 dark:bg-violet-950/30 dark:text-violet-200">
                            "Compiler" (8 bytes)
                        </div>
                    </div>

                    {/* Connector Arrow 2 */}
                    <div className="flex flex-col items-center justify-center py-1 text-zinc-400 lg:py-0">
                        <span className="font-mono text-[9px] font-semibold text-zinc-500">provenance</span>
                        <ArrowRight size={18} strokeWidth={2} className="rotate-90 lg:rotate-0" />
                    </div>

                    {/* Node 3: AIF Proof */}
                    <div className="rounded-lg border border-emerald-200/80 bg-white p-3.5 dark:border-emerald-900/60 dark:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                                INFERENCE
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">AIF 1.0</span>
                        </div>
                        <h5 className="mt-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Lifetime Extension
                        </h5>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Base deallocation deferred until last view use.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <Check size={13} strokeWidth={3} />
                            <span>Lifetime(base) ≥ Lifetime(view)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boundary Handlers */}
            <div className="mt-5">
                <div className="flex items-center justify-between pb-2.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                        2. Boundary Interoperability Gates
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">Automatic ABI Lowering</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Gate 1: Container Ingestion */}
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                Container Storage Boundary
                            </h5>
                            <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                list.push(view)
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Containers require independent ownership so items can outlive their source scope.
                        </p>

                        <div className="mt-3 flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="flex items-center gap-2">
                                <span className="text-violet-600 dark:text-violet-400">view</span>
                                <span className="text-zinc-400">→</span>
                                <code className="font-bold text-zinc-800 dark:text-zinc-200">str_own(view)</code>
                            </div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Owned Heap String
                            </span>
                        </div>
                    </div>

                    {/* Gate 2: C FFI Boundary */}
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                Foreign C FFI Boundary
                            </h5>
                            <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                c_function(view)
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            C functions require null termination; views may slice into un-terminated buffers.
                        </p>

                        <div className="mt-3 flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="flex items-center gap-2">
                                <span className="text-violet-600 dark:text-violet-400">view</span>
                                <span className="text-zinc-400">→</span>
                                <code className="font-bold text-zinc-800 dark:text-zinc-200">temp_terminated_copy()</code>
                            </div>
                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                Free after return
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </DiagramShell>
    );
}

