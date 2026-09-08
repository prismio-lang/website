---
title: Lexer, parser, and AST
description: The Prismio frontend from UTF-8 scanning through parser recovery and the typed structures consumed by later stages.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [lexer, parser, ast]
related: [compiler/pipeline-and-driver, compiler/semantic-analysis-and-types, cookbook/add-a-language-feature]
---

The frontend is divided into tokenization, syntax construction, and later semantic interpretation.
Keeping those boundaries explicit prevents parser convenience from becoming an undocumented type rule.

## Lexing

`src/lexer/token.psm` defines the token vocabulary. `scanner.psm` advances through UTF-8
source, records source positions, recognizes comments and literals, and produces tokens for the
parser. A token can exist before a complete language feature does; reserved vocabulary is not proof
that a construct parses or type-checks.

## Parsing

`src/parse/decl.psm`, `stmt.psm`, and `expr.psm` divide the grammar by role.
`parser.psm` owns shared cursor and diagnostic behavior. Expression parsing uses precedence-aware
logic; declarations and statements select productions from their leading syntax.

Selected failures recover so one invocation can report independent errors. Recovery must always
make progress and must stop at boundaries that do not consume the start of the next declaration.
Every new recovery rule needs a multiple-error fixture.

## AST

`src/ast/nodes.psm` stores syntax structure and source locations. `types.psm` stores type
representations shared with semantic work. `dump.psm` emits the stable-enough serialized form
used by debugging and AIF differential tooling.

The AST is not a memory-aware middle IR. Semantic ownership and AIF results are attached or kept
in side tables; later lowering may need to query them again. That limitation is important when
designing transforms that cross control-flow or call boundaries.

## Lexer implementation

`createLexer` initializes the source text, byte/character position, line, column, and file ID.
`lexAllTokens` repeatedly calls `lexerNextToken` and links returned `Token` values until EOF.
`lexerSkipWhitespace` handles spaces, newlines, line comments, and delegates nested scanning to
`lexerSkipBlockComment`. `lexerDecodeEscapes` is shared by string and character literals so
escape diagnostics use the original source coordinates.

Token-producing functions are separated by grammar:

- `lexIdentifier` scans names, then `isKeyword` and `isBoolean` classify reserved words and
  boolean literals;
- `lexNumber` handles the currently supported integer and floating spellings;
- `lexString` and `lexChar` enforce closing delimiters and decoded-width rules;
- `lexOperator` uses `isTwoCharOperator`, `twoCharOperatorType`, and
  `oneCharOperatorType`; and
- `lexRange` distinguishes range punctuation from ordinary dot/separator tokens.

`lexerToken` records token type, value, file, start/end line and column, and source offsets.
`lexerFatal` emits a location-aware diagnostic and terminates the frontend path. A new token is
not implemented until `TokenType`, `typeToString`, keyword/operator recognition, parser use,
highlighting grammar, and negative tests agree.

## Parser implementation

`parserCreate` wraps the token chain and tracks the current token plus recovery state.
`parseDeclaration` dispatches top-level imports, variables, external functions, functions,
structs, enums, traits, implementations, associated items, and workloads.

Expression parsing is precedence climbing. `parseExpression(p, precedence)` parses a unary or
primary expression and repeatedly consumes binary operators whose
`getOperatorPrecedence` is high enough. `parsePostfix` and `parseSuffixes` then attach calls,
indexing, member access, generic arguments, casts, option handling, and slices to the base node.
`foldNegativeLiteral` keeps the most-negative signed literal representable instead of requiring
an out-of-range positive intermediate.

`parseBlock` repeatedly calls `parseStatement`. Dedicated functions own `if`, `while`,
`loop`, `for`, `region`, `match`, `return`, and compound assignment. Parsing a construct
into a generic expression statement and repairing it later loses recovery boundaries and usually
produces worse diagnostics.

## AST data model

`NodeKind` identifies the node variant. `ASTNode` is a compact general node carrying three
child pointers, a sibling `next` pointer, string/integer slots, file/span information, and a
semantic type pointer. `createNode` initializes every field; `nodeSpanFrom` copies the complete
source range. `NodeList` and `nodeListPush` build ordered child chains without teaching every
parser production its own list storage.

`TypeInfo` is separate from syntax. `nodeSetType` attaches a copied resolved type after semantic
analysis, and `nodeGetType` is the later contract. `dumpAstJson` walks the actual linked
structure, includes the file table, and escapes JSON through `jsonString`; it is the quickest way
to verify parser shape before debugging sema or LLVM.

For a frontend change, test successful shape with `dump-ast`, the nearest missing delimiter,
an unexpected token inside the construct, recovery into a later declaration, accurate Unicode
line/column spans, and semantic rejection of a syntactically valid but invalid form.
