# Security Policy

## Overview

The Prismio team takes security seriously. This document describes how to report security vulnerabilities and what to expect from us.

---

## Supported Versions

| Version | Status |
|---------|--------|
| `main` branch | ✅ Security fixes applied |
| Latest release | ✅ Security fixes applied |
| Older releases | ⚠️ Best effort (pre-1.0, limited resources) |

---

## Reporting a Vulnerability

> **Please do NOT open a public GitHub issue for security vulnerabilities.** Public disclosure before a fix is available puts all users at risk.

### How to Report

Send an email to:

**vibrant.official275@gmail.com**

Subject line: `[SECURITY] <brief description>`

### What to Include

Please provide as much information as possible:

1. **Description** — What is the vulnerability? What can an attacker do?
2. **Affected component** — Compiler, stdlib, LSP, CLI?
3. **Reproduction steps** — Step-by-step instructions to reproduce
4. **Proof of concept** — Code or commands that demonstrate the issue
5. **Impact assessment** — What is the potential impact?
6. **Suggested fix** — If you have ideas for a fix, please share them

---

## What Counts as a Security Vulnerability

### In Scope

- **Compiler vulnerabilities** — Bugs that allow crafted Prismio source code to compromise the compiler host machine
- **Supply chain attacks** — Vulnerabilities in the build process or release pipeline
- **Memory safety violations in safe code** — If safe Prismio code can produce memory unsafety without `unsafe`
- **Privilege escalation** — If Prismio programs can gain unintended privileges
- **Denial of service** — If crafted Prismio source code causes the compiler to hang or crash (resource exhaustion)
- **Cryptographic weaknesses** — In any crypto included in the stdlib

### Out of Scope

- **Bugs in user-written Prismio programs** — The programmer's responsibility
- **`unsafe` code** — By definition, `unsafe` blocks can violate safety guarantees
- **Theoretical vulnerabilities** — Must be demonstrably exploitable
- **Social engineering** — Not a software vulnerability

---

## Responsible Disclosure Process

### Timeline

| Stage | Timeline |
|-------|---------|
| Acknowledge receipt | Within 48 hours |
| Initial assessment | Within 7 days |
| Status update | Every 14 days |
| Fix developed | Within 90 days (usually sooner) |
| Coordinated disclosure | After fix is released |

### What We Commit To

- Acknowledge your report within **48 hours**
- Keep you informed of our progress
- Credit you in the security advisory (unless you prefer anonymity)
- Not take legal action against good-faith reporters
- Fix genuine vulnerabilities promptly

### Coordinated Disclosure

We ask that you:
- Give us time to develop and release a fix before public disclosure
- Keep the details confidential until we've released a patch
- Coordinate the disclosure date with us

We target a **90-day** disclosure window, though most issues are resolved faster.

---

## Security Advisories

After a fix is released, we publish a security advisory on GitHub:

`https://github.com/prismio-lang/prismio/security/advisories`

Advisories include:
- CVE identifier (if applicable)
- Severity rating (Critical/High/Medium/Low)
- Description of the vulnerability
- Affected versions
- Fixed version
- Workarounds (if any)
- Credit to the reporter

---

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities. With your permission, your name/handle will be listed here.

*No entries yet — be the first!*

---

## Scope of Security Guarantees

### Memory Safety

Prismio's ownership and borrow checker guarantee memory safety in **safe code**:

- No use-after-free
- No buffer overflows (bounds-checked indexing)
- No null pointer dereferences
- No data races

These guarantees **do not apply** to `unsafe` blocks.

### Compiler Trust

The Prismio compiler is a trusted program. Do not compile untrusted Prismio code on production systems (same caution applies to any language compiler).

---

## Security Best Practices for Prismio Users

1. **Keep Prismio updated** — always use the latest release
2. **Audit `unsafe` blocks** — minimize and document unsafe usage
3. **Verify dependencies** — audit third-party packages you use
4. **Use release builds for production** — debug builds may leak information
5. **Follow the principle of least privilege** — don't run Prismio programs with root/admin

---

## Contact

Security-related questions: **vibrant.official275@gmail.com**

For general questions, use [GitHub Discussions](https://github.com/prismio-lang/prismio/discussions).
