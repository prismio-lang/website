'use client';

import React, { useState } from 'react';
import { AstNode } from '../lib/compiler/types';
import { ChevronRight, ChevronDown, Copy, Check, Braces, Network } from 'lucide-react';

interface AstViewerProps {
    ast: AstNode;
}

function AstTreeNode({ node, level = 0 }: { node: AstNode; level?: number }) {
    const [expanded, setExpanded] = useState<boolean>(level < 3);
    const hasChildren = Boolean(node.children && node.children.length > 0);

    return (
        <div className="text-xs font-mono">
            <div
                onClick={() => hasChildren && setExpanded(!expanded)}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-white/[0.04] transition-colors ${
                    hasChildren ? 'cursor-pointer' : ''
                }`}
                style={{ paddingLeft: `${Math.max(8, level * 16)}px` }}
            >
                {hasChildren ? (
                    expanded ? (
                        <ChevronDown size={13} className="text-zinc-500 shrink-0" />
                    ) : (
                        <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                    )
                ) : (
                    <span className="w-3.5" />
                )}

                <span className="text-indigo-400 font-semibold">{node.type}</span>

                {node.name && (
                    <span className="text-[#47d7b5] font-medium">"{node.name}"</span>
                )}

                {node.returnType && (
                    <span className="text-emerald-400 text-[11px]">&rarr; {node.returnType}</span>
                )}

                {node.value !== undefined && (
                    <span className="text-amber-300 text-[11px] truncate max-w-xs">
                        = {String(node.value)}
                    </span>
                )}

                {node.line && (
                    <span className="ml-auto text-zinc-600 text-[10px]">
                        L{node.line}
                    </span>
                )}
            </div>

            {hasChildren && expanded && (
                <div className="border-l border-white/[0.06] ml-3.5 my-0.5">
                    {node.children?.map((child, idx) => (
                        <AstTreeNode key={idx} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AstViewer({ ast }: AstViewerProps) {
    const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
    const [copied, setCopied] = useState(false);

    const jsonString = JSON.stringify(ast, null, 2);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#08090d]">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0c0d12] border-b border-white/[0.06] text-xs font-mono">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('tree')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                            viewMode === 'tree'
                                ? 'bg-white/[0.1] text-white font-medium'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Network size={12} />
                        <span>Tree Inspector</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewMode('json')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                            viewMode === 'json'
                                ? 'bg-white/[0.1] text-white font-medium'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Braces size={12} />
                        <span>JSON AST</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#13141c] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-[11px]"
                >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy AST'}</span>
                </button>
            </div>

            {/* Content view */}
            <div className="flex-1 overflow-auto p-4 font-mono">
                {viewMode === 'tree' ? (
                    <div className="p-2">
                        <AstTreeNode node={ast} />
                    </div>
                ) : (
                    <pre className="text-xs text-zinc-300 leading-5 whitespace-pre">
                        {jsonString}
                    </pre>
                )}
            </div>
        </div>
    );
}
