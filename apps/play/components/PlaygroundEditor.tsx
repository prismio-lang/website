'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Copy, Check, FileCode2, Terminal } from 'lucide-react';
import { highlightPrismio } from '../lib/compiler/highlighter';

interface PlaygroundEditorProps {
    value: string;
    onChange: (val: string) => void;
    onRun: () => void;
}

export default function PlaygroundEditor({ value, onChange, onRun }: PlaygroundEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [copied, setCopied] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

    const highlightedLines = highlightPrismio(value);

    // Sync scroll between textarea and pre highlight layer
    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    // Update cursor position on click or selection change
    const updateCursorPos = () => {
        if (!textareaRef.current) return;
        const text = textareaRef.current.value.slice(0, textareaRef.current.selectionStart);
        const lines = text.split('\n');
        const lastLine = lines[lines.length - 1] ?? '';
        setCursorPos({
            line: lines.length,
            col: lastLine.length + 1,
        });
    };

    // Keydown handlers: Tab, pairs auto-closing, Cmd/Ctrl+Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Run shortcut: Cmd+Enter or Ctrl+Enter
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onRun();
            return;
        }

        // Tab indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            if (e.shiftKey) {
                // Outdent if at line start
                const before = textarea.value.substring(0, start);
                const after = textarea.value.substring(end);
                if (before.endsWith('    ')) {
                    const newText = before.slice(0, -4) + after;
                    onChange(newText);
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start - 4;
                    }, 0);
                }
            } else {
                // Indent 4 spaces
                const newText = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                onChange(newText);
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                }, 0);
            }
            return;
        }

        // Auto-close brackets & quotes
        const pairs: Record<string, string> = {
            '(': ')',
            '{': '}',
            '[': ']',
            '"': '"',
            "'": "'",
        };

        if (pairs[e.key]) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const closing = pairs[e.key];

            // If text is selected, wrap it
            if (start !== end) {
                e.preventDefault();
                const selected = textarea.value.substring(start, end);
                const newText = textarea.value.substring(0, start) + e.key + selected + closing + textarea.value.substring(end);
                onChange(newText);
                setTimeout(() => {
                    textarea.selectionStart = start + 1;
                    textarea.selectionEnd = end + 1;
                }, 0);
                return;
            }
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="relative flex flex-col h-full bg-[#08090d] border-r border-white/[0.08] overflow-hidden">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0c0d12] text-xs">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-300">
                        <FileCode2 size={12} className="text-[#47d7b5]" />
                        <span>main.psm</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Copy code"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            {/* Code Area with Line Numbers and Dual Layer Editor */}
            <div className="relative flex-1 flex overflow-hidden font-mono text-xs sm:text-[13px] leading-6">
                {/* Line Numbers Column */}
                <div
                    className="shrink-0 w-12 sm:w-14 py-3 bg-[#08090d] border-r border-white/[0.04] select-none text-right pr-3 font-mono text-zinc-600 text-[11px] sm:text-xs overflow-hidden"
                    aria-hidden="true"
                >
                    {highlightedLines.map((line) => (
                        <div
                            key={line.lineNumber}
                            className={`h-6 leading-6 ${
                                cursorPos.line === line.lineNumber ? 'text-[#47d7b5] font-semibold' : ''
                            }`}
                        >
                            {line.lineNumber}
                        </div>
                    ))}
                </div>

                {/* Editor Surface: Highlighted Pre below, transparent Textarea above */}
                <div className="relative flex-1 h-full overflow-hidden">
                    {/* Background Syntax Highlighted Layer */}
                    <pre
                        ref={preRef}
                        aria-hidden="true"
                        className="absolute inset-0 p-3 m-0 overflow-hidden whitespace-pre pointer-events-none font-mono text-xs sm:text-[13px] leading-6 select-none"
                    >
                        {highlightedLines.map((line) => (
                            <div
                                key={line.lineNumber}
                                className={`h-6 leading-6 rounded-xs ${
                                    cursorPos.line === line.lineNumber ? 'bg-white/[0.02]' : ''
                                }`}
                            >
                                {line.tokens.length > 0 ? (
                                    line.tokens.map((token, idx) => (
                                        <span key={idx} className={token.className}>
                                            {token.text}
                                        </span>
                                    ))
                                ) : (
                                    <span>&nbsp;</span>
                                )}
                            </div>
                        ))}
                    </pre>

                    {/* Interactive Input Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            updateCursorPos();
                        }}
                        onKeyDown={handleKeyDown}
                        onKeyUp={updateCursorPos}
                        onClick={updateCursorPos}
                        onScroll={handleScroll}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-[#47d7b5] resize-none outline-none overflow-auto font-mono text-xs sm:text-[13px] leading-6 whitespace-pre"
                        style={{
                            tabSize: 4,
                            WebkitTextFillColor: 'transparent',
                        }}
                    />
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0b10] border-t border-white/[0.06] text-[11px] font-mono text-zinc-500 select-none">
                <div className="flex items-center gap-3">
                    <span className="text-zinc-400">Prismio (UTF-8)</span>
                    <span className="text-zinc-700">·</span>
                    <span>Spaces: 4</span>
                </div>

                <div className="flex items-center gap-3">
                    <span>{value.length} characters</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-300">
                        Ln {cursorPos.line}, Col {cursorPos.col}
                    </span>
                </div>
            </div>
        </div>
    );
}
