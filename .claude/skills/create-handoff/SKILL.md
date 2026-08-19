---
name: create-handoff
description: Generate a code handoff document for a feature — establish its scope from the git history, understand how it works, and write the document to handoffs/. Use when the user asks to "create a handoff", "write a handoff for this feature", or hand work off for review.
---

# Create Handoff

Write the initial handoff for a feature the user has built. This produces the **author's half**: Summary, Manual Tests, Automatic Tests, Coverage Specifics. Findings belongs to the reviewer and starts empty.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on structure and section rules; this skill is procedure only and deliberately does not restate the format. If the two ever disagree, the guide wins.

## Phase 1 — Establish scope

This is the hard part and the one worth spending time on. A handoff that lists the wrong files wastes the reviewer's entire pass.

The feature may be recent, or months old and already merged. Start wide, then narrow:

```bash
git status --short
git log --oneline -30
git diff --stat main...HEAD
```

If the work predates the current branch, find it by path or by message:

```bash
git log --oneline --all -- <path/to/suspected/file>
git log --oneline --all --grep '<feature keyword>'
```

Rules:

- **Do not guess between two candidate scopes.** If the recent history holds more than one plausible feature, list what you found and ask which. Guessing wrong costs the reviewer more than the question costs the user.
- A feature is rarely one commit. Follow it back until the earliest commit that belongs to it, then confirm the range with the user if it is not obvious.
- Check `ls handoffs/` for sibling handoffs covering adjacent work. Overlap is normal in this repo — one release's slices frequently touch the same files, and the reviewer needs to know which part is theirs. Cross-reference them in the Summary and scope the file entries accordingly.
- Exclude files the feature did not change, however relevant they seem. Coverage Specifics is a changed-file inventory, not a reading list.

## Phase 2 — Understand the mechanism

Read the code, not just the diff. The Summary requires a walkthrough of how the system works and its biggest players, and you cannot write that from `git diff --stat`.

Work out, concretely:

- Where a typical operation enters the system, what carries or transforms it, and where it lands.
- Which two or three classes are load-bearing, versus which files are incidental.
- Whether this is a **new feature** or a **refactor/overhaul** — the Summary is framed differently for each, and the difference is not always obvious from the diff. Ask the user if the history does not make it clear. A refactor needs the justification, and that is the part only they have.

This phase also produces the one-sentence-per-file descriptions in Coverage Specifics. Generic descriptions like "was updated" mean this phase was skipped.

## Phase 3 — Check the preconditions

The handoff assumes a green suite. Before writing:

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npm test
```

If the feature broke or made stale any pre-existing test, **stop and tell the user**. Repairing it is their call and comes before the handoff — do not write the document around a known-red suite, and do not repair the tests yourself unless asked.

Report anything that did not run rather than implying it passed.

## Phase 4 — Write it

Follow the guide's format exactly.

### The Summary

Two paragraphs, and the framing of the first depends on the kind of change:

- A **new feature** states its **purpose**. What could a user not do before? What is it for? A reviewer who does not know why it exists cannot judge whether the implementation serves it.
- A **refactor or overhaul** states **why the change was necessary**. What did the previous design cost — bugs it invited, work it made expensive, limits it imposed — and what forced the rework now? A list of what moved is not a justification; the diff already carries that. The reasoning is the part only the user has, so ask for it if Phase 2 did not turn it up.

Two to four sentences, concrete enough that a reviewer can tell from it alone whether a given file is in scope. Cross-reference the sibling handoffs found in Phase 1 so findings are not reported against someone else's slice.

The second paragraph is the walkthrough: the mechanism and its biggest players, with the main classes, methods, and entry points linked by name, tracing what happens on a typical operation. The audience is a coworker who has not seen this code — they should finish it understanding the basic shape of the system and knowing which file to open first. Orientation, not completeness: a few sentences and a handful of links. Detail that runs longer belongs in Coverage Specifics.

### The Manual Tests

QA steps a coworker can follow in a running instance **without reading the code**. A non-developer tester has to be able to work through the list.

- Each item is a discrete, verifiable behavior, not an implementation detail.
- Include the trigger where relevant — "via the session page", "as an instructor".
- Cover edge cases alongside the happy path: empty state, real-time sync between two clients, most-severe-wins logic, behavior when no items exist.
- After drafting, reread every item and strip any class, method, component, or event name that leaked in. This is the most common defect in generated handoffs — the author knows the internals and it shows.
- Focus on intended behavior, not what the code currently does. If you already see an issue in the code, still write the test as if it were correct so that the reviewer can discover the bug while performing the test.

### The Automatic Tests

Reserved for **critical functionality**: security boundaries, corruption or loss of persisted data, server crashes. Requesting a test per behavior is wrong here and wastes reviewer time.

- Presentation and convenience behavior — rendering, styling, ordering, expansion state — goes on the manual checklist instead.
- If the feature has no critical surface, say so with a reason rather than padding the list.
- Each bullet is one concrete case, specific enough that a developer can write it without guessing.
- Do not list tests that already exist.
- Each group names a target file path. A path outside every configured Jest root never runs, and a plausible-looking directory is not evidence that one exists — see `write-handoff-automatic-tests` Phase 1 for how to check before writing a path into the document.
- Focus on intended behavior, not what the code currently does. If you already see an issue in the code, still write the test as if it were correct so that the reviewer can discover the bug while performing the test.

### The Coverage Specifics

Only files this feature changed — including supporting work the feature required, not just the files that are recognizably the feature. Ordered from most foundational (shared models, server logic) to most surface-level (client components). Each gets one specific sentence on its role — "was updated" means Phase 2 was skipped.

### The rest

- Status line starts `Awaiting review`, with the manual and automatic counts filled in and no findings count — the reviewer adds that when the review begins.
- The author line names the user, from `git config user.name`. Write no reviewer line — the reviewer adds their own when the review begins.
- Include the `## Findings` heading with nothing under it. No tally — the reviewer adds one.
- Every checkbox starts unchecked.

## Phase 5 — Stop

Report concisely: where the document was written, the scope you settled on, and anything you were unsure about.

Then stop. Do not review your own handoff, do not populate Findings, and do not write the tests it asks for. Those are separate passes with separate skills, and a reviewer reading findings the author wrote learns nothing about whether the code survives another pair of eyes.
