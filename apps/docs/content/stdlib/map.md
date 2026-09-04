---
title: Map
description: The std.map hash table, the Key bound its keys satisfy, and why values stay scalar in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-29"
tags: [standard-library, map, collections, generics, traits, hash]
related: [stdlib/lists, language/generics, language/traits]
---

`Map<K, V>` is an associative container written in Prismio and shipped as `std/map.psm`. It is the first container in the language that is not built into the compiler, and it exists because [generics](/language/generics) do.

Import it explicitly. So does `std.io`: there is no prelude, and every standard module is imported the same way.

<!-- prismio-check: pass -->
```prismio
import std.map

fn main() -> Int {
    let ages = mapNew<Int, Int>()
    mapSet(ages, 1, 30)
    mapSet(ages, 2, 41)
    return mapGetOr(ages, 2, 0) - 41
}
```

## Operations

| Function | Meaning |
|---|---|
| `mapNew<K, V>()` | An empty map. Type arguments must be written; there is no argument to infer them from. |
| `mapLen(m)` | Number of entries. |
| `mapHas(m, key)` | Whether `key` is present. |
| `mapIndexOf(m, key)` | Position of `key`, or `-1`. |
| `mapGet(m, key)` | The value for `key` as an [`Option<V>`](/stdlib/option). |
| `mapGetOr(m, key, fallback)` | The value for `key`, or `fallback` when absent. |
| `mapSet(m, key, value)` | Insert or overwrite. Answers `true` if the key was already present. |
| `mapKeyAt(m, i)` / `mapValueAt(m, i)` | Iteration by position, in insertion order. |

`mapSet` returning whether the key existed is the one fact a caller cannot recover afterwards without a second lookup.

Prefer `mapGet` when a stored value could equal the fallback: `mapGetOr(m, k, 0)` cannot tell a stored `0` from a missing key, and `mapGet` can.

## Keys implement `Key + Copy`

`Map<K: Key + Copy, V>` requires identity from `Key` in `std.key` and storage
duplication from `Copy` in `std.copy`:

| Method | Meaning |
|---|---|
| `hash(self) -> Int` | Equal keys must hash equal. Unequal keys need not hash unequally. |
| `eq(self, other: Self) -> Bool` | Content equality. Not `==`, which compares pointers for `String`. |
| `copyOf(self) -> Self` | Required by `Copy`. The map keeps its keys, and a parameter is a borrow, so an owned key must be duplicated on the way in. |

`std.key` implements it for the integer types, `Char`, `Bool` and `String`. A user type becomes a
key by implementing it — two blocks, no registration:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.key
import std.copy

struct Point {
    x: Int,
    y: Int
}

impl Key for Point {
    fn hash(self) -> Int { return keyMixInt(self.x * 31 + self.y) }
    fn eq(self, other: Self) -> Bool { return self.x == other.x and self.y == other.y }
}

impl Copy for Point {
    fn copyOf(self) -> Self { return Point { x: self.x, y: self.y } }
}

fn main() -> Int {
    let places = mapNew<Point, Int>()
    mapSet(places, Point { x: 1, y: 2 }, 12)
    println(mapGetOr(places, Point { x: 1, y: 2 }, 0))
    return 0
}
```

`copyOf` is written in the `impl Copy` block, not repeated in the `impl Key` one.
Each block is checked against its own trait, and the map's two explicit bounds
require both implementations.

**`Float` deliberately has no `Key` impl.** NaN is not equal to itself, so a NaN key could be
inserted and never found again — a silently wrong answer. `Map<Float, V>` fails at the instantiation
with `Float does not implement \`Key\``.

## Values are scalars

`V` has no bound, so an owned value type — `String`, or a struct that owns anything — is a compile
error: *cannot move out of borrowed value `value`*. Store a handle or an index instead.

Bounding `V: Copy` as well was tried and reverted: it compiles and computes correct answers, and the
map then leaks every value it holds, because `mapGetOr`, `mapGet` and `mapValueAt` all return from
the values list and the analysis stops releasing a container it has seen escape. A container that
says it cannot hold something is better than one that holds it and leaks it.

## Lookup is constant time

`Map` is an open-addressed hash table: two dense parallel arrays in insertion order, plus a probe
table of indices into them. `mapIndexOf` probes rather than scans.

Insertion order is part of the contract, not an accident — `mapKeyAt` and `mapValueAt` iterate in
it, and rehashing moves slots rather than entries.

Measured against the association list this replaced, at identical checksums:

| entries | insert | lookup (miss) |
|---|---|---|
| 1 000 | 4.8x faster | 42x faster |
| 4 000 | 9.5x faster | 63x faster |
| 16 000 | 29x faster | 204x faster |

The ratio grows with the entry count, which is what O(n) → O(1) looks like rather than a constant
factor.

**There is no `mapRemove`.** Linear probing without deletion needs no tombstones and the probe can
stop at the first empty slot; adding deletion means revisiting every loop in the file.

## There is no separate Vec

`List<T>` is already the growable vector: its backing block doubles on push, eligible flat struct elements are stored inline, and `list_new_with_capacity` is its reserve. A distinct `Vec<T>` would be a second name for it. See [the list runtime](/stdlib/lists).
