# Semantic Model

The **semantic model** is the compiler phase that bridges the gap between raw parse trees and type-checked, name-resolved code. It is responsible for building the **symbol table**, resolving all names to their declarations, enforcing **scope rules**, and constructing the **control flow graph** used by later optimization and safety passes.

> 🚧 **Coming Soon** – The semantic model is under active development. Public APIs for querying the semantic model (e.g., from LSP plugins or compiler extensions) will be stabilized in a future release. This document describes the current internal design.

---

## Overview

The semantic analysis phase runs in several sub-passes over the AST:

```
AST (from parser)
     │
     ▼  1. Item Collection Pass
     │     Scans all top-level declarations, registers names
     │
     ▼  2. Import Resolution Pass
     │     Resolves `import` paths to module items
     │
     ▼  3. Name Binding Pass
     │     Resolves all identifier references to symbol table entries
     │
     ▼  4. Type Resolution Pass
     │     Resolves named types, checks type annotations
     │
     ▼  5. Control Flow Analysis
     │     Builds CFG, checks for unreachable code, missing returns
     │
     ▼  Resolved AST + Symbol Table
          (ready for type inference and borrow checking)
```

---

## 1. Symbol Table Structure

The symbol table maps **names** to **symbol definitions**. Each symbol carries:

```prismio
struct Symbol {
    id: SymbolId,
    name: String,
    kind: SymbolKind,
    visibility: Visibility,
    span: Span,
    scope: ScopeId,
    ty: TypeRef?,           // populated after type resolution
}

enum SymbolKind {
    Function(FunctionSig),
    Variable { mutable: Bool },
    Struct(StructDef),
    Enum(EnumDef),
    Trait(TraitDef),
    TypeParam(TypeParamDef),
    Module(ModuleId),
    Const,
}

struct FunctionSig {
    type_params: [TypeParamDef],
    params: [(String, TypeRef)],
    return_type: TypeRef,
}
```

The full symbol table is a flat map keyed by `SymbolId`:

```prismio
struct SymbolTable {
    symbols: HashMap<SymbolId, Symbol>,
    scopes: HashMap<ScopeId, Scope>,
    root_scope: ScopeId,
}
```

---

## 2. Scope Resolution

Prismio uses **lexical scoping**. Each block (`{ ... }`) introduces a new scope. Scopes form a tree rooted at the module scope.

```prismio
struct Scope {
    id: ScopeId,
    parent: ScopeId?,
    kind: ScopeKind,
    bindings: HashMap<String, SymbolId>,
}

enum ScopeKind {
    Module,
    Function,
    Block,
    Loop,
    Match,
    TypeParam,
}
```

**Scope lookup algorithm:**

1. Look in the current scope's `bindings`.
2. If not found, walk up to `parent` and repeat.
3. If the module scope is reached without a match, report a **name not found** error.

**Example:**

```prismio
fn outer() {
    let x = 10          // bound in outer's function scope

    fn inner() {
        let y = x + 1   // x resolved by walking up to outer's scope
        println(y)
    }

    inner()
}
```

### 2.1 Shadowing

Prismio allows **shadowing** — a new binding with the same name in an inner scope hides the outer one:

```prismio
let x = 5
let x = x + 1      // shadows previous x, evaluates to 6
println(x)          // prints 6
```

Each `let` creates a new `SymbolId` even if the name is identical. The borrow checker is aware of which version of a name is being referenced at each use site.

---

## 3. Name Binding

Name binding is the process of associating each **identifier use** in the AST with a **symbol definition** in the symbol table.

```prismio
// After name binding, each Ident node in the AST gains a resolved SymbolId:
enum IdentExpr {
    Unresolved(String),          // before binding
    Resolved(String, SymbolId),  // after binding
}
```

### 3.1 Forward References

Top-level items (functions, structs, enums, traits) support **forward references** — you can call a function before it is defined in the source file:

```prismio
fn main() {
    greet("Prismio")   // OK: greet is defined below
}

fn greet(name: String) {
    println("Hello, " + name + "!")
}
```

This is achieved by the **Item Collection Pass**, which first registers all top-level names before the Name Binding Pass begins.

### 3.2 Local Variables

Local variables do **not** support forward references. They must be declared before use:

```prismio
fn example() {
    println(x)     // Error: `x` used before declaration
    let x = 42
}
```

---

## 4. Type Resolution

After name binding, the type resolver converts all **syntactic type expressions** (`TypeExpr` AST nodes) into **semantic type references** (`TypeRef`), which are interned representations used by the type checker.

```prismio
// Semantic type representation (interned)
enum TypeRef {
    Int,
    Float,
    Bool,
    String,
    Char,
    Unit,
    Never,
    Array(TypeRef),
    Tuple([TypeRef]),
    Ref { mutable: Bool, inner: TypeRef },
    Named(SymbolId, [TypeRef]),   // struct/enum + type args
    Fn([TypeRef], TypeRef),
    TypeVar(TypeVarId),           // unification variable
    Error,                        // sentinel for recovery
}
```

### 4.1 Type Aliases

> 🚧 **Coming Soon** – Type alias declarations (`type Alias = ...`) are planned.

### 4.2 Generics Instantiation

When a generic function or struct is referenced, the type resolver records the **instantiation** — the concrete type arguments. Monomorphization of these instantiations happens later during code generation.

```prismio
fn identity<T>(value: T) -> T = value

// Usage: identity<Int>(42)
// Instantiation recorded: identity[T = Int]
```

---

## 5. Control Flow Graph (CFG)

The **Control Flow Graph** models the possible execution paths through a function body. It is used to verify:

- **Definite assignment**: every variable is assigned before use.
- **Return completeness**: every code path in a non-`Unit` function ends with a `return` or a value-producing tail expression.
- **Unreachable code**: code after `return`, `break`, or `continue`.
- **Borrow checker liveness**: the borrow checker uses liveness information derived from the CFG.

```prismio
struct ControlFlowGraph {
    entry: BasicBlockId,
    exit: BasicBlockId,
    blocks: HashMap<BasicBlockId, BasicBlock>,
}

struct BasicBlock {
    id: BasicBlockId,
    stmts: [CfgStmt],
    terminator: Terminator,
}

enum Terminator {
    Return(Expr?),
    Goto(BasicBlockId),
    Branch { condition: Expr, true_block: BasicBlockId, false_block: BasicBlockId },
    Match { scrutinee: Expr, arms: [(Pattern, BasicBlockId)] },
    Unreachable,
}
```

### 5.1 Example CFG

For the function:

```prismio
fn abs(x: Int) -> Int {
    if x < 0 {
        return -x
    }
    x
}
```

The CFG looks like:

```
entry
  │  (condition: x < 0)
  ├──true──► block_then ──► (return -x) ──► exit
  │
  └──false──► block_tail ──► (return x) ──► exit
```

---

## 6. Error Recovery

The semantic model is designed for **resilient error recovery**. When a name lookup fails or a type cannot be resolved, the compiler:

1. Emits a diagnostic with a precise span.
2. Substitutes an **error sentinel** (`TypeRef::Error`, `SymbolId::Error`) in place of the failed lookup.
3. Continues analysis so that subsequent passes can report additional errors without cascading from the same root cause.

This ensures that a single typo does not prevent the rest of the file from being analyzed, enabling the LSP to provide completions and diagnostics even in partially broken code.

---

## See Also

- [AST Specification](/ai/ast) — The AST that feeds into semantic analysis
- [Type Inference Model](/ai/type_inference) — Type inference built on the semantic model
- [Grammar (BNF)](/ai/grammar) — Syntactic structure
- [Memory Model Specification](/spec/memory) — Ownership and borrow rules
