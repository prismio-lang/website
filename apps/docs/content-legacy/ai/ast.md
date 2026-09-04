# AST Specification

The **Abstract Syntax Tree (AST)** is Prismio's internal representation of parsed source code. It is produced by the parser after lexical analysis and is the primary data structure consumed by all subsequent compiler phases: name resolution, type checking, borrow checking, IR generation, and tooling such as the LSP server.

> 🚧 **Coming Soon** – The AST node API is not yet publicly stable. This document reflects the current internal design and will be updated as the compiler matures toward a stable public interface.

---

## Overview

The Prismio AST is a **typed, immutable tree** of nodes. Each node carries:

- A **span** (source location: file, start byte offset, end byte offset)
- A **node kind** (the variant of the node)
- **Children** (sub-nodes or token references)
- An optional **node ID** for cross-referencing from later compiler phases

```
Source Text
    │
    ▼ Lexer
Token Stream
    │
    ▼ Parser
AST (Abstract Syntax Tree)
    │
    ▼ Name Resolution
Resolved AST + Symbol Table
    │
    ▼ Type Checker
Typed AST (TAST)
    │
    ▼ IR Generator
LLVM IR
```

---

## Node Structure

All AST nodes share a common base structure:

```prismio
struct AstNode {
    id: NodeId,
    span: Span,
    kind: AstKind,
}

struct Span {
    file: FileId,
    start: ByteOffset,
    end: ByteOffset,
}

struct NodeId(Int)    // Unique within a compilation unit
struct FileId(Int)    // Index into the file table
struct ByteOffset(Int)
```

---

## 1. Program Node

The root node of every parsed Prismio source file.

```prismio
struct ProgramNode {
    id: NodeId,
    span: Span,
    file: FileId,
    imports: [ImportDecl],
    declarations: [TopLevelDecl],
}
```

**JSON representation:**

```json
{
  "kind": "Program",
  "id": 0,
  "span": { "file": 0, "start": 0, "end": 412 },
  "imports": [...],
  "declarations": [...]
}
```

---

## 2. Declaration Nodes

Top-level declarations that appear directly in a source file or `impl` block.

### 2.1 FunctionDecl

```prismio
struct FunctionDecl {
    id: NodeId,
    span: Span,
    name: Ident,
    visibility: Visibility,
    type_params: [TypeParam],
    params: [Param],
    return_type: TypeExpr?,
    body: FunctionBody,
    attributes: [Attribute],
}

enum FunctionBody {
    Block(BlockExpr),
    Expression(Expr),   // fn add(a: Int, b: Int) -> Int = a + b
    Abstract,           // trait method with no body
}

enum Visibility {
    Public,
    Private,            // default
}
```

**Example AST for `fn add(a: Int, b: Int) -> Int = a + b`:**

```json
{
  "kind": "FunctionDecl",
  "name": "add",
  "visibility": "Private",
  "type_params": [],
  "params": [
    { "kind": "Param", "name": "a", "ty": { "kind": "NamedType", "name": "Int" } },
    { "kind": "Param", "name": "b", "ty": { "kind": "NamedType", "name": "Int" } }
  ],
  "return_type": { "kind": "NamedType", "name": "Int" },
  "body": {
    "kind": "Expression",
    "expr": {
      "kind": "BinaryExpr",
      "op": "+",
      "lhs": { "kind": "Ident", "name": "a" },
      "rhs": { "kind": "Ident", "name": "b" }
    }
  }
}
```

### 2.2 VariableDecl

```prismio
struct VariableDecl {
    id: NodeId,
    span: Span,
    mutable: Bool,
    name: Ident,
    type_annotation: TypeExpr?,
    initializer: Expr?,
}
```

### 2.3 StructDecl

```prismio
struct StructDecl {
    id: NodeId,
    span: Span,
    name: Ident,
    visibility: Visibility,
    type_params: [TypeParam],
    fields: [StructField],
}

struct StructField {
    id: NodeId,
    span: Span,
    name: Ident,
    ty: TypeExpr,
    visibility: Visibility,
}
```

### 2.4 EnumDecl

```prismio
struct EnumDecl {
    id: NodeId,
    span: Span,
    name: Ident,
    visibility: Visibility,
    type_params: [TypeParam],
    variants: [EnumVariant],
}

enum EnumVariant {
    Unit(Ident),
    Tuple(Ident, [TypeExpr]),
    Struct(Ident, [StructField]),
    Discriminant(Ident, Expr),
}
```

### 2.5 TraitDecl

```prismio
struct TraitDecl {
    id: NodeId,
    span: Span,
    name: Ident,
    visibility: Visibility,
    type_params: [TypeParam],
    super_traits: [TraitBound],
    items: [TraitItem],
}
```

### 2.6 ImplBlock

```prismio
struct ImplBlock {
    id: NodeId,
    span: Span,
    type_params: [TypeParam],
    self_ty: TypeExpr,
    trait_ty: TypeExpr?,   // None for inherent impls
    items: [FunctionDecl],
}
```

### 2.7 ImportDecl

```prismio
struct ImportDecl {
    id: NodeId,
    span: Span,
    path: ImportPath,
}

struct ImportPath {
    segments: [Ident],    // ["std", "io"] for `import std.io`
}
```

---

## 3. Expression Nodes

All expressions are represented by the `Expr` enum:

```prismio
enum Expr {
    Literal(LiteralExpr),
    Ident(IdentExpr),
    Binary(BinaryExpr),
    Unary(UnaryExpr),
    Call(CallExpr),
    MethodCall(MethodCallExpr),
    Field(FieldExpr),
    Index(IndexExpr),
    Block(BlockExpr),
    If(IfExpr),
    Match(MatchExpr),
    Closure(ClosureExpr),
    StructInit(StructInitExpr),
    Array(ArrayExpr),
    Tuple(TupleExpr),
    Cast(CastExpr),
    Range(RangeExpr),
    Return(ReturnExpr),
    Break(BreakExpr),
    Continue,
}
```

### 3.1 LiteralExpr

```prismio
enum LiteralExpr {
    Int(Int),
    Float(Float),
    Bool(Bool),
    Char(Char),
    String(String),
}
```

### 3.2 BinaryExpr

```prismio
struct BinaryExpr {
    op: BinaryOp,
    lhs: Expr,
    rhs: Expr,
}

enum BinaryOp {
    Add, Sub, Mul, Div, Rem,
    And, Or,
    Eq, Ne, Lt, Le, Gt, Ge,
    BitAnd, BitOr, BitXor,
    Shl, Shr,
    Assign,
    AddAssign, SubAssign, MulAssign, DivAssign, RemAssign,
}
```

### 3.3 CallExpr

```prismio
struct CallExpr {
    callee: Expr,
    args: [Argument],
}

enum Argument {
    Positional(Expr),
    Named(Ident, Expr),
}
```

### 3.4 ClosureExpr

```prismio
struct ClosureExpr {
    params: [ClosureParam],
    return_type: TypeExpr?,
    body: Expr,
    capture_mode: CaptureMode,
}

enum CaptureMode {
    ByRef,     // default
    ByValue,   // move closure
}
```

### 3.5 IfExpr

```prismio
struct IfExpr {
    condition: Expr,
    then_branch: BlockExpr,
    else_if_branches: [(Expr, BlockExpr)],
    else_branch: BlockExpr?,
}
```

### 3.6 MatchExpr

```prismio
struct MatchExpr {
    scrutinee: Expr,
    arms: [MatchArm],
}

struct MatchArm {
    pattern: Pattern,
    guard: Expr?,
    body: Expr,
}
```

---

## 4. Statement Nodes

```prismio
enum Stmt {
    Expr(ExprStmt),
    Let(VariableDecl),
    Return(ReturnStmt),
    Break(BreakStmt),
    Continue(ContinueStmt),
    While(WhileStmt),
    For(ForStmt),
    Loop(LoopStmt),
    Item(TopLevelDecl),   // nested function / struct / etc.
}
```

### 4.1 BlockExpr

A `BlockExpr` contains a sequence of statements and an optional trailing expression (the block's value):

```prismio
struct BlockExpr {
    stmts: [Stmt],
    tail_expr: Expr?,     // if Some, this is the block's value
}
```

---

## 5. Pattern Nodes

```prismio
enum Pattern {
    Wildcard,
    Literal(LiteralExpr),
    Ident(IdentPattern),
    Tuple(TuplePattern),
    Struct(StructPattern),
    Enum(EnumPattern),
    Range(RangePattern),
    Or(OrPattern),
}

struct IdentPattern {
    mutable: Bool,
    name: Ident,
    binding: Pattern?,    // `name @ pattern`
}

struct StructPattern {
    path: ImportPath,
    fields: [(Ident, Pattern)],
    rest: Bool,           // `..` present
}
```

---

## 6. Type Nodes

```prismio
enum TypeExpr {
    Named(NamedType),
    Array(ArrayType),
    Tuple(TupleType),
    Reference(RefType),
    Function(FnType),
    Infer,                // `_` — let the compiler infer
}

struct NamedType {
    path: ImportPath,
    args: [TypeExpr],     // generic arguments
}

struct ArrayType {
    element: TypeExpr,
    size: Expr?,          // None for dynamically-sized
}

struct RefType {
    mutable: Bool,
    inner: TypeExpr,
}

struct FnType {
    params: [TypeExpr],
    ret: TypeExpr,
}
```

---

## 7. Traversing the AST

> 🚧 **Coming Soon** – A stable visitor/traversal API will be exposed once the AST is stabilized.

The Prismio AST is designed for **recursive descent traversal**. The planned visitor API will follow a double-dispatch pattern:

```prismio
// Planned API (not yet available)
trait AstVisitor {
    fn visit_program(node: &ProgramNode) -> Unit
    fn visit_function_decl(node: &FunctionDecl) -> Unit
    fn visit_expr(expr: &Expr) -> Unit
    fn visit_stmt(stmt: &Stmt) -> Unit
    fn visit_type_expr(ty: &TypeExpr) -> Unit
    fn visit_pattern(pat: &Pattern) -> Unit
}
```

For now, compiler internals use **manual recursive matching** on the enum variants.

---

## 8. JSON Representation of AST Nodes

The compiler can emit the full AST as JSON for debugging and tooling:

```bash
prismio ast --json src/main.prism
```

> 🚧 **Coming Soon** – The `--json` flag and the stable JSON schema for AST nodes will be available in a future compiler release.

A sample JSON output for a simple program:

```json
{
  "kind": "Program",
  "file": "src/main.prism",
  "span": { "start": 0, "end": 87 },
  "imports": [
    {
      "kind": "ImportDecl",
      "path": ["std", "io"],
      "span": { "start": 0, "end": 13 }
    }
  ],
  "declarations": [
    {
      "kind": "FunctionDecl",
      "name": "main",
      "visibility": "Private",
      "params": [],
      "return_type": null,
      "body": {
        "kind": "Block",
        "stmts": [
          {
            "kind": "ExprStmt",
            "expr": {
              "kind": "Call",
              "callee": { "kind": "Ident", "name": "println" },
              "args": [
                { "kind": "Literal", "value": "Hello, Prismio!" }
              ]
            }
          }
        ],
        "tail_expr": null
      }
    }
  ]
}
```

---

## See Also

- [Grammar (BNF)](/ai/grammar) — Formal grammar that the AST reflects
- [Semantic Model](/ai/semantic_model) — Symbol table and name binding built from the AST
- [Type Inference Model](/ai/type_inference) — How types are resolved on the typed AST
- [Lexical Structure](/spec/lexical) — Tokens that form AST leaf nodes
