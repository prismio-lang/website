'use client';

import React, { useState, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import {
    FileCode2,
    Copy,
    Check,
    AlignLeft,
    WrapText,
    Map,
    Sparkles,
    Terminal
} from 'lucide-react';
import { setupPrismioMonaco } from '../lib/monaco/setupMonaco';
import { PRISMIO_LANGUAGE_ID } from '../lib/monaco/prismioLanguage';
import { PRISMIO_THEME_DARK } from '../lib/monaco/prismioTheme';
import { formatPrismioCode } from '../lib/monaco/prismioFormatter';

interface MonacoIdeEditorProps {
    value: string;
    onChange: (val: string) => void;
    onRun: () => void;
}

export default function MonacoIdeEditor({ value, onChange, onRun }: MonacoIdeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [copied, setCopied] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [showMinimap, setShowMinimap] = useState(false);
    const [showWordWrap, setShowWordWrap] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2200);
    };

    const handleEditorDidMount: OnMount = (editorInstance, monacoInstance) => {
        editorRef.current = editorInstance;

        // Register Prismio language, theme, completions, hover, formatter
        setupPrismioMonaco(monacoInstance);

        // Ensure theme is applied
        monacoInstance.editor.setTheme(PRISMIO_THEME_DARK);

        // Track cursor position
        editorInstance.onDidChangeCursorPosition((e) => {
            setCursorPos({
                line: e.position.lineNumber,
                col: e.position.column,
            });
        });

        // Add keyboard shortcut for Run: Cmd+Enter or Ctrl+Enter
        editorInstance.addCommand(
            monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
            () => {
                onRun();
            }
        );
    };

    const handleFormat = () => {
        if (!editorRef.current) return;
        const formatted = formatPrismioCode(value);
        onChange(formatted);
        showToast('Document formatted with Prismio style rules');
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        showToast('Source code copied to clipboard');
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="relative flex flex-col h-full bg-[#070709] overflow-hidden">
            {/* Top IDE File & Toolbar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a0c] border-b border-white/10 text-xs select-none">
                {/* File Tab */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070709] border-t-2 border-t-[#47d7b5] border-x border-x-white/5 text-xs font-mono text-zinc-200 -mb-1 mt-1">
                        <FileCode2 size={13} className="text-[#47d7b5]" />
                        <span className="font-medium">main.psm</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-500 pl-2">
                        <span>src/main.psm</span>
                    </div>
                </div>

                {/* Right Quick Controls */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Format Code */}
                    <button
                        type="button"
                        onClick={handleFormat}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
                        title="Format Code (Prismio Formatting Rules)"
                    >
                        <AlignLeft size={13} />
                        <span className="hidden md:inline">Format</span>
                    </button>

                    {/* Word Wrap Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowWordWrap(!showWordWrap)}
                        className={`cursor-pointer p-1 rounded transition-colors ${
                            showWordWrap
                                ? 'bg-white/[0.04] text-[#47d7b5]'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                        }`}
                        title="Toggle Word Wrap"
                    >
                        <WrapText size={13} />
                    </button>

                    {/* Minimap Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowMinimap(!showMinimap)}
                        className={`cursor-pointer p-1 rounded transition-colors ${
                            showMinimap
                                ? 'bg-white/[0.04] text-[#47d7b5]'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                        }`}
                        title="Toggle Minimap"
                    >
                        <Map size={13} />
                    </button>

                    {/* Copy Button */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors ml-1"
                        title="Copy Source Code"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            {/* Toast feedback */}
            {toastMessage && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-[#13141c] border border-[#47d7b5]/30 text-xs font-mono text-[#47d7b5] shadow-xl animate-fade-in flex items-center gap-1.5">
                    <Sparkles size={12} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Monaco Editor Container */}
            <div className="relative flex-1 h-full w-full overflow-hidden">
                <Editor
                    height="100%"
                    width="100%"
                    language={PRISMIO_LANGUAGE_ID}
                    theme={PRISMIO_THEME_DARK}
                    value={value}
                    onChange={(val) => onChange(val || '')}
                    onMount={handleEditorDidMount}
                    loading={
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 font-mono text-xs">
                            <div className="h-6 w-6 rounded-full border-2 border-[#47d7b5] border-t-transparent animate-spin" />
                            <span>Loading Monaco IDE Engine...</span>
                        </div>
                    }
                    options={{
                        fontFamily: 'var(--font-geist-mono), ui-monospace, Menlo, Monaco, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 22,
                        fontLigatures: true,
                        tabSize: 4,
                        insertSpaces: true,
                        minimap: { enabled: showMinimap },
                        wordWrap: showWordWrap ? 'on' : 'off',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        bracketPairColorization: { enabled: true },
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        renderWhitespace: 'selection',
                        padding: { top: 12, bottom: 12 },
                        suggest: {
                            showWords: true,
                            showSnippets: true,
                            preview: true,
                            insertMode: 'insert',
                        },
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: true,
                        },
                    }}
                />
            </div>

            {/* Bottom IDE Status Bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#090a0f] border-t border-white/10 text-[11px] font-mono text-zinc-500 select-none">
                <div className="flex items-center gap-3">
                    <span className="text-[#47d7b5]">Prismio IDE</span>
                    <span className="text-zinc-700">|</span>
                    <span>Spaces: 4</span>
                    <span className="text-zinc-700">|</span>
                    <span>UTF-8</span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline">
                        Press <kbd className="px-1 py-0.5 rounded-sm bg-white/[0.03] border border-white/5 text-[10px]">⌘⏎</kbd> to run
                    </span>
                    <span className="hidden sm:inline text-zinc-700">|</span>
                    <span className="text-zinc-400">
                        Ln {cursorPos.line}, Col {cursorPos.col}
                    </span>
                </div>
            </div>
        </div>
    );
}
