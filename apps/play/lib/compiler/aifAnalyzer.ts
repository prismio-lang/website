import { AifAllocation, AifReport, StorageTier } from './types';

export function analyzeAif(source: string): AifReport {
    const lines = source.split('\n');
    const allocations: AifAllocation[] = [];
    let nextId = 1;

    // Check which variables are returned or escape
    const returnedVars = new Set<string>();
    for (const line of lines) {
        const retMatch = line.trim().match(/^return\s+([a-zA-Z0-9_]+)(?:\s*;|\s*$)/);
        if (retMatch && retMatch[1]) {
            returnedVars.add(retMatch[1]);
        }
    }

    let insideFn = false;
    let fnName = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const trimmed = line.trim();
        const lineNum = i + 1;

        if (trimmed.startsWith('fn ')) {
            insideFn = true;
            const m = trimmed.match(/^fn\s+([a-zA-Z0-9_]+)/);
            fnName = m && m[1] ? m[1] : '';
        } else if (trimmed === '}') {
            insideFn = false;
        }

        if (!insideFn) continue;

        // Match let statements
        // e.g. let point = Point { x: 3, y: 4 }
        // e.g. let count: Int = 10
        // e.g. let buffer = Vec::with_capacity(128)
        const letMatch = trimmed.match(/^let\s+(?:mut\s+)?([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_<>]+))?\s*=\s*(.+)/);
        if (letMatch && letMatch[1] && letMatch[3]) {
            const varName = letMatch[1];
            const explicitType = letMatch[2];
            const expr = letMatch[3].trim();
            const col = line.indexOf(varName) + 1;

            let inferredType = explicitType || 'Int';
            let storage: StorageTier = 'Stack';
            let reason = 'small value does not escape activation record';
            let escapes = returnedVars.has(varName);

            // Infer type and storage placement
            if (/Point|Rect|Coord|Vector2|Vec2/.test(expr) || /Point|Rect|Coord/.test(inferredType)) {
                inferredType = inferredType === 'Int' ? 'Point' : inferredType;
                if (escapes) {
                    storage = 'Unique Heap';
                    reason = 'struct escapes local function scope via return value';
                } else {
                    storage = 'Stack';
                    reason = 'small composite value does not escape current stack frame';
                }
            } else if (/Vec|Array|List|Buffer|HashMap|Map/.test(expr) || /Vec|List|Map/.test(inferredType)) {
                inferredType = explicitType || 'Vec<Int>';
                if (expr.includes('arena') || expr.includes('temp')) {
                    storage = 'Arena';
                    reason = 'temporary buffer bound to thread-local scratch arena';
                } else if (escapes) {
                    storage = 'Unique Heap';
                    reason = 'dynamically-sized collection transferred to caller';
                } else {
                    storage = 'Scoped Heap';
                    reason = 'dynamically resized buffer allocated in local scope region';
                }
            } else if (/Arc|Mutex|spawn|thread/.test(expr)) {
                inferredType = explicitType || 'Arc<SharedState>';
                storage = 'Cross-Thread Heap';
                reason = 'shared across thread boundary with atomic reference count';
                escapes = true;
            } else if (/Rc|Shared/.test(expr)) {
                inferredType = explicitType || 'Rc<Data>';
                storage = 'Shared Heap';
                reason = 'multiple shared owners within single thread';
            } else if (/Node|Graph|Tree/.test(expr) && expr.includes('cycle')) {
                inferredType = explicitType || 'Node';
                storage = 'Cycle-Managed Heap';
                reason = 'potential cyclic reference managed by AIF backup collector';
                escapes = true;
            } else if (expr.startsWith('"')) {
                inferredType = 'String';
                if (escapes) {
                    storage = 'Unique Heap';
                    reason = 'string value escapes function boundary';
                } else {
                    storage = 'Stack';
                    reason = 'string view / small string optimization fits within stack';
                }
            } else if (/\d+\.\d+/.test(expr)) {
                inferredType = 'Float';
                storage = 'Stack';
                reason = 'primitive float fits in SIMD/FPU register or stack slot';
            } else if (/true|false/.test(expr)) {
                inferredType = 'Bool';
                storage = 'Stack';
                reason = 'boolean scalar resides in CPU register';
            } else {
                inferredType = explicitType || 'Int';
                storage = 'Stack';
                reason = 'primitive scalar fits within standard machine word';
            }

            allocations.push({
                id: nextId++,
                symbol: `${fnName}::${varName}`,
                line: lineNum,
                col,
                type: inferredType,
                storage,
                reason,
                escapes,
                sizeBytes: storage === 'Stack' ? 8 : storage === 'Unique Heap' ? 32 : 16,
            });
        }
    }

    // If no allocations detected, provide a default demonstration allocation if main exists
    if (allocations.length === 0) {
        allocations.push({
            id: 1,
            symbol: 'main::return_code',
            line: 2,
            col: 5,
            type: 'Int',
            storage: 'Stack',
            reason: 'exit code scalar stored in register/stack',
            escapes: false,
            sizeBytes: 4,
        });
    }

    const storagePlan: Record<StorageTier, number> = {
        'Stack': 0,
        'Arena': 0,
        'Unique Heap': 0,
        'Scoped Heap': 0,
        'Shared Heap': 0,
        'Cycle-Managed Heap': 0,
        'Cross-Thread Heap': 0,
    };

    let stackBytes = 0;
    let heapBytes = 0;

    for (const alloc of allocations) {
        storagePlan[alloc.storage]++;
        if (alloc.storage === 'Stack') {
            stackBytes += alloc.sizeBytes || 8;
        } else {
            heapBytes += alloc.sizeBytes || 24;
        }
    }

    // Generate manifest output matching `prismio aif --manifest`
    const manifestLines = [
        '# Prismio AIF (Adaptive Inference Framework) Storage Manifest v0.1.0',
        `# Generated for compilation target: x86_64-unknown-linux-gnu`,
        `# Total Allocations: ${allocations.length} | Stack: ${storagePlan['Stack']} | Heap: ${heapBytes > 0 ? Object.values(storagePlan).reduce((a, b) => a + b, 0) - storagePlan['Stack'] : 0}`,
        '',
        'ID | Symbol                 | Location     | Type      | Tier         | Reason',
        '---+------------------------+--------------+-----------+--------------+-----------------------------------------',
        ...allocations.map((a) => {
            const idStr = String(a.id).padEnd(2);
            const symStr = a.symbol.padEnd(22).slice(0, 22);
            const locStr = `main.psm:${a.line}:${a.col}`.padEnd(12);
            const typeStr = a.type.padEnd(9).slice(0, 9);
            const tierStr = a.storage.padEnd(12);
            return `${idStr} | ${symStr} | ${locStr} | ${typeStr} | ${tierStr} | ${a.reason}`;
        }),
    ];

    return {
        storagePlan,
        allocations,
        manifestOutput: manifestLines.join('\n'),
        heapBytes,
        stackBytes,
    };
}
