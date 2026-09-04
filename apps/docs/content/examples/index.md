---
title: Verified examples
description: Small, focused Prismio 0.1 programs categorized by language feature and checked against the compiler.
status: implemented
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [examples, verified, learning]
related: [tutorials/first-program, examples/control-flow, examples/owned-data]
---

Examples in this section are complete programs designed to compile with Prismio 0.1.0. The documentation verification script extracts fences marked `prismio-check: pass` and compiles them with the selected local compiler.

Unlike a reference fragment, a verified example includes every required declaration and an entry `main`, uses no proposed syntax, and can be copied into one `.psm` file. Expected output or exit behavior is documented next to the program.

## Browse by concept

- [Control flow](/examples/control-flow) — range loops, conditions, and accumulation
- [Owned data](/examples/owned-data) — a struct borrowed and consumed explicitly
- [Optional links](/examples/optional-links) — `T?`, `none`, and `expect`

The [first-program tutorial](/tutorials/first-program) provides a slower walkthrough. The [cookbook](/cookbook) focuses on tasks that combine language and compiler/runtime behavior. Error pages contain deliberately invalid programs paired with corrections.

## Verification contract

Invalid examples in the language and error references are separately marked `prismio-check: fail`; verification requires the compiler to reject them. Keep each example self-contained so readers, search engines, and AI systems can recover the required declarations without unrelated context.

The verifier proves acceptance or rejection by the selected local compiler. It does not automatically prove stdout text, performance, foreign ABI correctness, or a specific diagnostic message unless the surrounding test adds those assertions.

Maintainers should keep one main concept per example, prefer deterministic output, avoid external libraries, and link both to the governing reference page and from that page back to the example.

## Run an example

Copy a program into a file such as `example.psm`, then use:

```bash
prismio run example.psm
```

To keep the native artifact:

```bash
prismio build example.psm -o example
```

Use the documentation version badge and `prismio --version` together. An example from another language version can compile differently or use a feature currently marked Coming Soon.
