---
title: Read command-line arguments
description: Access process arguments in Prismio 0.1 through program-support FFI declarations.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cookbook, cli, arguments, ffi]
related: [runtime/supported-surface, cookbook/c-ffi, compiler/cli]
---

Prismio 0.1 does not inject `argc` and `argv` into `main`. The linked program-support runtime exposes argument access through external declarations used by the compiler itself. Bind the exact symbols from the runtime version you ship, then wrap them in local functions.

The current implementation is `cli_arg_count()` and `cli_arg()` in
`runtime/program_support.c`. `src/main.psm` declares both and uses them to parse the compiler's own
command line. `cli_arg()` returns an alias into runtime-owned argument storage; the caller must not
free it or keep it past process lifetime.

Keep the executable entry point in the documented form:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    // Call a local wrapper around the versioned program-support API.
    return 0
}
```

Do not copy a C or older draft signature such as `main(argc, argv)` and assume the compiler supplies those parameters.

Because this surface is not yet an importable, version-stable standard-library API, copy declarations only after checking `runtime/program_support.c` and existing compiler `extern fn` declarations. The current boundary is:

```prismio
extern fn cli_arg(index: Int) -> String alias
extern fn cli_arg_count() -> Int
```

Keep these declarations in one compatibility module rather than repeating them across application
files. The `alias` return is essential: declaring it as produced storage would make generated drop
logic attempt to release the process argument table.

## Safe integration shape

1. Inspect the program-support implementation in the exact compiler/runtime revision.
2. Find the existing Prismio extern declaration used by the compiler, if any.
3. Copy the exact width, optionality, and ownership contracts into one local wrapper file.
4. Expose application functions that return ordinary Prismio values rather than raw pointers.
5. Handle missing index/out-of-range behavior explicitly.
6. Test zero, one, and multiple arguments on every native target you support.

Argument zero and executable-path conventions can differ by platform. Do not make a portable application invariant from a host-specific observation unless the wrapper defines it.

Check `index >= 0` and `index < cli_arg_count()` in the Prismio wrapper. The compiler frontend uses
count checks before every option read; follow that pattern rather than depending on C-side
out-of-range behavior. Clone an argument only when the application needs owned storage independent
of the runtime alias.

For a durable library API, wait for the planned process/arguments standard-library module. This recipe documents the current integration approach rather than promising permanent symbol names.

When the runtime symbols change, update the wrapper and tests together. The names above document
the audited 0.1 implementation, not a permanent application API; a future `std.process` arguments
surface should replace direct declarations.
