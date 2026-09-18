---
title: Semantic analysis and types
description: The semantic passes that resolve Prismio names, types, overloads, calls, fields, flow, and program validity — and why a rejection reports every mistake it can find rather than stopping at the first.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [semantics, types, overloads]
related: [compiler/imports-and-symbols, compiler/ownership-and-drop-lowering, compiler/generics-and-monomorphization, compiler/diagnostics, aif/overview]
---

Every later stage of the compiler — allocation inference, LLVM generation — is allowed to assume the program in front of it is well-formed: every name resolved, every type assigned, every call bound to one specific overload. Semantic analysis is where that assumption is either established or the build stops. It resolves declarations and lexical scopes, assigns expression types, selects exact overloads, validates fields and enum variants, checks calls, and decides whether control flow returns or becomes unreachable — before ownership checks and code generation ever see the program.

Prismio does not lean on broad implicit numeric promotion. Width and signedness are part of a numeric type, not incidental to it, and a cast must be written explicitly wherever source and destination differ. `Int` itself is a 32-bit signed integer (`i32`). Overload selection therefore compares concrete argument types rather than ranking conversions, which is stricter than languages that will quietly widen an `Int` to an `I64` for you.

`src/sema/checker.psm` coordinates the passes; supporting modules divide builtins, types, symbols, generics, enums, ownership, and flow so each rule has one primary owner.

## See two integer widths refuse to mix

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let a: I64 = 10
    let b: Int = 5
    let c = a + b
    return 0
}
```

```bash
prismio check widths.psm
```

```text
error[P4001]: operator `+`: expected I64, found Int
 --> widths.psm:4:17
  |
4 |     let c = a + b
  |                 ^
error: aborting due to 1 previous error
```

`a` is `I64` and `b` is `Int` (32-bit); neither is a literal that could take either type, so there is no automatic widening to fall back on. The fix is an explicit cast, and once it's there the program both checks and runs:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let a: I64 = 10
    let b: Int = 5
    let c = a + (b as I64)
    println(c)
    return 0
}
```

```bash
prismio run widths.psm
```

```text
Built widths
15
```

## A worked example: one bad program, four diagnostics

Semantic analysis does not stop at the first error — it keeps checking and reports as many independent mistakes as it can find in one run, because a developer fixing errors one at a time and recompiling after each is exactly the loop this is meant to shorten. Four different literals, four different ways of not fitting their type:

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    let small: U8 = 999
    let wide = 4294967296
    let sum = 0 - 2147483648
    println(99999999999999999999999)
    println(small)
    println(wide)
    println(sum)
    return 0
}
```

```bash
prismio check literal_range.psm
```

```text
error[P4001]: integer literal `999` does not fit in U8
  --> literal_range.psm:4:21
   |
4 |     let small: U8 = 999
   |                     ^^^
error[P4001]: integer literal `4294967296` does not fit in Int
  --> literal_range.psm:5:16
   |
5 |     let wide = 4294967296
   |                ^^^^^^^^^^
error[P4001]: integer literal `2147483648` does not fit in Int
  --> literal_range.psm:6:19
   |
6 |     let sum = 0 - 2147483648
   |                   ^^^^^^^^^^
error[P4001]: integer literal `99999999999999999999999` is too large for any integer type
  --> literal_range.psm:7:13
   |
7 |     println(99999999999999999999999)
   |             ^^^^^^^^^^^^^^^^^^^^^^^
  note: the widest are `I64` and `U64`, at 64 bits
error: aborting due to 4 previous errors
```

Each literal is checked against the type it is used as — `U8` for `small`, `Int`'s own 32-bit range for a bare `let`, and the 64-bit ceiling once nothing narrower could possibly hold the value. None of these silently wrap: a literal that does not fit used to be accepted and truncated in silence, which is a worse failure than a compile error, because the program runs and prints a wrong number with no indication anything was lost. A deliberate `narrowing` cast (`300 as U8`, meaning 44) is a different, explicit operation and is not what this diagnostic is about.

## Analysis order

`analyzeModule` is the semantic entry point, and its ordering is part of the contract other stages rely on:

1. reset semantic type/symbol state and index top-level declarations;
2. collect generic templates and predeclare concrete functions and globals;
3. expand trait default methods and required generic specializations;
4. validate implementation coherence, orphan rules, members, and supertrait cycles;
5. synthesize dynamic trait-object structs and resolve opaque `impl Trait` returns;
6. analyze function bodies, globals, workloads, and expressions;
7. run ownership/extern-contract checks; and
8. leave a resolved `TypeInfo` on every expression that may reach **AIF** (the Adaptive Inference Framework — see [AIF overview](/aif/overview)) or **IR** (intermediate representation) generation.

Moving body analysis before predeclaration would break forward calls and mutual recursion. Running trait-object synthesis before conformance is known could create a vtable layout for an implementation that turns out to be invalid. Everything downstream — ownership checking, AIF, code generation — assumes this order already ran to completion.

## Builtins and source rewrites

`src/sema/builtins.psm` owns operations that look call-shaped in source but lower as compiler operations rather than as ordinary calls. Methods, operators, iteration, and selected standard-library behavior can all be rewritten to plain calls before overload resolution runs; the diagnostic for a failed rewrite should still name the source-level action the developer wrote, including a missing import when the rewrite depends on a standard module.

Source sugar is rewritten before final overload resolution in a few specific places: `semaStringComparison` and `semaStringConcatChain` route string operators to the operations that implement them while evaluating each operand exactly once; `semaForEachDesugar` and `semaForEachIterator` turn `for`-style iteration into explicit iterator calls; `semaPropertyRewrite` converts supported property-style access into a call; and `semaBecomeCall` replaces a node with its resolved call shape without discarding the original source span (needed so the diagnostic still points at what the developer wrote).

## Arrays: lengths, copies and views

An array's length lives on its `TypeInfo`, in `length` — `0` means the type does not know it. It is
set in three places and read everywhere else:

- `semaArrayLiteralExpr` and the literal branch of `semaCheckValue` give a literal its element count.
  A nested literal whose rows differ in length gets an element type of unknown length.
- `semaSizedArrayAnnotation` types `Array<T, N>` in a `let`, the one place a written length is
  read. `semaAnnotationInner` refuses a length anywhere else (a parameter, a return, a field, a type
  argument) and detaches it once reported, because a signature is typed more than once.
- `semaCheckArrayDecl` runs after the initializer and returns the binding's type: `[T]` and
  `Array<T>` take a known initializer length, `Array<T, N>` must match one, and a declaration with
  no initializer needs `N` and an element type with a zero.

The length survives a binding because `typeSemKey` writes it — `array#16:U32`, against the
unchanged `array:U32` for an unknown length — and `typeFromSemKey` reads it back. The key feeds
sema's variable-type table only; no IR is derived from it.

Two predicates in `src/ast/types.psm` are shared with code generation, so the two cannot disagree
about what a store or a binding does:

- `typeOwnsNothing(t)` — a number, `Bool`, `Char`, `Ptr` or a payload-less enum. An element must be
  one for an index store (which releases nothing it displaces), a zero-filled array, or a copy.
- `typeArrayCopies(t)` — the length is known and the elements own nothing. Then `let b = a` and
  `d = c` copy the elements; `semaCheckArrayCopy` requires equal, known lengths on assignment. An
  array without a known length is a view — a `[T]` parameter, and whatever is bound from one — and
  binding or assigning it shares the storage, which is the borrow a parameter already is.

A `Vec` binding with no initializer — `let items: Vec<Item>` — is given the `[]` it would otherwise
have to write by `semaDefaultEmptyVec`, before anything else looks at the declaration, so it is
checked and lowered exactly as `= []` and its IR is identical. It used to compile to an
uninitialised pointer. `Vec<T>?` is left alone: its absent value is `none`. Because this is a
sema rule rather than syntax, `src/` and `std/` must not rely on it until the seed has been
refreshed — the seed would still compile the short form to that uninitialised pointer.

`x[i] = v` is decided in `semaIndexAssignment` before the ordinary assignment path. A `Vec` or a
`Slice` is rewritten by `semaVecLowerIndexStore` into `list_set` / `slice_set` — the call
`v.set(i, x)` lowers to — and checked as that call. An array of elements that own nothing keeps the
assignment for codegen's element-address store. Everything else is refused with the spelling that
works. Assignment also sends a bare integer literal through `semaCheckValue`, so `w = 4294967296`
into an `I64` adopts the type and range-checks exactly as a `let` does.

## Flow and program validity

`src/sema/flow.psm` tracks returns, unreachable statements, loop behavior, and the facts safe lowering depends on. `semaStmtDiverges` identifies returns, breaks, continues, fully diverging `if` chains, and unbroken infinite `loop` statements; `semaBlockDiverges` walks a block until one statement prevents fall-through. The private `semaBlockHasBreak` and `semaIfHasBreak` helpers stop a `loop` that has any reachable structured `break` from being misclassified as divergent — get this wrong and either a live path is called unreachable, or a function that never returns is accepted as if it does.

## If you are changing semantic analysis

### Expression and statement functions

`semaExpr(module, expr)` is the central dispatcher. It handles literal types, identifier lookup, unary/binary operators, calls, members, indexing, casts, optionals, arrays, lists, structs, closures, dynamic values, and builtins, returning a `TypeInfo` that it also stores on the node. `semaStatement` checks one statement against its enclosing function's expected return type. `semaBlock` manages scope, analyzes the statement chain, and invokes the flow checks above. `semaFunction` creates the parameter scope, validates the body, checks return behavior, and closes the scope; `semaPredeclareFunction` and `semaPredeclareGlobal` establish names before any body executes, which is what step 2 of the analysis order depends on.

`semaTypeErrorAt` compares an expected and actual `TypeInfo` and formats the source-level diagnostic — this is what produced every `error[P4001]` above. `typeEquals` is structural for applied builtins/generics and nominal where the language requires identity. Three different string forms of a type exist for three different audiences and must not be swapped: `typeDisplay` is for humans (diagnostic text), `typeSemKey` is for semantic caches, and `typeIrKey` is for lowering.

### Builtins and calls in detail

`semaBuiltinCallType` returns the result type for compiler-known operations; `semaCheckBuiltinCall` validates arity, receiver/element types, mutation, ownership, and operation-specific constraints, across list, slice, `DataView`, string, task, channel, optional, and selected numeric operations. `semaTaskResultAllowed` and `semaSpawnArgAllowed` keep task application binary interface (ABI) values within representations the backend actually implements. `semaCheckUniqueArgs` prevents a uniquely-consumed value from being passed twice into one call. `semaCheckExternContracts` validates foreign-function-interface (FFI) ownership annotations, and only after types and parameter positions are already known — an FFI contract cannot be checked against a signature that has not been resolved yet.

A semantic change is only complete once it defines: accepted and rejected types, coercions, source-span ownership for diagnostics, overload interaction, flow behavior, ownership mode, generic specialization, dynamic dispatch behavior, AIF visibility, and the exact resolved form handed to code generation. New rules need a positive example, a focused rejection, and — where recovery or continued checking matters, as in the four-diagnostic example above — a multiple-error test proving the checker keeps going rather than stopping at the first mistake.
