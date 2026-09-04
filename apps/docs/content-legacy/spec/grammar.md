# Grammar Specification

This page provides the formal EBNF grammar for the Prismio programming language.

> 🚧 **Work in Progress** – This grammar is incomplete and subject to change as the language evolves. It reflects the current state of the language design.

## Notation

This grammar uses Extended Backus-Naur Form (EBNF):

| Notation | Meaning |
|----------|---------|
| `::=` | is defined as |
| `A B` | A followed by B (sequence) |
| `A \| B` | A or B (alternation) |
| `(A)` | grouping |
| `A?` | zero or one A (optional) |
| `A*` | zero or more A (repetition) |
| `A+` | one or more A |
| `'x'` | literal character or string |
| `[A]` | optional (same as `A?`) |

---

## Top-Level Program

```ebnf
Program        ::= ImportDecl* TopLevelDecl*

TopLevelDecl   ::= FunctionDecl
                 | VariableDecl
                 | TypeDecl
                 | StructDecl
                 | EnumDecl
                 | ImplBlock
```

---

## Import Declarations

```ebnf
ImportDecl     ::= 'import' ImportPath ImportAlias?
                 | 'import' ImportPath '.' '{' ImportList '}'

ImportPath     ::= Identifier ('.' Identifier)*

ImportAlias    ::= 'as' Identifier

ImportList     ::= Identifier (',' Identifier)* ','?
```

**Examples:**
```prismio
import std.io
import prismio.net.AsycnLoader
import src.ui.{ Text, Button, Panel }
import some.very.Long.Name as Short
```

---

## Variable Declarations

```ebnf
VariableDecl   ::= 'let' 'mut'? Pattern (':' TypeExpr)? ('=' Expr)? ';'?

Pattern        ::= Identifier
                 | '_'
                 | '(' Pattern (',' Pattern)* ')'
                 | '[' Pattern (',' Pattern)* ']'
```

**Examples:**
```prismio
let x = 5
let mut y: Int = 10
let (a, b) = (1, 2)
let _unused = compute()
```

---

## Function Declarations

```ebnf
FunctionDecl   ::= Visibility? 'fn' Identifier GenericParams? 
                   '(' ParamList? ')' ReturnType? FunctionBody

Visibility     ::= 'pub'

GenericParams  ::= '<' GenericParam (',' GenericParam)* ','? '>'
GenericParam   ::= Identifier (':' TypeBound)?

ParamList      ::= Param (',' Param)* ','?
Param          ::= 'mut'? Identifier ':' TypeExpr
                 | 'vararg' Identifier ':' TypeExpr

ReturnType     ::= '->' TypeExpr

FunctionBody   ::= Block                          // { statements }
                 | '=' Expr                       // = expression
                 | '=' Block                      // = { block }
```

**Examples:**
```prismio
fn add(a: Int, b: Int) -> Int { return a + b }
fn add(a: Int, b: Int) -> Int = a + b
pub fn greet(name: String) { println("Hi ${name}") }
fn identity<T>(x: T) -> T = x
```

---

## Type Expressions

```ebnf
TypeExpr       ::= Identifier                         // Int, Bool, String
                 | Identifier '<' TypeList '>'         // List<Int>
                 | '[' TypeExpr ']'                    // [Int] (array)
                 | '(' TypeList ')'                    // (Int, String) (tuple)
                 | TypeExpr '?'                        // Int? (optional)
                 | '&' TypeExpr                        // &T (reference)
                 | '&' 'mut' TypeExpr                  // &mut T (mutable ref)
                 | 'fn' '(' TypeList ')' '->' TypeExpr // function type

TypeList       ::= TypeExpr (',' TypeExpr)* ','?
```

---

## Statements

```ebnf
Statement      ::= VariableDecl
                 | ExprStmt
                 | ReturnStmt
                 | BreakStmt
                 | ContinueStmt
                 | Block

ExprStmt       ::= Expr ';'?

ReturnStmt     ::= 'return' Expr? ';'?

BreakStmt      ::= 'break' Expr? ';'?

ContinueStmt   ::= 'continue' ';'?

Block          ::= '{' Statement* Expr? '}'    // last expr = block value
```

---

## Expressions

```ebnf
Expr           ::= AssignExpr

AssignExpr     ::= LogicOrExpr (AssignOp AssignExpr)?
AssignOp       ::= '=' | '+=' | '-=' | '*=' | '/=' | '%=' 
                 | '&=' | '|=' | '^=' | '<<=' | '>>='

LogicOrExpr    ::= LogicAndExpr ('||' LogicAndExpr)*

LogicAndExpr   ::= EqExpr ('&&' EqExpr)*

EqExpr         ::= CmpExpr (('==' | '!=') CmpExpr)*

CmpExpr        ::= RangeExpr (('<' | '>' | '<=' | '>=') RangeExpr)*

RangeExpr      ::= AddExpr (('..' | '..=') AddExpr)?

AddExpr        ::= MulExpr (('+' | '-') MulExpr)*

MulExpr        ::= UnaryExpr (('*' | '/' | '%') UnaryExpr)*

UnaryExpr      ::= ('-' | '!' | '~') UnaryExpr
                 | PostfixExpr

PostfixExpr    ::= PrimaryExpr PostfixOp*
PostfixOp      ::= '.' Identifier                     // field/method
                 | '.' Identifier '(' ArgList? ')'     // method call
                 | '[' Expr ']'                        // indexing
                 | '(' ArgList? ')'                    // function call
                 | '?'                                  // error propagation

PrimaryExpr    ::= Literal
                 | Identifier
                 | '(' Expr ')'
                 | BlockExpr
                 | IfExpr
                 | MatchExpr
                 | ForExpr
                 | WhileExpr
                 | LoopExpr
                 | ClosureExpr
                 | ArrayExpr
                 | TupleExpr
```

---

## Literals

```ebnf
Literal        ::= IntLiteral
                 | FloatLiteral
                 | BoolLiteral
                 | CharLiteral
                 | StringLiteral

IntLiteral     ::= DecimalInt | HexInt | BinaryInt | OctalInt
DecimalInt     ::= [0-9] ([0-9] | '_')*
HexInt         ::= '0x' [0-9a-fA-F] ([0-9a-fA-F] | '_')*
BinaryInt      ::= '0b' [01] ([01] | '_')*
OctalInt       ::= '0o' [0-7] ([0-7] | '_')*

FloatLiteral   ::= DecimalInt '.' DecimalInt? Exponent?
Exponent       ::= ('e' | 'E') ('+' | '-')? DecimalInt

BoolLiteral    ::= 'true' | 'false'

CharLiteral    ::= "'" CharChar "'"
CharChar       ::= (any char except '\'' and '\') | EscapeSeq

StringLiteral  ::= '"' StringChar* '"'
                 | 'r"' RawChar* '"'
                 | '"""' MultilineChar* '"""'
StringChar     ::= (any char except '"' and '\') | EscapeSeq | Interpolation
Interpolation  ::= '${' Expr '}'
EscapeSeq      ::= '\' ('n' | 't' | 'r' | '"' | "'" | '\' | 'u{' HexDigit+ '}')
```

---

## Control Flow Expressions

```ebnf
IfExpr         ::= 'if' Expr Block ('else' 'if' Expr Block)* ('else' Block)?

MatchExpr      ::= 'match' Expr '{' MatchArm (',' MatchArm)* ','? '}'
MatchArm       ::= Pattern ('if' Expr)? '->' (Expr | Block)

ForExpr        ::= 'for' Pattern 'in' Expr Block

WhileExpr      ::= 'while' Expr Block

LoopExpr       ::= 'loop' Block
```

---

## Patterns

```ebnf
Pattern        ::= '_'                                 // wildcard
                 | Identifier                          // binding
                 | Literal                             // literal pattern
                 | RangePattern                        // range
                 | TuplePattern
                 | ArrayPattern
                 | StructPattern
                 | Pattern '|' Pattern                 // or-pattern
                 | Pattern 'if' Expr                   // guard

RangePattern   ::= Literal '..' Literal
                 | Literal '..=' Literal

TuplePattern   ::= '(' Pattern (',' Pattern)* ')'
ArrayPattern   ::= '[' Pattern (',' Pattern)* ']'
```

---

## Closures

```ebnf
ClosureExpr    ::= '{' ClosureParam* '->' Expr '}'
                 | '{' ClosureParam* '->' Block '}'
                 | '{' Expr '}'                        // single-expr, inferred param

ClosureParam   ::= 'mut'? Identifier (':' TypeExpr)?
ArgList        ::= Expr (',' Expr)* ','?
```

---

## Future Grammar Extensions

The following constructs are planned for future releases:

- Struct and enum declarations (`struct`, `enum`)
- Trait declarations and implementations (`trait`, `impl`)  
- Type aliases (`type Name = ...`)
- Async/await expressions
- Unsafe blocks
- Macro invocations
