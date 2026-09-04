---
title: Concurrency library
description: Prismio 0.1 ships no standard concurrency module; tasks and channels are language features rather than libraries.
status: coming-soon
version: "0.1.0"
lastUpdated: "2026-08-29"
tags: [standard-library, concurrency, threads, channels, coming-soon]
related: [language/concurrency, stdlib, roadmap]
---

Prismio 0.1 has **no standard concurrency module**. Synchronization types, mutexes, atomics and
scheduling APIs are Coming Soon, alongside the memory-ordering rules they require.

**Tasks and channels are not missing — they are language features rather than libraries.** `spawn`
and `join` are keywords and `Task<R>` is a language type; `Channel<T>` and its seven operations are
compiler builtins in the same category as `list_get` and `list_push`. None of them need an import.
See [Concurrency](/language/concurrency) for the task model, the channel rules, and how AIF
classifies thread affinity.

What a concurrency *library* would add, and what this page is a placeholder for: a `select` over
several channels, a managed thread pool, atomics and memory ordering, and cancellation. A send that
cannot proceed blocks today, and there is no way to ask whether it would.
