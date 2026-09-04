---
title: Types
description: Primitive, numeric, aggregate, optional, and inferred types in Prismio 0.1.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-25"
tags: [types, integers, floats, bool, string]
related: [language/arrays-and-lists, language/structs, language/optionals, specification/type-system]
---

Prismio is statically typed. Every binding, expression, parameter, field, and return value has a compiler-known type, and a type error is reported before LLVM code generation. User-defined structs are nominal. Enum declarations are named, but 0.1 enum values deliberately interoperate with `Int`, which weakens isolation between enum types.

Local types are inferred from initializers when no annotation is present. Inference does not make variables dynamically typed; once inferred, the type remains fixed.

| Type | Meaning |
| --- | --- |
| `Int` | Signed 32-bit integer |
| `I8`, `I16`, `I64`, `Isize` | Other signed integers |
| `U8`, `U16`, `U32`, `U64`, `Usize` | Unsigned integers |
| `Float` | 64-bit floating point |
| `Bool` | Boolean |
| `Char` | Byte character |
| `String` | Owned runtime string |
| `Ptr` | Raw pointer |
| `[T]` | Fixed-length stack array value |
| `List<T>` | Owned runtime list |
| `Slice<T>` | Copyable, bounds-checked view into a runtime list |
| `T?` | Nullable reference-shaped value |

`Int` is the spelling for signed 32-bit values; there is no separate `I32` type. Integer arithmetic requires matching widths. Use an explicit cast for conversions:

```prismio
let small: U8 = 200
let widened: Int = small as Int
let ratio: Float = widened as Float / 2.0
```

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
runtime error: integer overflow in `+` at app.psm:13
```

The flag is off by default and is a diagnostic aid, not a semantic change: a build without it emits exactly the same code it did before the flag existed. There are not yet explicit `wrapping_*` or `checked_*` forms, so code that intends to wrap has no way to say so and will be reported under the flag.

A `String` holds at most 2,147,483,647 bytes. Its length is an `Int`, so a longer string could not be indexed; the runtime reports an error rather than returning a truncated length if one is ever constructed from foreign code.

Beyond wrapping, integer overflow behavior is not yet frozen as a portable source-level guarantee. Do not build correctness or security invariants around debug-versus-optimized backend behavior.

## Floating point

`Float` is a 64-bit floating-point value. There is no `Float32` or `Float64` spelling in 0.1. Arithmetic and ordered comparisons operate on two `Float` values; explicitly cast integers before mixing them with a float.

Floating-point special values and edge cases inherit the current LLVM/backend behavior, but NaN ordering, exception flags, contraction, and cross-target reproducibility are not yet exhaustively specified. Treat exact numerical reproducibility as an application-level responsibility.

## Boolean and character values

`Bool` contains `true` or `false` and is required by `if` and `while`. Logical `and`, `or`, and `!` operate on booleans and short-circuit where documented.

`Char` is an 8-bit byte character in 0.1. It is useful for byte-oriented C interfaces and basic character values, but it is not a Unicode scalar abstraction. Full Unicode processing would require a library and representation contract not present in the current standard runtime.

## Strings and raw pointers

`String` is an owned runtime string. It is move-only: assigning it to another owned binding transfers ownership unless the surrounding operation is a borrow. Use the string runtime operations documented under [standard library strings](/stdlib/strings).

`Ptr` represents an untyped raw pointer. It exists for runtime and foreign-function integration. Dereference operations, typed pointer arithmetic, provenance rules, and a source-level unsafe block are not defined in 0.1; most useful pointer behavior therefore lives behind `extern fn` declarations.

Both `String` and `Ptr` are reference-shaped and may be written as `String?` or `Ptr?`.

## Structs and enums

A `struct` declaration introduces a nominal, move-only aggregate. Field names and types define its stored data, but structurally identical declarations are not interchangeable.

An `enum` declaration introduces a named set of variants. A **fieldless** enum is copyable and lowers to integer-like ordinals: variant expressions type as `Int`, and the checker permits `Enum`/`Int` compatibility.

A variant may instead carry values, and an enum may be generic. An enum with any payload variant compiles to a tagged struct rather than an integer, which makes its values nominal and move-only — including the variants that carry nothing. See [enums](/language/enums) and [Option and Result](/stdlib/option). Explicit discriminants are not supported.

```prismio
struct User { id: U64, active: Bool }
enum State { Starting, Ready, Stopped }
```

See [structs](/language/structs) and [enums](/language/enums) for construction and matching rules.

## Arrays, lists, and slices

`[T]` is a fixed-length stack array value. The length comes from the initializer and current compiler metadata rather than appearing in the source type spelling. Arrays are copied as values in 0.1.

`List<T>` is a compiler-known, owned runtime list. It is move-only and managed through list operations such as `list_new`, `list_push`, `list_len`, `list_get`, `list_set`, and `list_set_exclusive`. It is built into the compiler and predates [generics](/language/generics) rather than being an instance of them — it has its own type kind, runtime, and handling in the memory model.

`list_set_exclusive(list, index, value)` is the reclaiming replacement operation for boxed struct
elements. The compiler accepts it only for a locally created List that has not exposed an element,
been sliced, or crossed another borrowing call. It releases the displaced object immediately.
Use ordinary `list_set` for inline flat elements or when the List has already been observed; that
operation preserves existing borrow safety conservatively and does not promise immediate
reclamation of a displaced boxed object.

`Slice<T>` is a compiler-known view type created with `list[start..end]` or
`slice[start..end]`. It copies as a three-part descriptor—list identity, offset, and length—and
does not own or copy the elements. The memory analysis extends the underlying list's lifetime when
a Slice escapes. See [arrays, lists, and slices](/language/arrays-and-lists).

## Optional types

`T?` adds `none` to a reference-shaped type: structs, strings, lists, and raw pointers. It is not accepted for scalar numbers, `Bool`, `Char`, enums, or arrays.

```prismio
struct Entry { value: Int }

fn missing() -> Entry? {
    return none
}
```

Use `expect(value)` to obtain the underlying non-optional value after a runtime presence check. Comparing with `none` does not automatically narrow the type.

## Cast behavior

Narrowing integer casts keep low bits. Signed widening sign-extends; unsigned, `Bool`, and `Char` widening zero-extends. Float-to-integer casts truncate toward zero.

Integer-to-float and float-to-integer conversions can lose precision. A cast states that the conversion is intentional; it does not prove the value is in range. Pointer-related casts and foreign ABI conversions should be isolated behind small, well-documented interfaces.

## Copy and move categories

Strings, lists, and structs are move-only. Scalars, enums, arrays, and Slice descriptors use
value-copy semantics in 0.1.

| Category | Types | Assignment behavior |
| --- | --- | --- |
| Scalar copy | integers, `Float`, `Bool`, `Char`, `Ptr` | copies the value |
| Nominal copy | fieldless enums | copies the variant value |
| Aggregate copy | arrays, `Slice<T>` descriptors | copies the value or view descriptor |
| Move-only | `String`, `List<T>`, structs, optional wrappers around owned references | transfers ownership in owning contexts |

Function calls add parameter modes: an ordinary parameter borrows move-only data, `sink` consumes it, and `inout` forms a mutable borrow. The complete rules are in [ownership and borrowing](/language/ownership-and-borrowing).

## Types not implemented

Prismio 0.1 has no tuples, user-defined type aliases, union types, function values, closures, trait
objects, fixed source-spelled array lengths, arbitrary reference types, or user-written lifetime
types. Do not infer support from examples written for proposals or older documentation.
