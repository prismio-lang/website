---
title: Number text
description: The std.number_text module -- printing and converting to text an integer wider than 64 bits and the floats F16, F32, BF16 and F128.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-21"
tags: [standard-library, print, integers, floats, arbitrary-width]
related: [language/types, language/conversions, stdlib/io, stdlib/display]
---

`import std.number_text`. The numbers [`std.io`](/stdlib/io) prints have an overload each. These do not, and this module is what prints them: an integer wider than 64 bits, and the four floats other than `Float`.

## Integers wider than 64 bits

`print`, `println`, `toString`, `as String` and string interpolation (`"${x}"`) accept an `Int<N>` or `UInt<N>` of any width once the file imports this module. Up to 64 bits they need no import, since the value converts to `I64` or `U64` first.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.number_text

fn main() -> Int {
    let min: Int<128> = -170141183460469231731687303715884105728
    let top: UInt<256> = 1
    println(min)
    println(top << 255)
    return 0
}
```

```text
-170141183460469231731687303715884105728
57896044618658097711785492504343953926634992332820282019728792003956564819968
```

`toString(radix)` is not available past 64 bits. The call is rewritten to `intText(value, bits, signed)`, a generic function that takes the value apart in 32-bit digits and divides by 10^9, so nothing here needs a 128-bit division from the platform's runtime. It is quadratic in the width.

## `F16`, `F32`, `BF16` and `F128`

`print`, `println`, `toString()` and `toString(decimals)` are overloaded for each.

**`toString()` and `print` write the fewest digits that read back as the same number in the same type.** An `F32` written `0.1` prints `0.1`; printing its widening to a double would show `0.10000000149011612`, digits the type never had. `F16` needs at most 5 digits, `BF16` 4 and `F32` 9.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.number_text

fn main() -> Int {
    let third: F32 = 1.0
    println(third / 3.0)
    let h: F16 = 60000.0
    println(h * 2.0)
    return 0
}
```

```text
0.33333334
inf
```

`toString(decimals)` formats a fixed-point column, after widening to a `Float`. An `F128` prints as the `Float` nearest it, so a value that needs more than 17 digits is shown to 17.

## Why a separate import

A call into a module is allowed only from a file that imports it, and these types are used by few programs. The overloads belong beside `Float`'s in `std.io` and `std.string`, and move there once the bootstrap seed can read the type names; until then this module carries them.
