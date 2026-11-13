---
title: HashMap and HashSet
description: The std.map hash table and the set built on it — creating one, map literals, its methods, O(1) removal, the Key bound its keys satisfy, and how a map owns its values.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [standard-library, map, set, hashmap, hashset, collections, generics, traits, hash]
related: [stdlib/vec, language/generics, language/traits]
---

`HashMap<K, V>` is an associative container written in Prismio and shipped as `std/map.psm`. It is the first container in the language that is not built into the compiler, and it exists because [generics](/language/generics) do.

Import it explicitly. So does `std.io`: there is no prelude, and every standard module is imported the same way.

**Not available yet:** a sorted map; an `entry(key)` handle (`getOrInsert`, `getOrInsertWith` and `update` cover its common uses with one lookup each); changing a stored value in place (see [Owned values](#owned-values)); `shrinkToFit`; and a `Hash` trait that lets a composite key feed its fields to a hasher, in place of calling `keyMixInt` by hand. A sorted map is planned; sorting the keys gives a sorted traversal until then — see [what else is missing](/language/arrays-and-lists#not-available-yet). A set is [`HashSet`](#hashset), below.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.option
import std.string

fn main() -> Int {
    let stock: HashMap<String, Int> = { "apples": 12, "pears": 4, "plums": 30 }
    println(stock.set("pears", 5) ?? -1)    // 4: the value it replaced
    stock["figs"] = 9                       // inserts or replaces, with no answer

    println(stock["apples"])                // 12
    println(stock.getOr("kiwis", 0))        // 0
    println(stock.contains("plums"))        // true

    println(stock.remove("apples"))         // true
    println(stock.remove("apples"))         // false: already gone
    println(stock.count)                    // 3

    for (name, count) in stock {
        println(name + " " + count.toString())   // figs 9, pears 5, plums 30
    }

    stock.clear()
    println(stock.isEmpty)                  // true
    return 0
}
```

## Creating a map

Five spellings, and they all build the same thing:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map

fn main() -> Int {
    let a = HashMap<String, Int>()              // the type, called
    let b: HashMap<String, Int> = HashMap()         // the annotation supplies <String, Int>
    let c: HashMap<String, Int>                 // no initializer: an empty map
    let d: HashMap<String, Int> = {}            // an empty literal
    let e = HashMap<Int, Int>.withCapacity(1000)  // room for 1000 entries before it grows

    c.set("ready", 1)
    println(a.count + b.count + c.count + d.count + e.count)   // 1
    return 0
}
```

**Calling a type calls its `new`.** `HashMap<String, Int>()` is `HashMap<String, Int>.new()`, and the same holds for any struct whose `impl` declares a `new` — `Parser(source)` calls `Parser.new(source)`. A type without one is an error that says so: *`Bare` has no `new`, so it cannot be called*.

The type arguments come from the call or from the context. `let m = HashMap()` has neither, and is an error: *`HashMap()` needs its type arguments*. `mapNew<K, V>()`, the older spelling, still works, and takes its arguments from an annotation the same way.

**A `let` with no initializer is an empty map**, as one of a `Vec` is an empty `Vec`. It is not a zeroed value that crashes on first use.

## HashMap literals

`{ key: value, ... }`, the way Python and JSON write one:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.string

fn main() -> Int {
    let ages: HashMap<String, Int> = {
        "Alice": 20,
        "Bob": 25,
    }
    let codes = { 200: "ok".length, 404: "not found".length }   // HashMap<Int, Int>
    let limits: HashMap<String, U8> = { "max": 255 }                // 255 is a U8 here

    let who = "Carol"
    let scores = { who: 91, "Dan": 78 }       // keyed on the *value* of `who`

    println(ages["Bob"] + codes[404] + scores["Carol"])   // 25 + 9 + 91
    println(limits["max"])                                  // 255
    return 0
}
```

- **Types.** Under an annotation, every key and value takes the annotation's type, so a literal `255` fits a `U8`. With no annotation, the first entry decides, as a `Vec` literal's first element does; a later entry of another type is *map literal value: expected Int, found String*.
- **Keys are expressions.** `{ who: 91 }` uses the value of `who`, as in Python — never the string `"who"`, as in JavaScript. A computed key such as `{ name.concat("!"): 1 }` is fine.
- **`{}` needs a type.** `let m: HashMap<String, Int> = {}` is an empty map; `let m = {}` has nothing to say what it maps, and is an error.
- **A key written twice is an error** when both are literals: *this key is already in the map literal*. Python keeps the second value silently, which is a classic bug. Two computed keys that happen to be equal cannot be seen at compile time; the later one wins, as `set` would.
- **Order is preserved.** Entries go in in the order they are written, so iteration visits them in that order.
- **A trailing comma is allowed**, and a literal may span lines.
- **Needs `import std.map`**, like every other use of `HashMap`.

A literal is sized once, for exactly its entries, so building it never grows the table.

**Two limits in 0.1.** A literal holding a *computed* owned key — `{ s.concat("!"): 1 }`, as opposed to a literal, a variable or an integer — leaks its map when it is stored straight into a struct field, and leaks the key when it is returned straight from a function; bind it to a `let` first. Literals of plain keys, which is nearly all of them, have neither problem. Separately, two different `HashMap<String, ...>` types in one program each holding a key built at run time leak one key copy. Both are gaps in the compiler's ownership analysis, not in the map, and are tracked.

## Operations

| On a `HashMap<K, V>` | Returns |
|---|---|
| `HashMap<K, V>()`, `mapNew<K, V>()` | an empty map. The type arguments may come from an annotation instead: `let m: HashMap<K, V> = HashMap()`. |
| `HashMap<K, V>.withCapacity(n)` | an empty map with room for `n` entries before it grows |
| `m.count`, `m.isEmpty`, `m.capacity` | `Int`, `Bool`, `Int`; [properties](/language/methods#properties). `capacity` is how many entries the map holds before its table next grows |
| `m.contains(key)` | `Bool` |
| `m.get(key)` | `V?`: the value, or `none` — [`??`](/language/optionals#none-coalescing) gives it a default |
| `m.getOr(key, fallback)` | the value, or `fallback` when the key is absent |
| `m[key]` | the value; **stops the program** with `panic: key not in map` when the key is absent |
| `m[key] = value` | inserts or replaces: `m.set(key, value)` with the answer dropped |
| `m.insert(key, value)` | `Bool`: stores only a **new** key and answers `true` when it was new; an existing value is left alone |
| `m.set(key, value)` | `V?`: stores unconditionally and answers the value it replaced, `none` when the key is new |
| `m.getOrInsert(key, value)` | the value for `key`, storing `value` first when the key is absent; one lookup |
| `m.getOrInsertWith(key, \|\| make())` | as `getOrInsert`, and `make` runs only when the key is absent |
| `m.update(key, \|v: Int\| v + 1)` | `Bool`: replaces an existing value with one lookup; the closure runs once on a hit and never on a miss |
| `m.remove(key)` | `Bool`: `true` if the key was there and is now gone |
| `m.take(key)` | `V?`: removes the entry and answers its value, or `none` |
| `m.retain(\|k: String, v: Int\| v > 10)` | removes the entries the closure rejects; the survivors keep their order |
| `m.reserve(n)` | room for `n` **more** entries, so the inserts after it do not grow the table |
| `m.clear()` | removes every entry and keeps the table's capacity |
| `m.keys()` | `Vec<K>`: a copy of every key, in position order |
| `m.values()` | `Vec<V>`: every value, in position order |
| `m.keyAt(i)`, `m.valueAt(i)` | the key and value at position `i`, for `0 <= i < m.count` |

**Reading and writing fail differently, on purpose.** `m[key]` reads and stops the program when the key is absent; `m[key] = value` inserts or replaces; `m.get(key)` answers an optional. Use `m[key]` for a key the program knows is there and `get` for one that may not be.

**`insert` and `set` are two different questions.** `insert` is "add this if it is not there" and answers whether it was new, as [`HashSet.insert`](#hashset) does. `set` is "make this the value" and answers what it displaced. Prefer `get` when a stored value could equal the fallback: `m.getOr(k, 0)` cannot tell a stored `0` from a missing key, and `m.get(k)` can.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.option
import std.string

fn main() -> Int {
    let counts: HashMap<String, Int> = {}
    for word in ["a", "b", "a", "c", "a"] {
        counts.getOrInsert(word, 0)               // one lookup, not has-then-set
        counts.update(word, |n: Int| n + 1)
    }
    println(counts["a"])                          // 3

    println(counts.insert("a", 99))               // false: already there, left alone
    println(counts.take("b") ?? -1)               // 1: removed, and its value handed back
    counts.retain(|word: String, n: Int| n > 1)
    println(counts.count)                         // 1: only "a" survived

    counts.reserve(1000)                          // room for 1000 more
    println(counts.capacity >= 1001)              // true
    counts.clear()
    println(counts.capacity >= 1001)              // true: clear keeps the table
    return 0
}
```

A `getOrInsertWith` factory must not touch the map it is filling; the key is looked up again after it returns, and a value the factory stored itself is the answer.

There are no free-function twins: the `map*` functions that older code used (`mapSet`, `mapGetOr`, `mapHas`, `mapLen`, ...) are gone, and `m.length` and `m.has(key)` are now `m.count` and `m.contains(key)`.

## Removal, and what it does to positions

`remove` is O(1). Positions follow insertion order **until the first removal**. A removal then moves the last entry into the removed one's position, so the order afterwards is not the order of insertion — in the example above, `plums` moved into the position `apples` left. This is the swap-remove that Rust's `IndexMap` offers; keeping insertion order instead would make every removal O(n).

Do not remove entries while walking the map: the entry moved into the gap would be skipped. Collect what to remove first, then remove it.

A removed entry is released at once, key and value alike. Removing many entries leaves no slow lookups behind: the table rebuilds itself in place once a quarter of it is removed entries. On the benchmark suite's `mixed_map_removal` workload the map runs in 10.9 ms, against 12.8 ms for C++'s `std::unordered_map` and 16.7 ms for Rust's `HashMap`.

## Walking the keys

`m.keys()` returns a `Vec<K>` holding a copy of every key, in position order. The `Vec` owns its copies and releases them with the rest of the program's values; the map keeps its own. To read the keys without copying them, walk the map instead, with `for (key, value) in m`, or by position with `keyAt`:

```prismio
for (name, count) in stock { println(name) }
for i in 0..<stock.count { println(stock.keyAt(i)) }
```

All of these visit the entries in position order.

## Keys implement `Key + Copy`

`HashMap<K: Key + Copy, V>` requires identity from `Key` in `std.key` and storage
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
    let places = HashMap<Point, Int>()
    places.set(Point { x: 1, y: 2 }, 12)
    println(places[Point { x: 1, y: 2 }])
    return 0
}
```

`copyOf` is written in the `impl Copy` block, not repeated in the `impl Key` one.
Each block is checked against its own trait, and the map's two explicit bounds
require both implementations.

**`Float` deliberately has no `Key` impl.** NaN is not equal to itself, so a NaN key could be
inserted and never found again — a silently wrong answer. `HashMap<Float, V>` fails at the instantiation
with `Float does not implement \`Key\``.

## Owned values

A value may be a `String`, a `Vec`, or a struct that owns a `String` — anything that implements [`Copy`](#keys-implement-key--copy): `V: Copy`, as `K: Key + Copy`. The map stores a copy of what it is given, releases it with the table, and **hands out copies, never the stored value itself**: `m[key]`, `get`, `getOr`, `take`, the answer of `set`, `getOrInsert`, `values()`, `valueAt` and a `for` loop all answer a fresh copy. That one rule is why the compiler can release the table: no reference into it ever escapes.

<!-- prismio-check: pass -->
```prismio
import std.copy
import std.io
import std.map
import std.option
import std.string
import std.vec

struct Person {
    name: String,
    age: Int
}

impl Copy for Person {
    fn copyOf(self) -> Self { return Person { name: self.name.clone(), age: self.age } }
}

fn main() -> Int {
    let titles: HashMap<String, String> = {}
    titles["ada"] = "analytical engine programmer"
    titles["alan"] = "computing machinery theorist"
    println(titles["ada"])                       // analytical engine programmer
    println(titles.getOr("grace", "unknown"))    // unknown
    println(titles.take("alan") ?? "-")          // computing machinery theorist

    let squads: HashMap<Int, Vec<Int>> = {}
    let members: Vec<Int> = [3, 5, 8]
    squads[1] = members
    println(squads[1].length)                    // 3

    let people: HashMap<String, Person> = {}
    people["ada"] = Person { name: "Ada".concat(" Lovelace"), age: 36 }
    let found = people["ada"]
    println(found.name)                          // Ada Lovelace
    return 0
}
```

What that costs, and what to know:

- **A read allocates a copy** of an owned value (a scalar's copy is free). `m[key]` of a `Vec` copies the whole `Vec`, so a value you change often is better kept small, or replaced whole: there is no `m[key].push(x)` — read the value, change the copy, store it back with `m[key] = copy`. An entry handle that reaches into the table is [planned](#operations).
- **A replaced or removed entry is released at once.** `m[key] = value`, `set`, `remove`, `take`, `retain` and `clear` free what they displace at the store, so a loop that replaces one value 20 000 times holds one of them at a time, not all 20 000. A `HashSet` does not yet: it releases what it displaced when the set goes.
- **Reading in place is fine.** `people["ada"].name != "x"`, `names["one"][1]`, `people["ada"].age > 3` — also on the right of `and`/`or` — copy nothing you keep and leak nothing. The copy is released once the comparison has read it.
- **A struct written inline is fine**: `people["ada"] = Person { name: word(1), age: 36 }` stores a copy and releases the literal's `name`.
- **A map literal with computed owned keys or values** (`{ word(1): word(2) }`) is one call up to twelve entries, and owned wherever it lands. Past twelve *computed* entries it falls back to a chain that leaks them; literals, names and numbers have no limit. Bind computed values first, or split the literal.
- A `struct` value needs `impl Copy`; without it the program says *`Report` does not implement `Copy`*, and names the impl to write. `Vec<T>` is `Copy` when `T` is, and so are the scalars, `String` and `Ptr`.

## Lookup is constant time

`HashMap` is an open-addressed hash table: two dense parallel arrays in insertion order, plus a probe
table of indices into them. A lookup probes rather than scans.

Position order is part of the contract, not an accident — `keyAt` and `valueAt` iterate in it, and
rehashing moves slots rather than entries. It is insertion order until the first removal; see
[removal](#removal-and-what-it-does-to-positions).

Measured against the association list this replaced, at identical checksums:

| entries | insert | lookup (miss) |
|---|---|---|
| 1 000 | 4.8x faster | 42x faster |
| 4 000 | 9.5x faster | 63x faster |
| 16 000 | 29x faster | 204x faster |

The ratio grows with the entry count, which is what O(n) → O(1) looks like rather than a constant
factor.

**Removal leaves a marker, not a hole.** A later key's probe may pass through the removed one's
bucket, so `remove` marks the bucket rather than emptying it: a lookup probes past a marker, and an
insertion reuses the first one it passes.

**The columns are private.** A map's two entry columns and its probe table are fields of `HashMap`, and
none of them is part of its surface: a program cannot read, push to or truncate one
(`field 'entryKeys' of 'HashMap$Int$Int' is private to the file that declares it`). The probe relies on two
facts about them -- a bucket is always inside the probe table, and an entry index read out of it is always
inside both entry columns -- and states them to the optimiser instead of checking them on every probe, so
a lookup carries no bounds check. A program that could resize a column would break both without the
compiler seeing it. Use `keyAt`, `valueAt`, `count` and the operations above.

## Vec

A map's keys, values and slots are each a [`Vec`](/stdlib/vec) — the growable vector, whose backing block doubles on push and stores flat elements inline.

## HashSet

`HashSet<K>` is a collection of distinct keys, in the same `std/map.psm` and under the same `import std.map`. It has the table `HashMap` has with the value column taken out, and the same bound on `K`: `Key + Copy`, so a `String` or a struct key is copied in and released with the set.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.string

fn main() -> Int {
    let seen = HashSet<String>()
    println(seen.insert("ada"))             // true: it was not there
    println(seen.insert("ada"))             // false: it was
    println(seen.contains("ada"))           // true
    println(seen.contains("grace"))         // false

    println(seen.remove("ada"))             // true: it was there
    println(seen.remove("ada"))             // false: already gone
    println(seen.isEmpty)                   // true
    return 0
}
```

| On a `HashSet<K>` | Returns |
|---|---|
| `HashSet<K>()`, `HashSet<K>.new()` | an empty set. `let s: HashSet<K>` with no initializer is an empty set too |
| `HashSet<K>.withCapacity(n)` | an empty set with room for `n` keys before it grows |
| `s.count`, `s.isEmpty`, `s.capacity` | `Int`, `Bool`, `Int`; [properties](/language/methods#properties). `capacity` is how many keys the set holds before its table next grows |
| `s.insert(key)` | `Bool`: `true` when the key was not there already |
| `s.contains(key)` | `Bool` |
| `s.remove(key)` | `Bool`: `true` when the key was there to remove |
| `s.take(key)` | `K?`: removes the key and answers the stored one, or `none` |
| `s.get(key)` | `K?`: the stored key that equals `key`, or `none` |
| `s.toggle(key)` | `Bool`: adds an absent key, removes a present one, and answers whether it is in the set afterwards |
| `s.retain(\|k: Int\| k > 0)` | removes the keys the closure rejects; the survivors keep their order |
| `s.reserve(n)` | room for `n` **more** keys, so the inserts after it do not grow the table |
| `s.clear()` | removes every key and keeps the table's capacity |
| `for key in s` | visits every key once |
| `a.union(b)`, `a.intersection(b)`, `a.difference(b)`, `a.symmetricDifference(b)` | a new `HashSet<K>`: A ∪ B, A ∩ B, A − B, A △ B. Both operands are left alone |
| `a.isSubsetOf(b)`, `a.isSupersetOf(b)`, `a.isDisjoint(b)` | `Bool` |
| `s.insertAll(other)`, `s.removeAll(other)`, `s.retainAll(other)` | add, remove, or keep only the keys found in `other`, a `HashSet<K>` or a `Vec<K>` |

`insert` answering whether the key was new is the one fact a caller cannot recover afterwards without a second lookup, as `set` is for a map. A set has no `keyAt`, `keys()` or `has`: walk it with `for`, test it with `contains`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map

fn main() -> Int {
    let a: HashSet<Int> = HashSet()
    let b: HashSet<Int> = HashSet()
    for i in 1..4 { a.insert(i) }          // 1 2 3 4
    for i in 3..6 { b.insert(i) }          // 3 4 5 6

    println(a.union(b).count)               // 6
    println(a.intersection(b).count)        // 2: 3 and 4
    println(a.difference(b).count)          // 2: 1 and 2
    println(a.symmetricDifference(b).count) // 4: 1 2 5 6
    println(a.isSubsetOf(a.union(b)))       // true
    println(a.isDisjoint(b))                // false

    println(a.toggle(1))                    // false: it was there, now it is not
    println(a.toggle(9))                    // true: it was not there, now it is
    a.retain(|n: Int| n > 3)
    for n in a { println(n) }               // 4, then 9
    return 0
}
```

**`get` and `take` answer a copy of the stored key.** A set holds keys of a `Key + Copy` type, so it keeps its own copy and cannot hand that one out; `take` releases the stored key and returns an equal copy. That is still what `contains` cannot tell you when two keys are equal but not identical — a struct keyed on `id` with a name beside it — and a `String` key that comes back is released like any other. Sharing one stored object between holders (interning) needs a set that owns its keys outright, which a set that stores copies, like a map's [owned values](#owned-values), does not give you.

**Order.** A `for` loop and the algebra visit keys in position order: insertion order until the first removal, then with the last key moved into the gap, as a map's. It is not a promise a program should lean on. `retain` is the exception that keeps its survivors in order.

**Do not remove from a set while walking it** — the key moved into the gap would be skipped. Collect first, or use `retain`. `s.removeAll(s)` and `s.retainAll(s)` are safe: both read `other` before they change anything.

A set is not a `HashMap<K, Bool>`. It holds its own columns, because a struct that holds a `HashMap` in a field of its own leaks the table; the probe is written out for it, and the two are tested against the same shapes.
