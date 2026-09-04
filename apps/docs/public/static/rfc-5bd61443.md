# RFC Process

> 🚧 **Coming Soon** – The formal RFC process is being established. This page describes the intended process.

## What is an RFC?

RFC stands for **Request for Comments**. An RFC is a document proposing a substantial change or addition to the Prismio language, standard library, or toolchain.

The RFC process ensures that significant design decisions are:
- **Documented** — the rationale is written down for future reference
- **Discussed** — the community has a chance to provide feedback
- **Deliberate** — changes are not rushed into the language

---

## When to Write an RFC

**You need an RFC for:**
- New syntax or language features
- Changes to the type system
- New standard library modules
- Breaking changes to existing behavior
- Significant compiler behavior changes
- Changes to the ABI or memory model
- Major toolchain additions (new subcommands, etc.)

**You do NOT need an RFC for:**
- Bug fixes
- Performance improvements that don't change behavior
- Documentation improvements
- Adding tests
- Minor API additions that follow existing patterns
- Clarifying the specification

---

## RFC Template

Create a new file at `rfcs/XXXX-short-name.md` (where XXXX is the next available number):

```markdown
# RFC XXXX: [Feature Name]

## Summary

One paragraph explaining the feature.

## Motivation

Why is this change needed? What problems does it solve? 
What use cases does it enable?

## Guide-Level Explanation

Explain the feature as if you were teaching it to a Prismio user.
Include examples. This will form the basis of documentation.

## Reference-Level Explanation

Technical details of the implementation:
- Exact syntax
- Type system implications
- Interaction with existing features
- Edge cases

## Drawbacks

- Why should we NOT do this?
- What is the implementation cost?
- What are the tradeoffs?

## Alternatives

- What other designs were considered?
- What is the impact of not doing this?

## Unresolved Questions

- What aspects of the design are still unclear?
- What needs to be decided before implementation?
- What can be deferred to a future RFC?
```

---

## RFC Lifecycle

```
Draft → Open for Discussion → Final Comment Period → Accepted / Rejected → Implemented → Stabilized
```

### 1. Draft

Write your RFC using the template. Share it for early feedback via GitHub Discussions or Discord before opening a formal PR.

### 2. Open for Discussion

Open a Pull Request to the [prismio-lang/rfcs](https://github.com/prismio-lang/rfcs) repository. The PR starts the formal discussion period.

### 3. Final Comment Period (FCP)

When the core team believes the RFC is ready for a final decision, they enter a **10-day Final Comment Period**. This gives the community one last chance to raise concerns.

### 4. Decision

After FCP, the core team makes a decision:
- **Accepted** — The RFC is merged. Implementation can begin.
- **Postponed** — Good idea, but not the right time.
- **Rejected** — The proposal will not be implemented (with rationale).

### 5. Implementation

Once accepted, the RFC gets a tracking issue. Implementation PRs link to this issue.

### 6. Stabilization

Features land behind a feature flag initially. After sufficient testing and feedback, they are stabilized and available in stable Prismio.

---

## Discussion Guidelines

- Be constructive and specific in feedback
- Focus on technical merits
- Propose alternatives, not just objections
- Reference prior art when relevant
- Acknowledge tradeoffs

---

## Core Team RFC Process

The core team discusses RFCs in regular meetings. Meeting notes are published publicly.

Core team members are expected to:
- Review RFCs within 2 weeks of submission
- Provide substantive feedback or delegate review
- Reach consensus before accepting or rejecting

---

## RFC Repository

> 🚧 **Coming Soon** – [github.com/prismio-lang/rfcs](https://github.com/prismio-lang/rfcs)

See also: [Source Repositories](./source.md), [Issue Labels](./issues.md), [Style Guide](./style.md)
