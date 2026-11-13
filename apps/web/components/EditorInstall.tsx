'use client';

import React, {useState} from 'react';
import {ArrowUpRight, Check, Copy} from 'lucide-react';
import {EDITORS, LogoStack} from '@/components/EditorSupportCard';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

// The install page's version of the editor card: the way in, and nothing else.
const WHERE: Record<string, string> = {
    jetbrains: 'Settings → Plugins → Marketplace',
    vscode: 'Extensions view',
};

function Row({editor}: {editor: (typeof EDITORS)[number]}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(editor.copyValue);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // The name stays selectable.
        }
    };

    return (
        <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between max-sm:px-5">
            <div className="flex items-center gap-4">
                <LogoStack logos={editor.logos} />
                <div>
                    <p className="text-base font-semibold text-white">{editor.name}</p>
                    <p className="text-sm text-zinc-500">
                        {WHERE[editor.id]} · {editor.kind}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex items-center gap-3 rounded-lg bg-[#06070a] py-2 pl-3 pr-2.5 ring-1 ring-white/[0.08] max-sm:justify-between max-sm:py-0.5 max-sm:pr-1">
                    <code className="font-mono text-sm text-zinc-100">{editor.copyValue}</code>
                    <button
                        type="button"
                        onClick={copy}
                        className={`inline-flex items-center gap-1.5 rounded text-xs text-zinc-400 transition-colors hover:text-white max-md:min-h-10 max-md:px-2.5 max-md:text-sm ${FOCUS}`}
                        aria-label={`Copy ${editor.copyValue}`}
                    >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
                <a
                    href={editor.primary.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 max-md:min-h-11 max-md:justify-center ${FOCUS}`}
                >
                    Marketplace
                    <ArrowUpRight size={14} />
                </a>
            </div>
        </li>
    );
}

export default function EditorInstall({className = ''}: {className?: string}) {
    return (
        <div className={className}>
            <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                {EDITORS.map((editor) => (
                    <Row key={editor.id} editor={editor} />
                ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-zinc-500 max-md:text-base max-md:leading-7">
                Any other editor can run <code className="font-mono text-zinc-300">prismio lsp</code>, which ships with the toolchain.{' '}
                <a
                    href="https://docs.prismio.org/guides/editors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-zinc-300 underline underline-offset-4 transition-colors hover:text-white ${FOCUS}`}
                >
                    Editor guide
                </a>
            </p>
        </div>
    );
}
