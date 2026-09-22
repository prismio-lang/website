import type { languages, editor, Position } from 'monaco-editor';

const KEYWORD_DOCS: Record<string, { title: string; desc: string }> = {
    'region': {
        title: 'region <arena> { ... }',
        desc: '**Adaptive Inference Framework (AIF)**: Declares an arena region. Values allocated within this block are stored in a fast thread-local contiguous scratch arena with zero GC overhead and instant bulk tear-down at region exit.',
    },
    'mut': {
        title: 'mut (Mutable binding)',
        desc: 'Marks a variable binding as mutable, permitting re-assignment. Unmutated bindings are flagged with warning `W1005` by the compiler frontend.',
    },
    'inout': {
        title: 'inout (Reference passing)',
        desc: 'Passes a parameter by mutable reference pointer. The caller retains ownership while the callee can mutate the value in place.',
    },
    'sink': {
        title: 'sink (Ownership transfer)',
        desc: 'Transfers exclusive ownership of an argument to the function. Lowers through AIF drop logic.',
    },
    'fn': {
        title: 'fn <name>(<args>) -> <Type>',
        desc: 'Defines a statically typed Prismio function. Functions compile directly to native machine code via the LLVM backend.',
    },
    'struct': {
        title: 'struct <Name> { <fields> }',
        desc: 'Defines a composite product type. AIF escape analysis decides whether instances are stored on the local stack frame or promoted to unique heap.',
    },
    'enum': {
        title: 'enum <Name> { <variants> }',
        desc: 'Defines an algebraic sum type with optional payload tags. Matches are exhaustively checked and lowered to LLVM switch tables.',
    },
    'impl': {
        title: 'impl <Trait> for <Type>',
        desc: 'Implements methods or trait contracts for a struct or enum type.',
    },
    'trait': {
        title: 'trait <Name> { ... }',
        desc: 'Defines an interface / behavioral contract for static or dynamic dispatch.',
    },
    'match': {
        title: 'match <expr> { <pattern> => ... }',
        desc: 'Pattern matching construct. Exhaustively verified by the compiler frontend.',
    },
    'import': {
        title: 'import <module>',
        desc: 'Imports symbols from the standard library (`std.io`, `std.string`, etc.) or project packages.',
    },
    'println': {
        title: 'fn println(value: String) -> Void',
        desc: 'Writes the given string value followed by a newline to standard output (`stdout`).',
    },
    'print': {
        title: 'fn print(value: String) -> Void',
        desc: 'Writes the given string value without a newline to standard output (`stdout`).',
    },
};

const TYPE_DOCS: Record<string, { title: string; desc: string }> = {
    'Int': {
        title: 'Int (64-bit signed integer)',
        desc: 'Default machine word signed integer type (`i64` in LLVM IR).',
    },
    'Float': {
        title: 'Float (64-bit IEEE-754 float)',
        desc: 'Double-precision floating-point number (`double` in LLVM IR).',
    },
    'Bool': {
        title: 'Bool (Boolean)',
        desc: 'Logical boolean value (`true` or `false`), lowered to `i1` in LLVM.',
    },
    'String': {
        title: 'String (UTF-8 Slice)',
        desc: 'UTF-8 string slice represented as a pair of pointer and 64-bit length `{ ptr, i64 }`.',
    },
    'Char': {
        title: 'Char (Unicode scalar)',
        desc: '32-bit Unicode scalar character (`i32`).',
    },
    'Void': {
        title: 'Void (Unit)',
        desc: 'Represents the absence of a meaningful return value.',
    },
    'List': {
        title: 'List<T>',
        desc: 'Standard library dynamically growable array buffer. Stored in unique or scoped heap based on AIF analysis.',
    },
    'Map': {
        title: 'Map<K, V>',
        desc: 'Standard library associative hash map collection.',
    },
    'Option': {
        title: 'Option<T>',
        desc: 'Sum type representing either a value (`Some(T)`) or nothing (`None`).',
    },
    'Result': {
        title: 'Result<T, E>',
        desc: 'Error-handling sum type representing success (`Ok(T)`) or failure (`Err(E)`).',
    },
    'Box': {
        title: 'Box<T>',
        desc: 'Explicit unique-heap allocated smart pointer with automatic drop lowering.',
    },
};

export function createPrismioHoverProvider(): languages.HoverProvider {
    return {
        provideHover(model: editor.ITextModel, position: Position): languages.ProviderResult<languages.Hover> {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const name = word.word;

            // Check keyword docs
            if (KEYWORD_DOCS[name]) {
                const doc = KEYWORD_DOCS[name];
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    },
                    contents: [
                        { value: `\`\`\`prismio\n${doc.title}\n\`\`\`` },
                        { value: doc.desc },
                    ],
                };
            }

            // Check type docs
            if (TYPE_DOCS[name]) {
                const doc = TYPE_DOCS[name];
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    },
                    contents: [
                        { value: `\`\`\`prismio\ntype ${doc.title}\n\`\`\`` },
                        { value: doc.desc },
                    ],
                };
            }

            // Check if user-defined struct in document
            const fullText = model.getValue();
            const structRegex = new RegExp(`struct\\s+${name}\\s*\\{([^}]*)\\}`, 'm');
            const structMatch = fullText.match(structRegex);
            if (structMatch) {
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    },
                    contents: [
                        { value: `\`\`\`prismio\nstruct ${name} {\n${structMatch[1]?.trim() ?? ''}\n}\n\`\`\`` },
                        { value: '**User-defined Struct**: Evaluated by the Adaptive Inference Framework for zero-cost stack placement.' },
                    ],
                };
            }

            // Check if user-defined function in document
            const fnRegex = new RegExp(`fn\\s+${name}\\s*\\(([^)]*)\\)(?:\\s*->\\s*([a-zA-Z0-9_<>]+))?`, 'm');
            const fnMatch = fullText.match(fnRegex);
            if (fnMatch) {
                const params = fnMatch[1] ?? '';
                const retType = fnMatch[2] ?? 'Unit';
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    },
                    contents: [
                        { value: `\`\`\`prismio\nfn ${name}(${params}) -> ${retType}\n\`\`\`` },
                        { value: '**User-defined Function**: Statically checked and compiled to native machine code.' },
                    ],
                };
            }

            return null;
        },
    };
}
