---
title: Name and import resolution
description: Scope, shadowing, overload, field, variant, and source-import resolution rules for Prismio 0.1.
status: draft
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [specification, name-resolution, scope, imports]
related: [language/modules, language/variables, language/functions]
---

Name resolution begins after source files are loaded and their syntax trees are combined. It selects declarations and bindings by lexical scope, nominal owner, or overload signature. An import path may additionally qualify a call, and a visibility modifier may restrict which files a declaration resolves from.

## Import resolution

The entry module directory defines the source root. A dotted import replaces `.` with the host path separator and appends `.psm`. A wildcard import enumerates only direct `.psm` files of the named directory in sorted order.

For an entry `/project/src/main.psm`, `import model.user` selects `/project/src/model/user.psm`. `import model.*` selects direct `.psm` children of `/project/src/model/` and does not recurse.

The resolver must canonicalize and memoize imported files. Import cycles and diamonds therefore contribute each file at most once. Resolved declarations are flattened before semantic analysis; the flattened space is what unqualified use sites resolve against.

The resolver must also record, for each file, the import path it was reached by. That path is the module qualifier, and it must be recorded rather than derived from the file's location: an installed toolchain may store a standard module at a different path than a source checkout does, and a qualifier computed from the path would then differ between the two.

Failure to read a resolved file is a compile-time error. Wildcard enumeration order is deterministic by sorted path for a fixed file set.

## Lexical bindings

Local bindings use lexical block scope. An inner declaration may shadow an outer binding. A name is unavailable before its declaration and after its block ends.

The initializer of a shadowing declaration resolves before the new binding becomes active, so `let value = value + 1` can read an outer `value`. The new name then applies through the remainder of its block.

Function parameters are bindings in the function body's lexical environment. Loop iteration variables and bindings created inside control-flow arm blocks remain scoped to those bodies.

## Top-level declarations

Top-level structs, enums, globals, and other same-kind named declarations must be unique after import flattening. Functions with the same name form an overload set when parameter arity or exact parameter types differ. A call resolves against argument count and exact types; return type does not participate.

No implicit numeric conversion is performed merely to make an overload applicable. If candidates remain ambiguous or none matches, the call is a static error.

The program entry point is a top-level `main` declaration. Top-level executable statements are not declarations and are not accepted.

## Member and variant resolution

Fields resolve nominally against the receiver's struct declaration. Enum variants resolve through `EnumName.VariantName`. A method call `x.f(a)` resolves as the call `f(x, a)`, so an `impl` block is a naming construct over ordinary functions rather than a second dispatch mechanism; a trait bound is checked against the implementations in scope.

Prismio 0.1 has no alias import or selective import.

A qualified call `m.f(a)` is read as a module qualifier when `m` is not a local binding and some declaration of `f` was parsed from the module whose import path is `m`. A local binding of that name takes precedence, which is what keeps `receiver.method(a)` a method call.

Member resolution on `T?` does not automatically unwrap it. `expect` must first produce the underlying `T`. Field names from a structurally identical but nominally different struct are irrelevant to compatibility.

## Namespace consequences

Source organization and declared naming must still be coordinated. Two imported files cannot each hide a same-kind *type* behind their paths, because a qualifier applies to calls only; two same-named structs still conflict.

Functions are the exception in both directions. A qualifier disambiguates a call between two modules declaring the same function name, and `private` or `internal` keeps a function out of the resolution set for files outside its file or its package. A declaration carrying no modifier is public and participates in the whole program's analysis, which is the default.

Identifiers occupy compiler-defined declaration namespaces. Where a type and value spelling can coexist, use-site grammar and semantic expectation select the relevant kind; this specification does not promise arbitrary same-spelling declarations across all kinds.

## Resolution errors

Required diagnostics include undefined names, duplicate declarations, unknown fields or variants, invalid overload sets, no matching call, and ambiguous call selection. Exact prose and stable numeric codes are not part of 0.1 conformance.
