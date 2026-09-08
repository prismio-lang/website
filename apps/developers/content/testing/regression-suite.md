---
title: Positive and negative regression tests
description: How Prismio test fixtures establish accepted behavior, rejected boundaries, diagnostics, output, and ownership correctness.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [testing, regression, diagnostics]
related: [testing/overview, cookbook/add-a-language-feature, cookbook/add-a-diagnostic]
---

Files named `test_*.psm` generally exercise accepted behavior. Files named `neg_*.psm`
exercise a specific rejection. Supporting fixtures cover imports, slices, tasks, AIF reports,
debug information, and generated artifacts.

## Positive cases

A positive test should make the behavior observable. Prefer a deterministic value or output over
mere compilation. Ownership and layout tests should include values that fail if storage is moved,
released, or represented incorrectly.

## Negative cases

A negative test should isolate one invalid rule and assert the meaningful diagnostic fragment.
Use a separate fixture for recovery across multiple independent errors. Do not bind tests to
incidental punctuation when a stable category or source location is available.

## Cross-stage changes

A language feature normally needs parser acceptance, semantic success and failure cases, ownership
coverage, AIF treatment for new storage or edges, LLVM execution, and documentation examples.
An optimization additionally needs a guard proving its precondition and an artifact check proving
the transformation occurred.

Keep fixtures small. Large scenario tests are useful for integration, but they make the source of a
regression ambiguous and should not replace focused cases.

## Positive fixtures

Files named `test_N_name.psm` are standalone programs. `run_test` compiles each through the
selected compiler, executes it, and compares its exit/output contract. Unique output paths allow
`run_parallel` to run fixtures concurrently. Tests that inspect generated IR or auxiliary files
use dedicated runner functions rather than hiding shell work inside the source program.

Choose the next stable number only when adding to the ordered language suite. Highly focused
non-numbered fixtures are used by specialized gates such as target, overflow, AIF concurrency,
pointer-return, and slice-bounds checks.

## Negative fixtures

`neg_N_name.psm` files declare expected diagnostic fragments in their source comments.
`expected_errors` extracts them; `run_negative_test` requires a nonzero compiler result and
checks all expected meanings. A negative test should assert stable nouns and rule language, not
terminal color, whitespace, or an entire sentence that blocks harmless copy improvement.

`neg_12_multiple_errors.psm` and `neg_13_syntax_recovery.psm` protect continued analysis.
When adding a recoverable rule, include a later independent error so the test proves the compiler
did not stop at the first issue.

## Specialized artifact assertions

The runner contains explicit gates for implementation shapes:

- `run_struct_path_tbaa_test` checks alias metadata;
- `run_counted_fill_codegen_test` checks counted container lowering;
- `run_string_dispatch_codegen_test` inspects generated string-match dispatch;
- `run_overflow_checks_test` compares checked and wrapping arithmetic;
- `run_aif_drop_emission_test` inspects release functions;
- `emitted_layout_for` and `run_generic_layout_specialization_test` inspect concrete struct
  layouts; and
- `run_debug_info_test` parses metadata nodes and target-derived member offsets.

Artifact matching should name the semantic property—specific call, metadata kind, field offset,
block, or absence—not snapshot the entire IR unless whole-module identity is the property.

Before committing a fixture, run it alone through the runner filter, run its neighboring subsystem
gate, then run the complete suite with the same absolute compiler. Verify cleanup leaves no source
directory artifacts.
