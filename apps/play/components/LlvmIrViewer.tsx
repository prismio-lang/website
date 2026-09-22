'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, FileCode } from 'lucide-react';

interface LlvmIrViewerProps {
    llvmIr: string;
}

export default function LlvmIrViewer({ llvmIr }: LlvmIrViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(llvmIr);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const handleDownload = () => {
        const blob = new Blob([llvmIr], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'main.ll';
        a.click();
        URL.revokeObjectURL(url);
    };

    const lines = llvmIr.split('\n');

    // Simple LLVM syntax coloring
    const highlightLlvmLine = (line: string) => {
        if (line.trim().startsWith(';')) {
            return <span className="text-zinc-500 italic">{line}</span>;
        }

        // Tokenize line
        const parts = line.split(/([ \t,()={}[\]:;"]+)/);
        return parts.map((part, i) => {
            if (['define', 'declare', 'ret', 'alloca', 'load', 'store', 'call', 'tail', 'insertvalue', 'getelementptr', 'global', 'constant'].includes(part)) {
                return <span key={i} className="text-indigo-400 font-medium">{part}</span>;
            }
            if (['i32', 'i64', 'i8', 'i1', 'ptr', 'void', 'type', 'undef'].includes(part)) {
                return <span key={i} className="text-[#47d7b5]">{part}</span>;
            }
            if (part.startsWith('@')) {
                return <span key={i} className="text-amber-300 font-semibold">{part}</span>;
            }
            if (part.startsWith('%')) {
                return <span key={i} className="text-sky-300">{part}</span>;
            }
            if (/^\d+$/.test(part)) {
                return <span key={i} className="text-amber-400">{part}</span>;
            }
            if (part.startsWith('"') || part.endsWith('"')) {
                return <span key={i} className="text-emerald-300">{part}</span>;
            }
            return <span key={i} className="text-zinc-300">{part}</span>;
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#08090d]">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0c0d12] border-b border-white/[0.06] text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-400">
                    <FileCode size={13} className="text-[#47d7b5]" />
                    <span>LLVM IR (LLVM 23.1.1 Target)</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#13141c] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-[11px]"
                    >
                        <Download size={12} />
                        <span>Download .ll</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#13141c] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-[11px]"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copied ? 'Copied' : 'Copy IR'}</span>
                    </button>
                </div>
            </div>

            {/* Content view with line numbers */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-6">
                <div className="flex">
                    <div className="w-10 shrink-0 text-right pr-4 text-zinc-600 select-none">
                        {lines.map((_, idx) => (
                            <div key={idx}>{idx + 1}</div>
                        ))}
                    </div>
                    <div className="flex-1 whitespace-pre overflow-x-auto">
                        {lines.map((line, idx) => (
                            <div key={idx} className="hover:bg-white/[0.02]">
                                {highlightLlvmLine(line)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
