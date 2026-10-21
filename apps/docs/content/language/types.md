---
title: Types
description: Primitive, numeric, aggregate, optional, and inferred types in Prismio 0.1, including integers of any width and the five float types.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-21"
tags: [types, integers, arbitrary-width, floats, bool, string]
related: [stdlib/number-text, language/arrays-and-lists, language/structs, language/optionals, language/conversions, specification/type-system]
---

Prismio is statically typed. Every binding, expression, parameter, field, and return value has a compiler-known type, and a type error is reported before LLVM code generation. User-defined structs and enums are nominal: a `Color` is not an `Int`, and one enum is not another.

Local types are inferred from initializers when no annotation is present. Inference does not make variables dynamically typed; once inferred, the type remains fixed.

| Type | Meaning |
| --- | --- |
| `Int`, `I32` | Signed 32-bit integer — two names for one type |
| `I8`, `I16`, `I64`, `Isize` | Other signed integers |
| `U8`, `U16`, `U32`, `U64`, `Usize` | Unsigned integers |
| `Int<N>`, `UInt<N>` | A signed or unsigned integer of any width from 1 to 8,388,608 bits — [see below](#integers-of-any-width) |
| `Float`, `F64` | 64-bit floating point — two names for one type |
| `F16`, `F32`, `F128`, `BF16` | The other [float types](#floating-point) |
| `Bool` | Boolean |
| `Char` | Byte character |
| `String` | Owned runtime string |
| `Ptr` | Raw pointer |
| `Array<T, N>` | Fixed-length array stored in place — in the function's frame, or in a struct as a field; `[T]` when the length comes from an initializer |
| `Vec<T>` | Owned, growable vector |
| `Slice<T>` | Copyable, bounds-checked view into a `Vec<T>` |
| `T?` | A `T` or `none`: a value for a scalar, a nullable pointer for a reference |

`Int` and `I32` are two spellings of the same signed 32-bit type, so they mix freely and a diagnostic names either as `Int`. `I32` is there so the signed widths read `I8`, `I16`, `I32`, `I64` beside the unsigned ones. Integer arithmetic otherwise requires matching widths.

**Why `Int` is 32 bits.** It was measured rather than inherited. A 32-bit index costs nothing on the machines Prismio targets (the same loop with a 32-bit or 64-bit index ran in the same time), and making overflow undefined to help the optimiser made three real programs slightly *slower*. What a wider `Int` does cost is data: a step over records of eight integer fields ran 1.33 times slower with 64-bit fields, because twice the bytes per cache line is half the SIMD lanes. Reach for `I64` where the *value* needs it, not as a habit: sums of many numbers, byte or time counts, file sizes, identifiers, hashes and anything compared with a 64-bit value from C. A 32-bit `Int` wraps silently, so a total that can pass about two billion should be an `I64` from the start.

Use an explicit cast for conversions:

```prismio
let small: U8 = 200
let widened: Int = small as Int
let ratio: Float = widened as Float / 2.0
```

`x as T` cannot fail: it truncates or saturates. `x as T?` is the conversion that can, and answers `none` when `x` is not a `T` -- `300 as U8?`, `3.5 as Int?`, `"4x" as Int?`. See [conversions](/language/conversions).

## Signed and unsigned integers

Prismio exposes exact-width integer types so storage and foreign interfaces can state their requirements directly.

| Signed | Width | Unsigned | Width |
| --- | ---: | --- | ---: |
| `I8` | 8 bits | `U8` | 8 bits |
| `I16` | 16 bits | `U16` | 16 bits |
| `Int` | 32 bits | `U32` | 32 bits |
| `I64` | 64 bits | `U64` | 64 bits |
| `Isize` | target pointer width | `Usize` | target pointer width |

`Isize` and `Usize` follow the selected compilation target. Do not serialize them as a fixed-size wire format. Use an exact-width type when file or network compatibility matters.

Arithmetic, bitwise operations, comparisons, and assignments normally require exact compatible operand types. Prismio will not automatically widen `U8` to `Int` or combine `Int` and `Float`.

Console output is intentionally broader: `print` and `println` provide exact overloads for every integer type, so values such as `U64` can be printed without a narrowing cast. This does not introduce implicit conversion into other expressions.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let small: U8 = 5
    let total: Int = small + 1
    return total
}
```

Cast before the operation:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let small: U8 = 5
    let total: Int = (small as Int) + 1
    return total - 6
}
```

Integer overflow wraps. `Int` is signed 32-bit, so `2147483647 + 1` is `-2147483648` rather than an error, and the same holds for the other sized integer types at their own widths.

Building with `--overflow-checks` turns that wrap into a reported error instead, naming the operator and the source position:

```
runtime error: integer overflow in `+` at main.psm:13
```

The flag is off by default and is a diagnostic aid, not a semantic change: a build without it emits exactly the same code it did before the flag existed. There are not yet explicit `wrapping_*` or `checked_*` forms, so code that intends to wrap has no way to say so and will be reported under the flag.

A `String` holds at most 2,147,483,647 bytes. Its length is an `Int`, so a longer string could not be indexed; the runtime reports an error rather than returning a truncated length if one is ever constructed from foreign code.

Beyond wrapping, integer overflow behavior is not yet frozen as a portable source-level guarantee. Do not build correctness or security invariants around debug-versus-optimized backend behavior.

## Integers of any width

`Int<N>` is a signed integer of exactly `N` bits and `UInt<N>` an unsigned one, for any `N` from 1 to 8,388,608 (LLVM's own limit). `N` is a whole-number literal.

A width that already has a name *is* that name, with one type behind both spellings: `Int<8>` is `I8`, `Int<16>` is `I16`, `Int<32>` is `Int`, `Int<64>` is `I64`, and `UInt<8>` to `UInt<64>` are `U8` to `U64`. They share overloads and mix without a cast. Every other width is a type of its own.

<!-- prismio-check: pass -->
```prismio
struct Rgb565 { r: UInt<5>, g: UInt<6>, b: UInt<5> }

fn pack(p: Rgb565) -> UInt<16> {
    return (((p.r as UInt<16>) << 11) | ((p.g as UInt<16>) << 5)) | (p.b as UInt<16>)
}

fn main() -> Int {
    let pixel = Rgb565 { r: 31, g: 32, b: 1 }
    let wide: Int<128> = 170141183460469231731687303715884105727
    if (wide as Int != -1) { return 1 }
    return pack(pixel) as Int - 64513
}
```

Arithmetic wraps at the width, as it does for the named integers: a `UInt<4>` holding 15 plus one is 0, and an `Int<24>` holding 8,388,607 plus one is -8,388,608. `--overflow-checks` reports that wrap at any width. Division, remainder, shifts and comparisons follow the signedness of the type, so a `UInt<128>` compares as unsigned. There is no implicit widening between integer types of different widths, any more than between `U8` and `Int`: cast.

A literal is checked against the width it ends up with, however wide:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let a: Int<24> = 9000000
    let b: UInt<128> = 340282366920938463463374607431768211456
    return 0
}
```

Converting a `Float` to one saturates at that width's bounds and sends NaN to 0, as it does for the named integers, and `x as Int<24>?` answers `none` when `x` does not fit.

**Printing.** Up to 64 bits, `print`, `println`, `toString` and `as String` work as they do for any integer, with no import: the value converts to `I64` or `U64` first. Past 64 bits there is no machine integer to print through, so those calls use `std.number_text`, and a file that prints a wider integer must `import std.number_text`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.number_text

fn main() -> Int {
    let big: UInt<128> = 340282366920938463463374607431768211455
    println(big)
    return 0
}
```

**What a wide integer cannot be, yet.** `Int<N>` and `UInt<N>` for an `N` that has no name do not implement the standard traits (`Eq`, `Ord`, `Copy`, `Default`, `Display`, `Key`): the trait implementations are written per type, and only the module that declares a trait or a type may implement one for the other. So they cannot be `Map` keys or `sort`ed through the trait-bounded APIs, though every operator works on them directly. A `Vec` also cannot hold an integer wider than 64 bits; wrap it in a struct. The open items are on the [roadmap](/roadmap).

## Floating point

Prismio has five float types:

| Type | Format | Width | Notes |
| --- | --- | ---: | --- |
| `F16` | IEEE 754 binary16 | 16 | Largest finite value 65,504 |
| `BF16` | bfloat16 | 16 | The range of `F32` with an 8-bit significand |
| `F32` | IEEE 754 binary32 | 32 | |
| `Float`, `F64` | IEEE 754 binary64 | 64 | The default; `F64` is another spelling of `Float` |
| `F128` | IEEE 754 binary128 | 128 | Computed by the C runtime's soft-float routines, so slower |

The set is closed. Unlike `Int<N>`, a float has no free width: `F<24>` and `Float<32>` are compile-time errors.

A float literal takes the float type its context gives it: `let x: F32 = 0.1`, `x * 0.5` and `f(0.25)` for a function taking an `F32` are all `F32`. Operands of different float types do not mix; cast one (`a as F64`). A cast to a narrower float rounds to nearest, to a wider one is exact, and between `F16` and `BF16`, neither of which holds the other, it goes through `F32`. A float converts to an integer by saturating, and an integer to a float by rounding; `x as F16?` is `none` when the value is too large for an `F16`.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let a: F32 = 1.5
    let h: F16 = 65504.0
    let wide: Float = (a as F64) + (h as F64)
    if (wide != 65505.5) { return 1 }
    let tooBig: Float = 70000.0
    if (tooBig as F16? != none) { return 2 }
    return 0
}
```

`print`, `println` and `toString` of `F16`, `F32`, `BF16` and `F128` come from `std.number_text` (`import std.number_text`). They print the fewest digits that read back as the same number *in that type*: an `F32` written `0.1` prints `0.1`, where its widening to a double would show `0.10000000149011612`. An `F128` prints as the double nearest it.

`Float` is an IEEE 754 binary64 value (ISO/IEC 60559), the same type as C's `double`. Arithmetic, `%` and ordered comparisons operate on two values of one float type; explicitly cast integers before mixing them with a float.

The IEEE special values behave as the standard says. `NaN != NaN` is `true` and every other comparison with a NaN is `false`. `-0.0` keeps its sign, so `1.0 / -0.0` is `-inf`. `%` is C's `fmod`, so its result takes the dividend's sign. Square roots, rounding, powers, logarithms, trigonometry and the `Float.PI`/`Float.INFINITY` constants are in [`std.math`](/stdlib/math), which also documents what is correctly rounded and what comes from the platform's C library.

The compiler may fuse `a * b + c` into one fused multiply-add, as C compilers do by default. Exception flags and rounding modes other than round-to-nearest are not exposed. Treat bit-for-bit reproducibility of transcendental functions across operating systems as an application-level responsibility.

## Boolean and character values

`Bool` contains `true` or `false` and is required by `if` and `while`. Logical `and`, `or`, and `!` operate on booleans and short-circuit where documented.

`Char` is an 8-bit byte character in 0.1. It is useful for byte-oriented C interfaces and basic character values, but it is not a Unicode scalar abstraction. Full Unicode processing would require a library and representation contract not present in the current standard runtime.

## Strings and raw pointers

`String` is an owned runtime string. It is move-only: assigning it to another owned binding transfers ownership unless the surrounding operation is a borrow. Use the string runtime operations documented under [standard library strings](/stdlib/strings).

`Ptr` represents an untyped raw pointer. It exists for runtime and foreign-function integration. Dereference operations, typed pointer arithmetic, provenance rules, and a source-level unsafe block are not defined in 0.1; most useful pointer behavior therefore lives behind `extern fn` declarations.

Both `String` and `Ptr` are reference-shaped: `String?` and `Ptr?` are nullable pointers. A scalar -- a number, `Bool`, `Char` or a fieldless enum -- may be optional too, as a present flag beside the value that costs no allocation. See [optionals](/language/optionals).

## Structs and enums

A `struct` declaration introduces a nominal, move-only aggregate. Field names and types define its stored data, but structurally identical declarations are not interchangeable.

An `enum` declaration introduces a named set of variants. A **fieldless** enum is copyable and lowers to integer ordinals, but it is its own type: a variant has the enum's type, `c as Int` names the ordinal, and `n as Color?` is the checked way back.

A variant may instead carry values, and an enum may be generic. An enum with any payload variant compiles to a tagged struct rather than an integer, which makes its values nominal and move-only — including the variants that carry nothing. See [enums](/language/enums) and [`Result`](/stdlib/option#result). Explicit discriminants are not supported.

```prismio
struct User { id: U64, active: Bool }
enum State { Starting, Ready, Stopped }
```

See [structs](/language/structs) and [enums](/language/enums) for construction and matching rules.

## Arrays, vectors, and slices

`Array<T, N>` is a fixed-length array stored in place: in the function's frame, or inside a struct as a field. Without an initializer it holds `N` zeroed slots; `[T]` and `Array<T>` take the length from an initializer instead. An array whose length is known is copied by `let b = a` and by assignment, while a `[T]` parameter is a view of the caller's array. A function declared `-> Array<T, N>` returns one by value. See [arrays, vectors, and slices](/language/arrays-and-lists#arrays) and [returning and storing arrays](/language/arrays-and-lists#returning-and-storing-arrays).

`Vec<T>` is the owned, growable vector. It is move-only, and it is used through its methods — `v.push(x)`, `v.length`, `v[i]`, `v.insert(i, x)`, `v.pop()` and the rest listed on the [Vec page](/stdlib/vec). It is built into the compiler and predates [generics](/language/generics) rather than being an instance of them — it has its own type kind, runtime, and handling in the memory model. Before 0.1's collections work it was spelled `List<T>`; that spelling is now an error naming `Vec<T>`.

`v.replace(index, value)` is the reclaiming replacement operation for boxed struct
elements. The compiler accepts it only for a locally created Vec that
has not exposed an element, been sliced, or crossed another borrowing call. It releases the
displaced object immediately. Use ordinary `v.set(index, value)` for inline flat elements or when
the Vec has already been observed; that operation preserves existing borrow safety conservatively
and does not promise immediate reclamation of a displaced boxed object.

`Slice<T>` is a compiler-known view type created with `v[start..<end]` or
`slice[start..<end]` (or `..` to include `end`). It copies as a three-part descriptor—Vec identity, offset, and length—and
does not own or copy the elements. The memory analysis extends the underlying Vec's lifetime when
a Slice escapes. See [arrays, vectors, and slices](/language/arrays-and-lists).

## Optional types

`T?` adds `none` to a type: any number, `Bool`, `Char`, a fieldless enum, a struct, a `String`, a `Vec` or a raw pointer. It is not accepted for arrays. A number's `T?` is a value, copied and never allocated; a reference's is a pointer that is null for `none`. See [optionals](/language/optionals).

```prismio
struct Entry { value: Int }

fn missing() -> Entry? {
    return none
}
```

Use `expect(value)` to obtain the underlying non-optional value after a runtime presence check, or `value ?? fallback` to supply one when it is `none`. Comparing with `none` does not automatically narrow the type.

## Cast behavior

Narrowing integer casts keep low bits. Signed widening sign-extends; unsigned, `Bool`, and `Char` widening zero-extends. Float-to-integer casts truncate toward zero and **saturate**: a value past the destination's range becomes its `MAX` or `MIN`, and NaN becomes 0. `1e10 as Int` is `Int.MAX`, never an arbitrary value.

Integer-to-float conversions can lose precision above 2⁵³. A cast states that the conversion is intentional; it does not prove the value is in range. Pointer-related casts and foreign ABI conversions should be isolated behind small, well-documented interfaces.

## Copy and move categories

Strings, vectors, and structs are move-only. Scalars, enums, arrays of a known length, and Slice
descriptors use value-copy semantics in 0.1.

| Category | Types | Assignment behavior |
| --- | --- | --- |
| Scalar copy | integers, `Float`, `Bool`, `Char`, `Ptr` | copies the value |
| Nominal copy | fieldless enums | copies the variant value |
| Aggregate copy | arrays of a known length, `Slice<T>` descriptors | copies the elements, or the view descriptor |
| View | a `[T]` parameter, and a name bound from one | names the caller's array; nothing is copied |
| Move-only | `String`, `Vec<T>`, structs, optional wrappers around owned references | transfers ownership in owning contexts |

Function calls add parameter modes: an ordinary parameter borrows move-only data, `sink` consumes it, and `inout` forms a mutable borrow. The complete rules are in [ownership and borrowing](/language/ownership-and-borrowing).

## Types not implemented

Prismio 0.1 has no tuples, user-defined type aliases, union types, function types (a
[closure](/language/closures) is passed as a generic `F`), arbitrary reference types, or
user-written lifetime types. An array's length is written on a local `let`, a return type or a
struct field; a parameter of one fixed length (`xs: Array<Int, 4>`) is not available yet — a `[T]`
parameter takes any length. Do not infer support from examples written for proposals or older documentation.
