# Collections

Prismio's standard library provides a suite of generic collection types built on top of the core `Array<T>`. Collections are designed to work seamlessly with the ownership model, generic type parameters, and functional-style operations.

> 🚧 **Coming Soon** – The collections module is actively being implemented. `Array<T>` is fully available now. The types below — `List<T>`, `Map<K, V>`, `Set<T>`, `Queue<T>`, `Deque<T>`, and `Stack<T>` — are planned and partially specified. Code examples show the intended API.

---

## Overview

| Type | Status | Description |
|---|---|---|
| `Array<T>` | ✅ Available | Built-in, fixed-size (but growable) contiguous array |
| `List<T>` | 🚧 Coming Soon | Dynamic growable list (alias/wrapper over Array) |
| `Map<K, V>` | 🚧 Coming Soon | Hash map (key-value store) |
| `Set<T>` | 🚧 Coming Soon | Hash set (unique values) |
| `Queue<T>` | 🚧 Coming Soon | FIFO queue |
| `Deque<T>` | 🚧 Coming Soon | Double-ended queue |
| `Stack<T>` | 🚧 Coming Soon | LIFO stack |

---

## `Array<T>` — Currently Available

The built-in `Array<T>` is the workhorse of Prismio collections. It is a contiguous, heap-allocated, growable sequence with O(1) indexed access and O(1) amortized push to the end.

```prismio
// No import needed — Array<T> is in the prelude

let mut fruits: Array<String> = ["apple", "banana", "cherry"]

fruits.push("date")
println(fruits.length())  // 4
println(fruits[0])        // "apple"

let evens = [1, 2, 3, 4, 5, 6].filter(fn(x) -> x % 2 == 0)
// [2, 4, 6]

let squares = evens.map(fn(x) -> x * x)
// [4, 16, 36]

let sum = squares.reduce(0, fn(acc, x) -> acc + x)
// 56
```

For a complete `Array<T>` method reference, see [Core Types → Array](/stdlib/core-types#arrayt).

---

## `List<T>` — Planned

> 🚧 **Coming Soon**

`List<T>` will be a higher-level, more ergonomic dynamic list. Internally it uses the same heap-allocated contiguous storage as `Array<T>`, but provides a richer API and clearer semantics for lists that are expected to grow and shrink frequently.

```prismio
import std.collections.{ List }

fn main() {
    let mut list: List<Int> = List.new()
    list.add(10)
    list.add(20)
    list.add(30)

    println(list.size())        // 3
    println(list.get(1))        // Optional.some(20)

    list.removeAt(0)
    println(list.size())        // 2

    // Iteration
    for item in list {
        println(item)
    }

    // Functional ops
    let doubled = list.map(fn(x) -> x * 2)   // List<Int> [40, 60]
    let large = list.filter(fn(x) -> x > 15)  // List<Int> [20, 30]
}
```

**Planned methods:** `add`, `addAll`, `insert`, `remove`, `removeAt`, `get`, `set`, `size`, `isEmpty`, `contains`, `indexOf`, `clear`, `toArray`, `map`, `filter`, `reduce`, `forEach`, `sort`, `sortBy`, `reverse`, `subList`, `first`, `last`.

---

## `Map<K, V>` — Planned

> 🚧 **Coming Soon**

`Map<K, V>` will be a hash map providing O(1) average-case lookup, insertion, and deletion. Keys must implement the `Hash` and `Eq` traits.

```prismio
import std.collections.{ Map }

fn main() {
    let mut scores: Map<String, Int> = Map.new()

    scores.set("Alice", 95)
    scores.set("Bob", 87)
    scores.set("Carol", 92)

    println(scores.get("Alice"))     // Optional.some(95)
    println(scores.get("Dave"))      // Optional.none()

    scores.set("Alice", 98)          // update existing key
    println(scores.size())           // 3

    scores.remove("Bob")
    println(scores.containsKey("Bob"))  // false

    // Iteration
    for (key, value) in scores {
        println("${key}: ${value}")
    }

    // Functional
    let passing = scores.filter(fn(k, v) -> v >= 90)
    let names = scores.keys()      // Array<String>
    let values = scores.values()   // Array<Int>
}
```

**Planned methods:** `get`, `set`, `remove`, `containsKey`, `containsValue`, `size`, `isEmpty`, `keys`, `values`, `entries`, `getOrDefault`, `setIfAbsent`, `merge`, `map`, `filter`, `forEach`, `clear`, `toArray`.

### Map Literals (Planned)

```prismio
// Planned syntax for map literals
let config: Map<String, String> = Map {
    "host" => "localhost",
    "port" => "8080",
    "env"  => "production",
}
```

---

## `Set<T>` — Planned

> 🚧 **Coming Soon**

`Set<T>` will store unique values with O(1) average-case membership testing, insertion, and deletion. Values must implement `Hash` and `Eq`.

```prismio
import std.collections.{ Set }

fn main() {
    let mut tags: Set<String> = Set.new()

    tags.add("prismio")
    tags.add("programming")
    tags.add("prismio")   // duplicate — silently ignored

    println(tags.size())              // 2
    println(tags.contains("prismio")) // true

    tags.remove("programming")
    println(tags.size())              // 1

    // Set operations
    let a: Set<Int> = Set.from([1, 2, 3, 4])
    let b: Set<Int> = Set.from([3, 4, 5, 6])

    a.union(b)        // Set {1, 2, 3, 4, 5, 6}
    a.intersection(b) // Set {3, 4}
    a.difference(b)   // Set {1, 2} — in a but not b
    a.isSubset(b)     // false
    a.isDisjoint(b)   // false (they share 3 and 4)

    for tag in tags {
        println(tag)
    }
}
```

**Planned methods:** `add`, `remove`, `contains`, `size`, `isEmpty`, `union`, `intersection`, `difference`, `symmetricDifference`, `isSubset`, `isSuperset`, `isDisjoint`, `toArray`, `forEach`, `clear`.

---

## `Queue<T>` — Planned

> 🚧 **Coming Soon**

`Queue<T>` is a first-in, first-out (FIFO) data structure. Items are enqueued at the back and dequeued from the front.

```prismio
import std.collections.{ Queue }

fn main() {
    let mut queue: Queue<String> = Queue.new()

    queue.enqueue("task-1")
    queue.enqueue("task-2")
    queue.enqueue("task-3")

    println(queue.size())    // 3
    println(queue.peek())    // Optional.some("task-1") — look without removing

    let next = queue.dequeue()
    println(next)            // Optional.some("task-1")
    println(queue.size())    // 2
}
```

**Planned methods:** `enqueue`, `dequeue`, `peek`, `size`, `isEmpty`, `clear`, `toArray`.

---

## `Deque<T>` — Planned

> 🚧 **Coming Soon**

`Deque<T>` (double-ended queue) allows efficient insertion and removal from both the front and the back. It is useful for sliding window algorithms, breadth-first search, and implementing both stacks and queues.

```prismio
import std.collections.{ Deque }

fn main() {
    let mut deque: Deque<Int> = Deque.new()

    deque.pushBack(1)
    deque.pushBack(2)
    deque.pushFront(0)   // [0, 1, 2]

    println(deque.front())  // Optional.some(0)
    println(deque.back())   // Optional.some(2)

    deque.popFront()        // removes 0
    deque.popBack()         // removes 2
    println(deque.size())   // 1
}
```

**Planned methods:** `pushFront`, `pushBack`, `popFront`, `popBack`, `front`, `back`, `size`, `isEmpty`, `clear`, `toArray`.

---

## `Stack<T>` — Planned

> 🚧 **Coming Soon**

`Stack<T>` is a last-in, first-out (LIFO) data structure. Items are pushed and popped from the top.

```prismio
import std.collections.{ Stack }

fn main() {
    let mut stack: Stack<Int> = Stack.new()

    stack.push(10)
    stack.push(20)
    stack.push(30)

    println(stack.peek())   // Optional.some(30) — top element
    println(stack.pop())    // Optional.some(30) — removes top
    println(stack.size())   // 2

    while !stack.isEmpty() {
        println(stack.pop().unwrap())
    }
    // Prints: 20, 10
}
```

**Planned methods:** `push`, `pop`, `peek`, `size`, `isEmpty`, `clear`, `toArray`.

---

## Choosing the Right Collection

| Use case | Recommended type |
|---|---|
| Fixed or predictable-size sequence | `Array<T>` |
| Dynamic list with frequent growth/shrink | `List<T>` |
| Key-value lookup | `Map<K, V>` |
| Membership testing, deduplication | `Set<T>` |
| Task scheduling, BFS | `Queue<T>` |
| Sliding window, palindrome check | `Deque<T>` |
| Undo/redo, expression evaluation | `Stack<T>` |
| Call stack simulation, DFS | `Stack<T>` |

---

## Common Patterns (Using `Array<T>` Today)

Until `List<T>` and `Map<K, V>` are available, you can simulate common patterns:

### Simulating a Map with Array of Tuples

```prismio
let mut entries: Array<(String, Int)> = []
entries.push(("alice", 42))
entries.push(("bob", 17))

fn lookup(entries: Array<(String, Int)>, key: String) -> Optional<Int> {
    for (k, v) in entries {
        if k == key { return Optional.some(v) }
    }
    return Optional.none()
}

println(lookup(entries, "alice"))  // Optional.some(42)
```

### Simulating a Set with Array

```prismio
fn addUnique(mut arr: Array<String>, value: String) -> Array<String> {
    if !arr.contains(value) {
        arr.push(value)
    }
    return arr
}
```

---

## See Also

- [Core Types](/stdlib/core-types) — `Array<T>`, `Optional<T>`, and primitive types
- [Standard Library Overview](/stdlib/overview) — all stdlib modules
- [Pattern Matching](/language/control-flow/match) — destructuring collection elements
