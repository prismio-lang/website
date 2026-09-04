# Versioning & Stability

Understanding a language's versioning and stability guarantees helps you make informed decisions about when to adopt it and what level of confidence to have that your code will keep working as the language evolves.

This page explains how Prismio is versioned, what guarantees it makes (and does not make) at each stage of development, and what the path to long-term stability looks like.

> 🚧 **Coming Soon** – A formal stability policy and deprecation process will be published as part of the v1.0 milestone. Until then, the policies described here represent current intent, not binding commitments.

---

## Versioning Scheme

Prismio uses **Semantic Versioning (SemVer)** — the widely adopted versioning format `MAJOR.MINOR.PATCH`.

| Component | When It Changes | Example |
|---|---|---|
| **MAJOR** | Breaking changes to the language or stable APIs | `1.0.0` → `2.0.0` |
| **MINOR** | New features, backward-compatible additions | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, performance improvements, documentation | `1.0.0` → `1.0.1` |

### Pre-1.0 Disclaimer

> ⚠️ **Important:** Before Prismio reaches **v1.0**, **no stability guarantees are made**. During the pre-1.0 phase:
>
> - Syntax may change between minor versions.
> - Standard library APIs may be renamed, moved, or removed.
> - The compiler's behaviour may change in incompatible ways.
> - Language semantics (including ownership rules) may be revised.
>
> **Do not build production-critical software with pre-1.0 Prismio.** Early adoption is welcome and valuable — just go in with eyes open.

This is a deliberate choice. Getting the language design right — especially the ownership model, type system, and standard library architecture — is more important than false promises of stability before the design has been validated in practice.

---

## Version Channels

Prismio releases are distributed through three channels:

### Nightly

- Released every night from the main development branch.
- Contains the latest features and fixes, including work-in-progress.
- **No stability guarantees** — anything can break at any time.
- Useful for: compiler developers, language contributors, cutting-edge experimentation.

```
prismc --version
# Prismio 0.1.0-nightly.2026-06-04
```

### Beta

- Released periodically when a milestone is approaching completion.
- More stable than nightly but may still have breaking changes between betas.
- Useful for: early adopters, testing new features before they stabilise.

```
prismc --version
# Prismio 0.1.0-beta.3
```

### Stable

- Released at milestone boundaries (v0.1, v0.2, etc. and eventually v1.0).
- Bugs fixed in patch releases without breaking changes.
- **Recommended for most users** once a stable milestone is available.

```
prismc --version
# Prismio 0.1.0
```

> 🚧 **Coming Soon** – The first stable release (v0.1.0) has not yet been published. Subscribe to the GitHub repository to be notified when it is available.

---

## What "Stable" Means in Prismio

### Post-v1.0 Stability (Target)

Once Prismio reaches v1.0, the following stability guarantees are intended:

1. **Language Syntax** — Valid Prismio code that compiles on v1.0 will continue to compile on all v1.x releases. Syntax will not change in a breaking way within a major version.

2. **Standard Library API** — Public functions and types in `std.*` will not be renamed or removed without a deprecation period of at least one minor version.

3. **Compiler Behaviour** — Code that compiles without warnings on v1.x will not start producing errors on v1.(x+1). New warnings may be added in minor versions but will not be treated as errors by default.

4. **ABI Stability** — Binary compatibility of compiled libraries will be guaranteed within a major version.

5. **UMS Manifest Format** — The project manifest format (`ums.toml`) will remain backward-compatible within a major version.

### What Is Explicitly NOT Guaranteed

Even post-v1.0, the following may change:

- **Compiler error message wording** — Error messages may improve (change) in any release.
- **Compiler performance** — Compile times may change (hopefully for the better).
- **Internal compiler APIs** — If you use `libprismc` as a library, internal APIs are not covered by the stability guarantee.
- **Nightly / unstable features** — Features behind a `#[unstable]` attribute or nightly-only flag are not covered.

---

## Pre-v1.0 Versioning in Practice

During the current pre-1.0 phase, here is what each release type means in practice:

### Minor Version Bumps (0.x → 0.(x+1))

May include:
- New language features.
- **Breaking changes** to existing syntax or semantics.
- Standard library additions or **breaking API changes**.
- Tooling improvements that change command-line interfaces.

Every minor version will include a **migration guide** documenting breaking changes and how to update your code.

### Patch Version Bumps (0.x.y → 0.x.(y+1))

Will only include:
- Bug fixes.
- Performance improvements.
- Documentation updates.
- **No breaking changes** — even within pre-1.0 minor versions.

---

## Edition System

> 🚧 **Coming Soon** – An edition system (similar to Rust's edition model) is planned for a future milestone.

An *edition* is a way to introduce breaking language changes without breaking existing code. Old code opts in to a specific edition in the project manifest, and new editions can introduce incompatible improvements. The compiler supports multiple editions simultaneously.

```toml
# ums.toml (future format)
[project]
name = "my-app"
version = "1.0.0"
edition = "2027"   # chooses language edition
```

This allows the language to evolve freely while giving existing codebases time to migrate at their own pace.

---

## Deprecation Policy

> 🚧 **Coming Soon** – The formal deprecation policy will be published with v1.0.

The intended deprecation process for post-v1.0 changes:

### Phase 1: Deprecation Warning

When an API or language feature is scheduled for removal:

1. A deprecation warning is added in a **minor release**.
2. The compiler emits a warning when deprecated code is used.
3. Documentation is updated to recommend the replacement.

```prismio
// Example of a deprecation warning (future)
// Warning: `old_function` is deprecated since v1.3. Use `new_function` instead.
old_function()
```

### Phase 2: Removal

2. After at least **one full minor version** of deprecation warnings, the feature may be removed in the next **major release**.
3. The migration guide for the major release documents all removals.

### Security Exceptions

If a deprecated API has an active security vulnerability, it may be removed in a **patch release** without the normal deprecation period. Such removals will be clearly documented in the release notes with a CVE reference.

---

## Compatibility with the LLVM Backend

Prismio's LLVM backend version is pinned in each release. Upgrading the bundled LLVM version is considered a potential source of subtle behaviour changes and is treated carefully:

- LLVM major version upgrades are only done in **minor** (or **major**) Prismio releases.
- LLVM patch upgrades may be included in Prismio **patch** releases.

---

## Checking Your Version

You can always check your installed compiler version:

```
prismc --version
```

And your UMS version:

```
ums --version
```

To update to the latest stable release:

```
ums self-update
```

> 🚧 **Coming Soon** – `ums self-update` is planned for the v0.1 tooling milestone.

---

## Summary

| Phase | Breaking Changes | Recommended For |
|---|---|---|
| **Pre-Alpha (now)** | Expected and frequent | Language contributors |
| **v0.1 Alpha** | Possible between minor versions | Early adopters, experimenters |
| **v0.2–v0.9 Beta** | Minimised, documented with guides | Community builders, library authors |
| **v1.0 Stable** | Major-version only, long deprecation | Everyone, including production use |

---

## See Also

- [Roadmap](./roadmap.md) — The planned milestones toward v1.0.
- [Introduction](./introduction.md) — Getting started with Prismio.
- [Design Goals](./design_goals.md) — The values that guide language evolution decisions.
