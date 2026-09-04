---
title: Networking API
description: Planned sockets and networking modules for Prismio; not included in 0.1.
status: coming-soon
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [standard-library, networking, sockets, coming-soon]
related: [stdlib, language/ffi, language/concurrency]
---

Prismio 0.1 has **no importable networking library**. Sockets, DNS, HTTP, TLS, and asynchronous I/O are not standardized.

FFI can reach host networking APIs, but portability, cleanup, blocking semantics, and thread safety remain the application's responsibility.
