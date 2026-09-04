---
title: Lifetimes
description: Status of user-visible lifetime syntax in Prismio and the checks available in 0.1.
status: coming-soon
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [lifetimes, borrowing, coming-soon]
related: [language/ownership-and-borrowing, specification/memory-model, roadmap]
---

User-written lifetime parameters or annotations are **not implemented in Prismio 0.1**. There is no `'a`-style syntax and no general reference type in source code.

The current compiler still enforces useful lifetime-related restrictions through parameter modes, move state, scope, array escape checks, and AIF. Those checks should not be described as a complete formal borrow checker.

