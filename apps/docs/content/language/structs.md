---
title: Structs
description: Define, construct, access, mutate, and transfer nominal struct values in Prismio 0.2.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [structs, fields, aggregate-types]
related: [language/types, language/ownership-and-borrowing, language/optionals]
---

A struct declares named fields and creates a nominal, move-only type. Structs group related values without introducing inheritance or an object runtime; methods are attached separately, in [`impl` blocks](/language/methods).

<!-- prismio-check: pass -->
```prismio
struct Point {
    x: Int,
    y: Int
}

fn main() -> Int {
    let point = Point { x: 4, y: 9 }
    point.x = point.x + 1
    return point.x + point.y
}
```

## Declaration syntax

Fields are written as `name: Type` entries inside braces and separated by commas.

```prismio
struct Request {
    id: U64,
    retry_count: Int,
    path: String
}
```

The declaration introduces `Request` into the program's type namespace. Field order contributes to the current compiled layout, but source code should use names rather than assuming offsets. A stable cross-version struct ABI is not promised in 0.1.

Fields may contain scalars, enums, fixed-length arrays, vectors, strings, other structs (declared elsewhere or [nested](#nested-structs)), and permitted optional types. An array field is written `Array<T, N>` and stored inside the struct — see [returning and storing arrays](/language/arrays-and-lists#returning-and-storing-arrays). A directly recursive stored field has no finite layout; model recursive links with an optional reference-shaped struct field, as shown on the [optional values](/language/optionals) page.

## Nested structs

A struct can declare another inside it, either as a field's type or between its fields. The inner struct is an ordinary struct, stored inline in the outer one, with no extra indirection and no ownership rule of its own. Writing it inside says that it belongs to the outer struct, and the outer struct's name is how you reach it from outside.

<!-- prismio-check: pass -->
```prismio
struct Window {
    title: String,
    size: struct { w: Int, h: Int },
    origin: struct { x: Int, y: Int }
}

fn area(size: Window.size) -> Int {
    return size.w * size.h
}

fn main() -> Int {
    let window = Window {
        title: "main",
        size: { w: 4, h: 5 },
        origin: Window.origin { x: 1, y: 2 }
    }
    window.size.w = 6
    return area(window.size) - 30
}
```

`size: struct { ... }` declares a struct named after the field, `Window.size`, and gives the field that type. The fields of a nested struct follow the field rules: private to the file unless marked.

A struct with a name of its own is declared between the fields and reached through its owner:

<!-- prismio-check: pass -->
```prismio
struct Config {
    struct Limits { max: Int, min: Int }
    limits: Limits,
    retries: Int
}

impl Config.Limits {
    fn span(self: Config.Limits) -> Int { return self.max - self.min }
}

fn main() -> Int {
    let config = Config { limits: Config.Limits { max: 9, min: 1 }, retries: 3 }
    return config.limits.span() - 8
}
```

Inside `Config`'s own fields `Limits` is written bare. Anywhere else, including an `impl` block and a function's signature, it is `Config.Limits`. A nested `Limits` hides a top-level `Limits` for the fields beside it.

Nesting goes as deep as you like (`Config.Server.tls`), and each level is named by the one outside it.

### Writing the value

A nested struct literal is written with its path, `Window.origin { x: 1, y: 2 }`, or with bare braces wherever the expected type is a struct, as `size:` above. The braces work for any struct, nested or not, in a field, a `let` with a type, an argument or a return:

```prismio
let limits: Config.Limits = { max: 3, min: 2 }
```

A bare `{ name: value }` is a [`HashMap`](/stdlib/map) literal when a map is expected or nothing says otherwise. The context decides, and an unknown field is reported as one: ``struct `Window.size` has no field `d` ``.

### Rules

- **Visibility.** A nested struct is as visible as the struct it is written in. It has no marker of its own.
- **Identity.** Two inline structs of the same shape are two types, as two declarations are. An inline struct is nameable, as `Window.size`, so a function can take it.
- **Generics.** A struct inside a generic struct is not supported yet; declare it beside the outer one and give it the type parameters it uses.
- **Recursion.** A nested struct cannot contain itself or its owner, for the reason a directly recursive field cannot: there is no finite layout.

## Visibility

A struct and each of its fields carry a visibility marker, written before the name, with the levels a [function](/language/modules#visibility) has: `public` is everywhere, `internal` the declaring package, `private` the declaring file. **A struct is `internal` unless marked, and a field is `private` unless marked**, so a type is a closed box until its author opens it.

```prismio
public struct Point {
    public x: Int,
    internal tag: Int,
    secret: Int
}
```

`Point` is nameable from any file, `x` is readable and writable from any file, `tag` from files in the same package, and `secret` only from the file that declares `Point`. Reading or writing a field you cannot see, or naming a struct you cannot see, is a compile error that says which level stops you and what to write. A word is a marker only when a name follows it, so a field called `public` still reads as one.

A struct literal sets every field, the written ones and the ones left to their defaults, so it is written only where all of them are visible. A struct with a hidden field is built by a function its own file provides, as `Buffer` is built by `Buffer(16)`.

## Construction

A struct literal names its type and provides field initializers:

```prismio
let request = Request {
    id: 42,
    retry_count: 0,
    path: "/health"
}
```

Every declared field must receive a compatible value. Initializers are matched by field name, not by an anonymous positional tuple. A misspelled, missing, or unknown field is a compile-time error.

Struct literals are expressions and may be returned, passed to functions, or nested inside another literal. Their ownership behavior follows the destination: an owned move-only field transfers into the new struct.

## Nominal identity

Two declarations with identical fields remain different types.

<!-- prismio-check: fail -->
```prismio
struct ScreenPoint { x: Int, y: Int }
struct MapPoint { x: Int, y: Int }

fn main() -> Int {
    let screen = ScreenPoint { x: 1, y: 2 }
    let map: MapPoint = screen
    return map.x
}
```

The compiler does not perform structural conversion. Write an explicit conversion function that constructs `MapPoint` if the distinction is intentional.

## Field access and assignment

Fields are selected with `.` and initialized by name in a struct literal. Every declared field must have a compatible initializer. Two structs with the same field shapes remain different types.

Field access reads the declared field type:

```prismio
let attempts: Int = request.retry_count
```

Field assignment requires an assignable value of that field type. Compound assignment on a field is not implemented as a general assignment place; spell the operation explicitly:

```prismio
request.retry_count = request.retry_count + 1
```

Prismio 0.2 permits field assignment through a struct binding even when that binding was not declared `mut`; `mut` is enforced for direct binding reassignment. This distinction is current compiler behavior and may be tightened in a later language version.

An optional struct must be unwrapped before member access. Comparing it with `none` does not flow-narrow the expression; call `expect` and access the result.

## Taking a struct apart

`let` can name a struct's fields at once. The pattern is the type, then the fields to bind:

<!-- prismio-check: pass -->
```prismio
struct Point { x: Int, y: Int }

fn main() -> Int {
    let p = Point { x: 3, y: 4 }
    let Point { x, y } = p
    let Point { x: left, .. } = Point { x: 10, y: 20 }
    return x + y + left - 17
}
```

- `{ x, y }` binds each field to a name of its own spelling; `{ x: left }` binds it to another.
- `..` says the other fields are left alone, and a field you do not list is left alone either. `_` skips one you list: `{ x: _, y }`.
- `let mut Point { y: top } = p` makes the bindings assignable. It does not make `p` change.
- A pattern inside a pattern takes a nested struct apart: `let Window { title, origin: Point { x, y } } = win`. A [nested struct](#nested-structs) is named by its path, `size: Window.size { w, h }`.

A pattern is shorthand for the field reads it stands for, so a binding behaves as `let x = p.x` does: a number is copied, and a `String` or `Vec` is borrowed from the value for as long as that value lives. A variable taken apart this way is still whole afterwards. A value that is not a variable, such as a call, is held under a hidden name for the rest of the scope, so its bindings stay valid, and for that case the pattern's type is checked against it:

``expected Point, found Other``

For a variable the type in the pattern is not checked, only the fields: a name that is not a field of the variable's type is an error at the name in the pattern. A pattern that binds the name it is taking apart (`let Point { x: p } = p`) is refused, because the fields after it would read the new `p`. A global `let` binds one name and takes no pattern.

Patterns in `match` arms and function parameters are not implemented. An enum's [struct variant](/language/enums#struct-variants) is taken apart in a `match` arm.

## Ownership

Struct values move when stored into another owned location or passed to `sink`. Ordinary function parameters borrow them. Methods are attached with an [`impl` block](/language/methods) and a type satisfies a bound with [`impl <Trait> for <Type>`](/language/traits). Constructors, field visibility modifiers, and inheritance are not implemented.

<!-- prismio-check: pass -->
```prismio
struct Ticket { number: Int }

fn number(ticket: Ticket) -> Int {
    return ticket.number
}

fn close(sink ticket: Ticket) -> Int {
    return ticket.number
}

fn main() -> Int {
    let ticket = Ticket { number: 9 }
    let observed = number(ticket)
    return close(ticket) - observed
}
```

`number` borrows, so the caller can later pass `ticket` to the consuming `close`. After `close`, the binding is moved.

When a struct contains another move-only value, constructing the outer struct transfers the inner value. Reading a scalar field from a borrowed struct is safe; transferring an owned field out of a borrowed parameter is rejected where it would violate the borrow.

## Current limitations

- Methods and associated functions are written in [`impl` blocks](/language/traits),
  inherent or for a trait, and an `impl` may be generic. There is no dedicated
  constructor declaration: write an associated `new` that returns the struct, and
  `Point(3, 4)` calls it — see [calling a type](/language/methods#calling-a-type-calls-its-new).
- Visibility applies to a struct and its fields. An enum takes the same markers, without fields: see [enum visibility](/language/enums#visibility).
- Structs may be [generic](/language/generics); there are no field defaults. A literal that omits a field is accepted, and the omitted field is zero-initialised — a null pointer, a zero number, zeroed array elements, or a recursively zeroed inline struct.
- A generic struct cannot hold an `Array<T, N>` field yet.
- There is no update syntax that copies unspecified fields. A struct is taken apart by a [`let` pattern](#taking-a-struct-apart), not in a `match` arm or a parameter list.
- Layout and cross-version ABI stability are not guaranteed.
- Field assignment through an immutable binding is currently accepted and may be tightened.

Use standalone functions for behavior and keep foreign-facing layouts behind a small [FFI](/language/ffi) layer.
