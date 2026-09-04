---
title: Grammar reference
description: Compact EBNF-style grammar for declarations, statements, types, and expressions accepted by Prismio 0.1.
status: draft
version: "0.1.0"
lastUpdated: "2026-09-03"
tags: [specification, grammar, ebnf, parser]
related: [language/lexical-structure, specification/evaluation, specification/conformance]
---

The notation uses `*` for repetition, `?` for optional syntax, `|` for alternatives, and quoted terminal text. It is a readable compiler-derived contract, not a generated parser artifact. Lexical validity, semantic type checks, and ownership rules further restrict syntactically valid programs.

## Declarations, statements, and types

```text
program        = declaration* EOF ;
declaration    = importDecl | letDecl | functionDecl | externDecl
               | structDecl | enumDecl ;
importDecl     = "import" qualifiedName ("." "*")? ;
functionDecl   = "fn" identifier typeParams? "(" parameters? ")" returnType? block ;
typeParams     = "<" identifier ("," identifier)* ">" ;
externDecl     = "extern" "fn" identifier "(" externParameters? ")" returnType? ;
returnType     = "->" type ;
structDecl     = "struct" identifier typeParams? "{" fields? "}" ;
enumDecl       = "enum" identifier typeParams? "{" variants? "}" ;
variants       = variant ("," variant)* ","? ;
variant        = identifier ("(" type ("," type)* ")")? ;
letDecl        = "let" "mut"? "unique"? pin? identifier
                 (":" type)? ("=" expression)? ;
pin            = "pin" "(" tier ")" ;
type           = identifier typeArgs? | "[" type "]" | type "?" ;
typeArgs       = "<" type ("," type)* ">" ;

statement      = letDecl | block | ifStmt | whileStmt | loopStmt | forStmt
               | matchStmt | regionStmt | breakStmt | continueStmt
               | returnStmt | expressionStmt ;
ifStmt         = "if" "(" expression ")" block ("else" (block | ifStmt))? ;
whileStmt      = "while" "(" expression ")" block ;
loopStmt       = "loop" block ;
forStmt        = "for" identifier "in" expression ".." expression block ;
matchStmt      = "match" "(" expression ")" "{" matchArm* "}" ;
matchArm       = (pattern | "_") "=>" block ;
pattern        = expression | variantPattern ;
variantPattern = identifier typeArgs? "." identifier ("(" identifier ("," identifier)* ")")? ;
regionStmt     = "region" identifier ("pin" "(" integer ")")? block ;
block          = "{" statement* "}" ;
```

Function parameters take an optional leading `sink` or `inout` mode and an optional contextual `unique`, followed by `name: Type`. Expressions include literals, names, calls, struct and array literals, field/index access, unary and binary operations, assignments, and `as` casts.

A type name followed by `<` is a type-argument list wherever a type is expected. In expression position the same shape appears before `{` (a generic struct literal), before `(` (a call with written type arguments), and before `.` (a qualified enum variant); these are told apart from a comparison by scanning to the closing `>` and looking at the token after it.

Block comments are `/* ... */` and nest; see [lexical structure](/language/lexical-structure). Semicolons and `try` forms are not in the 0.1 grammar.

Methods, `impl` blocks, traits and closures **are**. A declaration may carry a leading visibility modifier, and an `impl` body holds `fn` declarations that may each carry one:

```text
declaration    = visibility? (importDecl | letDecl | fnDecl | externDecl
                             | structDecl | enumDecl | implDecl | traitDecl) ;
visibility     = "public" | "private" | "internal" ;
implDecl       = "impl" typeName ("for" typeName)? "{" implMember* "}" ;
implMember     = visibility? fnDecl ;
traitDecl      = "trait" identifier "{" fnSignature* "}" ;
closureExpr    = "|" parameters? "|" (expression | block) ;
```

A visibility modifier is accepted only on a function -- `fn`, `extern fn`, or a method inside an `impl` block. On a type, an enum, or a global it is a parse-time rejection rather than a marker that is accepted and ignored.

An `impl` member without a `self` parameter is an associated function; a generic `impl` (`impl Box<Int>`) is rejected.

## Parameters

Ordinary function parameters use this shape:

```text
parameters     = parameter ("," parameter)* ;
parameter      = parameterMode? "unique"? identifier ":" type ;
parameterMode  = "sink" | "inout" ;
```

`unique` is experimental contextual syntax. An ordinary move-only parameter with no explicit mode borrows for the call. Parameter types are required.

Foreign parameters reuse typed parameter structure and may add an FFI ownership contract after the parameter type. Return types on an extern declaration may also carry their supported contract. Contract validity is checked separately from parsing.

## Expressions

The expression grammar uses precedence climbing. This compact form describes the accepted families:

```text
expression     = binaryExpression ;
binaryExpression
               = unaryExpression (binaryOp unaryExpression)* ;
unaryExpression
               = ("!" | "-" | "~") unaryExpression
               | postfixExpression ;
postfixExpression
               = primaryExpression ("as" type)* ;
primaryExpression
               = literal | identifier | structLiteral | arrayLiteral
               | "(" expression ")" ;
suffix         = callSuffix | indexSuffix | memberSuffix ;
callSuffix     = "(" arguments? ")" ;
indexSuffix    = "[" expression "]" ;
memberSuffix   = "." identifier ;
```

Calls, indexing, and member selection bind most tightly through primary-expression suffix parsing. Prefix unary operators recurse, so repeated forms such as `!!flag` and `--value` parse when semantically valid. `as` casts form a postfix chain.

Binary precedence from low to high is `or`; `and`; equality; ordering; bitwise OR; bitwise XOR; bitwise AND; shifts; addition/subtraction; multiplication/division/remainder.

## Literals and aggregates

```text
literal        = integer | float | string | character
               | "true" | "false" | "none" ;
arrayLiteral   = "[" (expression ("," expression)*)? "]" ;
structLiteral  = identifier "{" fieldInitializer
                 ("," fieldInitializer)* "}" ;
fieldInitializer
               = identifier ":" expression ;
```

Whether an integer literal fits its contextual type, whether all array elements agree, and whether a struct literal supplies the declared fields are semantic questions.

## Assignment statements

Assignment is recognized after parsing an expression-statement target:

```text
assignmentStmt = expression assignmentOp expression ;
assignmentOp   = "=" | "+=" | "-=" | "*=" | "/=" | "%="
               | "&=" | "|=" | "^=" ;
```

Semantic analysis restricts assignable destinations. Direct and compound assignment to a binding require `mut`; compound assignment currently supports a plain variable target rather than every member/index place.

## Lexical exclusions

Statements do not end in `;`. Comments use `//`; `/* ... */` is not recognized. Numeric base prefixes, string interpolation, raw strings, tuple punctuation, closure bars, and user lifetime tokens are not part of the 0.1 grammar.

The lexer reserves `throw`, but no declaration or statement production consumes it, so it produces a parse error when used. `trait` and `impl` are consumed by the declaration productions above.
