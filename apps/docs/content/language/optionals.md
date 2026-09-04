---
title: Optional reference values
description: Represent absence with T?, none, comparisons, and checked expect in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [optional, nullable, none, expect]
related: [language/types, language/structs, errors/optional-needs-unwrap]
---

Append `?` to a reference-shaped type to represent either a value or `none`. In 0.1, optional types are allowed for structs, strings, lists, and raw pointers—not scalar numbers, booleans, characters, enums, or arrays.

```prismio
let message: String? = none
let values: List<Int>? = none
let address: Ptr? = none
```

The annotation is important when the initializer is only `none`, because absence alone cannot identify the underlying type.

## Optional struct links

Optional struct references allow finite representation of linked data:

<!-- prismio-check: pass -->
```prismio
struct Node {
    value: Int,
    next: Node?
}

fn value_after(node: Node) -> Int {
    if (node.next == none) { return 0 }
    let next = expect(node.next)
    return next.value
}

fn main() -> Int {
    let tail = Node { value: 2, next: none }
    let head = Node { value: 1, next: tail }
    return value_after(head)
}
```

`Node?` permits the final `next` to be absent. Constructing `head` transfers the owned `tail` into the `next` field according to normal struct ownership rules.

## Testing for absence

An optional may be compared with `none` using `==` or `!=`. This does not flow-narrow its type. Call `expect(optional)` to obtain the non-optional value; the runtime checks for `none`. Accessing a member on `T?` without `expect` is a compile-time error.

```prismio
if (candidate == none) {
    println("missing")
} else {
    let present = expect(candidate)
    println(present.value)
}
```

The call to `expect` remains required in the `else` arm. The compiler does not currently preserve a path-sensitive proof that `candidate != none`.

<!-- prismio-check: fail -->
```prismio
struct Item { value: Int }

fn read(item: Item?) -> Int {
    if (item != none) {
        return item.value
    }
    return 0
}

fn main() -> Int { return read(none) }
```

Member access fails because `item` still has type `Item?`. Use `expect(item).value` after handling the absent case.

## `expect`

`expect(optional)` performs a runtime presence check and produces the underlying non-optional value when present. Passing `none` reaches the runtime failure path; 0.1 does not provide a catchable exception for that failure.

Use `expect` only after program logic has established that absence is not expected, or at a deliberate fail-fast boundary. If absence is normal, compare with `none` and select an explicit fallback before unwrapping.

Calling `expect` follows borrowing behavior for the owned optional in current compiler tests; it is not documented as consuming the caller merely to inspect a present value. Moving the unwrapped owned result into another owning location still follows normal ownership rules.

## Ownership

Wrapping a move-only value in `T?` does not change its ownership. Storing the value still transfers it to the new owned location.

<!-- prismio-check: fail -->
```prismio
import std.io

struct Item { value: Int }

fn main() -> Int {
    let item = Item { value: 4 }
    let optional: Item? = item
    println(expect(optional).value)
    return item.value
}
```

Creating `optional` moves `item`; the final access to the original binding is invalid.

## Unsupported forms

These constructs do not exist in 0.1:

- optional scalar types such as `Int?` or `Bool?`;
- optional chaining such as `value?.field`;
- nil-coalescing operators such as `??`;
- postfix force-unwrapping such as `value!`;
- `if let` or pattern-based optional binding;
- automatic flow narrowing after comparison; and
- a generic user-defined `Option<T>`.

Use an explicit `if`, comparison with `none`, and `expect`. For scalar absence, model the state with a fieldless enum plus a separately maintained value, or choose an application-specific sentinel only when its invariant is clear.
