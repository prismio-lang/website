'use client';

import React, {useCallback, useEffect, useState} from 'react';

type Suite = 'hosted' | 'freestanding';

interface SuiteTabsProps {
    hosted: React.ReactNode;
    /** Null when the checked-in results have no freestanding report: the option is disabled. */
    freestanding: React.ReactNode | null;
    /** Workloads measured in each suite, shown inside the switch. */
    counts: {hosted: number; freestanding: number | null};
}

const TABS: {key: Suite; name: string; sub: string}[] = [
    {key: 'hosted', name: 'Hosted', sub: 'Prismio, C++ and Rust, on the operating system'},
    {key: 'freestanding', name: 'Freestanding', sub: 'Prismio, C and Rust, with no operating system at all'},
];

/**
 * The two benchmark suites share one results file and are read one at a time. Both panels
 * are rendered by the server, so the page is complete without script; this only chooses
 * which one is visible. The choice lives in the URL hash (`#freestanding`) so a link can
 * name a suite, and it is read after mount, so the first paint matches the static export.
 *
 * The control is a two-option switch: one thumb slides between the options, and the panel that
 * becomes visible fades in. `prefers-reduced-motion` turns both off.
 */
export default function SuiteTabs({hosted, freestanding, counts}: SuiteTabsProps) {
    const [active, setActive] = useState<Suite>('hosted');
    const available = useCallback((suite: Suite) => suite === 'hosted' || freestanding !== null, [freestanding]);

    useEffect(() => {
        const fromHash = () => {
            const wanted: Suite = window.location.hash === '#freestanding' ? 'freestanding' : 'hosted';
            setActive(available(wanted) ? wanted : 'hosted');
        };
        fromHash();
        window.addEventListener('hashchange', fromHash);
        return () => window.removeEventListener('hashchange', fromHash);
    }, [available]);

    const select = (suite: Suite) => {
        if (!available(suite)) return;
        setActive(suite);
        const url = suite === 'hosted' ? window.location.pathname + window.location.search : `#${suite}`;
        window.history.replaceState(null, '', url);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const usable = TABS.filter((tab) => available(tab.key));
        const at = usable.findIndex((tab) => tab.key === active);
        const next = usable[(at + (event.key === 'ArrowRight' ? 1 : usable.length - 1)) % usable.length];
        if (next) {
            event.preventDefault();
            select(next.key);
            document.getElementById(`bench-tab-${next.key}`)?.focus();
        }
    };

    const current = TABS.find((tab) => tab.key === active) ?? TABS[0]!;

    return (
        <>
            <style>{`
                @keyframes bench-panel-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: none; }
                }
                .bench-panel:not([hidden]) { animation: bench-panel-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both; }
                @media (prefers-reduced-motion: reduce) {
                    .bench-panel:not([hidden]) { animation: none; }
                }
            `}</style>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div
                    role="tablist"
                    aria-label="Benchmark suite"
                    onKeyDown={onKeyDown}
                    className="relative grid w-full shrink-0 grid-cols-2 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/[0.09] sm:w-[25rem]"
                >
                    {/* The thumb: one element that slides, so the change reads as a single movement. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-white/[0.12] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{transform: active === 'freestanding' ? 'translateX(100%)' : 'translateX(0)'}}
                    />
                    {TABS.map((tab) => {
                        const selected = active === tab.key;
                        const enabled = available(tab.key);
                        const count = tab.key === 'hosted' ? counts.hosted : counts.freestanding;
                        return (
                            <button
                                key={tab.key}
                                id={`bench-tab-${tab.key}`}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={`bench-panel-${tab.key}`}
                                tabIndex={selected ? 0 : -1}
                                disabled={!enabled}
                                title={enabled ? undefined : 'No freestanding results in the checked-in file'}
                                onClick={() => select(tab.key)}
                                className={`relative z-10 flex items-center justify-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                                    selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                {tab.name}
                                {count !== null && (
                                    <span
                                        className={`font-mono text-xs font-normal tabular-nums transition-colors duration-200 ${
                                            selected ? 'text-zinc-300' : 'text-zinc-500'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <p key={active} aria-live="polite" className="bench-panel font-mono text-xs leading-5 text-zinc-400">
                    {current.sub}
                </p>
            </div>

            <div
                id="bench-panel-hosted"
                role="tabpanel"
                aria-labelledby="bench-tab-hosted"
                hidden={active !== 'hosted'}
                className="bench-panel mt-12 space-y-20"
            >
                {hosted}
            </div>
            {freestanding !== null && (
                <div
                    id="bench-panel-freestanding"
                    role="tabpanel"
                    aria-labelledby="bench-tab-freestanding"
                    hidden={active !== 'freestanding'}
                    className="bench-panel mt-12 space-y-20"
                >
                    {freestanding}
                </div>
            )}
        </>
    );
}
