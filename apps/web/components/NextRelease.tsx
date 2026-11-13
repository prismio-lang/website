import React from 'react';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight} from 'lucide-react';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

/** 10 Nov 2026 to 10 Dec 2026. */
const DAYS_BETWEEN = 30;

const TERMS = [
    {term: 'Status', detail: 'Planned. Nothing in 0.3.0 has been announced yet.'},
    {term: 'The date', detail: 'A target, not a promise. If it moves, this page says so.'},
    {term: 'Scope', detail: 'Set by the open issues and the “Not yet” list on the roadmap.'},
];

/** The next release: a two-node timeline from the shipped version to the planned one. Static, no script. */
export default function NextRelease() {
    return (
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 max-md:grid-cols-1 max-md:gap-10">
            <div className="lg:col-span-5">
                <p className="font-mono text-sm text-indigo-300">Next release</p>
                <h2 id="next-heading" className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                    0.3.0 is planned for{' '}
                    <time dateTime="2026-12-10" className="text-sky-300 whitespace-nowrap max-md:whitespace-normal">
                        10 December 2026.
                    </time>
                </h2>
                <p className="mt-6 text-base leading-7 text-zinc-300">
                    Releases follow the work, so the date is where the project is aiming, not a contract.
                    Progress is public: every change lands on GitHub, and the release notes list what shipped.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 max-md:mt-4 max-md:flex-col max-md:items-start max-md:gap-y-0">
                    <a
                        href="https://github.com/prismio-lang/prismio/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`max-md:min-h-11 max-md:text-base inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 ${FOCUS}`}
                    >
                        Follow the open issues
                        <ArrowUpRight size={15}/>
                    </a>
                    <Link
                        href="/releases"
                        className={`max-md:min-h-11 max-md:text-base inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white ${FOCUS}`}
                    >
                        Past release notes
                        <ArrowRight size={14}/>
                    </Link>
                </div>
            </div>

            <div className="lg:col-span-7 lg:pt-3">
                {/* Timeline: shipped version, the span between, the planned version */}
                <div
                    role="img"
                    aria-label={`Prismio 0.2.0 was released on 10 November 2026. Prismio 0.3.0 is planned for 10 December 2026, ${DAYS_BETWEEN} days later.`}
                    className="flex items-start"
                >
                    <div className="w-28 shrink-0 sm:w-36 max-sm:w-24">
                        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/60">
                            <span className="size-1.5 rounded-full bg-emerald-400"/>
                        </span>
                        <p className="mt-4 font-mono text-2xl font-semibold tracking-tight text-white">0.2.0</p>
                        <p className="mt-1 text-sm text-zinc-300">10 Nov 2026</p>
                        <p className="mt-0.5 text-xs text-emerald-300">Released</p>
                    </div>

                    <div className="relative mt-2 min-w-0 flex-1" aria-hidden>
                        <div className="h-px w-full bg-gradient-to-r from-emerald-400/70 via-white/25 to-indigo-300/70"/>
                        <p className="mt-3 text-center font-mono text-xs text-zinc-400">{DAYS_BETWEEN} days</p>
                    </div>

                    <div className="w-28 shrink-0 text-right sm:w-36 max-sm:w-24">
                        <span className="ml-auto flex size-4 items-center justify-center rounded-full border border-dashed border-indigo-300/80">
                            <span className="size-1 rounded-full bg-indigo-300/80"/>
                        </span>
                        <p className="mt-4 font-mono text-2xl font-semibold tracking-tight text-white">0.3.0</p>
                        <p className="mt-1 text-sm text-zinc-300">10 Dec 2026</p>
                        <p className="mt-0.5 text-xs text-indigo-300">Planned</p>
                    </div>
                </div>

                <dl className="mt-12 max-md:mt-10 divide-y divide-white/[0.1] border-y border-white/[0.1]">
                    {TERMS.map((item) => (
                        <div key={item.term} className="grid gap-1 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
                            <dt className="font-mono text-sm font-semibold text-white">{item.term}</dt>
                            <dd className="text-sm leading-6 text-zinc-400">{item.detail}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
