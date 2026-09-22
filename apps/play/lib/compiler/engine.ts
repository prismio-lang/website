import { CompilerOptions, Diagnostic, ExecutionResult } from './types';
import { parsePrismioAst } from './astParser';
import { analyzeAif } from './aifAnalyzer';
import { generateLlvmIr } from './llvmGenerator';

export function runCompiler(code: string, options: CompilerOptions): ExecutionResult {
    const startTime = performance.now();
    const lines = code.split('\n');
    const diagnostics: Diagnostic[] = [];

    // Check for common error patterns (e.g. Type mismatch demo from docs)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const trimmed = line.trim();
        const lineNum = i + 1;

        // P4001: Expected Int, found String
        const typeMismatch = trimmed.match(/let\s+(?:mut\s+)?([a-zA-Z0-9_]+)\s*:\s*Int\s*=\s*"([^"]*)"/);
        if (typeMismatch && typeMismatch[1] && typeMismatch[2] !== undefined) {
            const varName = typeMismatch[1];
            const strVal = typeMismatch[2];
            const col = line.indexOf(`"${strVal}"`) + 1;
            diagnostics.push({
                code: 'P4001',
                level: 'error',
                message: `initializer for \`${varName}\`: expected Int, found String`,
                line: lineNum,
                col,
                length: strVal.length + 2,
                sourceLineContent: line,
                suggestion: `use an integer literal instead, e.g. \`let ${varName}: Int = 3\``,
                phase: 'type-checker',
            });
        }

        // P2002: Syntax error: unmatched parenthesis
        const openParen = (line.match(/\(/g) || []).length;
        const closeParen = (line.match(/\)/g) || []).length;
        if (openParen !== closeParen && !trimmed.startsWith('//')) {
            diagnostics.push({
                code: 'P2002',
                level: 'error',
                message: 'unmatched opening delimiter `(`',
                line: lineNum,
                col: line.indexOf('(') + 1,
                sourceLineContent: line,
                suggestion: 'add closing parenthesis `)`',
                phase: 'parser',
            });
        }

        // P1005: Unused mutable variable warning
        const splitWords = trimmed.split(' ');
        const thirdWord = splitWords[2];
        if (trimmed.startsWith('let mut ') && thirdWord && !code.includes(`${thirdWord} =`)) {
            const varName = thirdWord.replace(':', '');
            if (varName) {
                diagnostics.push({
                    code: 'W1005',
                    level: 'warning',
                    message: `variable \`${varName}\` does not need to be mutable`,
                    line: lineNum,
                    col: line.indexOf(varName) + 1,
                    sourceLineContent: line,
                    suggestion: `change to immutable \`let ${varName}\``,
                    phase: 'frontend',
                });
            }
        }
    }

    const hasErrors = diagnostics.some((d) => d.level === 'error');
    const ast = parsePrismioAst(code);
    const aif = analyzeAif(code);
    const llvmIr = generateLlvmIr(code, options);

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    if (hasErrors) {
        exitCode = 1;
        const errLines: string[] = [];
        for (const diag of diagnostics) {
            const caret = ' '.repeat(Math.max(0, diag.col - 1)) + '^'.repeat(diag.length || 1);
            errLines.push(
                `${diag.level}[${diag.code}]: ${diag.message}`,
                ` --> main.psm:${diag.line}:${diag.col}`,
                '  |',
                `${String(diag.line).padStart(2)} | ${diag.sourceLineContent || ''}`,
                `  | ${caret}`,
            );
            if (diag.suggestion) {
                errLines.push(`  = help: ${diag.suggestion}`);
            }
            errLines.push('');
        }
        errLines.push(`error: aborting due to ${diagnostics.filter((d) => d.level === 'error').length} previous error(s)`);
        stderr = errLines.join('\n');
    } else {
        // Successful simulation
        const stdoutLines: string[] = [];

        if (options.command === 'check') {
            stdoutLines.push('✓ Type checking passed. 0 errors, 0 warnings.');
            stdoutLines.push('AST and AIF storage models validated successfully.');
        } else if (options.command === 'aif') {
            stdoutLines.push(aif.manifestOutput);
        } else if (options.command === 'dump-ast') {
            stdoutLines.push(JSON.stringify(ast, null, 2));
        } else if (options.command === 'build') {
            stdoutLines.push('Built main (x86_64-unknown-linux-gnu)');
            stdoutLines.push(`LLVM IR backend optimization: ${options.optimization}`);
            if (options.verify) {
                stdoutLines.push('AIF lifecycle verification instrumentation enabled (--verify)');
            }
            stdoutLines.push('Wrote native executable: ./build/main');
        } else {
            // Command 'run'
            // Extract println / print calls
            for (const raw of lines) {
                const line = raw ?? '';
                const printMatch = line.trim().match(/println\s*\(\s*"([^"]*)"\s*\)/);
                if (printMatch && printMatch[1] !== undefined) {
                    stdoutLines.push(printMatch[1]);
                }
            }

            if (stdoutLines.length === 0) {
                stdoutLines.push('Program finished with exit code 0 (no output produced).');
            }
        }

        stdout = stdoutLines.join('\n');
    }

    const durationMs = Math.round((performance.now() - startTime + 12.4) * 10) / 10;

    return {
        success: !hasErrors,
        exitCode,
        stdout,
        stderr,
        durationMs,
        llvmIr,
        ast,
        aif,
        diagnostics,
        toolchainVersion: 'prismio 0.1.0 (self-hosted)',
        llvmVersion: 'LLVM 23.1.1',
    };
}
