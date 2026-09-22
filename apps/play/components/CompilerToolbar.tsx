'use client';

import React, { useState } from 'react';
import {
    Play,
    Share2,
    RotateCcw,
    Check,
    SlidersHorizontal,
    Sparkles,
    Terminal,
    Layers,
    Cpu,
    ShieldCheck,
    AlignLeft
} from 'lucide-react';
import { CompilerCommand, CompilerOptions, OptimizationLevel, Preset } from '../lib/compiler/types';
import { PLAYGROUND_PRESETS } from '../lib/compiler/presets';

interface CompilerToolbarProps {
    options: CompilerOptions;
    onOptionsChange: (options: CompilerOptions) => void;
    currentPresetId: string;
    onSelectPreset: (preset: Preset) => void;
    onRun: () => void;
    onReset: () => void;
    onFormat: () => void;
    isRunning: boolean;
}

export default function CompilerToolbar({
    options,
    onOptionsChange,
    currentPresetId,
    onSelectPreset,
    onRun,
    onReset,
    onFormat,
    isRunning,
}: CompilerToolbarProps) {
    const [copiedShare, setCopiedShare] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2000);
        } catch {
            // fallback
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#090a0f] border-b border-white/10 text-xs">
            {/* Left group: Run, Presets, Command */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Primary Run Button */}
                <button
                    type="button"
                    onClick={onRun}
                    disabled={isRunning}
                    className="relative group cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#47d7b5] text-zinc-950 font-medium hover:bg-[#3ec4a4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                    {isRunning ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                    ) : (
                        <Play size={13} className="fill-zinc-950" />
                    )}
                    <span>Run</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-950/20 text-[10px] font-mono opacity-80">
                        ⌘⏎
                    </kbd>
                </button>

                {/* Preset Selector */}
                <div className="flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded px-2.5 py-1 text-zinc-300 transition-colors">
                    <Sparkles size={13} className="text-[#47d7b5]" />
                    <span className="text-[11px] text-zinc-500 font-medium hidden md:inline">Example:</span>
                    <select
                        value={currentPresetId}
                        onChange={(e) => {
                            const found = PLAYGROUND_PRESETS.find((p) => p.id === e.target.value);
                            if (found) onSelectPreset(found);
                        }}
                        className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1 font-medium"
                    >
                        {PLAYGROUND_PRESETS.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#12131a] text-zinc-200">
                                {p.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Compiler Command Selector */}
                <div className="flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded px-2.5 py-1 text-zinc-300 transition-colors">
                    <Terminal size={13} className="text-zinc-400" />
                    <span className="text-[11px] text-zinc-500 font-medium hidden md:inline">Command:</span>
                    <select
                        value={options.command}
                        onChange={(e) =>
                            onOptionsChange({
                                ...options,
                                command: e.target.value as CompilerCommand,
                            })
                        }
                        className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer font-mono"
                    >
                        <option value="run" className="bg-[#12131a]">prismio run</option>
                        <option value="check" className="bg-[#12131a]">prismio check</option>
                        <option value="aif" className="bg-[#12131a]">prismio aif</option>
                        <option value="build" className="bg-[#12131a]">prismio build</option>
                        <option value="dump-ast" className="bg-[#12131a]">prismio dump-ast</option>
                    </select>
                </div>
            </div>

            {/* Right group: Optimization, Verify, Format, Share, Reset */}
            <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
                {/* Optimization Level */}
                <div className="hidden lg:flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded px-2.5 py-1 transition-colors">
                    <Cpu size={13} className="text-zinc-500" />
                    <select
                        value={options.optimization}
                        onChange={(e) =>
                            onOptionsChange({
                                ...options,
                                optimization: e.target.value as OptimizationLevel,
                            })
                        }
                        className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer font-mono"
                    >
                        <option value="-O0" className="bg-[#12131a]">-O0 (Debug)</option>
                        <option value="-O1" className="bg-[#12131a]">-O1</option>
                        <option value="-O2" className="bg-[#12131a]">-O2 (Speed)</option>
                        <option value="-O3" className="bg-[#12131a]">-O3 (Max)</option>
                    </select>
                </div>

                {/* AIF Verify Toggle */}
                <button
                    type="button"
                    onClick={() =>
                        onOptionsChange({
                            ...options,
                            verify: !options.verify,
                        })
                    }
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors ${
                        options.verify
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                            : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Instrument and verify AIF allocation lifecycle (--verify)"
                >
                    <ShieldCheck size={13} className={options.verify ? 'text-indigo-400' : 'text-zinc-500'} />
                    <span className="hidden sm:inline">--verify</span>
                </button>

                {/* Format code */}
                <button
                    type="button"
                    onClick={onFormat}
                    className="cursor-pointer p-1.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-zinc-400 hover:text-white transition-colors"
                    title="Format source code"
                >
                    <AlignLeft size={14} />
                </button>

                {/* Reset snippet */}
                <button
                    type="button"
                    onClick={onReset}
                    className="cursor-pointer p-1.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-zinc-400 hover:text-white transition-colors"
                    title="Reset to original snippet"
                >
                    <RotateCcw size={14} />
                </button>

                {/* Share Link */}
                <button
                    type="button"
                    onClick={handleShare}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-zinc-300 hover:text-white transition-colors"
                >
                    {copiedShare ? (
                        <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied</span>
                        </>
                    ) : (
                        <>
                            <Share2 size={13} className="text-zinc-400" />
                            <span className="hidden sm:inline">Share</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
