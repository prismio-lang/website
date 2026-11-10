---
title: Concurrency library
description: Prismio 0.2 ships no standard concurrency module; tasks and channels are language features rather than libraries.
status: planned
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [standard-library, concurrency, threads, channels, coming-soon]
related: [language/concurrency, stdlib, roadmap]
---

Prismio 0.2 has **no standard concurrency module**. Mutexes, safe synchronization types and
scheduling APIs are Coming Soon. Raw pointer atomics with an explicit memory ordering exist in [`std.raw`](/stdlib/raw), for code that works with hardware.

**Tasks and channels are not missing — they are language features rather than libraries.** `spawn`
and `join` are keywords, `async fn`, `await` and `scope { }` are language syntax (see [async and await](/language/async-await)), and `Task<R>` and `Future<T>` are language types; `Channel<T>` and its methods (`c.send(v)`,
`c.receive()`, `for msg in c`, ...) are lowered by the compiler in the same category as a Vec's
`push` and indexing. None of them need an import.
See [Concurrency](/language/concurrency) for the task model, the channel rules, and how AIF
classifies thread affinity.

What a concurrency *library* would add, and what this page is a placeholder for: a `select` over
several channels, a managed thread pool, safe synchronization types, and cancellation. A send that
cannot proceed blocks today, and there is no way to ask whether it would.
