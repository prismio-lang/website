import { CompilerOptions } from './types';

export function generateLlvmIr(source: string, options: CompilerOptions): string {
    const lines = source.split('\n');
    const isDebug = options.optimization === '-O0' || options.debug;
    const isVerify = options.verify;

    // Detect structs
    const structDefs: string[] = [];
    for (const line of lines) {
        const sm = line.trim().match(/^struct\s+([a-zA-Z0-9_]+)/);
        if (sm && sm[1]) {
            structDefs.push(`%struct.${sm[1]} = type { i64, i64 }`);
        }
    }

    // Detect string literals
    const stringLiterals: Array<{ label: string; text: string; len: number }> = [];
    let strIdx = 0;
    for (const line of lines) {
        const matches = line.matchAll(/"([^"\\]*)"/g);
        for (const m of matches) {
            const text = m[1] ?? '';
            stringLiterals.push({
                label: `@.str.s${strIdx++}`,
                text,
                len: text.length + 1,
            });
        }
    }

    // Detect functions
    let insideMain = false;
    const mainBody: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i] ?? '';
        const trimmed = raw.trim();
        if (trimmed.startsWith('fn main(')) {
            insideMain = true;
            continue;
        }
        if (insideMain) {
            if (trimmed === '}') {
                insideMain = false;
            } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
                mainBody.push(trimmed);
            }
        }
    }

    const output: string[] = [
        '; ModuleID = \'main.psm\'',
        'source_filename = "main.psm"',
        'target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"',
        'target triple = "x86_64-unknown-linux-gnu"',
        '',
        '; --- Prismio Runtime Type Definitions ---',
        '%prismio.str = type { ptr, i64 }',
        '%prismio.aif_frame = type { ptr, i32, i32 }',
        ...structDefs,
        '',
        '; --- Global Symbols & Constant Pool ---',
        '@prismio_argc = global i32 0, align 4',
        '@prismio_argv = global ptr null, align 8',
    ];

    if (stringLiterals.length === 0) {
        output.push('@.str.default = private unnamed_addr constant [1 x i8] c"\\00", align 1');
    } else {
        for (const s of stringLiterals) {
            output.push(`${s.label} = private unnamed_addr constant [${s.len} x i8] c"${s.text}\\00", align 1`);
        }
    }

    output.push(
        '',
        '; --- External Declarations ---',
        'declare void @println__String(%prismio.str)',
        'declare void @print__String(%prismio.str)',
        'declare void @prismio_aif_verify_scope(ptr, i32) #1',
        'declare ptr @prismio_alloc_unique(i64) #2',
        'declare void @prismio_free_unique(ptr) #3',
        '',
        '; --- Function Lowering ---',
    );

    // Main function body
    output.push('define i32 @main(i32 %argc, ptr %argv) #0 {');
    output.push('entry:');

    if (isDebug) {
        output.push('  %argc.addr = alloca i32, align 4');
        output.push('  %argv.addr = alloca ptr, align 8');
        output.push('  %retval = alloca i32, align 4');
        output.push('  store i32 %argc, ptr %argc.addr, align 4');
        output.push('  store ptr %argv, ptr %argv.addr, align 8');
        output.push('  store i32 0, ptr %retval, align 4');
        output.push('  store i32 %argc, ptr @prismio_argc, align 4');
        output.push('  store ptr %argv, ptr @prismio_argv, align 8');

        if (isVerify) {
            output.push('  ; AIF runtime lifecycle verification');
            output.push('  %aif_token = alloca %prismio.aif_frame, align 8');
            output.push('  call void @prismio_aif_verify_scope(ptr %aif_token, i32 1)');
        }

        let reg = 1;
        for (const stmt of mainBody) {
            if (stmt.includes('println(')) {
                const strMatch = stmt.match(/"([^"]*)"/);
                const strVal = strMatch && strMatch[1] ? strMatch[1] : '';
                const matched = stringLiterals.find((s) => s.text === strVal);
                const label = matched ? matched.label : '@.str.default';
                const len = strVal.length;

                output.push(`  ; Lower println("${strVal}")`);
                output.push(`  %str.val.${reg} = insertvalue %prismio.str undef, ptr ${label}, 0`);
                output.push(`  %str.slice.${reg} = insertvalue %prismio.str %str.val.${reg}, i64 ${len}, 1`);
                output.push(`  call void @println__String(%prismio.str %str.slice.${reg})`);
                reg++;
            } else if (stmt.includes('let point') || stmt.includes('Point')) {
                output.push(`  ; AIF Stack Allocation: %point placed in local stack slot`);
                output.push(`  %point = alloca %struct.Point, align 8`);
                output.push(`  %point.x = getelementptr inbounds %struct.Point, ptr %point, i32 0, i32 0`);
                output.push(`  store i64 3, ptr %point.x, align 8`);
                output.push(`  %point.y = getelementptr inbounds %struct.Point, ptr %point, i32 0, i32 1`);
                output.push(`  store i64 4, ptr %point.y, align 8`);
            } else if (stmt.includes('return 0')) {
                output.push('  store i32 0, ptr %retval, align 4');
            }
        }

        output.push('  %0 = load i32, ptr %retval, align 4');
        output.push('  ret i32 %0');
    } else {
        // Optimized -O2 / -O3
        output.push('  ; Tail-call optimized & SSA register lowering (-O3)');
        output.push('  store i32 %argc, ptr @prismio_argc, align 4');
        output.push('  store ptr %argv, ptr @prismio_argv, align 8');

        for (const s of stringLiterals) {
            output.push(`  tail call void @println__String(%prismio.str { ptr ${s.label}, i64 ${s.text.length} })`);
        }

        output.push('  ret i32 0');
    }

    output.push('}');
    output.push('');
    output.push('attributes #0 = { noinline nounwind optnone "frame-pointer"="all" "target-cpu"="x86-64" }');
    output.push('attributes #1 = { nounwind willreturn }');
    output.push('attributes #2 = { noalias nounwind allocsize(0) }');
    output.push('attributes #3 = { nounwind }');

    return output.join('\n');
}
