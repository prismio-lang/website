---
title: Memory annotations and regions
description: Reference for unique, pin(Tn), named regions, region budgets, and AIF-related compiler directives in Prismio 0.1.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [annotations, unique, pin, region, aif]
related: [guides/memory-and-aif, compiler/aif, specification/memory-model]
---

Prismio exposes a small experimental source vocabulary for constraining Allocation Inference Framework (AIF) decisions. These annotations are accepted by the compiler, but their placement rules, tier meanings, thresholds, and diagnostics may change before 1.0.

Annotations refine analysis; they do not disable ownership or authorize unsafe behavior. A request that contradicts proven constraints is rejected.

## Status and intended use

Use annotations when testing AIF behavior, validating a performance assumption, or placing a strict allocation budget around a well-measured subsystem. Ordinary programs should first rely on compiler inference and the stable ownership modes documented elsewhere.

The experimental status means source compatibility is not promised across minor 0.x releases. Keep annotated code localized and record the compiler version used for performance results.

## unique bindings

Place `unique` after an optional `mut` and before the binding name:

```prismio
let unique item = make_item()
let mut unique queue: List<Item> = list_new()
```

`unique` expresses single-owner intent. The compiler rejects uses that introduce aliases inconsistent with it.

The binding grammar places `unique` after optional `mut` and before the binding name. It is an assertion that analysis may use, not an instruction to copy or clone the value.

```prismio
struct Task { id: Int }

fn create_task() -> Task {
    return Task { id: 1 }
}

let mut unique current = create_task()
```

An operation that would retain another incompatible alias can refute the assertion. Exact diagnostic wording and the set of tracked aliasing operations are experimental.

## Tier pins

`pin(Tn)` requests a specific AIF tier for a binding.

```prismio
let pin(T1) message = make_message()
```

The compiler verifies the request against analysis. A refuted pin is an error, not an instruction to generate unsafe memory behavior.

Tier pins belong beside a binding declaration:

```prismio
let pin(T1) message = make_message()
let mut pin(T2) worklist: List<Work> = list_new()
```

The public meaning of every tier and its cost model is not frozen. Do not describe `T1`, `T2`, or later tiers as permanent synonyms for one allocation mechanism unless the current [AIF compiler documentation](/compiler/aif) explicitly guarantees it.

Pins are useful as assertions in experiments: if compiler analysis cannot satisfy the requested tier, compilation fails rather than silently choosing behavior that violates the source request.

## Named regions

```prismio
region request {
    // region-scoped work
}

region bounded pin(4096) {
    // region with a 4096-byte budget
}
```

Regions require names. A byte budget can be rejected when inferred requirements exceed it. Tier names, inference thresholds, and accepted annotation placement are experimental and may change before 1.0.

The unbudgeted form names a lexical region:

```prismio
region request {
    let response = build_response()
    send(response)
}
```

The budgeted form adds `pin(number)` after the name. The number is a byte budget in the current implementation:

```prismio
region packet pin(2048) {
    let buffer = build_packet()
    write(buffer)
}
```

The compiler can reject a statically inferred requirement that exceeds the budget. Dynamic behavior, foreign allocation, and unsupported opaque operations remain outside what a source annotation can automatically prove.

## Interaction with ownership

Region exit and allocation tier selection do not make a moved binding readable, allow a borrow to escape, or change a `sink` call into a copy. Ownership is checked at the language level; AIF chooses or constrains an implementation strategy consistent with those checks.

A named region also does not introduce a namespace. Bindings inside it follow ordinary lexical scope and are unavailable after the closing brace.

A region you write is lexical in the other sense too: its arena is pushed at the opening brace and popped at every exit, including an early `return` or a `break` out of a loop around it. An arena the compiler places by itself is not held to that — it may open partway into a block and close before the closing brace, at the last use of what it serves — which is one reason a report distinguishes `region:auto` from a name you chose. Write `region` when you want the block to be the extent.

## Diagnostics and verification

Treat annotation failures as evidence that the requested performance/storage assertion is inconsistent with current analysis. Do not work around them by adding raw pointers unless the program genuinely intends an FFI-level responsibility.

When annotations matter to a deployment:

1. pin the Prismio compiler version;
2. keep a small compiler-checked reproducer;
3. record the selected target and optimization options;
4. test both accepted and deliberately refuted constraints; and
5. remeasure after a compiler upgrade.

## Current limitations

- Tier semantics and inference thresholds are experimental.
- Annotation placement may change before 1.0.
- AIF does not verify arbitrary foreign allocation behavior.
- Budget success is not a universal process-memory limit.
- Annotations are not a replacement for ownership-safe source structure.
- There is no stable user-defined allocator protocol or general lifetime annotation syntax.
