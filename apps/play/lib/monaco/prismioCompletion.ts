import type { languages, editor, Position } from 'monaco-editor';
import { PRISMIO_LANGUAGE_ID } from './prismioLanguage';

export function createPrismioCompletionProvider(
    monaco: typeof import('monaco-editor')
): languages.CompletionItemProvider {
    return {
        triggerCharacters: ['.', ':', '>', ' '],

        provideCompletionItems(
            model: editor.ITextModel,
            position: Position
        ): languages.ProviderResult<languages.CompletionList> {
            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);
            const word = model.getWordUntilPosition(position);

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions: languages.CompletionItem[] = [];

            // 1. Check if after 'import ' or 'import std.'
            if (/import\s+std\.\w*$/.test(textBefore)) {
                const stdModules = [
                    { name: 'io', desc: 'Standard I/O, file reading, and console formatting' },
                    { name: 'string', desc: 'UTF-8 string manipulation, parsing, and formatting' },
                    { name: 'list', desc: 'Growable dynamic array buffer' },
                    { name: 'map', desc: 'Hash map associative key-value collection' },
                    { name: 'option', desc: 'Optional value representations (Some, None)' },
                    { name: 'fs', desc: 'Filesystem path operations and file I/O' },
                    { name: 'process', desc: 'Process execution, environment variables, and exit codes' },
                    { name: 'display', desc: 'Display trait and formatting utilities' },
                    { name: 'eq', desc: 'Equality comparison trait' },
                    { name: 'ord', desc: 'Ordering and sorting traits' },
                    { name: 'iter', desc: 'Iterator abstractions and lazy adaptors' },
                ];

                for (const mod of stdModules) {
                    suggestions.push({
                        label: mod.name,
                        kind: monaco.languages.CompletionItemKind.Module,
                        documentation: mod.desc,
                        insertText: mod.name,
                        range,
                    });
                }
                return { suggestions };
            }

            if (/import\s+\w*$/.test(textBefore)) {
                suggestions.push({
                    label: 'std',
                    kind: monaco.languages.CompletionItemKind.Module,
                    documentation: 'Prismio standard library root',
                    insertText: 'std.',
                    range,
                });
                return { suggestions };
            }

            // 2. Check if in type context (after ':' or '->')
            const isTypeContext = /(?::|->)\s*\w*$/.test(textBefore);
            if (isTypeContext) {
                const builtinTypes = [
                    { name: 'Int', desc: '64-bit signed machine integer (default scalar)' },
                    { name: 'Float', desc: '64-bit IEEE-754 double precision float' },
                    { name: 'Bool', desc: 'Boolean scalar (true / false)' },
                    { name: 'Char', desc: 'Unicode 32-bit scalar value' },
                    { name: 'String', desc: 'UTF-8 string slice backed by pointer and length' },
                    { name: 'Void', desc: 'Unit return type representing no value' },
                    { name: 'I8', desc: '8-bit signed integer' },
                    { name: 'I16', desc: '16-bit signed integer' },
                    { name: 'I64', desc: '64-bit signed integer' },
                    { name: 'Isize', desc: 'Pointer-sized signed integer' },
                    { name: 'U8', desc: '8-bit unsigned byte' },
                    { name: 'U16', desc: '16-bit unsigned integer' },
                    { name: 'U32', desc: '32-bit unsigned integer' },
                    { name: 'U64', desc: '64-bit unsigned integer' },
                    { name: 'Usize', desc: 'Pointer-sized unsigned integer' },
                    { name: 'Ptr', desc: 'Raw untyped memory pointer' },
                ];

                for (const t of builtinTypes) {
                    suggestions.push({
                        label: t.name,
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        detail: 'built-in type',
                        documentation: t.desc,
                        insertText: t.name,
                        range,
                    });
                }

                const genericTypes = [
                    { name: 'List', snippet: 'List<${1:T}>', desc: 'Growable dynamic collection' },
                    { name: 'Map', snippet: 'Map<${1:Key}, ${2:Value}>', desc: 'Hash-based key-value map' },
                    { name: 'Option', snippet: 'Option<${1:T}>', desc: 'Optional value (Some(T) or None)' },
                    { name: 'Result', snippet: 'Result<${1:T}, ${2:E}>', desc: 'Error handling type (Ok(T) or Err(E))' },
                    { name: 'Box', snippet: 'Box<${1:T}>', desc: 'Unique heap-allocated pointer' },
                    { name: 'Task', snippet: 'Task<${1:T}>', desc: 'Asynchronous task handle' },
                ];

                for (const g of genericTypes) {
                    suggestions.push({
                        label: g.name,
                        kind: monaco.languages.CompletionItemKind.Class,
                        detail: 'std generic type',
                        documentation: g.desc,
                        insertText: g.snippet,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range,
                    });
                }

                // Add in-scope struct names as types
                const fullText = model.getValue();
                const structMatches = fullText.matchAll(/struct\s+([A-Z][a-zA-Z0-9_]*)/g);
                for (const sm of structMatches) {
                    if (sm[1]) {
                        suggestions.push({
                            label: sm[1],
                            kind: monaco.languages.CompletionItemKind.Struct,
                            detail: 'user-defined struct',
                            insertText: sm[1],
                            range,
                        });
                    }
                }

                return { suggestions };
            }

            // 3. Member access after '.'
            if (textBefore.endsWith('.')) {
                // Common std members and methods
                const members = [
                    { label: 'len', detail: '() -> Int', doc: 'Returns the length or number of elements' },
                    { label: 'is_empty', detail: '() -> Bool', doc: 'Returns true if collection is empty' },
                    { label: 'push', detail: '(item: T) -> Void', doc: 'Appends an element to the buffer' },
                    { label: 'pop', detail: '() -> Option<T>', doc: 'Removes and returns the last element' },
                    { label: 'clear', detail: '() -> Void', doc: 'Clears all elements' },
                    { label: 'x', detail: 'Int', doc: 'Coordinate / field' },
                    { label: 'y', detail: 'Int', doc: 'Coordinate / field' },
                ];

                for (const m of members) {
                    suggestions.push({
                        label: m.label,
                        kind: monaco.languages.CompletionItemKind.Field,
                        detail: m.detail,
                        documentation: m.doc,
                        insertText: m.label,
                        range,
                    });
                }
                return { suggestions };
            }

            // 4. Statements, Templates, Built-ins, and Keywords
            const templates: Array<{
                label: string;
                detail: string;
                documentation: string;
                insertText: string;
            }> = [
                {
                    label: 'main',
                    detail: 'fn main() -> Int { ... }',
                    documentation: 'Main entrypoint function for Prismio programs',
                    insertText: 'fn main() -> Int {\n    ${0:println("Hello Prismio!")}\n    return 0\n}',
                },
                {
                    label: 'fn',
                    detail: 'Function declaration',
                    documentation: 'Declares a new statically-typed function',
                    insertText: 'fn ${1:name}(${2:params}) -> ${3:Unit} {\n    ${0}\n}',
                },
                {
                    label: 'struct',
                    detail: 'Struct declaration',
                    documentation: 'Declares a composite data structure. AIF escape analysis decides stack vs heap placement.',
                    insertText: 'struct ${1:Name} {\n    ${2:field}: ${3:Int},\n}',
                },
                {
                    label: 'enum',
                    detail: 'Enum declaration',
                    documentation: 'Declares an algebraic sum type with optional payload',
                    insertText: 'enum ${1:Name} {\n    ${2:Variant},\n}',
                },
                {
                    label: 'match',
                    detail: 'Pattern match expression',
                    documentation: 'Exhaustive pattern matching with compiler lowering',
                    insertText: 'match ${1:target} {\n    ${2:Pattern} => {\n        ${0}\n    }\n}',
                },
                {
                    label: 'region',
                    detail: 'region arena { ... }',
                    documentation: 'Adaptive Inference Framework: thread-local scratch arena with zero-cost deallocation',
                    insertText: 'region ${1:arena} {\n    ${0}\n}',
                },
                {
                    label: 'for',
                    detail: 'for (item in collection) { ... }',
                    documentation: 'Iteration loop over collection or range',
                    insertText: 'for (${1:item} in ${2:collection}) {\n    ${0}\n}',
                },
                {
                    label: 'while',
                    detail: 'while (condition) { ... }',
                    documentation: 'Conditional loop',
                    insertText: 'while (${1:condition}) {\n    ${0}\n}',
                },
                {
                    label: 'if',
                    detail: 'if (condition) { ... }',
                    documentation: 'Conditional branch',
                    insertText: 'if (${1:condition}) {\n    ${0}\n}',
                },
                {
                    label: 'let',
                    detail: 'let variable = ...',
                    documentation: 'Declares an immutable variable binding',
                    insertText: 'let ${1:name}: ${2:Int} = ${3:value}',
                },
                {
                    label: 'let mut',
                    detail: 'let mut variable = ...',
                    documentation: 'Declares a mutable variable binding',
                    insertText: 'let mut ${1:name} = ${2:value}',
                },
                {
                    label: 'println',
                    detail: 'println(text)',
                    documentation: 'Prints text followed by newline to standard output',
                    insertText: 'println("${1:message}")',
                },
                {
                    label: 'print',
                    detail: 'print(text)',
                    documentation: 'Prints text to standard output without newline',
                    insertText: 'print("${1:message}")',
                },
            ];

            for (const t of templates) {
                suggestions.push({
                    label: t.label,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: t.detail,
                    documentation: t.documentation,
                    insertText: t.insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range,
                });
            }

            // In-scope function and variable scan
            const fullText = model.getValue();
            const fnMatches = fullText.matchAll(/fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g);
            for (const fm of fnMatches) {
                if (fm[1] && fm[1] !== 'main') {
                    suggestions.push({
                        label: fm[1],
                        kind: monaco.languages.CompletionItemKind.Function,
                        detail: `fn(${fm[2] ?? ''})`,
                        insertText: `${fm[1]}($0)`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range,
                    });
                }
            }

            const varMatches = fullText.matchAll(/let\s+(?:mut\s+)?([a-zA-Z0-9_]+)/g);
            const seenVars = new Set<string>();
            for (const vm of varMatches) {
                if (vm[1] && !seenVars.has(vm[1])) {
                    seenVars.add(vm[1]);
                    suggestions.push({
                        label: vm[1],
                        kind: monaco.languages.CompletionItemKind.Variable,
                        detail: 'local variable',
                        insertText: vm[1],
                        range,
                    });
                }
            }

            return { suggestions };
        },
    };
}
