export interface SyntaxToken {
    text: string;
    className: string;
}

export interface HighlightedLine {
    lineNumber: number;
    tokens: SyntaxToken[];
    raw: string;
}

const KEYWORDS_CONTROL = new Set([
    'if', 'else', 'when', 'match', 'for', 'in', 'loop', 'while', 'break', 'continue', 'return'
]);

const KEYWORDS_DECLARATION = new Set([
    'fn', 'let', 'mut', 'pub', 'extern', 'unsafe', 'struct', 'impl', 'enum',
    'module', 'import', 'as', 'type', 'trait', 'interface', 'abstract', 'override',
    'open', 'sealed', 'data', 'object', 'companion', 'by', 'delegate', 'inline',
    'infix', 'operator', 'suspend', 'async', 'await', 'defer'
]);

const KEYWORDS_OTHER = new Set([
    'self', 'super', 'where', 'dyn', 'static', 'const', 'use', 'mod'
]);

const BOOLEANS = new Set(['true', 'false', 'none', 'null']);

const BUILTIN_TYPES = new Set([
    'Int', 'Int8', 'Int16', 'Int32', 'Int64',
    'UInt', 'UInt8', 'UInt16', 'UInt32', 'UInt64',
    'Float', 'Float32', 'Float64',
    'Bool', 'Char', 'String', 'Unit', 'Never', 'Any', 'Nothing',
    'Option', 'Result', 'Ok', 'Err', 'Some', 'None',
    'List', 'Array', 'Map', 'Set', 'Vec', 'Box', 'Arc', 'Mutex', 'RwLock', 'Rc'
]);

export function highlightPrismioLine(line: string): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
        const ch = line[i] ?? '';
        const nextCh = line[i + 1] ?? '';

        // Line comment
        if (ch === '/' && nextCh === '/') {
            tokens.push({
                text: line.slice(i),
                className: 'text-zinc-500 italic',
            });
            break;
        }

        // Strings (double quote)
        if (ch === '"') {
            let j = i + 1;
            while (j < len && line[j] !== '"') {
                if (line[j] === '\\' && j + 1 < len) {
                    j += 2;
                } else {
                    j++;
                }
            }
            if (j < len) j++; // include closing quote
            tokens.push({
                text: line.slice(i, j),
                className: 'text-emerald-300',
            });
            i = j;
            continue;
        }

        // Single character quote
        if (ch === "'") {
            let j = i + 1;
            while (j < len && line[j] !== "'") {
                if (line[j] === '\\' && j + 1 < len) {
                    j += 2;
                } else {
                    j++;
                }
            }
            if (j < len) j++;
            tokens.push({
                text: line.slice(i, j),
                className: 'text-emerald-400',
            });
            i = j;
            continue;
        }

        // Whitespace
        if (/\s/.test(ch)) {
            let j = i;
            while (j < len && /\s/.test(line[j] ?? '')) j++;
            tokens.push({
                text: line.slice(i, j),
                className: '',
            });
            i = j;
            continue;
        }

        // Numbers (hex, float, int)
        if (/\d/.test(ch)) {
            let j = i;
            const chJ = line[j] ?? '';
            const chJ1 = line[j + 1] ?? '';

            if (chJ === '0' && (chJ1 === 'x' || chJ1 === 'X')) {
                j += 2;
                while (j < len && /[0-9a-fA-F_]/.test(line[j] ?? '')) j++;
            } else if (chJ === '0' && (chJ1 === 'b' || chJ1 === 'B')) {
                j += 2;
                while (j < len && /[01_]/.test(line[j] ?? '')) j++;
            } else {
                while (j < len && /[0-9_]/.test(line[j] ?? '')) j++;
                if (line[j] === '.' && /\d/.test(line[j + 1] ?? '')) {
                    j++;
                    while (j < len && /[0-9_]/.test(line[j] ?? '')) j++;
                }
            }
            tokens.push({
                text: line.slice(i, j),
                className: 'text-amber-300',
            });
            i = j;
            continue;
        }

        // Words / Identifiers
        if (/[a-zA-Z_]/.test(ch)) {
            let j = i;
            while (j < len && /[a-zA-Z0-9_]/.test(line[j] ?? '')) j++;
            const word = line.slice(i, j);

            // Check following characters for function call
            let k = j;
            while (k < len && /\s/.test(line[k] ?? '')) k++;
            const isCall = line[k] === '(';

            let className = 'text-zinc-200';

            if (KEYWORDS_CONTROL.has(word) || KEYWORDS_DECLARATION.has(word)) {
                className = 'text-indigo-400 font-medium';
            } else if (KEYWORDS_OTHER.has(word)) {
                className = 'text-indigo-300';
            } else if (BOOLEANS.has(word)) {
                className = 'text-amber-400 font-semibold';
            } else if (BUILTIN_TYPES.has(word) || /^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
                className = 'text-[#47d7b5] font-medium';
            } else if (isCall) {
                className = 'text-sky-300 font-medium';
            }

            tokens.push({ text: word, className });
            i = j;
            continue;
        }

        // Multi-char operators
        const twoChar = line.slice(i, i + 2);
        if (['->', '=>', '==', '!=', '<=', '>=', '&&', '||', '::', ':=', '..'].includes(twoChar)) {
            tokens.push({
                text: twoChar,
                className: 'text-indigo-300 font-medium',
            });
            i += 2;
            continue;
        }

        // Single punctuation & operators
        if (['{', '}', '(', ')', '[', ']', ';', ',', ':', '.'].includes(ch)) {
            tokens.push({
                text: ch,
                className: 'text-zinc-500',
            });
        } else if (['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~'].includes(ch)) {
            tokens.push({
                text: ch,
                className: 'text-indigo-300',
            });
        } else {
            tokens.push({
                text: ch,
                className: 'text-zinc-400',
            });
        }
        i++;
    }

    return tokens;
}

export function highlightPrismio(code: string): HighlightedLine[] {
    const lines = code.split('\n');
    return lines.map((line, idx) => ({
        lineNumber: idx + 1,
        tokens: highlightPrismioLine(line),
        raw: line,
    }));
}
