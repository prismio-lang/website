---
title: Type-system rules
description: Prismio 0.1 type categories, inference, compatibility, optional types, overloads, and explicit conversions.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [specification, type-system, inference, conversion]
related: [language/types, language/functions, specification/memory-model]
---

Every expression has a statically determined type. A binding without an annotation takes its initializer's type. A binding with both must have a compatible initializer. A binding with neither is invalid.

Type inference is local and does not make a binding polymorphic or dynamic. Once a binding's type is selected, later assignment must preserve it.

## Type universe

Primitive types are `Int`, `I8`, `I16`, `I64`, `Isize`, `U8`, `U16`, `U32`, `U64`, `Usize`, `Float`, `Bool`, `Char`, `String`, and `Ptr`. Struct names introduce nominal types. Enum names introduce declared enum types with the `Int` compatibility rule below. `[T]` forms an array type; `List<T>` forms the built-in list type.

`Int` is signed 32-bit. `Float` is the sole 64-bit floating-point type. `Isize` and `Usize` use target pointer width. `Char` is byte-sized in 0.1.

Struct identity is nominal: distinct declarations do not become compatible because their fields coincide. Enum declarations retain names for annotations and variant lookup, but a variant expression types as plain `Int`, and `semaTypesMatch` treats an enum and the default 32-bit `Int` as compatible in either direction. Consequently distinct enum declarations can interoperate through that representation in 0.1. `List<T>` is a built-in type constructor, separate from [generics](/language/generics): it predates them and is not an instance of them. An enum with payload variants is not an `Int` — it compiles to a tagged struct and is nominal and move-only like any other struct.

## Literal typing

Decimal integer literals are checked against a contextual integer type when one is available. An ordinary uncontextualized integer uses the compiler's default behavior centered on `Int`; larger values require a compatible contextual width. Floating literals have `Float`, Boolean literals have `Bool`, character literals have `Char`, and string literals produce `String`.

`none` requires or receives an optional reference-shaped context. It is not a universal inhabitant of every type.

## Compatibility

Arithmetic and bitwise operations require exact compatible operand types. The compiler does not implicitly widen numeric values. `as` performs explicit conversions among supported numeric, Boolean, and character representations.

Assignment, argument passing, return, field initialization, and list/array element operations require the type expected by their context. Ownership mode changes whether a move-only value is borrowed or transferred; it does not make incompatible types assignable.

For explicit casts:

- signed widening sign-extends;
- unsigned, Boolean, and character widening zero-extends;
- integer narrowing keeps low-order bits;
- float-to-integer truncates toward zero; and
- integer/float conversions may lose precision.

An explicit cast does not perform application-level range validation.

## Optional formation and elimination

`T?` is well-formed only when `T` is reference-shaped: a struct, string, list, or raw pointer. `none` inhabits a compatible optional context. An optional value is not usable as `T`; `expect` performs a checked unwrap. Equality and inequality with `none` are allowed but do not refine later expression types.

Optionality preserves the ownership category of an underlying owned value. Constructing an optional from a move-only struct transfers it into the optional owner. `expect` checks presence but does not introduce general first-class references.

Scalar optionals, optional enums, optional arrays, optional chaining, and coalescing are absent. [`Option<T>`](/stdlib/option) exists as a library type over payload-carrying enum variants, and is what covers the scalar case that `T?` refuses.

## Functions and overloads

Function parameter and return types are declared. A call must select a declaration by name, argument count, and exact parameter types. Return type does not distinguish an overload. Default/named arguments and implicit numeric coercion do not participate.

For a move-only argument, an ordinary parameter borrows, `inout` mutably borrows, and `sink` transfers. For copy types, values are copied under current value semantics.

## Aggregate typing

An array literal's elements must agree on an element type. Source type `[T]` does not spell the length even though the compiler tracks concrete storage from the initializer. An index has type `Int`.

A struct literal must name a declared struct and initialize its fields with compatible values. Member selection uses the receiver's nominal declaration. Enum variants are selected and validated with `Enum.Variant`, then type as `Int` in compiler 0.1.

`list_new` receives `T` through contextual `List<T>` typing. Other list operations must agree on that element type.

## Control-flow typing

The condition of `if` and `while` must be `Bool`. `match` accepts integers and fieldless enums in 0.1. Every returned expression must match the declared return type, and all reachable paths of a value-returning function must return.

`if`, loops, and `match` have statement behavior and do not synthesize a selected value type. `break` and `continue` carry no value.

## Excluded type forms

There are no tuple types, user type aliases, union types, arbitrary references, function-value types, closure types, trait objects, user generics, type parameters, payload enums, or user-written lifetime types.
