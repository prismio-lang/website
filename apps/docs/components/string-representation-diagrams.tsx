import { ArrowDown, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const inlineBytes = ["P", "r", "i", "s", "m", "i", "o", "!"];

function DiagramShell({
    title,
    description,
    children,
    caption,
    labelledBy,
}: {
    title: string;
    description: string;
    children: ReactNode;
    caption: ReactNode;
    labelledBy: string;
}) {
    return (
        <figure
            aria-labelledby={labelledBy}
            className="not-prose my-10 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
            <div className="border-b border-zinc-200 bg-white px-5 py-5 sm:px-7 dark:border-zinc-800 dark:bg-zinc-950">
                <h3 id={labelledBy} className="text-balance text-xl font-semibold tracking-[-0.02em] text-zinc-950 sm:text-2xl dark:text-zinc-50">
                    {title}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {description}
                </p>
            </div>
            {children}
            <figcaption className="border-t border-zinc-200 bg-white px-5 py-4 text-sm leading-6 text-zinc-600 sm:px-7 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                {caption}
            </figcaption>
        </figure>
    );
}

function StorageBadge({ children, tone }: { children: ReactNode; tone: "violet" | "cyan" }) {
    const classes = tone === "cyan"
        ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/70 dark:text-cyan-200"
        : "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/70 dark:text-violet-200";

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${classes}`}>
            {children}
        </span>
    );
}

function WordLabel({ children }: { children: ReactNode }) {
    return (
        <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500 dark:text-zinc-500">
            {children}
        </p>
    );
}

function LongControlWord({ view }: { view: boolean }) {
    return (
        <div className="grid grid-cols-[1.2fr_.85fr_1.35fr] gap-1.5 text-center font-mono text-[10px] leading-4 sm:text-[11px]">
            <div className="rounded-lg border border-zinc-300 bg-zinc-100 px-1.5 py-2.5 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <strong className="block font-semibold text-zinc-800 dark:text-zinc-200">reserved</strong>
                bits 33…63
            </div>
            <div className={`rounded-lg border px-1 py-2.5 ${view ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-300" : "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300"}`}>
                <strong className="block font-semibold">VIEW={view ? "1" : "0"}</strong>
                bit 32
            </div>
            <div className="rounded-lg border border-zinc-300 bg-zinc-100 px-1.5 py-2.5 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <strong className="block font-semibold text-zinc-800 dark:text-zinc-200">length = n</strong>
                bits 0…30 · I=0
            </div>
        </div>
    );
}

function StorageCard({
    badge,
    tone,
    title,
    subtitle,
    children,
    cost,
    ownership,
}: {
    badge: string;
    tone: "violet" | "cyan";
    title: string;
    subtitle: string;
    children: ReactNode;
    cost: string;
    ownership: string;
}) {
    return (
        <section className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div>
                <StorageBadge tone={tone}>{badge}</StorageBadge>
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.015em] text-zinc-950 dark:text-zinc-50">{title}</h4>
                <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            </div>
            <div className="flex-1">{children}</div>
            <dl className="mt-6 grid gap-3 rounded-xl bg-zinc-100/80 p-3 text-sm dark:bg-zinc-950/80">
                <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-500">Creation</dt>
                    <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-200">{cost}</dd>
                </div>
                <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-500">Storage</dt>
                    <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-200">{ownership}</dd>
                </div>
            </dl>
        </section>
    );
}

export function StringStorageDiagram() {
    return (
        <DiagramShell
            labelledBy="string-storage-diagram-title"
            title="One 16-byte value, three storage classes"
            description="Logical layout on Prismio’s current 64-bit targets. Physical byte order is omitted so the tags and storage relationships remain clear."
            caption={<>All three forms occupy two machine words. Only the owned form releases the allocation behind its pointer.</>}
        >
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
                <StorageCard
                    badge="Inline"
                    tone="violet"
                    title="Text lives in the pair"
                    subtitle="0–12 bytes · no allocation"
                    cost="Copy up to 12 bytes"
                    ownership="Self-contained"
                >
                    <WordLabel>Word 0 · 64 bits</WordLabel>
                    <div className="grid grid-cols-8 overflow-hidden rounded-lg border border-violet-300 bg-violet-50 font-mono text-xs font-semibold text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-100">
                        {inlineBytes.map((byte, index) => (
                            <span key={`${byte}-${index}`} className="border-r border-violet-300 py-3 text-center last:border-r-0 dark:border-violet-700">
                                {byte}
                            </span>
                        ))}
                    </div>
                    <WordLabel>Word 1 · 64 bits</WordLabel>
                    <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_2fr] gap-1.5 font-mono text-[10px] text-violet-900 sm:text-[11px] dark:text-violet-100">
                        {[8, 9, 10, 11].map((index) => (
                            <span key={index} className="rounded-md border border-violet-300 bg-violet-50 py-3 text-center dark:border-violet-700 dark:bg-violet-950/60">
                                d{index}
                            </span>
                        ))}
                        <span className="rounded-md border border-zinc-300 bg-zinc-100 px-1 py-2 text-center text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                            <strong className="block font-semibold">INLINE=1</strong>
                            length · 31 bits
                        </span>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        Bytes after the logical length stay zero, so equal inline strings are identical pairs.
                    </p>
                </StorageCard>

                <StorageCard
                    badge="Owned"
                    tone="cyan"
                    title="Text lives on the heap"
                    subtitle="13 bytes–2 GiB · owns allocation"
                    cost="Heap allocation and copy"
                    ownership="Released by this String"
                >
                    <WordLabel>Word 0 · data pointer</WordLabel>
                    <div className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-3 text-center font-mono text-xs font-semibold text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-100">
                        0x… data pointer
                    </div>
                    <WordLabel>Word 1 · control</WordLabel>
                    <LongControlWord view={false} />
                    <div className="flex justify-center py-2 text-cyan-600 dark:text-cyan-400">
                        <ArrowDown aria-hidden="true" size={20} strokeWidth={1.8} />
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-3 font-mono text-xs font-semibold text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-100">
                        <span>text…bytes</span>
                        <span className="text-cyan-700 dark:text-cyan-300">{"\\0"}</span>
                    </div>
                </StorageCard>

                <StorageCard
                    badge="View"
                    tone="violet"
                    title="Text lives inside a base"
                    subtitle="13 bytes–2 GiB · aliases storage"
                    cost="No allocation or byte copy"
                    ownership="Borrowed from the base"
                >
                    <WordLabel>Word 0 · interior pointer</WordLabel>
                    <div className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-3 text-center font-mono text-xs font-semibold text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-100">
                        base pointer + offset
                    </div>
                    <WordLabel>Word 1 · control</WordLabel>
                    <LongControlWord view />
                    <div className="flex justify-center py-2 text-violet-600 dark:text-violet-400">
                        <ArrowDown aria-hidden="true" size={20} strokeWidth={1.8} />
                    </div>
                    <div className="grid grid-cols-[.8fr_1.6fr_1fr] items-center overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100 font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                        <span className="px-2 py-3 text-center">base</span>
                        <strong className="border-x border-violet-300 bg-violet-50 px-2 py-3 text-center font-semibold text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-100">
                            selected range
                        </strong>
                        <span className="px-2 py-3 text-center">continues</span>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                        The range has no terminator of its own, so the length bounds every read.
                    </p>
                </StorageCard>
            </div>
            <p className="px-5 pb-5 text-center text-xs leading-5 text-zinc-500 sm:px-7 sm:pb-6 dark:text-zinc-500">
                INLINE is checked first. Bit 32 is text data when INLINE is set and the VIEW flag otherwise.
            </p>
        </DiagramShell>
    );
}

function FlowArrow({ label }: { label: string }) {
    return (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 py-1 text-violet-600 lg:w-20 dark:text-violet-400">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{label}</span>
            <ArrowRight aria-hidden="true" className="rotate-90 lg:rotate-0" size={24} strokeWidth={1.8} />
        </div>
    );
}

function FlowNode({
    badge,
    tone,
    title,
    subtitle,
    children,
}: {
    badge: string;
    tone: "violet" | "cyan";
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <section className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <StorageBadge tone={tone}>{badge}</StorageBadge>
            <h4 className="mt-4 text-lg font-semibold tracking-[-0.015em] text-zinc-950 dark:text-zinc-50">{title}</h4>
            <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function BoundaryFlow({
    title,
    description,
    action,
    result,
    resultDetail,
    tone,
}: {
    title: string;
    description: string;
    action: string;
    result: string;
    resultDetail: string;
    tone: "violet" | "cyan";
}) {
    const resultClasses = tone === "cyan"
        ? "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-100"
        : "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-100";

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="text-lg font-semibold tracking-[-0.015em] text-zinc-950 dark:text-zinc-50">{title}</h4>
            <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{description}</p>
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] items-center gap-2">
                <div className="rounded-lg border border-violet-300 bg-violet-50 px-2 py-3 text-center dark:border-violet-700 dark:bg-violet-950/60">
                    <code className="text-xs font-semibold text-violet-900 dark:text-violet-100">view</code>
                    <span className="mt-1 block text-[10px] text-violet-700 dark:text-violet-300">not owned</span>
                </div>
                <div className="flex min-w-14 flex-col items-center gap-1 text-zinc-500">
                    <span className="text-center font-mono text-[9px] font-semibold text-zinc-600 dark:text-zinc-400">{action}</span>
                    <ArrowRight aria-hidden="true" size={20} strokeWidth={1.8} />
                </div>
                <div className={`rounded-lg border px-2 py-3 text-center ${resultClasses}`}>
                    <code className="text-xs font-semibold">{result}</code>
                    <span className="mt-1 block text-[10px] opacity-75">{resultDetail}</span>
                </div>
            </div>
        </section>
    );
}

export function StringViewLifetimeDiagram() {
    return (
        <DiagramShell
            labelledBy="string-view-lifetime-diagram-title"
            title="A view borrows bytes; the analysis carries the lifetime"
            description="The zero-copy path stays internal. Ownership and ABI boundaries receive an explicit copy when their contract requires one."
            caption={<>Application code cannot observe these transitions; each path preserves `String`’s source-level behavior.</>}
        >
            <div className="p-4 sm:p-6">
                <div className="flex flex-col items-stretch lg:flex-row">
                    <FlowNode badge="Owned base" tone="cyan" title="source" subtitle="pointer + byte length">
                        <div className="overflow-hidden rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-3 text-center font-mono text-xs dark:border-cyan-700 dark:bg-cyan-950/60">
                            <span className="text-cyan-700 dark:text-cyan-300">prefix </span>
                            <strong className="font-semibold text-cyan-950 dark:text-cyan-50">selected</strong>
                            <span className="text-cyan-700 dark:text-cyan-300"> suffix{"\\0"}</span>
                        </div>
                    </FlowNode>

                    <FlowArrow label="aliases" />

                    <FlowNode badge="View" tone="violet" title="source[a..b]" subtitle="interior pointer + byte length">
                        <div className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-3 text-center font-mono text-xs font-semibold text-violet-950 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-50">
                            selected
                        </div>
                    </FlowNode>

                    <FlowArrow label="provenance" />

                    <FlowNode badge="Analysis" tone="violet" title="Same allocation provenance" subtitle="The view introduces no allocation site">
                        <ul className="space-y-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                            <li>The view has no independent block to free.</li>
                            <li>Its last use keeps the base allocation alive.</li>
                        </ul>
                    </FlowNode>
                </div>

                <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-center text-sm font-medium text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-100">
                    Base lifetime <span aria-hidden="true">≥</span><span className="sr-only">is at least</span> view lifetime
                </div>

                <h4 className="mb-4 mt-8 text-base font-semibold text-zinc-950 dark:text-zinc-100">
                    When the view crosses a boundary
                </h4>
                <div className="grid gap-4 lg:grid-cols-2">
                    <BoundaryFlow
                        title="Stored in a container"
                        description="The slot must own what it stores."
                        action="str_own"
                        result={"owned copy\\0"}
                        resultDetail="released with container"
                        tone="violet"
                    />
                    <BoundaryFlow
                        title="Passed to C"
                        description="C receives a temporary NUL-terminated pointer."
                        action="copy for call"
                        result={"temporary copy\\0"}
                        resultDetail="released after return"
                        tone="cyan"
                    />
                </div>
            </div>
        </DiagramShell>
    );
}
