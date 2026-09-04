# Typing Rules

This page describes the formal type system of Prismio.

> 🚧 **Coming Soon** – A complete formal specification is being developed. This page describes the type system at a conceptual and semi-formal level.

## Type System Overview

Prismio uses a **static, nominally-typed** type system with **type inference**. Key properties:

- **Static typing** — all types are known at compile time
- **Strong typing** — no implicit coercions between unrelated types
- **Type inference** — types are often inferred so you don't need to annotate them
- **Parametric polymorphism** — generic functions and types via `<T>` parameters
- **No null/undefined** — optional values are explicit via `Optional<T>` (or `T?`)

---

## Type Environments

A **type environment** `Γ` maps variable names to their types:

```
Γ ::= ∅                    (empty environment)
    | Γ, x : T             (extending with binding x of type T)
```

When the compiler checks an expression, it looks up variable types in the current environment.

---

## Basic Typing Judgments

The judgment `Γ ⊢ e : T` reads: "In environment Γ, expression `e` has type `T`."

### Literal Rules

```
──────────────────    (T-IntLit)
Γ ⊢ n : Int

────────────────────    (T-FloatLit)
Γ ⊢ f : Float

────────────────────    (T-BoolLit)
Γ ⊢ true : Bool
Γ ⊢ false : Bool

──────────────────────    (T-StringLit)
Γ ⊢ "s" : String
```

### Variable Rule

```
x : T ∈ Γ
──────────    (T-Var)
Γ ⊢ x : T
```

### Let Binding

```
Γ ⊢ e₁ : T₁    Γ, x : T₁ ⊢ e₂ : T₂
────────────────────────────────────────    (T-Let)
Γ ⊢ let x = e₁; e₂ : T₂
```

### Function Declaration

```
Γ, x₁:T₁, ..., xₙ:Tₙ ⊢ body : Tᵣ
───────────────────────────────────────────────────────────    (T-Fn)
Γ ⊢ fn f(x₁:T₁, ..., xₙ:Tₙ) -> Tᵣ { body } : fn(T₁,...,Tₙ)->Tᵣ
```

### Function Call

```
Γ ⊢ f : fn(T₁, ..., Tₙ) -> Tᵣ    Γ ⊢ e₁:T₁  ...  Γ ⊢ eₙ:Tₙ
────────────────────────────────────────────────────────────────    (T-Call)
Γ ⊢ f(e₁, ..., eₙ) : Tᵣ
```

---

## Arithmetic Typing

```
Γ ⊢ e₁ : Int    Γ ⊢ e₂ : Int
───────────────────────────────    (T-Add-Int)
Γ ⊢ e₁ + e₂ : Int

Γ ⊢ e₁ : Float    Γ ⊢ e₂ : Float
────────────────────────────────────    (T-Add-Float)
Γ ⊢ e₁ + e₂ : Float
```

> **Note:** Prismio does not implicitly convert `Int` to `Float`. You must cast explicitly: `x.toFloat()`.

---

## Comparison Typing

```
Γ ⊢ e₁ : T    Γ ⊢ e₂ : T    T implements Eq
──────────────────────────────────────────────    (T-Eq)
Γ ⊢ e₁ == e₂ : Bool
```

---

## If Expression Typing

```
Γ ⊢ cond : Bool    Γ ⊢ e₁ : T    Γ ⊢ e₂ : T
───────────────────────────────────────────────    (T-If)
Γ ⊢ if cond { e₁ } else { e₂ } : T
```

Both branches must have the same type. If the `else` branch is omitted, the `if` has type `Unit`.

---

## Generic Types and Polymorphism

Prismio supports parametric polymorphism:

```prismio
fn identity<T>(x: T) -> T = x

let n = identity(42)      // T inferred as Int
let s = identity("hi")    // T inferred as String
```

### Type Instantiation

```
Γ ⊢ f : ∀T. T -> T    Γ ⊢ e : S
──────────────────────────────────    (T-Instantiate)
Γ ⊢ f(e) : S
```

### Type Bounds

> 🚧 **Coming Soon** – Trait bounds on generic parameters.

```prismio
// Planned syntax
fn largest<T: Comparable>(items: [T]) -> T {
    // T must implement Comparable
}
```

---

## Optional Types

`T?` is syntactic sugar for `Optional<T>`:

```prismio
let name: String? = null     // or: Optional<String>
let age: Int? = 42
```

### Optional Typing Rules

```
Γ ⊢ e : T
──────────────────    (T-Some)
Γ ⊢ e : T?

─────────────────    (T-None)
Γ ⊢ null : T?
```

---

## Type Inference

Prismio uses **bidirectional type checking** — types flow both bottom-up (synthesis) and top-down (checking):

```prismio
// Type synthesized from RHS
let x = 42         // x : Int (synthesized)

// Type checked against annotation
let y: Float = 3.14   // 3.14 checked against Float

// Type inferred through usage
let items = [1, 2, 3]  // items : [Int] (array element type inferred)
```

When inference fails:
```prismio
// Error: cannot infer type of empty array
let empty = []    // ERROR: ambiguous type

// Fix: annotate the type
let empty: [Int] = []   // OK
```

---

## Type Unification

Type inference works by generating and solving **unification constraints**:

```
unify(T, T)    = ok
unify(?, T)    = ok, bind ? to T
unify(T, ?)    = ok, bind ? to T
unify(fn(A)->B, fn(C)->D) = unify(A,C) and unify(B,D)
unify(T, U)    = error "type mismatch: expected T, found U"
```

---

## Built-in Types

| Type | Description | Example |
|------|-------------|---------|
| `Int` | Platform-native integer (64-bit) | `42` |
| `Int8` | 8-bit signed integer | `127i8` |
| `Int16` | 16-bit signed integer | `1000i16` |
| `Int32` | 32-bit signed integer | `100000i32` |
| `Int64` | 64-bit signed integer | `9999i64` |
| `UInt` | Platform-native unsigned | `42u` |
| `Float` | 64-bit floating point | `3.14` |
| `Float32` | 32-bit floating point | `3.14f32` |
| `Bool` | Boolean | `true` |
| `Char` | Unicode character | `'a'` |
| `String` | UTF-8 string | `"hello"` |
| `[T]` | Array of T | `[1, 2, 3]` |
| `(A, B)` | Tuple | `(1, "two")` |
| `T?` | Optional T | `null` or value |
| `Unit` | No value (void) | (implicit) |
| `Never` | Unreachable | (panic, exit) |

> 🚧 **Coming Soon** – Formal subtyping rules, trait system, and complete type specification.
