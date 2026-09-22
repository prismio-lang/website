export type CompilerCommand = 'run' | 'check' | 'aif' | 'build' | 'dump-ast';

export type OptimizationLevel = '-O0' | '-O1' | '-O2' | '-O3';

export interface CompilerOptions {
    command: CompilerCommand;
    optimization: OptimizationLevel;
    verify: boolean;
    debug: boolean;
    overflowChecks: boolean;
}

export type StorageTier =
    | 'Stack'
    | 'Arena'
    | 'Unique Heap'
    | 'Scoped Heap'
    | 'Shared Heap'
    | 'Cycle-Managed Heap'
    | 'Cross-Thread Heap';

export interface AifAllocation {
    id: number;
    symbol: string;
    line: number;
    col: number;
    type: string;
    storage: StorageTier;
    reason: string;
    sizeBytes?: number;
    escapes: boolean;
}

export interface AifReport {
    storagePlan: Record<StorageTier, number>;
    allocations: AifAllocation[];
    manifestOutput: string;
    heapBytes: number;
    stackBytes: number;
}

export type DiagnosticLevel = 'error' | 'warning' | 'info' | 'note';

export interface Diagnostic {
    code: string;
    level: DiagnosticLevel;
    message: string;
    line: number;
    col: number;
    length?: number;
    sourceLineContent?: string;
    suggestion?: string;
    phase: 'frontend' | 'parser' | 'type-checker' | 'aif-oracle' | 'llvm-codegen';
}

export interface AstNode {
    type: string;
    name?: string;
    value?: unknown;
    returnType?: string;
    params?: Array<{ name: string; type: string }>;
    children?: AstNode[];
    line?: number;
    col?: number;
    attributes?: Record<string, unknown>;
}

export interface ExecutionResult {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
    llvmIr: string;
    ast: AstNode;
    aif: AifReport;
    diagnostics: Diagnostic[];
    toolchainVersion: string;
    llvmVersion: string;
}

export interface Preset {
    id: string;
    title: string;
    category: 'Getting Started' | 'Memory & AIF' | 'Language Features' | 'Diagnostics & Verification';
    description: string;
    code: string;
    recommendedCommand?: CompilerCommand;
}
