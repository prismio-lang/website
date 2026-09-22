import type { languages, editor } from 'monaco-editor';

export function formatPrismioCode(source: string): string {
    const rawLines = source.split('\n');
    let indentLevel = 0;
    const formattedLines: string[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        let line = (rawLines[i] ?? '').trim();

        // Empty line
        if (!line) {
            formattedLines.push('');
            continue;
        }

        // Handle line comments
        if (line.startsWith('//')) {
            formattedLines.push('    '.repeat(indentLevel) + line);
            continue;
        }

        // Adjust indent for closing brace at start of line
        if (line.startsWith('}') || line.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Rule 1: Tight around dot (.)
        line = line.replace(/\s*\.\s*/g, '.');

        // Rule 2: Tight around range (..)
        line = line.replace(/\s*\.\.\s*/g, '..');

        // Rule 3: Colons (: Type) - no space before, 1 space after (except :: which is tight)
        line = line.replace(/(?<!:)\s*:\s*(?!:)/g, ': ');

        // Rule 4: Commas (,) - no space before, 1 space after
        line = line.replace(/\s*,\s*/g, ', ');

        // Rule 5: Around arrows (-> and =>) - 1 space around
        line = line.replace(/\s*->\s*/g, ' -> ');
        line = line.replace(/\s*=>\s*/g, ' => ');

        // Rule 6: Logical operators as words ('and', 'or') - air around
        line = line.replace(/\s+and\s+/g, ' and ');
        line = line.replace(/\s+or\s+/g, ' or ');

        // Rule 7: Assignment and relational operators
        line = line.replace(/\s*([=><!]=|[=><])\s*/g, ' $1 ');
        // Fix back arrow if altered
        line = line.replace(/-\s*>/g, '->');
        line = line.replace(/=\s*>/g, '=>');
        line = line.replace(/:\s*=\s*/g, ' := ');

        // Rule 8: Opening brace ({) has 1 space before
        line = line.replace(/\s*\{$/g, ' {');

        // Indent the line
        const indented = '    '.repeat(indentLevel) + line;
        formattedLines.push(indented);

        // Adjust indent if line ends with opening brace or bracket
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;

        const netBraces = openBraces - closeBraces;
        const netBrackets = openBrackets - closeBrackets;

        // If not already adjusted at line start
        if (!line.startsWith('}') && !line.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel + netBraces + netBrackets);
        } else {
            // Already subtracted 1 at start
            indentLevel = Math.max(0, indentLevel + (netBraces + 1) + netBrackets);
        }
    }

    return formattedLines.join('\n');
}

export function createPrismioFormattingProvider(): languages.DocumentFormattingEditProvider {
    return {
        provideDocumentFormattingEdits(
            model: editor.ITextModel
        ): languages.ProviderResult<languages.TextEdit[]> {
            const formatted = formatPrismioCode(model.getValue());
            return [
                {
                    range: model.getFullModelRange(),
                    text: formatted,
                },
            ];
        },
    };
}
