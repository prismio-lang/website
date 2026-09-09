# Documentation style

Rules for anyone — human or agent — writing pages under `apps/docs/content` or
`apps/developers/content`.

This is the counterpart of the compiler repository's `CODE_STYLE.md`, and it has
the same purpose: not to make the pages look uniform, but to keep them
**usable by someone who does not already know the answer**.

---

## 1. Why this exists

The pages here are accurate, dense and confidently written. That is not the
same as being readable, and in September 2026 a measurement said so:

- **81 of 169 pages contained no runnable example** — no command, no output,
  nothing a reader could try.
- Openings led with mechanism, very often with a bare filename:
  *"`src/sema/checker.psm` coordinates semantic analysis…"*.
- Terms were used before they were introduced — *transfer function*,
  *post-sema*, *sole-regime*, *theta-fields*.
- Both glossaries expanded **AIF** as "Allocation Inference Framework" while the
  spec, `aif/README.md` and `src/aif/model.psm` all say **Adaptive**. The one
  page whose entire job is defining the acronym disagreed with the source, and
  the surrounding prose was so assured that nobody stopped to check.

That last one is the tell. Writing this dense reads as authoritative, which is
exactly why gaps in it survive.

**Density is not the problem. Keep every fact.** What was missing is the
on-ramp.

---

## 2. What this is built on

Two bodies of existing work. Neither is ours; both are worth reading.

### Diátaxis — *what kind of page is this?*

Daniele Procida's framework splits documentation into four modes that serve
different needs and must not be blended:

| Mode | Serves | Reader is |
|---|---|---|
| **Tutorial** | learning by doing | acquiring skill, needs a guaranteed-success path |
| **How-to** | a goal | competent, has a specific task |
| **Reference** | lookup | knows what they want, needs it exact |
| **Explanation** | understanding | wants the why, not doing anything right now |

**Prismio's distribution is badly skewed.** Nearly every page is reference or
explanation. There is almost no tutorial, and the how-to layer — the cookbook —
contained no commands at all. That is the structural half of the problem: a
newcomer arrives needing a tutorial and is handed a reference page.

### Cognitive load — *why an accurate page still fails*

John Sweller's cognitive load theory separates three demands on working memory:

- **Intrinsic** — the difficulty of the subject. Allocation inference *is* hard.
  You cannot remove this and should not try.
- **Extraneous** — load imposed by how the material is presented. This is the
  only kind worth cutting, and it is what our pages were full of.
- **Germane** — effort that actually builds a mental model. Worth spending.

Two named effects explain the rest:

- **The expert blind spot** (also *the curse of knowledge*): once you know
  something, you cannot reconstruct not knowing it. Our pages are written by the
  person holding the schema, for a reader assumed to hold it too.
- **The expertise reversal effect**: worked examples strongly help novices and
  measurably *slow down* experts. This is why the answer is not "add examples
  everywhere" but **ordering** — see §3.

The practical instruments come from three more places: Ausubel's **advance
organizer** (give the reader a frame before the details), Mayer's
**pre-training** principle (name the vocabulary before describing the process
that uses it), and John Carroll's **minimalism** (get the reader doing real work
immediately, and treat error recovery as first-class content).

---

## 3. The page shape

Diátaxis says don't mix modes. Our contributor pages legitimately need two: a
reader must learn *what AIF is* and *how to change it*, often on one page.

**We resolve that by ordering rather than separation.** Every page runs
orientation → use → internals, in that order:

1. **What problem does this solve** — plain words, before any filename.
   *(advance organizer)*
2. **See it work** — a real command and its **real, pasted** output.
   *(minimalism; worked-example effect)*
3. **How to read a failure** — real failure output, and what to do about it.
   *(error recovery is content, not an appendix)*
4. **A worked example** — one real, traced case, where a good one exists.
5. **The internals** — explicitly labelled *"if you are changing this"*.
   *(progressive disclosure; lets the expert skip, without blocking the novice)*

The label on step 5 is doing real work. It is what lets an expert jump straight
past the on-ramp without the on-ramp having been removed for everyone else.

**Not every page needs all five.** A pure reference table needs §1 and then the
table. But the order never inverts: internals never come before orientation.

---

## 4. Rules

1. **Never open with a filename or a bare identifier.** Open with the problem
   the subject solves. `src/driver/compile.psm` is an answer to a question the
   reader has not been given yet.

2. **Every page earns at least one runnable block** — a command, a snippet, or
   an output sample. If a page genuinely cannot have one, say so in frontmatter
   (`no-command: <reason>`) rather than leaving it silently absent.

3. **Paste real output. Never invent it.** Run the command, copy what it
   printed. Invented output goes stale invisibly and teaches the reader to
   distrust the page. Where a `prismio` snippet compiles standalone, mark it
   `<!-- prismio-check: pass -->` so the example gate verifies it.

4. **Expand an acronym on first use, per page.** Readers arrive from search, not
   from the top of a section.

5. **Define a term before the process that uses it.** If a paragraph needs
   *sole-regime*, the sentence before it says what that is, or links to where.

6. **Show what failure looks like.** For anything a reader runs, the failure
   output is more valuable than the success output — success needs no
   documentation.

7. **Prefer one traced real example to three abstract rules.** A bug you
   actually chased, with the numbers it produced, transfers understanding that a
   general statement does not.

8. **Headings name the reader's question, not the mechanism.**
   *"How to debug a disagreement"*, not *"Parsers and compared facts"*.

9. **State deliberate omissions.** Where coverage is partial, write it down.
   Silence reads as completeness and hides gaps — this is how a wrong glossary
   entry survives beside correct prose.

10. **Keep the density.** Do not pad, hedge, or soften to seem friendlier. Cut
    extraneous load — missing structure, undefined terms, absent examples — and
    leave the intrinsic difficulty intact.

---

## 5. What the gate checks

`scripts/audit-content.mjs` already gates frontmatter and internal links. The
readability rules above are mostly mechanical, and the ones that are should be
enforced there rather than left to review:

| Rule | Check |
|---|---|
| 2 | body contains a fenced `bash`/`prismio`/`text` block, or frontmatter declares `no-command` |
| 1 | first prose paragraph does not begin with a backticked identifier or a path |
| 4 | a known acronym appearing in the body appears once with its expansion |
| 4 | expansions match a single source-of-truth table (the `AIF` case) |
| 8 | no heading from a banned-phrasing list (`Implementation map`, `Parsers and …`) |

Everything else is review judgement. The point of moving a rule into the gate is
not ceremony — it is that **a rule nobody can check is a rule that drifts**, and
this repository has just demonstrated exactly that with the AIF acronym.

---

## 6. Before and after

From `apps/developers/content/testing/aif-differential.md`.

**Before** — accurate, and unusable if you did not already know what AIF is:

> AIF has two implementations that deliberately share no analysis code. The
> production pass lives in `src/aif`; `aif/prototype/aif.py` is the independent
> Python oracle. […] it detects a silently different transfer function by
> comparing every maintained result and exclusion counter over the same
> post-sema program.

**After** — same facts, with somewhere to stand:

> Prismio decides at compile time where every value your program allocates should
> live: a stack slot, an arena reclaimed in bulk, the heap with a reference
> count, or the heap without one. Making that decision is the job of **AIF**, the
> Adaptive Inference Framework […]
>
> Nothing inside the compiler can check that decision against itself, because a
> wrong rule does not crash. It produces a plausible-looking number, the test
> suite stays green, and the bug surfaces much later as a use-after-free with
> nothing pointing at the cause.
>
> So the analysis is written **twice**, deliberately […]

Nothing was removed. The reader was given the problem before the mechanism, and
the reason the mechanism has to exist before its parts.

`testing/aif-differential.md` and `aif/overview.md` are the two worked examples
of this style. Read them before writing a new page.

---

## 7. This is not finished

At the time of writing, two pages follow this and roughly eighty do not. The
order to work through them is by *vocabulary debt*: the overview pages first,
because every deeper page assumes the vocabulary they are supposed to
establish, then the cookbook, which is how-to content that currently reads as
explanation.

No framework is perfect and this one is not either. It is specific and mostly
checkable, which is the only kind that survives contact with a codebase.
