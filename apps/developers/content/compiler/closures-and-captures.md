---
title: Closures and captures
description: How Prismio rewrites closures into generated types and call functions while preserving capture ownership and allocation facts.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [closures, captures, ownership]
related: [compiler/traits-impls-and-dispatch, aif/tiers-and-analysis-domains, runtime/tasks-and-channels]
---

A closure is rewritten into a compiler-generated record containing its captures plus a generated
`call` function. Calling the closure then uses ordinary method and overload machinery.

## Capture semantics

Captures are by value in the current compiler. Capturing a move-only value transfers it into the
closure record; capturing a copy value copies it. Parameter types are explicit, and the body is
checked after the generated environment is available.

The rewrite must preserve source locations so diagnostics point to the closure expression rather
than synthetic declarations. Generated names must be collision-safe and deterministic because
self-hosted fixed-point checks observe compiler output.

## Memory consequences

The closure record is an ordinary allocation site from AIF's perspective. A capture creates a field
edge into that record. If the closure escapes, its captured values acquire at least the lifetime
required by the environment. Passing a closure to a native task additionally contributes
thread-affinity evidence.

## Lowering

Known closure calls can remain direct calls to a specialized generated function. Dynamic callable
forms follow the same object-safety and dispatch constraints as their trait representation. Tests
must cover capture moves, use-after-capture errors, generic closure contexts, returned closures,
and task transfer.

## Parsing and capture discovery

`atClosure` distinguishes closure syntax from surrounding expression forms.
`parseClosureExpr` records the parameter list, declared parameter types, and expression body as a
closure AST node. The body is still parsed as an ordinary expression, so calls, member access,
operators, nested closures, and source spans use the same nodes as function bodies.

`semaLowerClosure` owns semantic lowering. It first calls `semaClosureBodyType` to analyze the
body in a scope containing the closure parameters. `semaCollectCaptures` and
`semaCollectCapturesChain` walk the body; `semaClosureIsCapture` excludes parameters,
declarations local to the body, top-level symbols, and duplicate names.

Captures are by value. `semaClosureHasCapture` prevents duplicate fields.
`semaRewriteCaptures` replaces each captured identifier use with access through the generated
environment receiver. Move-only captured bindings are consumed from the enclosing scope; copying
them into a field while leaving the original usable would create two owners.

## Generated representation

`semaClosureName` combines a closure prefix, stable source identity, and specialization context.
The lowering appends:

- a synthetic struct with one field per capture;
- a synthetic call function whose first parameter is the environment/closure value;
- the rewritten closure body; and
- a struct literal expression that constructs the environment at the original closure site.

The generated declarations are ordinary concrete AST. They pass through ownership checking, AIF,
layout selection, struct registration, release-function generation, and LLVM code generation. A
capture-free closure may therefore become an empty environment plus a direct callable symbol;
an owning capture makes the generated struct droppable.

## Call lowering

Once sema has resolved the closure's generated call symbol, a known call is emitted through the
ordinary direct-call builder. The environment becomes the explicit first argument. This preserves
normal overload, borrow, sink, debug, and temporary-release behavior.

When a closure participates in a supported dynamic callable/trait representation, the erased data
pointer and function entry are carried by the dynamic record. `generateDynMake` constructs that
record. `generateDynCall` loads the table entry with `ir_ptr_slot`, passes the erased receiver,
and uses `ir_call_end_indirect`.

## Lifetime implications

The closure value owns its by-value environment fields. Returning the closure transfers that
environment to the caller. Passing it to `spawn` transfers it to the task when the task ABI and
captured types allow the move. Borrowing an outer value is not silently converted into a stored
reference; the current model intentionally avoids a closure outliving a borrowed stack binding.

A closure change needs parser-shape tests, capture ordering, shadowing, nested closures, capture-free
cases, scalar and move-only captures, use after capture, returned closures, generic specialization,
direct and dynamic calls, task transfer, generated release behavior, debug visibility, and stable
symbols across the self-hosted fixed point.
