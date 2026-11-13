'use client';

import React, {useState} from 'react';
import Image from 'next/image';
import {motion, useReducedMotion} from 'framer-motion';
import {ArrowUpRight, Check, Copy} from 'lucide-react';
import GithubIcon from '@/components/icons/GithubIcon';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

// Fixed on purpose: no request at build or run time, so the page stays fully static. Update these when a new version is published.
const VSCODE_VERSION = '0.1.0';
const JETBRAINS_VERSION = '0.2.0';

// Official product logos, from JetBrains and Microsoft.
interface Ide {
    name: string;
    logo?: string;
}

const VSCODE: Ide = {name: 'VS Code', logo: '/icons/ide/vscode.svg'};
// Used by hand with the plugin.
const JETBRAINS_TESTED: Ide[] = [
    {name: 'IntelliJ IDEA', logo: '/icons/ide/intellij-idea.png'},
    {name: 'CLion', logo: '/icons/ide/clion.png'},
];
// Listed as supported on the Marketplace (2026.2+), not used by hand yet.
const JETBRAINS_COMPATIBLE: Ide[] = [
    {name: 'PyCharm', logo: '/icons/ide/pycharm.png'},
    {name: 'WebStorm', logo: '/icons/ide/webstorm.png'},
    {name: 'GoLand', logo: '/icons/ide/goland.png'},
    {name: 'RustRover', logo: '/icons/ide/rustrover.svg'},
    {name: 'Rider', logo: '/icons/ide/rider.svg'},
    {name: 'PhpStorm', logo: '/icons/ide/phpstorm.png'},
    {name: 'RubyMine', logo: '/icons/ide/rubymine.png'},
    {name: 'DataGrip', logo: '/icons/ide/datagrip.png'},
];

export interface Editor {
    id: 'vscode' | 'jetbrains';
    name: string;
    kind: string;
    logos: Ide[];
    summary: string;
    needs: string;
    primary: {label: string; href: string};
    source: string;
    features: string[];
    installIntro: React.ReactNode;
    copyValue: string;
    installOutro: string;
}

// What each one does is taken from its own README / Marketplace description.
export const EDITORS: Editor[] = [
    {
        id: 'jetbrains',
        name: 'JetBrains IDEs',
        kind: `Plugin v${JETBRAINS_VERSION}`,
        logos: JETBRAINS_TESTED,
        summary: 'Official Prismio support for IntelliJ IDEA, CLion, and the other JetBrains IDEs, live on the Marketplace.',
        needs: 'A JetBrains IDE 2026.2 or newer, Prismio 0.2.0 or newer',
        primary: {label: 'Marketplace page', href: 'https://plugins.jetbrains.com/plugin/34672-prismio'},
        source: 'https://github.com/prismio-lang/jetbrains-plugin',
        features: [
            'Syntax highlighting for .psm files and build.ums manifests',
            'Completion that knows the type in front of the dot, with imports added for you',
            'Compiler errors as you type, with a quick fix for a missing import',
            'Go to declaration, find usages, and rename',
            'Formatting, folding, brace matching, and live templates',
            'Run, build, and test from the gutter and the run menu',
        ],
        installIntro: (
            <>
                In your IDE open <strong className="font-medium text-white">Settings → Plugins → Marketplace</strong> and search for
            </>
        ),
        copyValue: 'Prismio',
        installOutro: 'Press Install, and restart the IDE if asked.',
    },
    {
        id: 'vscode',
        name: 'VS Code',
        kind: `Extension v${VSCODE_VERSION}`,
        logos: [VSCODE],
        summary: "The Prismio extension is a thin client of the compiler's own language server, so it knows what your compiler knows.",
        needs: 'VS Code 1.100 or newer, Prismio 0.2.0 or newer',
        primary: {label: 'Marketplace page', href: 'https://marketplace.visualstudio.com/items?itemName=Prismio.prismio'},
        source: 'https://github.com/prismio-lang/vscode-plugin',
        features: [
            'Compiler errors as you type, with the P#### codes, in .psm files and build.ums',
            'Completion that brings its import with it, hover, signature help, inlay hints',
            'Go to definition (into the standard library too), find references, rename',
            'Format document or selection, folding, the outline, snippets',
            'Run and Debug links above fn main, and tasks for build, test, and run',
        ],
        installIntro: (
            <>
                Open the <strong className="font-medium text-white">Extensions</strong> view (Cmd/Ctrl+Shift+X) and search for
            </>
        ),
        copyValue: 'Prismio',
        installOutro: 'Press Install. Open a folder with a build.ums or any .psm file and the language server starts.',
    },
];

export function Logo({ide, size}: {ide: Ide; size: number}) {
    if (!ide.logo) return null;
    return <Image src={ide.logo} alt="" width={size} height={size} className="shrink-0 object-contain" />;
}

export function LogoStack({logos}: {logos: Ide[]}) {
    return (
        <span className="flex shrink-0 items-center -space-x-3 max-md:-space-x-2 max-md:[&_img]:size-5" aria-hidden>
            {logos.map((ide) => (
                <span key={ide.name} className="flex size-11 items-center justify-center rounded-xl bg-[#0b0c10] ring-2 ring-[#0b0c10] max-md:size-7 max-md:rounded-lg">
                    <Logo ide={ide} size={40} />
                </span>
            ))}
        </span>
    );
}

export default function EditorSupportCard({className = ''}: {className?: string}) {
    const [activeId, setActiveId] = useState<Editor['id']>('jetbrains');
    const [copied, setCopied] = useState(false);
    const reduceMotion = useReducedMotion();
    const editor = EDITORS.find((e) => e.id === activeId) ?? EDITORS[0]!;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(editor.copyValue);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // The text stays selectable.
        }
    };

    return (
        <div className={`overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09] ${className}`}>
            {/* Pick an editor */}
            <div role="tablist" aria-label="Editor" className="grid sm:grid-cols-2 max-sm:grid-cols-2">
                {EDITORS.map((e) => {
                    const selected = e.id === activeId;
                    return (
                        <button
                            key={e.id}
                            type="button"
                            role="tab"
                            id={`editor-tab-${e.id}`}
                            aria-selected={selected}
                            aria-controls="editor-panel"
                            onClick={() => {
                                setActiveId(e.id);
                                setCopied(false);
                            }}
                            className={`relative flex items-center gap-4 px-7 py-6 max-md:gap-2 max-md:px-2.5 max-md:py-3.5 text-left transition-colors focus-visible:ring-inset ${FOCUS} ${
                                selected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.025]'
                            }`}
                        >
                            <LogoStack logos={e.logos} />
                            <span className="min-w-0">
                                <span className={`block text-lg font-semibold tracking-tight max-md:text-sm max-md:leading-5 max-md:whitespace-nowrap transition-colors ${selected ? 'text-white' : 'text-zinc-400'}`}>
                                    {e.name}
                                </span>
                                <span className="mt-0.5 block text-sm text-zinc-500 max-md:text-xs">{e.kind}</span>
                            </span>
                            <span
                                aria-hidden
                                className={`absolute inset-x-0 bottom-0 h-px transition-colors ${selected ? 'bg-indigo-400' : 'bg-white/[0.08]'}`}
                            />
                        </button>
                    );
                })}
            </div>

            <motion.div
                key={editor.id}
                id="editor-panel"
                role="tabpanel"
                aria-labelledby={`editor-tab-${editor.id}`}
                initial={reduceMotion ? false : {opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
                className="grid lg:grid-cols-12 max-md:grid-cols-1"
            >
                {/* Who it is for, and where to get it */}
                <div className="p-8 lg:col-span-5 lg:p-10 max-md:p-5">
                    <p className="max-w-md text-base leading-7 text-zinc-300">{editor.summary}</p>

                    <div className="mt-8">
                        <p className="text-xs font-medium text-zinc-500">{editor.id === 'vscode' ? 'Works in' : 'Recommended'}</p>
                        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                            {(editor.id === 'vscode' ? [VSCODE] : JETBRAINS_TESTED).map((ide) => (
                                <li key={ide.name} className="flex items-center gap-2.5 text-sm font-medium text-white">
                                    <Logo ide={ide} size={24} />
                                    {ide.name}
                                </li>
                            ))}
                        </ul>
                        {editor.id === 'jetbrains' && (
                            <>
                                <p className="mt-6 text-xs font-medium text-zinc-500">Also compatible</p>
                                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                                    {JETBRAINS_COMPATIBLE.map((ide) => (
                                        <li key={ide.name} className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Logo ide={ide} size={20} />
                                            {ide.name}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <p className="mt-4 text-xs leading-5 text-zinc-500">{editor.needs}.</p>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch">
                        <a
                            href={editor.primary.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`max-md:h-12 max-md:justify-center max-md:text-base inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                        >
                            {editor.primary.label}
                            <ArrowUpRight size={14} />
                        </a>
                        <a
                            href={editor.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`max-md:h-12 max-md:justify-center max-md:text-base inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.06] ${FOCUS}`}
                        >
                            <GithubIcon size={16} />
                            Source
                        </a>
                    </div>
                </div>

                {/* What you get, and how to install */}
                <div className="border-t border-white/[0.07] p-8 lg:col-span-7 lg:border-l lg:border-t-0 lg:p-10 max-md:p-5">
                    <ul className="grid gap-x-8 sm:grid-cols-2">
                        {editor.features.map((feature) => (
                            <li key={feature} className="flex gap-3 border-b border-white/[0.06] py-3.5 text-sm leading-6 text-zinc-300 max-md:text-base">
                                <Check size={15} className="mt-1 shrink-0 text-emerald-400" aria-hidden />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 max-md:hidden">
                        <p className="text-sm leading-6 text-zinc-400 max-md:text-base max-md:leading-7">{editor.installIntro}</p>
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#06070a] px-4 py-3 ring-1 ring-white/[0.08] max-md:py-1.5 max-md:pr-1.5">
                            <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-zinc-100 [scrollbar-width:none]">
                                {editor.copyValue}
                            </code>
                            <button
                                type="button"
                                onClick={copy}
                                className={`max-md:h-11 max-md:rounded-lg max-md:px-3 max-md:text-sm inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-zinc-400 transition-colors hover:text-white ${FOCUS}`}
                                aria-label={`Copy ${editor.copyValue}`}
                            >
                                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-500 max-md:text-base max-md:leading-7">{editor.installOutro}</p>
                    </div>
                </div>
            </motion.div>

            {/* Any other editor */}
            <div className="grid divide-y divide-white/[0.07] border-t border-white/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <a
                    href="https://docs.prismio.org/guides/editors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between gap-4 px-8 py-5 max-md:px-5 transition-colors hover:bg-white/[0.03] focus-visible:ring-inset ${FOCUS}`}
                >
                    <span>
                        <span className="block text-sm font-semibold text-white">Any editor that speaks LSP</span>
                        <span className="mt-0.5 block text-sm text-zinc-400">
                            <code className="font-mono text-zinc-300">prismio lsp</code> ships with the compiler.
                        </span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-500 transition-colors group-hover:text-white" />
                </a>
                <a
                    href="https://github.com/prismio-lang/prismio-tmlanguage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between gap-4 px-8 py-5 max-md:px-5 transition-colors hover:bg-white/[0.03] focus-visible:ring-inset ${FOCUS}`}
                >
                    <span>
                        <span className="block text-sm font-semibold text-white">Just syntax highlighting</span>
                        <span className="mt-0.5 block text-sm text-zinc-400">A TextMate grammar for any editor that reads one.</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-500 transition-colors group-hover:text-white" />
                </a>
            </div>
        </div>
    );
}
