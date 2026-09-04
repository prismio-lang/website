---
title: Refuted AIF tier pin
description: Fix a Prismio pin(Tn) assertion that conflicts with converged allocation analysis.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-23"
tags: [error, aif, pin, allocation-tier]
related: [language/annotations, compiler/aif, errors/region-budget-exceeded]
---

## Meaning

Converged AIF analysis proved that the requested tier cannot satisfy the value's escape or ownership requirements.

A tier pin is an assertion checked against evidence, not an optimization hint and not an unsafe override. Rejecting it preserves the source ownership/allocation contract.

## Why it happens

The value may escape its lexical region, acquire aliases, enter an owning container, cross a retaining foreign contract, or otherwise require a more general tier than requested.

## Invalid code

<!-- prismio-check: fail -->
```prismio
extern fn str_concat(a: String borrow, b: String borrow) -> String produce(free)
fn escapes() -> String {
    let pin(T1) value = str_concat("a", "b")
    return value
}
```

The returned value escapes its region, so `T1` cannot hold.

## Correct code

<!-- prismio-check: pass -->
```prismio
extern fn str_concat(a: String borrow, b: String borrow) -> String produce(free)
fn escapes() -> String {
    let value = str_concat("a", "b")
    return value
}
```

Note the contracts on the declaration. They are not decoration: an `extern fn` with no contract has unknown provenance, so the analysis cannot know the result is a fresh allocation the caller owns, and it leaks on every call. In application code, prefer [`String.concat`](/stdlib/strings) from `std.string`, which carries the contract already — the raw declaration appears here only because this page is about the analysis itself.

## Common fixes

Remove the pin and accept inference, choose a compatible tier, or restructure ownership so the value no longer escapes. Never treat a pin as an unsafe override.

Run `prismio aif source.psm --why=<name>` to inspect the evidence before editing. Since tier policy is experimental, revalidate pins after compiler upgrades and measure the application goal rather than preserving an old tier name mechanically.
