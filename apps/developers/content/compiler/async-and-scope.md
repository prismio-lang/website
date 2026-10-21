---
title: async, await and scope
description: How async fn, Future<T>, await, scope and spawn blocks are lowered onto the task runtime, with no state machine and no new type.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-14"
tags: [async, await, scope, tasks, futures, lowering]
related: [runtime/tasks-and-channels, compiler/closures-and-captures, compiler/ownership-and-drop-lowering, aif/tiers-and-analysis-domains]
---

`async fn`, `await`, `scope { }` and `spawn { }` add no new type and no new runtime object. They
are four ways to build, start and wait for the task that `spawn f(x)` and `join t` already were,
and each is rewritten into that vocabulary before ownership analysis or code generation sees it.
The user-facing description is [Async and await](https://docs.prismio.org/language/async-await);
this page is the lowering, and the invariants it keeps.

## One type: `Future<T>` is `Task<T>`

`typeTask` builds a `PTR`-kinded type with a `child`, as it always did, and now names it
`Future<R>`. Both spellings are accepted where a type is written (`semaAnnotationType`), the sem
key is still `task:<inner>`, and `monoAnnotationFromType` writes a future back as an applied
`Future<..>` so a lifted block can name a captured future's type.

## The five rewrites

| Source | After sema | Where |
| --- | --- | --- |
| `async fn f` | the same `FUNCTION`; bit 4 of its attribute record (`nodeIsAsync`) | `parseAsyncFunctionDecl`, `fn_attrs.psm` |
| `await f(x)`, `f` async | a `CALL_EXPR` — the `JOIN_EXPR` becomes the call | `semaJoinExpr` |
| `f(x)`, `f` async, not awaited | a `SPAWN_EXPR` with `i2 = 1` around a copy of the call | `semaLazyFuture` |
| `spawn { b }` | `b` lifted to `fn Spawn$L$N(captures)`, async; then `spawn Spawn$L$N(captures)` | `semaSpawnBlock` |
| `scope { b }` | a `REGION_STATEMENT` with `i3 = 1` | `parseScopeStatement` |

`async` is stored in the function-attribute table (`fnAttrTable`) beside `export` and `naked`, keyed
by where the `fn` keyword is. That table survives the copy a generic instantiation makes, so an
`async fn identity<T>` stays async in every instantiation, and it costs nothing in the AST.

`await` and `join` are one node, `JOIN_EXPR`, with `i2 = 1` for `await`. What differs is only
where it may be written (`semaAsyncContext`, set by `semaFunction` from the function's flag), and
that awaiting a *direct call* of an async function collapses to the call.

### How the call knows whether it is awaited

`semaCallExpr` resolves the callee, and then asks whether it is async. If so, an enclosing `await`
or `spawn` has said "I want the call" by setting `CALL_EXPR.i3 = 7` before checking it; the call
answers `i3 = 8` and its plain return type, and the parent acts on that. With no mark the call is a
future, and `semaLazyFuture` rewrites it in place:

```
CALL_EXPR f(x)   ==>   SPAWN_EXPR (i2 = 1) { child1 = CALL_EXPR f(x) (i3 = 8, typed R) }  : Future<R>
```

Both shapes in one program:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

async fn double(x: Int) -> Int {
    return x * 2
}

async fn main() -> Int {
    // Awaited where it is called: this is just the call.
    let direct = await double(4)
    // Not awaited: sema rewrites it to `spawn double(21)`, a Future<Int>.
    let pending = double(21)
    let later = await pending
    println((direct + later).toString())
    return 0
}
```

```text
50
```

`semaExpr` caches a node's type, so the rewrite runs once. Everything after sema — the AIF walk,
the E-SPAWN-J proof that a `let t = spawn ...` is joined, the task-handle drop — sees a
`SPAWN_EXPR`, which is what it already handled.

### `spawn { }` is lifted, not closed over

The block's captures are found as a closure's are (`semaCollectCaptures`), checked as the function
the block will become — async, and with no scope around it, so a nested `spawn { }` is refused
for want of its own — and the block becomes the body of a generated function whose parameters
are the captures. The spawn is then an ordinary `spawn Spawn$L$N(a, b)`. A capture is therefore
moved exactly as a spawn argument is (`semaConsumeOperand`), and borrowed by the body exactly as a
parameter is. A closure would add a struct and a `call` method and give the runtime nothing to
call; the arguments of the task are already the struct's fields.

Moves recorded while the body was checked in the enclosing function are undone for the captures
afterwards (`ir_unmark_moved`), because the spawn is about to make the one real move.

## What a task may carry

A task is called through `void*` slots and answers through an `i32`, a word or nothing, so
`semaTaskSlotAllowed` admits a value when its IR key fits one word (a reference, a String, a
scalar, a scalar optional) and refuses arrays, slices and data views, which are frame storage.
`functionNeedsTaskThunk` generalises to every function whose own signature is not the runtime's:
the thunk (`generateTaskThunk`) takes the slots, converts each with `slotToScalar` and calls the real
function with its honest types, and converts the result with `scalarToSlot`. The result *lane*
(`taskResultLane`: `i32`, word, `void`) is decided from the callee's declared return type at both
ends, so the type the task produced and the one `await` reads cannot disagree. A function whose
arguments are references and whose result is an `Int`, a reference or nothing gets no thunk, and
the IR of every program that spawned before this change is byte-for-byte what it was.

A task target is named by *address* and a function defined later in the module does not exist yet,
so `generateSpawn` declares it first (`declareTaskTarget`) with the signature the definition will
give; `materialize_function` reuses the declaration. Lifted blocks are appended after everything
else, so before this a spawn of a function defined below it failed with `address of unknown
function`.

## `scope` in code generation

A `scope` is `prismio_scope_new` … `prismio_scope_end` around its block, and the end is emitted on
every way out. It is entered with `ir_region_enter`, the counter `return`, `break` and `continue`
already use to know how many arenas they leave, and `generateRegionExits` closes each level in
order: a level that was entered by a scope ends the scope, any other pops an arena. So no new
mechanism is needed to leave a scope correctly, and a scope and an arena can interleave.
`irTaskScopes` records, per function, which level belongs to which scope slot, and a `spawn`
inside registers with the innermost (`prismio_scope_spawn`). It is empty in every function that
writes no `scope`, so such functions emit what they emitted.

The AIF walk treats `i3 = 1` as a plain block, not a region: a scope has no name to place an arena
under, and nothing it starts may live on one.

## The runtime

`PrismioTask` gained `threaded` (a thread exists to wait for) and `refs`.

- `prismio_future_new` builds a task and starts nothing.
- `prismio_task_await` — behind `prismio_task_join`, `_join_p` and `_join_v` — runs an unstarted
  task **inline on the calling thread** and records it joined; a started one is waited for as
  before. A second await returns the stored result.
- `prismio_task_start(scope, fut)` puts a future on a thread (`spawn fut`), and registers it if
  it was this call that started it.
- `prismio_scope_spawn` is `spawn` plus registration; `prismio_scope_end` awaits each task and
  drops the scope's reference.
- `prismio_task_release` decrements `refs` and frees at zero, so the binding's drop and a scope's
  end can come in either order. A `spawn { }` used as a statement releases its own reference at
  once, which is how the scope comes to free it.

## What is not modelled, and why

- **A joined result is not an owned allocation to the analysis.** `JOIN_EXPR` yields no sites, so
  a struct or String that came back through a handle is never freed by the awaiter. `join` always
  did this; `await f(x)` avoids it because it is a call. The fix is a join that yields the task
  callee's return sites, with the same change in the Python oracle's `T` domain.
- **`await` blocks.** The lowering has no suspension point, so an `await` of a future running on
  another thread is a `pthread_join`. The call-yields-task, await-runs-or-joins interface is what a
  pool or a state machine would have to keep.
- **Three slots.** A held future or a task carries at most three arguments.

Tests: `tests/test_289_async_await.psm`, `tests/test_290_scope_spawn.psm`, and
`tests/neg_271` through `neg_278`.
