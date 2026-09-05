---
title: Read command-line arguments
description: Access process arguments in Prismio 0.1 through program-support FFI declarations.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cookbook, cli, arguments, ffi]
related: [language/ffi, cookbook/c-ffi, compiler/cli]
---

Prismio 0.1 does not inject `argc` and `argv` into `main`. The linked program-support runtime exposes argument access through external declarations used by the compiler itself. Bind the exact symbols from the runtime version you ship, then wrap them in local functions.

Keep the executable entry point in the documented form:

```prismio
fn main() -> Int {
    // Call a local wrapper around the versioned program-support API.
    return 0
}
```

Do not copy a C or older draft signature such as `main(argc, argv)` and assume the compiler supplies those parameters.

Because this surface is not yet an importable, version-stable standard-library API, copy declarations only after checking `runtime/program_support.c` and existing compiler `extern fn` declarations. Keep raw pointers and ownership contracts out of application modules.

## Safe integration shape

1. Inspect the program-support implementation in the exact compiler/runtime revision.
2. Find the existing Prismio extern declaration used by the compiler, if any.
3. Copy the exact width, optionality, and ownership contracts into one local wrapper file.
4. Expose application functions that return ordinary Prismio values rather than raw pointers.
5. Handle missing index/out-of-range behavior explicitly.
6. Test zero, one, and multiple arguments on every native target you support.

Argument zero and executable-path conventions can differ by platform. Do not make a portable application invariant from a host-specific observation unless the wrapper defines it.

For a durable library API, wait for the planned process/arguments standard-library module. This recipe documents the current integration approach rather than promising permanent symbol names.

When the runtime symbols change, update the wrapper and tests together. Documentation intentionally omits concrete internal symbol names here so AI/search results do not turn an unstable implementation detail into a permanent public API.
