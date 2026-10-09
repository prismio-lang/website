'use client';

import React, {useCallback, useEffect, useState} from 'react';

type Suite = 'hosted' | 'freestanding';

interface SuiteTabsProps {
    hosted: React.ReactNode;
    /** Null when the checked-in results have no freestanding report: the tab is disabled. */
    freestanding: React.ReactNode | null;
}

const TABS: {key: Suite; name: string; sub: string}[] = [
    {key: 'hosted', name: 'Hosted', sub: 'Prismio · C++ · Rust on the operating system'},
    {key: 'freestanding', name: 'Freestanding', sub: 'Prismio · C · Rust with no operating system'},
];

/**
 * The two benchmark suites share one results file and are read one at a time. Both panels
 * are rendered by the server, so the page is complete without script; this only chooses
 * which one is visible. The choice lives in the URL hash (`#freestanding`) so a link can
 * name a tab, and it is read after mount, so the first paint matches the static export.
 */
export default function SuiteTabs({hosted, freestanding}: SuiteTabsProps) {
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
            select(next.key);
            document.getElementById(`bench-tab-${next.key}`)?.focus();
        }
    };

    return (
        <>
            <div
                role="tablist"
                aria-label="Benchmark suite"
                onKeyDown={onKeyDown}
                className="flex gap-2 border-b border-white/[0.09]"
            >
                {TABS.map((tab) => {
                    const selected = active === tab.key;
                    const enabled = available(tab.key);
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
                            className={`relative -mb-px flex flex-col items-start gap-0.5 rounded-t-xl border border-b-0 px-5 pb-3 pt-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                                selected
                                    ? 'border-white/[0.09] bg-[#111218] text-white shadow-[inset_0_2px_0_0_rgb(52,211,153)]'
                                    : 'border-transparent text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                            }`}
                        >
                            <span className="text-sm font-semibold">{tab.name}</span>
                            <span className="hidden font-mono text-xs text-zinc-400 sm:inline">{tab.sub}</span>
                        </button>
                    );
                })}
            </div>

            <div
                id="bench-panel-hosted"
                role="tabpanel"
                aria-labelledby="bench-tab-hosted"
                hidden={active !== 'hosted'}
                className="mt-12 space-y-20"
            >
                {hosted}
            </div>
            {freestanding !== null && (
                <div
                    id="bench-panel-freestanding"
                    role="tabpanel"
                    aria-labelledby="bench-tab-freestanding"
                    hidden={active !== 'freestanding'}
                    className="mt-12 space-y-20"
                >
                    {freestanding}
                </div>
            )}
        </>
    );
}
