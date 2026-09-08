---
title: Native tasks and typed channels
description: The runtime model behind spawn, join, Task results, blocking Channel operations, ownership transfer, and current concurrency limits.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [runtime, concurrency, channels]
related: [compiler/closures-and-captures, aif/tiers-and-analysis-domains, performance/benchmark-contract]
---

`spawn` creates a native operating-system thread and returns a typed `Task<R>`; `join`
waits for completion and transfers the result. There is no persistent executor or work-stealing
pool in the current runtime.

Task frames package the callable and arguments in a runtime-compatible form. Ownership passed to a
task must be transferred or proven to remain valid until a join. AIF's thread-affinity facts
distinguish contained spawn/join work from values that remain shared across thread boundaries.

## Channels

`Channel<T>` is a compiler-supported typed blocking channel. The runtime uses a bounded ring with
mutex and condition-variable coordination. Send can block while full; receive blocks until a value
arrives or the channel closes. Channel ownership rules determine whether an element is copied,
moved, or shared.

The current implementation is a general synchronized channel, not a topology-specialized SPSC,
MPSC, or lock-free queue. User-facing atomics, mutex types, memory orderings, async functions, and
nonblocking I/O are not exposed.

Tests must cover successful transfer, close behavior, task results, moved arguments, join ordering,
and memory release. Concurrency failures require stress and sanitizer runs in addition to
deterministic unit cases.

## Task runtime

`prismio_task_spawn(fn, rkind, nargs, a0, a1, a2)` allocates a `PrismioTask`, records the erased
entry pointer, return-kind tag, and up to three lowered arguments, enables thread-safe memory mode,
and starts a Windows thread or POSIX pthread. `prismio_task_entry` marks worker-thread state,
calls `prismio_task_invoke`, stores the result, and performs thread-local memory cleanup.

The compiler generates task thunks when the ordinary function ABI cannot be called directly from
the erased runtime entry. `functionNeedsTaskThunk` currently checks string parameters/returns;
`taskThunkName` derives the symbol and `generateTaskThunk` packs or unpacks the runtime slots.

`prismio_task_await` joins exactly once and returns the task record. Typed join entry points then
select the result:

- `prismio_task_join` returns the integer form;
- `prismio_task_join_p` returns a pointer/owned aggregate handle;
- `prismio_task_join_v` waits for a void task; and
- `prismio_task_release` releases a task handle whose result lifecycle is complete.

Semantic helpers `semaSpawnArgAllowed` and `semaTaskResultAllowed` reject values the erased ABI
cannot preserve. AIF's `aif_con_spawn` distinguishes a task that is structurally joined from one
whose value may overlap the enclosing scope.

## Channel runtime

`chan_new(capacity)` allocates the queue, mutex, and condition variables. Capacity controls
bounded buffering; zero/invalid capacities follow the runtime's validated minimum behavior.

`chan_send` locks the channel, waits while the buffer is full, fails after close, enqueues one
erased message, signals a receiver, and unlocks. `chan_recv` waits while empty and open; after
close it drains queued messages before returning the closed/empty result. `chan_close` marks
closed and wakes both senders and receivers.

`chan_share` increments handle sharing, `chan_free` decrements it and destroys the queue and
synchronization objects only when the final handle is gone. `chan_len` reads the current queue
length under the lock.

The compiler's `Channel<T>` type preserves the element type even though C stores `void *`.
Scalar values are packed into pointer-width slots using the same scalar-bit rules as other erased
runtime boundaries; owned values transfer according to send/receive semantics.

Concurrency tests should include capacity one and larger buffers, blocked sender/receiver wakeups,
close while blocked, close after queued sends, multiple producers/consumers, task result ownership,
channel-handle sharing, cyclic payloads, and TSan runs. A deterministic unit case is necessary but
cannot replace repeated scheduling stress.
