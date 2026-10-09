import React from 'react';
import {Cpu} from 'lucide-react';
import FreestandingMatrix from '@/components/benchmarks/FreestandingMatrix';
import {FreestandingDataset, formatBytes} from '@/lib/benchmarks';

interface FreestandingPanelProps {
    data: FreestandingDataset;
}

const ARM_TONES = {prismio: 'bg-purple-400', c: 'bg-sky-400', rust: 'bg-orange-400'} as const;
const ARM_TEXT = {prismio: 'text-purple-300', c: 'text-sky-300', rust: 'text-orange-300'} as const;
const ARM_NAMES = {prismio: 'Prismio', c: 'C (clang -O3)', rust: 'Rust (opt-3)'} as const;

function Bars({values, format}: {values: Record<'prismio' | 'c' | 'rust', number>; format: (value: number) => string}) {
    const max = Math.max(values.prismio, values.c, values.rust, 1);
    return (
        <div className="space-y-3">
            {(['prismio', 'c', 'rust'] as const).map((key) => (
                <div key={key}>
                    <div className="flex justify-between font-mono text-xs">
                        <span className={ARM_TEXT[key]}>{ARM_NAMES[key]}</span>
                        <span className="text-zinc-300">{values[key] ? format(values[key]) : '—'}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={`h-full ${ARM_TONES[key]}`} style={{width: `${Math.round((values[key] / max) * 100)}%`}} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** The freestanding suite's page section: hero, headline cards, footprint, matrix, notes. */
export default function FreestandingPanel({data}: FreestandingPanelProps) {
    const {stats} = data;
    const cards = [
        {
            key: 'c',
            title: 'Overall vs C',
            arm: 'clang -O3',
            armTone: 'text-sky-300',
            geomean: stats.cGeomean,
            delta: stats.cDeltaPct,
            wins: stats.winsVsC,
            parity: stats.parityVsC,
            losses: stats.lossesVsC,
        },
        {
            key: 'rust',
            title: 'Overall vs Rust',
            arm: 'rustc opt-level 3, no_std',
            armTone: 'text-orange-300',
            geomean: stats.rustGeomean,
            delta: stats.rustDeltaPct,
            wins: stats.winsVsRust,
            parity: stats.parityVsRust,
            losses: stats.lossesVsRust,
        },
    ];
    const pct = (n: number) => `${(n / stats.count) * 100}%`;
    const notes: [string, React.ReactNode][] = [
        [
            'What the number is',
            <>
                Guest instructions executed, read from the generic timer under QEMU&apos;s{' '}
                <code className="font-mono text-emerald-300">-icount shift=0</code> ({data.tickInstructions} instructions per
                tick). It is exact and repeatable, so there is no median, spread or noise model: a verdict is a fixed ±
                {data.parityPct.toFixed(0)}% on the ratio.
            </>,
        ],
        [
            'What it leaves out',
            <>
                It models no cache, pipeline or branch predictor. A workload dominated by memory stalls, such as{' '}
                <code className="font-mono text-emerald-300">pointer_chase</code> or{' '}
                <code className="font-mono text-emerald-300">mem_copy</code>, costs more on real silicon than its count says,
                and a count cannot show a vectorised loop&apos;s advantage. It shows how much code each compiler asked the machine to run.
            </>,
        ],
        [
            'Held equal',
            <>
                One harness object for all three arms, built once. No floating point or SIMD and strict alignment for every arm
                (the MMU is off, so an unaligned access faults). The same algorithm in each language, checked by identical checksums.
            </>,
        ],
        [
            'Known difference',
            <>
                Rust indexes with bounds checks, as safe Rust does; C and Prismio&apos;s fixed arrays are unchecked. That is the
                language&apos;s price for safe indexing, so it stays in the number.
            </>,
        ],
    ];

    return (
        <>
            <section className="grid gap-10 border-b border-white/[0.09] pb-16 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-8">
                    <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                        No operating system. The same programs.
                    </h1>
                    <p className="mt-7 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
                        Prismio against C (clang -O3) and Rust (<code className="font-mono text-emerald-300">no_std</code>, opt-level 3)
                        on bare-metal AArch64: no C library, no allocator, no startup files. One shared boot harness links into all
                        three, so the only code that differs is the benchmarks. Every workload is counted in guest instructions under
                        QEMU, which is exact and repeatable, with identical checksums across all three languages.
                    </p>
                </div>
                <aside className="self-end border-l border-white/[0.1] pl-5 lg:col-span-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Cpu size={16} className="text-indigo-300" />
                        Latest checked-in run
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                        {[
                            ['Generated', data.formattedDate],
                            ['Metric', 'guest instructions'],
                            ['Boots per arm', `${data.runs} (${data.deterministic ? 'identical' : 'differ'})`],
                            ['Workloads', String(stats.count)],
                            ['Target', data.target],
                            ['Emulator', data.environment.qemu ? `QEMU ${data.environment.qemu}` : 'QEMU'],
                            ['Code size', formatBytes(data.codeBytes.prismio)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-6 text-zinc-400">
                                <dt>{label}</dt>
                                <dd className="font-mono text-zinc-200">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </aside>
            </section>

            <section aria-label="Freestanding overall results">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.key} className="space-y-5 rounded-2xl border border-white/10 bg-[#0b0c10] p-7">
                            <div className="flex items-center justify-between text-sm">
                                <h2 className="font-medium text-zinc-200">{card.title}</h2>
                                <span className={`font-mono text-xs ${card.armTone}`}>{card.arm}</span>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="font-mono text-4xl font-bold text-white">{card.geomean.toFixed(2)}×</span>
                                <span
                                    className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                                        card.delta >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                    }`}
                                >
                                    {card.delta >= 0
                                        ? `${card.delta.toFixed(1)}% fewer instructions`
                                        : `${Math.abs(card.delta).toFixed(1)}% more instructions`}
                                </span>
                            </div>
                            <p className="text-sm leading-6 text-zinc-400">
                                Geometric mean of Prismio&apos;s instruction count over the other arm&apos;s, across {stats.count} workloads.
                                Below 1.00× is fewer instructions.
                            </p>
                            <div className="space-y-2 pt-1">
                                <div
                                    role="img"
                                    aria-label={`${card.wins} fewer, ${card.parity} at parity, ${card.losses} more`}
                                    className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]"
                                >
                                    <div style={{width: pct(card.wins)}} className="bg-emerald-400" />
                                    <div style={{width: pct(card.parity)}} className="bg-zinc-500" />
                                    <div style={{width: pct(card.losses)}} className="bg-rose-400" />
                                </div>
                                <div className="flex justify-between font-mono text-xs text-zinc-400">
                                    <span>{card.wins} fewer</span>
                                    <span>{card.parity} parity</span>
                                    <span>{card.losses} more</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0b0c10] p-7">
                        <div className="flex items-center justify-between text-sm">
                            <h2 className="font-medium text-zinc-200">Repeatable</h2>
                            <span className="font-mono text-xs text-orange-300" title={data.machine}>QEMU -icount</span>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-mono text-4xl font-bold text-emerald-400">{data.deterministic ? 'Exact' : 'Varies'}</span>
                            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-sm font-medium text-emerald-400">
                                {data.runs} boots agree
                            </span>
                        </div>
                        <p className="text-sm leading-6 text-zinc-400">
                            The virtual clock advances one nanosecond per instruction, so a timer tick is {data.tickInstructions} instructions
                            and a repeat boot returns the same count.
                        </p>
                    </div>
                </div>
            </section>

            <section aria-labelledby="fs-footprint-heading" className="space-y-8">
                <div>
                    <h2 id="fs-footprint-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                        Build &amp; code footprint
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm text-zinc-400">
                        Time to build the suite, and the machine code each compiler produced for it.
                    </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0b0c10] p-7">
                        <div className="flex items-center justify-between text-sm">
                            <h3 className="font-medium text-zinc-200">Compilation speed</h3>
                            <span className="font-mono text-xs text-zinc-400">compile and link</span>
                        </div>
                        <Bars
                            values={{prismio: data.compile.prismio.raw, c: data.compile.c.raw, rust: data.compile.rust.raw}}
                            format={(value) => `${(value / 1e6).toFixed(0)} ms`}
                        />
                        <p className="text-xs leading-5 text-zinc-400">
                            Each arm is built from source and linked with the shared harness. Prismio compiles the whole suite as one program.
                        </p>
                    </div>
                    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0b0c10] p-7">
                        <div className="flex items-center justify-between text-sm">
                            <h3 className="font-medium text-zinc-200">Image size</h3>
                            <span className="font-mono text-xs text-zinc-400">.text of the image</span>
                        </div>
                        <Bars values={data.codeBytes} format={formatBytes} />
                        <p className="text-xs leading-5 text-zinc-400">
                            Executable code, including {formatBytes(data.harnessBytes)} of harness common to all three.
                        </p>
                    </div>
                </div>
            </section>

            <section aria-labelledby="fs-matrix-heading" className="space-y-8">
                <div>
                    <h2 id="fs-matrix-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                        All freestanding workloads
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm text-zinc-400">
                        Guest instructions per workload. Click any row to see the checksum all three arms returned and each arm&apos;s exact count.
                    </p>
                </div>
                <FreestandingMatrix benchmarks={data.benchmarks} categories={data.categories} />
            </section>

            <section aria-labelledby="fs-notes-heading" className="space-y-8">
                <div>
                    <h2 id="fs-notes-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                        How to read this
                    </h2>
                    <p className="mt-3 text-sm text-zinc-400">What the number is, what it leaves out, and what is held equal.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {notes.map(([heading, body]) => (
                        <div key={heading} className="rounded-xl border border-white/[0.07] bg-[#0b0c10] p-5">
                            <h3 className="mb-1 text-sm font-semibold text-white">{heading}</h3>
                            <p className="text-sm leading-6 text-zinc-400">{body}</p>
                        </div>
                    ))}
                    <div className="rounded-xl border border-white/[0.07] bg-[#0b0c10] p-5 md:col-span-2">
                        <h3 className="mb-1 text-sm font-semibold text-white">Toolchains</h3>
                        <p className="font-mono text-xs leading-6 text-zinc-400">
                            {[
                                data.environment.prismio && `prismio ${data.environment.prismio}${data.environment.prismioProfile ? ` (${data.environment.prismioProfile} build)` : ''}`,
                                data.environment.clang && `clang ${data.environment.clang}`,
                                data.environment.rustc && `rustc ${data.environment.rustc}`,
                                data.environment.lld && `lld ${data.environment.lld}`,
                                data.environment.qemu && `qemu ${data.environment.qemu}`,
                            ].filter(Boolean).join(' · ') || '—'}
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
