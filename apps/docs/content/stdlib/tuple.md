---
title: std.tuple
description: Tuple2, Tuple3 and Tuple4, the generic structs that the tuple syntax (a, b) stands for.
status: stable
version: "0.3.0"
lastUpdated: "2026-11-12"
tags: [tuple, stdlib]
related: [language/types, language/structs]
---

A function that has two answers, a quotient and a remainder, or a value and whether it was found, can return them together without declaring a struct for the pair:

<!-- prismio-check: pass -->
```prismio
import std.io

fn divide(a: Int, b: Int) -> (Int, Int) {
    return (a / b, a % b)
}

fn main() {
    let (quotient, remainder) = divide(17, 5)
    println(quotient, "remainder", remainder)
}
```

```
3 remainder 2
```

This module defines what that [tuple syntax](/language/types#tuples) means. You rarely import it: a file that writes `(a, b)` or `(Int, String)` gets the import added.

| Item | Meaning |
| --- | --- |
| `Tuple2<A, B>`, `Tuple3<A, B, C>`, `Tuple4<A, B, C, D>` | Generic structs with public fields `_0`, `_1`, … The type `(A, B)` is `Tuple2<A, B>`. |
| `tuple2(a, b)`, `tuple3(a, b, c)`, `tuple4(a, b, c, d)` | Build one, with the type arguments inferred. `(a, b)` is `tuple2(a, b)`; each argument is moved in. |
| `impl Copy` | When every element is `Copy`. This is what puts a tuple in a `Vec`. |
| `impl Eq` | When every element is `Eq`: `a.eq(b)`, and `a == b`, compare element by element. |

`t.0` is `t._0`. Tuples order, hash and print nowhere yet: there is no `Ord`, `Key` or `Display` for them, so a tuple is not a map key and is not printed whole. Print its elements.
