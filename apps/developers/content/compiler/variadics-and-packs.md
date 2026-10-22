---
title: Variadics, packs and typelists
description: How the compiler turns a function with a pack parameter into an ordinary function per call shape, and which module owns each step.
status: experimental
version: "0.2.0"
lastUpdated: "2026-10-22"
tags: [variadics, packs, typelist, monomorphization]
related: [compiler/generics-and-monomorphization, compiler/semantic-analysis-and-types, compiler/frontend]
---

A pack (`...args: Ts`) takes any number of arguments, and a `typelist` says which types they may have. The compiler's approach is the one it uses for generics and payload enums: **put the feature in the AST, not in five passes**. Sema rewrites a function with a pack into an ordinary function per call shape, so AIF, ownership and codegen never see a pack.

## Who owns what

| Concern | Module |
|---|---|
| The `...` token (`TokenType.ELLIPSIS`, beside `..` and `..<`) | `lexer/scanner.psm` |
| `typelist Name { ... }` / `( ... )` → `TYPELIST_DECL` | `parse/typelists.psm` |
| `...name: T` on a parameter (`i1` = 1), packs last (`P3015`), none on `extern fn` (`P3014`) | `parse/decl.psm` |
| `...args` at a call → `SPREAD_EXPR` | `parse/expr.psm` |
| What a typelist accepts: types, traits, nested lists | `sema/typelists.psm` |
| Binding a call to the packs, instantiating, rewriting the body | `sema/packs.psm` |
| Treating a function with a pack as a template | `monoIsTemplate` in `sema/generics.psm` |
| The one call site | `semaCallExpr`, just before `monoResolveGenericCall` |

## One call

`packResolveCall` runs for a call whose callee names a function with a pack, and only when no fixed overload takes the call (`monoConcreteOverloadFits`), so every existing overload keeps winning. It then:

1. types every argument past the fixed parameters;
2. **binds** them pack by pack, in declaration order (`packBind`): a set pack takes arguments while its list accepts them, a sequence pack takes whole groups while each position's entry accepts, and anything left over is reported with the position and the pattern;
3. **instantiates** (`packInstantiate`): the template is copied under a name mangled with the argument types (`println$pack$String$Int`), each pack parameter becomes one parameter per argument (`args$0`, `args$1`, typed by `monoAnnotationFromType`), and the copy is appended, indexed and predeclared as `monoInstantiateFunction` does;
4. **rewrites the copy's body**, once per pack: `args.length` and `args.count` become literals, `args[k]` becomes the parameter `args$k`, `...args` becomes the parameters as separate arguments, and `for x in args` is unrolled.

The unrolled body is one `if (true) { ... }` per argument. That is the scope each copy needs so its `let`s do not meet the next copy's, and it is a real statement kind, where sema has no bare block to lower. `break` and `continue` inside it would bind to an enclosing loop, so they are refused.

## Two details that cost time

- **An instantiation needs `genericInfo`.** Codegen decides whether to emit a function from source or take it from a PLIB by `nodeIsNull(func.genericInfo)` (`shouldEmitFunctionFromSource`). A pack function with no type parameter (`...parts: String`) has none, so the instantiation gets a marker `GENERIC_PARAM`; without it the call links against a symbol no PLIB defines.
- **Module state, not parameters.** The rewrite walks the body recursively and needs the pack's name, length, width and list at every level, so they are module-level variables set once per pass (`packName`, `packCount`, `packWidth`, `packList`, `rowName`, `rowGroup`).

## Not done

A pack in a closure; keyword arguments; a minimum count. `docs/VARIADICS_PLAN.md` has the design record.
