# Grammar (BNF)

This page provides a formal **BNF/EBNF grammar specification** for the Prismio programming language. It is intended for compiler authors, tooling developers, and language researchers who need a precise, machine-readable description of Prismio's syntax.

> 🚧 **Coming Soon** – This is a **partial draft** grammar. The complete, normative grammar specification will be published alongside the Prismio 1.0 stable release. Productions marked with `(* draft *)` may change.

---

## Notation

This grammar uses **Extended Backus–Naur Form (EBNF)** with the following conventions:

| Notation | Meaning |
|---|---|
| `::=` | Production rule definition |
| `\|` | Alternation (OR) |
| `[ ... ]` | Optional (zero or one) |
| `{ ... }` | Repetition (zero or more) |
| `( ... )` | Grouping |
| `'...'` | Terminal literal |
| `UPPER_CASE` | Lexical token (defined in lexer) |
| `lower_case` | Non-terminal |
| `(* ... *)` | Comment / annotation |

---

## 1. Program Structure

A Prismio source file is a sequence of top-level declarations. There is no required ordering between declarations.

```bnf
program
    ::= { top_level_declaration }

top_level_declaration
    ::= import_declaration
      | function_declaration
      | variable_declaration
      | type_declaration
      | struct_declaration
      | enum_declaration
      | trait_declaration
      | impl_block
      | const_declaration
```

---

## 2. Import Declarations

```bnf
import_declaration
    ::= 'import' import_path

import_path
    ::= IDENTIFIER { '.' IDENTIFIER }

(* Examples:
     import std.io
     import std.collections.HashMap
     import myproject.utils.StringHelper
*)
```

> **Note:** Wildcard imports (e.g., `import std.*`) are **not supported**. All imports must be explicit.

---

## 3. Function Declarations

```bnf
function_declaration
    ::= ['pub'] 'fn' IDENTIFIER
        [ type_parameter_list ]
        '(' [ parameter_list ] ')'
        [ '->' type_expression ]
        ( block_expression | '=' expression )

parameter_list
    ::= parameter { ',' parameter } [',']

parameter
    ::= ['mut'] IDENTIFIER ':' type_expression
      | 'self'
      | '&' ['mut'] 'self'

type_parameter_list
    ::= '<' type_parameter { ',' type_parameter } '>'

type_parameter
    ::= IDENTIFIER [ ':' trait_bound { '+' trait_bound } ]

trait_bound
    ::= type_expression

(* Examples:
     fn greet(name: String) -> String { ... }
     fn add(a: Int, b: Int) -> Int = a + b
     fn identity<T>(value: T) -> T = value
     pub fn process(mut data: [Int]) -> Bool { ... }
*)
```

---

## 4. Variable Declarations

```bnf
variable_declaration
    ::= ('let' | 'let' 'mut') IDENTIFIER
        [ ':' type_expression ]
        [ '=' expression ]
        ';'

const_declaration
    ::= 'const' IDENTIFIER ':' type_expression '=' expression ';'

(* Examples:
     let x = 42
     let mut counter: Int = 0
     const MAX_SIZE: Int = 1024
*)
```

---

## 5. Type Declarations

### 5.1 Struct Declarations

```bnf
struct_declaration
    ::= ['pub'] 'struct' IDENTIFIER
        [ type_parameter_list ]
        '{' { struct_field } '}'

struct_field
    ::= ['pub'] IDENTIFIER ':' type_expression ','
```

### 5.2 Enum Declarations

```bnf
enum_declaration
    ::= ['pub'] 'enum' IDENTIFIER
        [ type_parameter_list ]
        '{' { enum_variant } '}'

enum_variant
    ::= IDENTIFIER [ '(' type_expression { ',' type_expression } ')' ]
      | IDENTIFIER '{' struct_field { struct_field } '}'
      | IDENTIFIER '=' expression
```

### 5.3 Trait Declarations

```bnf
trait_declaration
    ::= ['pub'] 'trait' IDENTIFIER
        [ type_parameter_list ]
        [ ':' trait_bound { '+' trait_bound } ]
        '{' { trait_item } '}'

trait_item
    ::= function_declaration
      | abstract_function_signature

abstract_function_signature
    ::= 'fn' IDENTIFIER
        [ type_parameter_list ]
        '(' [ parameter_list ] ')'
        [ '->' type_expression ] ';'
```

### 5.4 Impl Blocks

```bnf
impl_block
    ::= 'impl' [ type_parameter_list ] type_expression
        [ 'for' type_expression ]
        '{' { function_declaration } '}'
```

---

## 6. Type Expressions

```bnf
type_expression
    ::= primitive_type
      | array_type
      | tuple_type
      | reference_type
      | named_type
      | function_type
      | optional_type

primitive_type
    ::= 'Int'
      | 'Float'
      | 'Bool'
      | 'String'
      | 'Char'
      | 'Unit'
      | 'Never'

array_type
    ::= '[' type_expression ']'
      | '[' type_expression ';' INTEGER_LITERAL ']'   (* fixed-size array, draft *)

tuple_type
    ::= '(' type_expression ',' type_expression { ',' type_expression } ')'

reference_type
    ::= '&' type_expression
      | '&' 'mut' type_expression

named_type
    ::= IDENTIFIER [ '<' type_expression { ',' type_expression } '>' ]
      | import_path [ '<' type_expression { ',' type_expression } '>' ]

function_type
    ::= 'fn' '(' [ type_expression { ',' type_expression } ] ')' '->' type_expression

optional_type
    ::= type_expression '?'   (* draft *)
```

---

## 7. Statements

```bnf
statement
    ::= variable_declaration
      | expression_statement
      | return_statement
      | if_statement
      | while_statement
      | for_statement
      | loop_statement
      | break_statement
      | continue_statement
      | match_statement
      | block_expression

expression_statement
    ::= expression ';'

return_statement
    ::= 'return' [ expression ] ';'

break_statement
    ::= 'break' [ expression ] ';'

continue_statement
    ::= 'continue' ';'
```

---

## 8. Control Flow Statements

### 8.1 If / Else

```bnf
if_statement
    ::= 'if' expression block_expression
        { 'else' 'if' expression block_expression }
        [ 'else' block_expression ]
```

### 8.2 While Loop

```bnf
while_statement
    ::= 'while' expression block_expression
```

### 8.3 For Loop

```bnf
for_statement
    ::= 'for' pattern 'in' expression block_expression
```

### 8.4 Loop

```bnf
loop_statement
    ::= 'loop' block_expression
```

---

## 9. Match Expression

```bnf
match_statement
    ::= 'match' expression '{' { match_arm } '}'

match_arm
    ::= pattern [ 'if' expression ] '=>' ( expression | block_expression ) [ ',' ]

pattern
    ::= '_'
      | literal_pattern
      | identifier_pattern
      | tuple_pattern
      | struct_pattern
      | enum_pattern
      | range_pattern
      | or_pattern

literal_pattern
    ::= INTEGER_LITERAL
      | FLOAT_LITERAL
      | BOOL_LITERAL
      | CHAR_LITERAL
      | STRING_LITERAL

identifier_pattern
    ::= ['mut'] IDENTIFIER
      | IDENTIFIER '@' pattern

tuple_pattern
    ::= '(' pattern { ',' pattern } ')'

struct_pattern
    ::= IDENTIFIER '{' { IDENTIFIER ':' pattern ',' } [ '..' ] '}'

enum_pattern
    ::= IDENTIFIER '(' pattern { ',' pattern } ')'

range_pattern
    ::= expression '..' expression
      | expression '..=' expression

or_pattern
    ::= pattern '|' pattern
```

---

## 10. Expressions

Expressions are listed in **descending precedence** (highest precedence first).

```bnf
expression
    ::= assignment_expression

assignment_expression
    ::= logical_or_expression
      | place_expression assignment_operator expression

assignment_operator
    ::= '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '&=' | '|=' | '^='
      | '<<=' | '>>='

logical_or_expression
    ::= logical_and_expression { '||' logical_and_expression }

logical_and_expression
    ::= equality_expression { '&&' equality_expression }

equality_expression
    ::= relational_expression { ( '==' | '!=' ) relational_expression }

relational_expression
    ::= range_expression { ( '<' | '>' | '<=' | '>=' ) range_expression }

range_expression
    ::= additive_expression [ '..' additive_expression ]
      | additive_expression [ '..=' additive_expression ]

additive_expression
    ::= multiplicative_expression { ( '+' | '-' ) multiplicative_expression }

multiplicative_expression
    ::= cast_expression { ( '*' | '/' | '%' ) cast_expression }

cast_expression
    ::= unary_expression [ 'as' type_expression ]

unary_expression
    ::= [ '-' | '!' | '&' | '&' 'mut' | '*' ] postfix_expression

postfix_expression
    ::= primary_expression { postfix_suffix }

postfix_suffix
    ::= '.' IDENTIFIER
      | '.' IDENTIFIER '(' [ argument_list ] ')'
      | '[' expression ']'
      | '(' [ argument_list ] ')'
      | '?'                           (* error propagation, draft *)

primary_expression
    ::= literal
      | IDENTIFIER
      | '(' expression ')'
      | tuple_expression
      | array_expression
      | block_expression
      | if_expression
      | match_expression
      | closure_expression
      | struct_init_expression
      | 'self'

argument_list
    ::= expression { ',' expression } [',']
      | IDENTIFIER ':' expression { ',' IDENTIFIER ':' expression } [',']  (* named args, draft *)
```

---

## 11. Primary Expressions

### 11.1 Literals

```bnf
literal
    ::= INTEGER_LITERAL
      | FLOAT_LITERAL
      | BOOL_LITERAL
      | CHAR_LITERAL
      | STRING_LITERAL

INTEGER_LITERAL
    ::= DECIMAL_LITERAL
      | HEX_LITERAL
      | BINARY_LITERAL
      | OCTAL_LITERAL

DECIMAL_LITERAL   ::= [1-9] { [0-9_] } | '0'
HEX_LITERAL       ::= '0x' HEX_DIGIT { HEX_DIGIT | '_' }
BINARY_LITERAL    ::= '0b' ('0' | '1') { '0' | '1' | '_' }
OCTAL_LITERAL     ::= '0o' [0-7] { [0-7] | '_' }
FLOAT_LITERAL     ::= DECIMAL_LITERAL '.' DECIMAL_LITERAL [ EXPONENT ]
EXPONENT          ::= ('e' | 'E') [ '+' | '-' ] DECIMAL_LITERAL
BOOL_LITERAL      ::= 'true' | 'false'
CHAR_LITERAL      ::= "'" ( CHAR_CHAR | ESCAPE_SEQ ) "'"
STRING_LITERAL    ::= '"' { STRING_CHAR | ESCAPE_SEQ } '"'
```

### 11.2 Block Expression

```bnf
block_expression
    ::= '{' { statement } [ expression ] '}'
```

The optional trailing expression is the value of the block.

### 11.3 Closure Expression

```bnf
closure_expression
    ::= '|' [ closure_param_list ] '|' [ '->' type_expression ] ( expression | block_expression )
      | '||' [ '->' type_expression ] ( expression | block_expression )

closure_param_list
    ::= closure_param { ',' closure_param }

closure_param
    ::= ['mut'] IDENTIFIER [ ':' type_expression ]
```

### 11.4 Struct Initialization

```bnf
struct_init_expression
    ::= IDENTIFIER '{' { IDENTIFIER ':' expression ',' } '}'
      | IDENTIFIER '{' { IDENTIFIER ':' expression ',' } '..' expression '}'
```

### 11.5 Array Expression

```bnf
array_expression
    ::= '[' ']'
      | '[' expression { ',' expression } [','] ']'
      | '[' expression ';' expression ']'   (* repeat expression, draft *)
```

### 11.6 Tuple Expression

```bnf
tuple_expression
    ::= '(' ')'
      | '(' expression ',' ')'
      | '(' expression ',' expression { ',' expression } [','] ')'
```

---

## 12. Lexical Tokens (Summary)

```bnf
IDENTIFIER
    ::= ( LETTER | '_' ) { LETTER | DIGIT | '_' }

LETTER    ::= [a-z] | [A-Z]
DIGIT     ::= [0-9]
HEX_DIGIT ::= [0-9] | [a-f] | [A-F]

ESCAPE_SEQ
    ::= '\n' | '\t' | '\r' | '\\' | '\'' | '\"' | '\0'
      | '\x' HEX_DIGIT HEX_DIGIT
      | '\u{' HEX_DIGIT { HEX_DIGIT } '}'

LINE_COMMENT    ::= '//' { any character except newline }
BLOCK_COMMENT   ::= '/*' { any character } '*/'
DOC_COMMENT     ::= '///' { any character except newline }
```

---

## 13. Keywords

The following identifiers are reserved as keywords and cannot be used as identifiers:

```
as       break    const    continue  else     enum
false    fn       for      if        impl     import
in       let      loop     match     mut      pub
return   self     struct   trait     true     type
while    where
```

> 🚧 **Coming Soon** – Additional keywords may be reserved as the language specification matures. Soft keywords and contextual keywords are under consideration.

---

## See Also

- [Lexical Structure](/spec/lexical) — Detailed lexer rules
- [Grammar Specification](/spec/grammar) — Full EBNF grammar (work in progress)
- [AST Specification](/ai/ast) — Abstract Syntax Tree node types
- [Type Inference Model](/ai/type_inference) — How the type system works
