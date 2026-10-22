---
title: Functions and parameters
description: Declare Prismio 0.1 functions, return values, overloads, and borrow, sink, or inout parameters.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-28"
tags: [functions, parameters, returns, overloads, cold, hot, inlining, noreturn, const]
related: [language/ownership-and-borrowing, language/ffi, errors/wrong-arity]
---

A function has a name, zero or more typed parameters, an optional return type, and a block body. Functions are top-level declarations; Prismio 0.1 does not nest named functions inside blocks.

```prismio
fn add(left: Int, right: Int) -> Int {
    return left + right
}
```

The general shape is:

```text
fn name([mode] parameter: Type, ...) [-> Type] {
    statements
}
```

Parameter types are required. The compiler does not infer a public signature from call sites. A trailing `-> Type` declares a returned value; omitting it declares a function that returns no value.

## Calling a function

A call evaluates its arguments and transfers or borrows them according to the selected function signature.

<!-- prismio-check: pass -->
```prismio
import std.io

fn clamp_low(value: Int, minimum: Int) -> Int {
    if (value < minimum) { return minimum }
    return value
}

fn announce(value: Int) {
    println(value)
}

fn main() -> Int {
    let result = clamp_low(-3, 0)
    announce(result)
    return result
}
```

The number of arguments and their exact types must match an available declaration. There are no named arguments, default arguments, or automatic numeric conversions.

## Return rules

Omitting `-> Type` declares a no-value-returning function. Non-void functions must return on every reachable path; a path may instead end in [`panic`, `unreachable` or `exit`](/language/error-handling#when-the-program-cannot-go-on), which never return. Code after an unconditional `return`, or after one of those three, is rejected as unreachable.

```prismio
fn log_ready() {
    println("ready")
    return
}
```

For a value-returning function, `return expression` must match the declared return type. A function body does not use its final expression as an implicit return, and the error for one that ends in an expression points at it and says to write `return`. A [closure](/language/closures#block-bodies) is the one place a final expression is the value.

<!-- prismio-check: fail -->
```prismio
fn classify(value: Int) -> Int {
    if (value > 0) {
        return 1
    }
}

fn main() -> Int { return classify(1) }
```

The compiler rejects `classify` because the path where `value <= 0` reaches the end without returning an `Int`. An infinite `loop` or a return on every branch can satisfy definite-return analysis.

An unconditional `return`, `break`, or `continue` also ends the reachable statements in its local control-flow position. The compiler reports statements that can never execute rather than silently emitting them.

## Parameter modes

- `value: T` copies scalar/copy values and borrows a move-only value by default.
- `sink value: T` consumes it.
- `inout value: T` takes a mutable borrow.

```prismio
struct Counter { value: Int }

fn read(counter: Counter) -> Int { return counter.value }
fn increment(inout counter: Counter) { counter.value = counter.value + 1 }
fn finish(sink counter: Counter) -> Int { return counter.value }
```

The caller writes no separate borrow operator. The callee's signature determines the mode.

### Default parameters borrow move-only data

An ordinary parameter does not consume a string, list, or struct. It creates a callee-visible borrow for the duration of the call. The caller retains ownership and may use the value afterward.

<!-- prismio-check: pass -->
```prismio
struct Message { code: Int }

fn inspect(message: Message) -> Int {
    return message.code
}

fn main() -> Int {
    let message = Message { code: 7 }
    let code = inspect(message)
    return message.code - code
}
```

The callee cannot `drop` or move a borrowed parameter into an owned location. Make consumption explicit with `sink` when the callee needs ownership.

### `sink` transfers ownership

`sink` documents a consuming API at the function boundary. Passing a move-only value marks the caller's binding as moved.

<!-- prismio-check: fail -->
```prismio
struct Message { code: Int }

fn consume(sink message: Message) -> Int {
    return message.code
}

fn main() -> Int {
    let message = Message { code: 7 }
    consume(message)
    return message.code
}
```

The last field access is a use after move. `sink` on a copy type is accepted as a signature mode where supported, but the observable value behavior remains copy-like; it is primarily meaningful for move-only values.

### `inout` permits caller-visible mutation

`inout` forms an exclusive mutable borrow. It does not move the value, and changes made through the parameter are visible after the call. The argument has to be something the caller may change — a `let mut` binding or its own `inout` parameter — and an `inout` parameter may be a struct, a `Vec`, an array or a slice. An ordinary parameter is read-only: pushing to a `Vec` parameter or storing into an array parameter needs `inout`.

<!-- prismio-check: pass -->
```prismio
struct Counter { value: Int }

fn increment(inout counter: Counter) {
    counter.value = counter.value + 1
}

fn main() -> Int {
    let mut counter = Counter { value: 4 }
    increment(counter)
    return counter.value - 5
}
```

There is no `&`, `&mut`, or address-of spelling at the call site. The selected parameter declaration provides the borrowing contract.

## Recursion

Functions may call themselves and other declared functions. Recursive code must still satisfy ordinary return and ownership rules.

<!-- prismio-check: pass -->
```prismio
fn factorial(value: Int) -> Int {
    if (value <= 1) { return 1 }
    return value * factorial(value - 1)
}

fn main() -> Int {
    return factorial(5) - 120
}
```

Tail-call optimization is not a source-language guarantee. Bound recursion explicitly when stack usage matters.

## Overloading

Functions may share a name when their parameter count or exact parameter types differ. Resolution does not use implicit numeric coercions, and return type alone cannot distinguish overloads. Default arguments, named arguments and expression bodies are not implemented; [variadic parameters](/language/variadics) are. Functions may be [generic](/language/generics).

```prismio
fn describe(value: Int) -> Int { return value }
fn describe(value: U64) -> U64 { return value }
fn describe(left: Int, right: Int) -> Int { return left + right }
```

At a call site, the compiler filters by arity and exact parameter types. If no candidate matches, it reports the mismatch. If more than one candidate is equally applicable, it reports ambiguity rather than choosing from the return context.

<!-- prismio-check: fail -->
```prismio
fn measure(value: Int) -> Int { return value }

fn main() -> Int {
    let value: U8 = 2
    return measure(value)
}
```

Write `measure(value as Int)` to select the `Int` overload deliberately.

## Cold functions

Some code runs rarely: an error report, a table that has to grow, the first
insertion of a key. Keeping it in its own function is only half the job. When a
function has a single caller, the optimiser folds it back into that caller
whatever its size -- and the caller, now large, stops being inlined into the loop
that calls *it*. The fast path pays for the slow one.

Mark such a function `cold`:

```prismio
import std.io

cold fn reportOverflow(value: Int) -> Int {
    println("value out of range")
    return 0
}

fn clamp(value: Int) -> Int {
    if (value > 1000) { return reportOverflow(value) }
    return value
}

fn main() -> Int {
    let mut total = 0
    for i in 0..<100 {
        total = total + clamp(i * 3)
    }
    println(total)
    return 0
}
```

A cold function is never inlined into its callers, and a branch that calls one
is laid out as the unlikely path, so the code around it stays small enough to be
inlined and vectorised where it is used. It is LLVM's `cold` and `noinline`
together -- Rust's `#[cold]` with `#[inline(never)]`.

`cold` goes after any visibility marker and directly before `fn`, at top level or
inside an `impl` block:

```prismio
private cold fn grow(list: Vec<Int>) { ... }
impl Table {
    cold fn rehash(self) { ... }
}
```

It is contextual, so a variable or function may still be *named* `cold`. It
changes where code is placed, never what it does: removing every `cold` leaves a
program with the same behaviour.

Use it for paths that are rare **at run time**, not merely long. The standard
library marks the insert half of `Map.set`; marking a hot function cold moves its
callers' fast path the wrong way.

## Inlining

The optimiser decides from a cost model whether a call is replaced by the function's body, and
the model is usually right. Three markers, written directly before `fn`, say otherwise when you
know something it cannot:

| Marker | Meaning | LLVM | Rust |
|---|---|---|---|
| `inline fn` | worth inlining; a hint | `inlinehint` | `#[inline]` |
| `inline(always) fn` | inlined into every caller, whatever its size | `alwaysinline` | `#[inline(always)]` |
| `inline(never) fn`, `noinline fn` | never inlined | `noinline` | `#[inline(never)]` |

`noinline` and `inline(never)` are two spellings of one request. The compiler's own sources use
`noinline`.

The cost model is wrong when a function is small in what it *does* but large in what it *says*: a
probe loop whose body grew a bounds check, so that it no longer fits the budget although its caller
runs it millions of times and wants the body in view. That function earns `inline(always)`:

<!-- prismio-check: pass -->
```prismio
inline(always) fn square(value: Int) -> Int {
    return value * value
}

fn sumOfSquares(count: Int) -> Int {
    let mut total = 0
    for i in 0..<count {
        total = total + square(i)
    }
    return total
}

fn main() -> Int {
    return sumOfSquares(10)
}
```

A plain `inline fn` only nudges the cost model, and the nudge can lose. Use it for a small function
you expect to be cheap to copy, and `inline(always)` when the body has to be in view.

The markers go after any visibility marker, at top level or inside an `impl` block, and combine
with the other function modifiers in any order:

```prismio
private inline(always) fn probe(slots: Vec<Int>, at: Int) -> Int { ... }
export hot inline(always) fn tick(x: Int) -> Int { ... }
impl Table {
    inline(always) fn slotOf(self, key: Int) -> Int { ... }
    noinline fn rebuild(self) { ... }
}
```

Every marker is contextual, so a variable or function may still be *named* `inline`, and each changes
where code is placed, never what it does. A generic function keeps its markers in every
instantiation. A build with debug information (`-g`) ignores `inline(always)`, so that a function
can be stepped into.

Markers that contradict each other are refused where they are written:

```text
error[P3201]: a function cannot be both `inline` and `noinline`
error[P3201]: a function cannot be both `cold` and `inline`
error[P3201]: `hot` is written twice
```

Use `inline(always)` sparingly. Inlining a large function into many callers grows the program, and
the compiler's own choice is better than a guess for most code. The standard library marks the probe
of `Map`, which every lookup and update runs in a loop.

## Hot functions

`hot` is the opposite of `cold`: a function that runs often. It is LLVM's `hot` -- the optimiser
favours speed over size for it, even when the rest of the program is built small, and its code is
placed with the other hot code. It says nothing about inlining, so it combines with any of the markers
above, and it contradicts only `cold`.

```prismio
hot fn step(state: Int) -> Int { ... }
```

## Functions that do not return

A call to a `noreturn fn` never gives control back: the function ends the program, loops forever, or
calls another `noreturn` function.

<!-- prismio-check: pass -->
```prismio
import std.io

noreturn fn die(code: Int) {
    println("fatal")
    exit(code)
}

fn checked(x: Int) -> Int {
    if (x < 0) { die(2) }
    return x
}

fn pick(x: Int) -> Int {
    if (x > 0) {
        return 1
    } else {
        die(3)
    }
}

fn main() -> Int {
    return checked(pick(1)) - 1
}
```

Because the optimiser treats the code after such a call as unreachable, the promise is checked rather
than trusted. A body that contains a `return`, or can reach its closing brace, is an error:

```text
error[P4001]: function `die` is `noreturn`, so it cannot `return`
error[P4001]: function `die` is `noreturn`, but control can reach its closing brace
```

End the body with `panic`, `exit`, `unreachable`, an endless `loop`, or a call to another `noreturn`
function. Callers benefit too: a path that ends in a `noreturn` call needs no `return`, as the second
`pick` branch above shows. A function declared `noreturn` combines with `cold`
(`cold noreturn fn`), which is what an error path usually is.

A call is known to diverge by its name, and only when every function and method of that name is
`noreturn`. If a `noreturn fn abort` shares its name with an ordinary `abort` elsewhere, a function
that ends in the call still needs an explicit `return` or `unreachable()`. The optimiser is told
either way.

## Constant functions

A `const fn` is an ordinary function that the compiler may also run while it compiles. It is
checked and compiled like any other, so it can be called at run time too; `const` adds one thing,
which is that a [constant](/language/variables#constants) may call it.

<!-- prismio-check: pass -->
```prismio
import std.io

const fn area(width: Int, height: Int) -> Int {
    return width * height
}

const fn isPrime(n: Int) -> Bool {
    if (n < 2) { return false }
    let mut d = 2
    while (d * d <= n) {
        if (n % d == 0) { return false }
        d += 1
    }
    return true
}

const CELLS = area(8, 8)
const PRIME = isPrime(97)

fn main() -> Int {
    println(CELLS)          // 64, worked out before the program existed
    println(PRIME)          // true
    return 0
}
```

What a `const fn` may do at compile time:

- take and return **integers of any width and `Bool`**;
- declare `let` and `let mut` variables of those types, and assign to them;
- use `if`, `match` on a value, `while`, `loop`, `for` over a range (`0..<n`, `a..b`,
  `step`, counting down), `repeat`, `break` and `continue` with labels, and `return`;
- call other `const fn`s, recursively, and read global constants.

Anything else -- strings, floats, `Vec`s, structs, pointers, closures, generics -- is refused where
the constant is written, naming the first thing it could not run. The result is exact, not wrapped:
every value that meets a declared type (a parameter, an annotated variable, the return type) has to
fit it, `as` truncates to the width it names, and arithmetic that leaves the range of a 62-bit
integer is an error. A constant is therefore either what the function computes at run time or a
compile error. Evaluation is bounded -- a loop that never ends or a recursion with no base case is
reported, not hung on.

A `const fn` cannot be `async`, `naked` or `noreturn`. It combines with `export`, `hot`, `inline` and
the other markers.

## Entry point

An executable uses a top-level `main` function, and it can be written two ways: `fn main()` and `fn main() -> Int`. The returned integer becomes the process exit status. A `main` with no return type exits with status 0: **reaching the closing brace is `return 0`, and so is a bare `return`**. Writing `-> Int` says the status is yours, so that `main` is held to the rule every `-> Int` function has: each path must `return` a number, and falling off the end or a bare `return` is an error. Any other return type is refused (`main` returns an `Int`, the exit status, or nothing). The 0.1 compiler does not document command-line argument parameters on `main`; obtain environment or argument data through supported runtime or FFI functions instead of copying signatures from C, Rust, or older drafts.

## Nested functions

A `fn` may be written inside another function's body. It is an ordinary function that sits where it is used: private, visible in the block that declares it, callable before its declaration and from itself, and it **captures nothing**. A name from the enclosing function is unknown inside it, as it would be anywhere else; use a [closure](/language/closures) to capture.

<!-- prismio-check: pass -->
```prismio
import std.io

fn total(n: Int) -> Int {
    fn square(x: Int) -> Int { return x * x }
    fn sumTo(k: Int) -> Int {
        if k <= 0 { return 0 }
        return square(k) + sumTo(k - 1)
    }
    return sumTo(n)
}

fn main() -> Int {
    println(total(3))     // 14
    return 0
}
```

Two functions may each declare a `helper`, a method may declare one, and a nested function may declare its own. The compiler names each `outer$inner`, so none can collide with a name a program wrote.

## Not implemented

Named functions cannot currently define optional/default arguments
or use expression bodies, and take any number of arguments only through a
[pack](/language/variadics). Functions may declare
[type parameters](/language/generics) with one or more [trait bounds](/language/traits).
Closures provide anonymous capturing callables, and method-call syntax plus `impl`
blocks provide type-oriented operations; each has its own documented constraints.
