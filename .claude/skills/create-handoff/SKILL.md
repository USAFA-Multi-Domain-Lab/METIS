---
name: create-handoff
description: Generate a code handoff document for a feature — establish its scope from the git history, understand how it works, and write the document to handoffs/. Use when the user asks to "create a handoff", "write a handoff for this feature", or hand work off for review.
---

# Create Handoff

Write the initial handoff for a feature the user has built. This produces the **author's half**: Summary, Manual Tests, Automatic Tests, Coverage Specifics. Findings belongs to the reviewer and starts empty.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on structure and section rules; this skill is procedure only and deliberately does not restate the format. If the two ever disagree, the guide wins.

## Phase 1 — Determine the version

The handoff goes in `handoffs/{version}/`, the release the work ships in. Read `version` from `package.json` and compare it against the newest `# version-{n}` heading in `docs/changelog.md`:

- **`package.json` is ahead of the changelog** — that is the version. The release is open and this work belongs to it.
- **The changelog already has an entry for that version** — the bump has not happened yet, so the number is either stale or the user has begun writing the changelog early. Ask the user which version this handoff is for; do not assume the next one.

Create the directory if it does not exist. This phase comes first because it bounds the next one: the release's tag is where the history search starts, and its directory holds the sibling handoffs.

## Phase 2 — Establish scope

This is the hard part and the one worth spending time on. A handoff that lists the wrong files wastes the reviewer's entire pass.

Releases are tagged `v{version}` (assuming the tags have been pulled down from GitHub), so the previous release's tag is the earliest commit this version's work can start from:

```bash
git describe --tags --abbrev=0   # the previous release, e.g. v2.5.1
git status --short
git log --oneline v{previous}..HEAD
git diff --stat v{previous}...HEAD
```

The feature may be the branch you are on, or merged in weeks ago. Narrow by path or by message:

```bash
git log --oneline --all ^v{previous} -- <path/to/suspected/file>
git log --oneline --all ^v{previous} --grep '<feature keyword>'
```

Rules:

- **Do not guess between two candidate scopes.** If the release's history holds more than one plausible feature, list what you found and ask which. Guessing wrong costs the reviewer more than the question costs the user.
- A feature is rarely one commit. Follow it back to the earliest commit that belongs to it — never past the previous release's tag — then confirm the range with the user if it is not obvious.
- Read the handoffs already in `handoffs/{version}/` for sibling work. Overlap is normal in this repo — one release's slices frequently touch the same files, and the reviewer needs to know which part is theirs. Cross-reference them in the Summary and scope the file entries accordingly. Earlier versions' directories hold shipped work and are not siblings.
- Exclude files the feature did not change, however relevant they seem. Coverage Specifics is a changed-file inventory, not a reading list.

## Phase 3 — Understand the mechanism

Read the code, not just the diff. The Summary requires a walkthrough of how the system works and its biggest players, and you cannot write that from `git diff --stat`.

Work out, concretely:

- Where a typical operation enters the system, what carries or transforms it, and where it lands.
- Which two or three classes are load-bearing, versus which files are incidental.
- Whether this is a **new feature** or a **refactor/overhaul** — the Summary is framed differently for each, and the difference is not always obvious from the diff. Ask the user if the history does not make it clear. A refactor needs the justification, and that is the part only they have.

This phase also produces the one-sentence-per-file descriptions in Coverage Specifics. Generic descriptions like "was updated" mean this phase was skipped.

## Phase 4 — Check the preconditions

The handoff assumes a green suite. Before writing:

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npm test
```

If the feature broke or made stale any pre-existing test, **stop and tell the user**. Repairing it is their call and comes before the handoff — do not write the document around a known-red suite, and do not repair the tests yourself unless asked.

Report anything that did not run rather than implying it passed.

## Phase 5 — Write it

Follow the guide's format exactly.

**Do not hard-wrap the prose.** Every paragraph and every bullet is a single line, however long it runs — the IDE soft-wraps it to the window. Breaking prose at a fixed column makes the document harder to read and forces a whole paragraph to reflow on every later edit.

### The Summary

The first paragraph has a maximum of four sentences and 100 words. It should provide a concise summary of the feature or refactor, without run-on sentences. The framing for this summary depends on the kind of change:

- A **new feature** states its **purpose**. What could a user not do before? What is it for? A reviewer who does not know why it exists cannot judge whether the implementation serves it.
- A **refactor or overhaul** states **why the change was necessary**. What did the previous design cost — bugs it invited, work it made expensive, limits it imposed — and what forced the rework now?

Keep explanation general and high-level. Avoid implementation details. Do not include links.

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

Only files this feature changed — including supporting work the feature required, not just the files that are recognizably the feature. Ordered from most foundational (shared models, server logic) to most surface-level (client components). Each gets one specific sentence on its role — "was updated" means Phase 3 was skipped.

### The rest

- Status line starts `Awaiting review`, with the manual and automatic counts filled in and no findings count — the reviewer adds that when the review begins.
- The author line names the user, from `git config user.name`. Write no reviewer line — the reviewer adds their own when the review begins.
- Include the `## Findings` heading with nothing under it. No tally — the reviewer adds one.
- Every checkbox starts unchecked, and carries the ordinal the guide gives it: manual tests numbered from 1, automatic test groups numbered in their headings with their cases lettered from `a`.

## Phase 6 — Stop

Report concisely: where the document was written, the scope you settled on, and anything you were unsure about.

Close by invoking `next-handoff-step`, which names what comes next.

Then stop. Do not review your own handoff, do not populate Findings, and do not write the tests it asks for. Those are separate passes with separate skills, and a reviewer reading findings the author wrote learns nothing about whether the code survives another pair of eyes.
