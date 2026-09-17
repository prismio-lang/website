---
title: Lexer, parser, and AST
description: The Prismio frontend from UTF-8 scanning through parser recovery and the typed structures consumed by later stages.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [lexer, parser, ast]
related: [compiler/pipeline-and-driver, compiler/semantic-analysis-and-types, compiler/diagnostics, cookbook/add-a-language-feature]
---

Before the compiler can ask whether a program means anything, it has to answer a
narrower question: is this well-formed text at all? That question belongs to the
**frontend** — tokenizing, parsing, and building the **AST** (abstract syntax
tree) — and keeping it strictly separate from semantic meaning is what lets a
parser fail on one broken declaration while still reporting every other mistake
in the file, and what stops "the parser accepted it" from quietly becoming a
type rule.

## See it work

`prismio dump-ast` prints the checked, flattened AST as JSON — useful for
seeing the frontend's actual output before debugging semantic analysis or LLVM
generation:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("hello from prismio")
    return 0
}
```

```bash
prismio dump-ast hello.psm
```

The file table names every source that contributed a declaration, and a plain
`std.io` import already pulls in a second one — because, per [import
resolution](/compiler/overview#what-each-stage-decides), a `std.*` import
resolves to a precompiled `.plib`, not to source:

```text
{"format":"aif-ast","version":1,"source":"hello.psm","compiler":"0.1.0","files":[{"id":0,"path":"hello.psm"},{"id":1,"path":"~/prismio/.prismio/build/stdlib/io.plib"}],"decls":[ ... 72 declarations ... ]}
```

`dump-ast` prints one JSON line; re-indented and with repeated boilerplate keys
cut, the `main` function's node is (`ln`/`co`/`le` are line, column, and
length):

```text
{
  "k": "FUNCTION",
  "s1": "main",
  ...
  "c2": [
    {
      "k": "BLOCK",
      ...
      "c1": [
        {
          "k": "EXPRESSION_STATEMENT",
          ...
          "c1": [
            {
              "k": "CALL_EXPR",
              "s1": "",
              "s2": "println__String",
              ...
              "ty": "Void",
              "c1": [
                {
                  "k": "IDENTIFIER_EXPR",
                  "s1": "println",
                  ...
                }
              ],
              "c2": [
                {
                  "k": "LITERAL_EXPR",
                  "s1": "hello from prismio",
                  ...
                  "ty": "String",
                  ...
                }
              ],
              ...
```

`s2` on the `CALL_EXPR` is already `println__String` — the resolved overload,
not the written name `println`. That resolution happens in semantic analysis,
but `dump-ast` runs the same pipeline up through sema, so what it prints is the
*checked* tree, not the raw parse.

## What failure looks like

A lexer-level failure: a nested block comment, where an inner `*/` closes the
*inner* comment and leaves the outer one open, so the file lexes to end of
input with nothing closed:

<!-- prismio-check: fail -->
```prismio
import std.io

/* outer /* inner */

fn main() -> Int {
    println("unreachable")
    return 0
}
```

```bash
prismio check nested_comment.psm
```

```text
error[P2001]: unterminated block comment
 --> nested_comment.psm:3:1
  |
3 | /* outer /* inner */
  | ^
error: aborting due to 1 previous error
```

The span points at the `/*` that opened the comment, not at the end of the
file — every unterminated comment reaches EOF, so that position identifies
nothing useful. The opening delimiter is the only part a reader can act on.

A parser-level failure, with **recovery**: a syntax error at the top level does
not end the parse. `parser_synchronize` skips to the next token that can only
begin a declaration (`fn`, here), so a second piece of garbage later in the
file is also reported, and the good function between them still parses:

```text
9 9 9

fn fine() -> Int {
    return 1
}

%

fn main() -> Int {
    return fine()
}
```

```bash
prismio check syntax_recovery.psm
```

```text
error[P3201]: expected a declaration, found `9` (expected one of `import`, `let`, `fn`, `extern`, `struct`, `enum`, `impl`, `trait`)
 --> syntax_recovery.psm:1:1
  |
1 | 9 9 9
  | ^
error[P3201]: expected a declaration, found `%` (expected one of `import`, `let`, `fn`, `extern`, `struct`, `enum`, `impl`, `trait`)
 --> syntax_recovery.psm:7:1
  |
7 | %
  | ^
error: aborting due to 2 previous errors
```

Without recovery this file would report exactly one error and hide `fine()`'s
problem-free body along with everything after it. The two properties that make
this safe: synchronize always consumes at least one token, and it stops
*before* the anchor token (`fn`) so that declaration parses normally.

## Worked example: a keyword with nowhere to go

A token existing is not evidence that the feature behind it works.
`isKeyword` in `src/lexer/token.psm` already recognizes `throw` as reserved
vocabulary, but the parser has no statement production that accepts it — so it
falls through to expression parsing and fails as an unrecognized start of an
expression, not as a missing-statement diagnostic:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    throw
    return 0
}
```

```bash
prismio check throw.psm
```

```text
error[P3201]: expected an expression, found `throw` (a KEYWORD)
 --> throw.psm:2:5
  |
2 |     throw
  |     ^^^^^
error: aborting due to 1 previous error
```

`trait` and `impl`, by contrast, are both reserved *and* implemented. Whether a
word lexes tells you nothing about whether the grammar accepts it — check the
parser, not the token list.

## What each layer owns

**Lexing.** `src/lexer/token.psm` defines the token vocabulary. `scanner.psm`
advances through UTF-8 source, records source positions, recognizes comments
and literals, and produces tokens for the parser.

**Parsing.** `src/parse/decl.psm`, `stmt.psm`, and `expr.psm` divide the
grammar by role. `parser.psm` owns shared cursor and diagnostic behavior.
Expression parsing uses precedence-aware logic; declarations and statements
select productions from their leading syntax.

**AST.** `src/ast/nodes.psm` stores syntax structure and source locations.
`types.psm` stores type representations shared with semantic work. `dump.psm`
emits the JSON form shown above.

The AST is not a memory-aware middle IR (intermediate representation).
Semantic ownership and AIF (Adaptive Inference Framework) results are attached
or kept in side tables; later lowering may need to query them again. That
limitation matters when designing transforms that cross control-flow or call
boundaries.

## If you are changing the frontend

### Lexer implementation

`createLexer` initializes the source text, byte/character position, line,
column, and file ID. `lexAllTokens` repeatedly calls the private
`lexerNextToken` and links the returned `Token` values until EOF — there is no
public `scan()` entry point; `lexAllTokens` is what a caller drives.
`lexerSkipWhitespace` handles spaces, newlines, line comments, and delegates
nested scanning to `lexerSkipBlockComment`. `lexerDecodeEscapes` is shared by
string and character literals so escape diagnostics use the original source
coordinates.

Token-producing functions are separated by grammar:

- `lexIdentifier` scans names, then `isKeyword` and `isBoolean` classify
  reserved words and boolean literals;
- `lexNumber` handles the currently supported integer and floating spellings;
- `lexString` and `lexChar` enforce closing delimiters and decoded-width
  rules;
- `lexOperator` uses `isTwoCharOperator`, `twoCharOperatorType`, and
  `oneCharOperatorType`; and
- `lexRange` distinguishes range punctuation from ordinary dot/separator
  tokens.

`lexerToken` records token type, value, file, start/end line and column, and
source offsets. `lexerFatal` emits a location-aware diagnostic and terminates
the frontend path. A new token is not implemented until `TokenType`,
`typeToString`, keyword/operator recognition, parser use, highlighting
grammar, and negative tests agree — the `throw` example above is exactly the
gap that leaves.

### Parser implementation

`parserCreate` wraps the token chain and tracks the current token plus
recovery state. `parseModule` is the actual top-level entry: it loops, calling
`parseDeclaration` for each top-level construct, until it reaches EOF, and
returns the `MODULE` node the rest of the compiler consumes. `parseDeclaration`
itself dispatches imports, variables, external functions, functions, structs,
enums, traits, implementations, associated items, and workloads.

Expression parsing is precedence climbing. `parseExpression(p, precedence)`
parses a unary or primary expression and repeatedly consumes binary operators
whose `getOperatorPrecedence` is high enough. `parsePostfix` and
`parseSuffixes` then attach calls, indexing, member access, generic arguments,
casts, option handling, and slices to the base node. `foldNegativeLiteral`
keeps the most-negative signed literal representable instead of requiring an
out-of-range positive intermediate.

`parseBlock` repeatedly calls `parseStatement`. Dedicated functions own `if`,
`while`, `loop`, `for`, `region`, `match`, `return`, and compound assignment.
Parsing a construct into a generic expression statement and repairing it later
loses recovery boundaries and usually produces worse diagnostics.

### AST data model

`NodeKind` identifies the node variant. `ASTNode` is a compact general node
carrying three child pointers, a sibling `next` pointer, string/integer slots,
file/span information, and a semantic type pointer. `createNode` initializes
every field; `nodeSpanFrom` copies the complete source range. `NodeList` and
`nodeListPush` build ordered child chains without teaching every parser
production its own list storage.

`TypeInfo` is separate from syntax. `nodeSetType` attaches a copied resolved
type after semantic analysis, and `nodeGetType` is the later contract.
`dumpAstJson` walks the actual linked structure, includes the file table, and
escapes JSON through `jsonString`.

### What to test

For a frontend change, test successful shape with `dump-ast`, the nearest
missing delimiter, an unexpected token inside the construct, recovery into a
later declaration, accurate Unicode line/column spans, and semantic rejection
of a syntactically valid but invalid form — a token being recognized, as
`throw` shows, is not the same claim as a construct being accepted.
