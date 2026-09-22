import { AstNode } from './types';

export function parsePrismioAst(source: string): AstNode {
    const lines = source.split('\n');
    const rootChildren: AstNode[] = [];

    let currentFunction: AstNode | null = null;
    let currentStruct: AstNode | null = null;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const rawLine = lines[lineIdx] ?? '';
        const trimmed = rawLine.trim();
        const lineNum = lineIdx + 1;

        if (!trimmed || trimmed.startsWith('//')) {
            continue;
        }

        // Import statement
        const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_.]+)/);
        if (importMatch && importMatch[1]) {
            rootChildren.push({
                type: 'ImportDeclaration',
                name: importMatch[1],
                line: lineNum,
                attributes: { path: importMatch[1] },
            });
            continue;
        }

        // Struct declaration
        const structMatch = trimmed.match(/^struct\s+([a-zA-Z0-9_]+)\s*\{?/);
        if (structMatch && structMatch[1]) {
            const structNode: AstNode = {
                type: 'StructDeclaration',
                name: structMatch[1],
                line: lineNum,
                children: [],
            };
            rootChildren.push(structNode);
            currentStruct = structNode;
            if (trimmed.includes('}') && trimmed.includes('{')) {
                currentStruct = null;
            }
            continue;
        }

        // Inside struct fields
        if (currentStruct && !trimmed.startsWith('}')) {
            const fieldMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)/);
            if (fieldMatch && fieldMatch[1] && fieldMatch[2]) {
                currentStruct.children?.push({
                    type: 'FieldDeclaration',
                    name: fieldMatch[1],
                    returnType: fieldMatch[2],
                    line: lineNum,
                });
            }
            continue;
        }

        if (currentStruct && trimmed.startsWith('}')) {
            currentStruct = null;
            continue;
        }

        // Enum declaration
        const enumMatch = trimmed.match(/^enum\s+([a-zA-Z0-9_]+)(?:<[^>]+>)?\s*\{?/);
        if (enumMatch && enumMatch[1]) {
            rootChildren.push({
                type: 'EnumDeclaration',
                name: enumMatch[1],
                line: lineNum,
                children: [],
            });
            continue;
        }

        // Function declaration
        const fnMatch = trimmed.match(/^fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([a-zA-Z0-9_<>]+))?/);
        if (fnMatch && fnMatch[1]) {
            const fnName = fnMatch[1];
            const rawParams = (fnMatch[2] ?? '').trim();
            const returnType = fnMatch[3] || 'Unit';

            const params: Array<{ name: string; type: string }> = [];
            if (rawParams.length > 0) {
                const paramParts = rawParams.split(',');
                for (const part of paramParts) {
                    const [pName, pType] = part.split(':').map((s) => s.trim());
                    if (pName && pType) {
                        params.push({ name: pName, type: pType });
                    }
                }
            }

            const fnNode: AstNode = {
                type: 'FunctionDeclaration',
                name: fnName,
                returnType,
                params,
                line: lineNum,
                children: [],
                attributes: {
                    exported: trimmed.startsWith('pub '),
                    isEntrypoint: fnName === 'main',
                },
            };

            rootChildren.push(fnNode);
            currentFunction = fnNode;
            continue;
        }

        // End of function block
        if (currentFunction && trimmed === '}') {
            currentFunction = null;
            continue;
        }

        // Statements inside function
        if (currentFunction) {
            // Let statement
            const letMatch = trimmed.match(/^(?:let\s+(?:mut\s+)?)([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_<>]+))?\s*=\s*(.+)/);
            if (letMatch && letMatch[1] && letMatch[3]) {
                const varName = letMatch[1];
                const explicitType = letMatch[2];
                const initExpr = letMatch[3];

                currentFunction.children?.push({
                    type: 'LetStatement',
                    name: varName,
                    returnType: explicitType || 'Inferred',
                    value: initExpr,
                    line: lineNum,
                    attributes: {
                        mutable: trimmed.startsWith('let mut'),
                        isInitialized: true,
                    },
                });
                continue;
            }

            // Return statement
            const retMatch = trimmed.match(/^return\s*(.*)/);
            if (retMatch && retMatch[1] !== undefined) {
                currentFunction.children?.push({
                    type: 'ReturnStatement',
                    value: retMatch[1].trim() || 'Unit',
                    line: lineNum,
                });
                continue;
            }

            // Function Call (e.g. println)
            const callMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*\((.*)\)/);
            if (callMatch && callMatch[1]) {
                currentFunction.children?.push({
                    type: 'CallExpression',
                    name: callMatch[1],
                    value: callMatch[2] ?? '',
                    line: lineNum,
                });
                continue;
            }

            // Control flow statements
            if (trimmed.startsWith('if ') || trimmed.startsWith('while ') || trimmed.startsWith('match ')) {
                const keyword = trimmed.split(' ')[0] ?? 'Block';
                currentFunction.children?.push({
                    type: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}Statement`,
                    value: trimmed.slice(keyword.length).trim(),
                    line: lineNum,
                });
                continue;
            }
        }
    }

    return {
        type: 'Program',
        name: 'main.psm',
        children: rootChildren,
        attributes: {
            language: 'Prismio',
            totalLines: lines.length,
            targetTriple: 'x86_64-unknown-linux-gnu',
        },
    };
}
