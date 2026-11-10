---
title: Releases and documentation versions
description: Prismio release notes, current language version, and architecture for retaining older documentation.
status: stable
version: "0.2.0"
lastUpdated: "2026-11-10"
tags: [releases, versioning, changelog]
related: [releases/0.2.0, releases/0.1.0, migration, specification/conformance]
---

**Current documented language and compiler version: 0.2.0.**

- [Prismio 0.2.0](/releases/0.2.0) — published 2026-11-10: [downloads](https://github.com/prismio-lang/prismio/releases/tag/v0.2.0), async functions and scoped tasks, the language server and formatter, freestanding builds, and the breaking changes. Coming from 0.1? Read [Migrating from 0.1 to 0.2](/migration/0.1-to-0.2).
- [Prismio 0.1.0](/releases/0.1.0) — the first release, published 2026-10-02: [downloads](https://github.com/prismio-lang/prismio/releases/tag/v0.1.0), what is new, the breaking changes, what is not included

To install it, see [Install](/start/installation). Every release archive has a `.sha256` beside it, and the archives are not signed.

Current reference URLs are unprefixed and carry machine-readable `version` metadata. At the first compatibility-breaking documentation release, the previous tree will be retained under `/versions/<version>/`, and a version selector will link current and archived copies. Canonical URLs will keep search engines from treating identical latest/versioned pages as duplicates.

There is no stability channel distinction yet. “Implemented” means present in the audited compiler, not guaranteed unchanged through 1.0.
