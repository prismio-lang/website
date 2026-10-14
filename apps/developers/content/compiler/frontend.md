---
title: Lexer, parser, and AST
description: The Prismio frontend from UTF-8 scanning through parser recovery and the typed structures consumed by later stages.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
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
  reserved words and boolean literals. ASCII takes the `isIdentStart` /
  `isIdentPart` fast path; a byte past ASCII is decoded to a scalar and tested
  against UAX #31's `XID_Start` and `XID_Continue`, from
  `src/lexer/identifier_tables.psm`. Prismio's profile is in
  `lexerIsIdentifierStart` and `lexerIsIdentifierContinue`: `_` may start a name,
  U+200C and U+200D are excluded, and a non-ASCII name is stored in NFC
  (`normalizeNfc`, from `std.unicode`) so canonically equivalent spellings are
  one symbol. Columns stay in UTF-8 bytes. `lexerNonAsciiMessage` names a
  rejected character by code point, and a non-UTF-8 byte by value;
- `lexNumber` handles decimal, `0x`/`0o`/`0b` and floating spellings. Each run
  of digits goes through `lexDigitRun`, which accepts `_` between two digits
  (`1_000_000`, `0xFF_FF`, `1e1_0`) and refuses one without a digit after it
  with P2001. The token text has its separators removed (`lexNumberText`), so
  sema's range check, the backend and the AIF oracle read plain digits and none
  of them knows separators exist; `len` still spans the source as written, so a
  diagnostic underlines the whole literal. `src/` must not use a separator until
  the seed has been refreshed by a compiler that reads them;
- `lexString` and `lexChar` enforce closing delimiters and decoded-width
  rules. `lexerDecodeEscapes` decodes a string's escapes, including `\e`
  (ESC), `\xHH` (one byte, `lexerHexByteEscape`) and `\u{...}` (a Unicode
  scalar written as UTF-8 by `utf8Text`); NUL is refused in every spelling,
  since a String is NUL-terminated. `src/` must not use the three new escapes
  until the seed has been refreshed by a compiler that decodes them;
- `lexOperator` uses `isTwoCharOperator`, `twoCharOperatorType`, and
  `oneCharOperatorType`; and
- `lexRange` distinguishes range punctuation from ordinary dot/separator
  tokens. `..` and `..<` are one `RANGE` kind told apart by the token's
  value, so every production that accepts a range accepts both and records
  which it saw. `@`, for loop labels, is a `SEPARATOR`.

`lexerToken` records token type, value, file, start/end line and column, and
source offsets. `lexerFatal` emits a location-aware diagnostic and terminates
the frontend path. A new token is not implemented until `TokenType`,
`typeToString`, keyword/operator recognition, parser use, highlighting
grammar, and negative tests agree — the `throw` example above is exactly the
gap that leaves.

### Unicode tables

`src/lexer/identifier_tables.psm`, `std/unicode_tables.psm` and
`std/unicode_case.psm` are generated by `tools/generate_unicode_tables.py` and
never edited. The generator pins the Unicode version (`UNICODE_VERSION`,
18.0.0) and the SHA-256 of every file it reads, fetches them into
`build/unicode/<version>/` -- the UCD under `ucd/`, the UTS #39 data under
`security/` -- and refuses a file whose hash differs. It does not use Python's
`unicodedata`, whose version is the interpreter's. Each output records the
version, the source files with their hashes, and the generator's hash, so a
generator change makes every output stale too.

```bash
python3 tools/generate_unicode_tables.py --check
python3 tools/unicode_conformance.py --compiler <toolchain>/bin/prismio
```

`--check` fails when a committed table differs from what the pinned data
produces. The conformance tool runs `std.unicode` over the UCD's own
`GraphemeBreakTest.txt` and `NormalizationTest.txt`. Moving to a new Unicode
version is one reviewed change: the version, the pins, the regenerated tables,
and both commands passing -- rule changes do happen (GB9c changed in 18.0).

A table is a *RangeTable* -- an array literal of sorted, disjoint ranges,
binary-searched -- unless a benchmark asked for something else, and one did:
case mapping. `std/unicode_case.psm` is a two-stage table of deltas, ICU's code
point trie in miniature: `index[scalar / 32]` finds a block of 32 scalars, whose
row holds one delta per kind (lower, title, upper, fold), and blocks with the
same contents are stored once. A mapping of more than one scalar (`ß` to `SS`)
reads as a sentinel there and its scalars are in a small table of exceptions.
The search it replaced made `toUpper` on Cyrillic, Greek and accented Latin
5.4x Rust's; the table made it 1.7x faster than Rust's. A table is emitted only
when something in Prismio reads it.

### Security checks in the lexer

Three checks keep what a reader sees and what compiles the same text:

- **P2002** (error, `src/lexer/scanner.psm`): an unescaped bidirectional
  override or isolate in a comment or a string -- Trojan Source. Every one of
  them encodes with lead byte `0xE2`, so the per-byte loops test that byte and
  decode only then.
- **P2003** and **P2004** (warnings, `src/lexer/identifier_security.psm`): a
  character UTS #39 restricts in identifiers, and two identifiers with the same
  UTS #39 skeleton. The scanner records whether it saw a non-ASCII identifier
  and nothing runs unless it did; when it did, every file is lexed again from
  the diagnostics registry's copy (`diag_file_content`), because a confusable
  pair can be one name in std and one in the program.

The diagnostic renderer (`runtime/diagnostics.c`) prints a bidi control in a
quoted source line as U+FFFD, so the error about one does not reorder the line
it quotes, and draws carets by character rather than byte.

### Parser implementation

`parserCreate` wraps the token chain and tracks the current token plus
recovery state. `parseModule` is the actual top-level entry: it loops, calling
`parseDeclaration` for each top-level construct, until it reaches EOF, and
returns the `MODULE` node the rest of the compiler consumes. `parseDeclaration`
itself dispatches imports, variables, external functions, functions, structs,
enums, traits, implementations, associated items, and workloads.

Expression parsing is precedence climbing. `parseExpression(p, precedence)`
parses a unary or primary expression and repeatedly consumes binary operators
whose `getOperatorPrecedence` is high enough. From the bottom: `or`, `and`, `== !=`,
`< <= > >=`, `??`, `|`, `^`, `&`, `<< >>`, `+ -`, `* / %`. `??` is the one operator that
associates to the right (`parseExpression` passes its own precedence, not one more, for the
right operand), and it sits above comparison and below the bitwise operators, as Swift's does.
The scanner reads it as one `ARITHMETIC_OPERATOR` token in `Lexer.coalesce`, ahead of the
separator check that makes a lone `?` the optional suffix. `parsePostfix` and
`parseSuffixes` then attach calls, indexing, member access, generic arguments,
casts, option handling, and slices to the base node. `foldNegativeLiteral`
keeps the most-negative signed literal representable instead of requiring an
out-of-range positive intermediate.

`parseBlock` repeatedly calls `parseStatement`. Dedicated functions own `if`,
`while`, `loop`, `for`, `repeat`, `region`, `match`, `return`, and compound assignment.

The loop productions carry the most shape:

- **`for`** (`parseForStatement`) accepts a parenthesised header — `for (x in 1..10)` — told
  apart from the pair `for (k, v) in m` by whether a `,` follows the first name. A range leaves
  `child1` the start, `child2` the end with an optional `step` expression on the end's `next`,
  `child3` the body, and `i1 = 1` when the end is included (`..`). A header with no range
  operator is a collection loop, marked by the absent `child2`; a pair puts its second name in
  `s2`. `step` is contextual and read only after an end.
- **`repeat(n)`** is contextual too, because `"ab".repeat(3)` is a String method.
  `atRepeatStatement` looks ahead for `repeat`, a balanced parenthesised count and a `{` — a
  shape no call statement can have — and `parseRepeatStatement` builds the loop as
  `for $repeat_L_C in 0..<n`.
- **A label** (`outer@ for …`) is an identifier followed by `@` at the start of a statement.
  `parseLabeledLoop` parses the loop and stores the label on its body BLOCK's `s1`, which a
  BLOCK does not otherwise use and which every later rewrite of a loop preserves.
  `break@outer` and `continue@outer` store it in their own `s1`; the `@` must be on the
  keyword's line.

**Imports.** `parseImportStatement` reads a dotted path, an optional `.*`, and an optional
`as` alias (`parseImportAlias`). A leading `{` starts a group, `import {io, string} from std`:
`parseImportGroup` reads single-segment entries, each with its own optional `as`, then
`from` and the directory (`parseImportFrom`), and returns one `IMPORT_STATEMENT` per entry
chained on `next`, exactly the nodes the entries would have been as separate lines.
`parseModule` splices the chain into the declarations. A leading `*` is `import * from std`,
the same node `import std.*` builds. `from` is contextual: an identifier with that
spelling, after a group or a `*`, and as the first word of a declaration.

**The directory first.** `from std import {io, string}` and `from std import *` are the
same two statements with the order reversed. `atFromImport` (`src/parse/decl.psm`) recognises
a top-level identifier `from` followed by a module name -- nothing else can begin a
declaration with an identifier, so no program that already names something `from` changes
meaning -- and `parseFromImportStatement` reads the directory (`parseImportDirectory`, shared
with `import ... from`), the keyword `import`, and then either a group
(`parseImportGroupEntries` and `qualifyImportGroup`, shared with the other order) or `*`.
Both orders therefore build the same `IMPORT_STATEMENT` nodes and nothing downstream can
tell them apart. `from std import io` is refused by name, since it would be a third spelling
of `import std.io` (`tests/neg_260_from_import_single.psm`; `test_264` is the accepted half).

A group entry names a file, never a declaration, and the parser cannot tell the two
apart, so it marks each entry with `i2 = 1`. `refuseGroupDeclaration` in
`driver/imports.psm` reports P1072 for a marked entry whose path is a declaration inside
a module, before `mergeNamedModule`'s selective-import fallback can quietly select it. An
empty group, an alias after the directory, a dotted entry, and the path-first
`import std.{io}` are syntax errors; the last one's message spells the right order.

**`default`** is a keyword and parses as a `DEFAULT_EXPR` primary, beside `none`. It has no
type of its own; sema rewrites it in place (see
[semantic analysis](/compiler/semantic-analysis-and-types#builtins-and-source-rewrites)).

**`{ key: value }`** parses as a `MAP_LITERAL_EXPR` primary (`parseMapLiteral`): child1 is the
key chain and child2 the value chain, in order, and `{}` has neither. Nothing else begins an
expression with `{` -- a block is a statement and a closure opens with `|` -- so it claims no
existing spelling. It is gated on `allowStructLit` as a struct literal is, so a `for` head that
ends at `{` is never read as one. Like `DEFAULT_EXPR`, the kind is appended to `NodeKind` so the
seed's ordinals do not move, and it never survives sema.

**`Map<String, Int>()`** needs nothing from the parser: `Name<args>(...)` was already a call
with explicit type arguments on `child3`. Sema decides that `Name` is a type
(`semaTypeCall`).

**Declaration modifiers.** `export`, `naked`, `section("...")` and `align(n)` before `fn`, and
`repr(C)` and `packed` before `struct`, are contextual words, matched as identifiers the way `cold` and the
visibility markers are. `atFnModifiers` and `atStructModifiers` claim one only when the next token continues
a declaration (`fn`, `struct`, another modifier, or `(` for the three that take one), so a variable called
`export` keeps compiling, and `visibilityLevel` looks through them so `public export fn` parses. The struct
markers set bits in `STRUCT_DECL.i1` (`nodeMarkReprC`, `nodeMarkPacked`). The function ones do not touch the
node: `FUNCTION.i1` already holds one state at a time (inline, property, cold), and a field on every node
would cost the whole compiler for a handful of boot-stub declarations. They go into a table in
`ast/fn_attrs.psm`, one record per line keyed by the position of the `fn` keyword (`file:line:col`), which
is unique per declaration and survives the copy a generic instantiation makes; `generateFunction` reads it
once per function and calls `ir_function_export`, `ir_function_naked`, `ir_function_section` and
`ir_function_align`. `export` is an LLVM alias beside the function, not a rename, because every call inside
the program already names the mangled symbol. A new modifier is: a word in `isFnModifierWord`, a case in
`parseModifiedFunctionDecl`, a bit or field in the table, and a backend call. Add it to the IntelliJ plugin's
`PrismioWords` and `SignatureParser` in the same change.

**Hardware builtins.** `src/common/mem_builtins.psm` is the one table for `__builtin_mem_*`,
`__builtin_asm*`, `__builtin_port_*` and `__builtin_ptr_addr`/`addr_ptr`, read by four places that must agree:
sema types and checks a call (`semaCheckMemBuiltin` in `sema/builtins.psm`), codegen emits it
(`generateMemBuiltin`, over `ir_mem_load`, `ir_mem_store`, `ir_mem_rmw`, `ir_mem_cmpxchg`, `ir_mem_fence`
and `ir_asm_call`), `aif/contracts.psm` describes it as reading its arguments and keeping nothing, and
`tools/aif_oracle/aif.py` keeps its own copy of that last half. A name one of them misses fails quietly: AIF
stops bracketing the caller. None needs a seed refresh while `src/` does not call it. The LLVM calls they
use (`LLVMBuildAtomicRMW`, `LLVMGetInlineAsm` and the rest) are declared in `runtime/prismio_llvm.h` too, for
the builds that use the hand-kept header.

The programs reach these through `std.raw`, `std.port` and `std.asm`, never by name: `semaRefuseRuntimeCalls`
(`sema/vec.psm`) runs before any rewrite and refuses every `__builtin_*` written outside `std/`, with the wrapper
to write instead from `semaBuiltinSpelling`. Add a builtin and its spelling goes in that table, its wrapper in
`std/`. `asm`, `asmRead` and `asmWrite` cannot be wrappers, because the text must be a literal in the
instruction stream: their declarations in `std/asm.psm` are placeholders and `semaStdAsmBuiltin` lowers a call
to the builtin in place, only when the callee resolves to `std.asm`'s declaration.

**Conditions, `is`/`not`, nested functions, closure blocks.** `parseCondition` (`parse/stmt.psm`) reads an `if` or
`while` condition with `allowStructLit` off, so the `{` is the body; `parseBracketed` turns it back on inside
parentheses, call arguments, indexes and literals. `is`, `is not` and `not` are keywords read into the `==`,
`!=` and `!` nodes in `parseExpression` and `parseUnary`, so no later pass sees them. A `fn` statement is parsed
by `parseNestedFn` (`parse/decl.psm`) and hoisted: the parser keeps the FUNCTION being read in `fnNode`, names a
nested one `outer$inner` (`nestedFunctionPrefix`, which adds the type for a method), chains it on `hoistHead`,
and `parseModule` splices the chain in after the declaration it was written in. `renameNestedCalls` rewrites
the calls in the declaring block when the block closes. A closure may take a block: `parseClosureExpr` stores
the BLOCK in `child2`, `semaClosureBodyType` types the last statement, and `semaLowerClosure` makes it the
`call` function's body with that statement turned into a `return`; names the block itself declares are never
captures (`semaClosureDeclaredNames`).

**Visibility.** A function, a global `let`, a struct and a struct field carry their level in `i2` (0 public,
1 file, 2 package), and `semaVisibleFrom` (`sema/types.psm`) is the one test, with `ir_same_package` answering
the package question in C. The parser stamps the defaults, `internal` on a struct and `private` on a field, so
a node built by sema (a closure's struct, an enum payload) has 0 and is public. A field is checked in
`semaFindStructFieldType`, a struct in `semaCheckStructVisible` where an annotation or a literal names it, and a
literal's fields together in `semaCheckStructLiteralVisible`. A standard-library body naming a program's struct
is the type argument of a generic arriving, already checked where the program wrote it. Moving the tree to
the new defaults was mechanical: compile every entry point, read the diagnostics, widen each declaration to the
level its uses need. **`src/` uses the markers, so the pinned seed cannot parse it** until a seed is cut and
re-pinned.

**Constants, ranges and indexes.** An array's length is parsed as an expression (`parseTypeArgList`, tighter
than `>`, with `lengthDepth` so a `>>` still closes two lists) and `semaResolveArrayLength` (`sema/consts.psm`)
folds it to the literal everything else reads; `semaFoldConstantInitializer` does the same for an integer
global. A `for` over bounds of another integer type is rewritten by `semaForTypedRange` (`sema/ranges.psm`)
into declarations and the `Int` loop over a count, so every loop proof still applies: `__builtin_range_count`
and `__builtin_range_at` (`ir/range_values.psm`) do the arithmetic in 64 bits, and the check that the count fits
is left out where it cannot fail, so a freestanding program with constant ranges references no failure
routine. An index of another integer type is converted in `semaIndexOperandAsInt`, by a cast when every value
fits and by `__builtin_index_int`, which saturates, otherwise. `nowrap` recognises `std.math`'s `min` and `max`
(`nowrapIsStdMath`) because the builtins no longer appear in programs.

**Definite assignment.** `semaCheckDefiniteAssignment` (`sema/assign.psm`) runs over each function body after
sema, because it needs `match` exhaustiveness (`i3`). The state at a point is the declared-but-unassigned locals
(a `let` with an annotation and no initializer, arrays excepted) plus a dead flag; branches join by union, a
return, jump or never-returning call makes a path dead, and a loop body is analysed once with the entry state.
Sema marks a value-less `let` assignable (`ir_mark_mutable`), so the *first* assignment to an immutable one is
not refused there; the pass refuses a second one, and one a loop could repeat, which it finds by recording
assignments made inside a loop to declarations from outside it and checking at each back edge (the end of the
body and `continue`) whether control returns with the declaration assigned.

A slice's end is normalised by `parseSliceEnd`: `a[x..y]` is stored as the exclusive bound
`y + 1`, so sema and codegen only ever see the half-open form they always handled.
Parsing a construct into a generic expression statement and repairing it later
loses recovery boundaries and usually produces worse diagnostics.

### AST data model

`NodeKind` identifies the node variant. `ASTNode` is a compact general node
carrying three child pointers, a sibling `next` pointer, string/integer slots,
file/span information, and a semantic type pointer. `createNode` initializes
every field; `nodeSpanFrom` copies the complete source range. `NodeList` and
`nodeListPush` build ordered child chains without teaching every parser
production its own list storage.

A `TYPE_ANNOTATION` reuses the general slots, and every pass that reads an
annotation reads them the same way: `i1` marks an array, `i2` a constructor with
type arguments (the name in `s1`, the arguments a `next` chain under `child1`),
and `i3` a trailing `?`. `child1` of an array is its element annotation.
`Array<T, N>` and `Array<T>` are normalised by `parseArrayTypeArgs` into exactly
the node `[T]` parses to, so no later pass learns a new shape; a written length
rides on `child2` as a `LITERAL_EXPR`; the parser accepts one anywhere, and sema decides where one may be written (`semaCheckArrayLengthPositions`). A number
in a type-argument list is accepted for `Array` alone — `parseTypeArgList`
refuses it for any other constructor with `P3006` and drops it, so no pass after
the parser meets a number where a type belongs. `src/` does not use
`Array<T, N>` yet: under the seed rule it can once the seed has been refreshed
by a compiler that parses it. Two names are renamed on the way through, so no
later pass ever meets them: `Vec` becomes the internal `List`, and `I32` becomes
`Int`, the one signed 32-bit type.

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
