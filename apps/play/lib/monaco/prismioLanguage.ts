import type { languages } from 'monaco-editor';

export const PRISMIO_LANGUAGE_ID = 'prismio';

export const prismioLanguageDef: languages.IMonarchLanguage = {
    defaultToken: 'invalid',
    tokenPostfix: '.psm',

    keywords: [
        'import', 'match', 'if', 'else', 'and', 'or',
        'true', 'false', 'break', 'continue', 'return', 'throw',
        'while', 'loop', 'for', 'in',
        'let', 'struct', 'impl', 'enum', 'trait', 'where', 'fn', 'extern',
        'mut', 'as', 'inout', 'sink', 'region', 'none'
    ],

    contextualKeywords: [
        'public', 'private', 'internal',
        'dyn', 'Self', 'type', 'spawn',
        'pin', 'unique', 'produce', 'borrow', 'alias', 'free'
    ],

    builtinTypes: [
        'Int', 'Float', 'Bool', 'Char', 'String', 'Ptr', 'Void',
        'I8', 'I16', 'I64', 'Isize',
        'U8', 'U16', 'U32', 'U64', 'Usize'
    ],

    stdlibTypes: [
        'List', 'Map', 'Option', 'Result', 'Box', 'Task', 'Slice', 'DataView', 'Chan'
    ],

    stdModules: [
        'io', 'string', 'list', 'map', 'option', 'fs', 'process',
        'display', 'eq', 'ord', 'key', 'copy', 'iter'
    ],

    operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '->', '=>', '..', '::', ':='
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
        root: [
            // Identifiers and keywords
            [/[a-zA-Z_]\w*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@contextualKeywords': 'keyword.contextual',
                    '@builtinTypes': 'type.builtin',
                    '@stdlibTypes': 'type.stdlib',
                    '@stdModules': 'module.std',
                    '@default': 'identifier'
                }
            }],

            // Whitespace
            { include: '@whitespace' },

            // Delimiters and operators
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@symbols/, {
                cases: {
                    '@operators': 'operator',
                    '@default': ''
                }
            }],

            // Numbers
            [/\b0[xX][0-9a-fA-F_]+\b/, 'number.hex'],
            [/\b0[bB][01_]+\b/, 'number.binary'],
            [/\b0[oO][0-7_]+\b/, 'number.octal'],
            [/\b\d[0-9_]*\.[0-9_]+([eE][\-+]?\d+)?\b/, 'number.float'],
            [/\b\d[0-9_]*\b/, 'number'],

            // Delimiter: after number because of .\d floats
            [/[;,.]/, 'delimiter'],

            // Strings
            [/"""/, { token: 'string.quote', bracket: '@open', next: '@stringMulti' }],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

            // Characters
            [/'[^\\']'/, 'string.char'],
            [/(')(@escapes)(')/, ['string.char', 'string.escape', 'string.char']],
            [/'/, 'string.invalid']
        ],

        whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
        ],

        comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            ['\\*/', 'comment', '@pop'],
            [/[\/*]/, 'comment']
        ],

        string: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],

        stringMulti: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"""/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
            [/./, 'string']
        ],
    },
};

export const prismioLanguageConfig: languages.LanguageConfiguration = {
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
    ],
    folding: {
        markers: {
            start: new RegExp('^\\s*//\\s*#?region\\b'),
            end: new RegExp('^\\s*//\\s*#?endregion\\b'),
        },
    },
    indentationRules: {
        increaseIndentPattern: /^.*\{[^}"']*$/,
        decreaseIndentPattern: /^(\s*\}|\s*\)).*$/,
    },
};
