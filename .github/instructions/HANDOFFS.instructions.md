# METIS: Code Handoff Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document defines what a code handoff is and how it is laid out. It does not describe how to produce one — that lives in the handoff skills.

## Overview

A **code handoff** is a single Markdown document written for a coworker who will review a feature you have developed. It tells the reviewer what changed, what to verify by hand, what to cover with tests, and — once the review is underway — records what was found and what was done about it.

1. **The author writes it.** Summary, manual test checklist, automatic test checklist, and coverage specifics. Every checkbox starts unchecked and the Findings section starts empty.
2. **The reviewer works through it.** Manual tests, automatic tests, and the review itself — boxes get checked as the tests pass and findings are added as they are discovered.
3. **The author resolves the findings.** Resolution happens in place: the box is checked and a reply appended beneath it. Tests the review left failing come back too — their boxes are checked once the fix makes them pass.

Handoffs live in `handoffs/{version}/{feature-name}.md`, kebab-case, where `{version}` is the release the work ships in — `handoffs/2.5.2/member-unban.md`. The directory is gitignored, so writing there never touches a commit.

The document is edited continuously, not written once at the end. Its state at any moment is the state of the review.

Every file link and line number in it — in findings, in coverage specifics, anywhere — is accurate when written and is not maintained afterward. Code moves, and a reference that no longer lands where it did is expected rather than a defect. Each one records where something was at the moment it was written, not where it is now.

---

## Document Format

```markdown
# {Feature Name} — Code Handoff

**Status:** {Awaiting review | In review | Resolving findings | Complete} — {n}/{n} manual tests pass, {n}/{n} automatic tests pass, {n}/{n} findings resolved

**Author**: `{Author Name}` \
**Reviewer**: `{Reviewer Name}`

## Summary of Changes and Coverage

{Up to four sentences and 100 words on what this change is. **New feature** — the purpose it serves: what a user could not do before, and what it is for. **Refactor or overhaul** — why the change was necessary: what the previous design cost and what forced the rework.}

{A brief walkthrough of how the system works and the biggest players in it, linking the main classes and entry points by name. Trace what happens on a typical operation — where it enters, what carries it, where it lands. Orientation only.}

## Manual Tests

- [ ] A discrete, verifiable behavior.
- [ ] Another behavior.

## Automatic Tests

### `ClassName.methodName`

`tests/projects/unit/shared/path/ClassName.test.ts`

- [ ] A specific test case.
- [ ] Another test case.

## Findings

**Critical 0 · High 2 · Medium 1 · Low 3 · Advisory 2**

### High

- [ ] [File.ts:41](/path/to/File.ts) — **The claim, in one bold sentence.** Supporting detail: what
      the code does, why it is wrong, and what closing it would take.

### Medium

- [x] [OtherFile.ts:118](/path/to/OtherFile.ts) — **The claim.** Supporting detail.

  > **{Author Name}** _{MM:DD:YYYY:HH:MM}_ What was changed, and why.

### Advisory

- [ ] [ThirdFile.ts:9](/path/to/ThirdFile.ts) — Not a defect, but worth knowing.

## Coverage Specifics

- [shared/missions/effects/Effect.ts](/shared/missions/effects/Effect.ts) — What this file is and the role it plays in the feature.
- [client/src/sessions/SessionClient.ts](/client/src/sessions/SessionClient.ts) — Scoped here to the batched update handlers. (The realm architecture is covered by [handoffs/2.5.2/other-feature.md](/handoffs/2.5.2/other-feature.md).)
```

---

## Section Guidelines

### Title, Status, and Participants

The title names the feature concisely, followed by `— Code Handoff`.

The status line is one line, kept current as work proceeds. It has four values, each with a condition that must hold:

- **`Awaiting review`** — written and not yet picked up. No reviewer line, every box unchecked, Findings empty.
- **`In review`** — the reviewer has it. Holds until every manual test and every automatic test has been **addressed** — checked off as passing, or left unchecked with a note saying why — and every finding the review turned up is written down. Neither a failing test nor an open finding keeps it here; an unaddressed item does. A section the document declares unnecessary counts as addressed.
- **`Resolving findings`** — everything the reviewer owns is addressed and the document is back with the author. Whatever is still open is the author's to close.
- **`Complete`** — every box in the document is checked, manual tests, automatic tests, and findings alike.

Whoever edits the document checks whether its status still holds and corrects it if it does not. That upkeep — the status line and the findings tally alike — is silent: never report a correction, and never remark that one was unnecessary.

The author leaves the findings count off; the reviewer adds it when the review begins.

Beneath it, `**Author**` names whoever wrote the feature and this document, and `**Reviewer**` names whoever reviews and tests it against the document's claims — each taken from that person's `git config user.name`. The author writes the author line alone; the reviewer line is added when the review begins. The trailing backslash on the author line is a hard line break — without it the two render as one line.

### Summary of Changes and Coverage

Two paragraphs: what the change is and why it was made, then a brief walkthrough of how the system works and its biggest players, with the main classes and entry points linked by name.

### Notes

A note records anything that happened beneath a checkbox — a test that failed, a test that passed once a fix landed, a finding that was resolved. One form throughout the document:

```markdown
> **Jordan Stokes** _07:29:2026:11:27_ What happened, in a sentence.
```

The name is whoever wrote the note, from their `git config user.name`; the timestamp comes from `date "+%m:%d:%Y:%H:%M"`. Indent two spaces to stay inside the list item, prefix every wrapped line with `>`, and separate paragraphs with a bare `>`.

Notes accumulate. A later note goes beneath the ones already there rather than replacing them — the sequence is the record.

### Cross-References

A note pointing at a finding cites it `{Severity} #{n}`, counting from the top of that severity group. A finding pointing back at what surfaced it cites `manual test {n}` or `automatic test {n}`, counting from the top of that checklist. Neither number is written into the document; both are read off it.

### Manual Tests

A checklist of behaviors verified by hand in a running instance. A checked box means the behavior passed. A failure stays unchecked with a note beneath it, linking to the finding it confirms:

```markdown
- [ ] Update an outdated effect whose data cannot be migrated cleanly and confirm the update reports failure.

  > **Jordan Stokes** _07:29:2026:11:27_ Reported success instead, and the issue stayed in the list — see High #1.
```

When no manual testing is required, the section is a single sentence saying so and why, in place of the list.

### Automatic Tests

A checklist of test cases, grouped under a `###` heading named for the class or component, with the target test file path directly beneath it. The suite is green when the handoff is written.

A checked box means the test is written **and passing**. A test written but failing stays unchecked with a note beneath it, the same as a failed manual item:

```markdown
- [ ] A script producing schema-violating output causes `migrate` to throw.

  > **Jordan Stokes** _07:29:2026:11:27_ Written, fails today — the cursor advances before validation runs. See High #2.
```

A test that fails because it exposes a real product defect makes that defect a **finding**, not a coverage gap. Additional coverage a reviewer writes is added to the checklist, checked.

### Findings

- The section opens with a one-line tally: `**Critical 0 · High 2 · Medium 1 · Low 3 · Advisory 2**`, omitting tiers with no entries.
- Findings are grouped under `### Critical`, `### High`, `### Medium`, `### Low`, and `### Advisory`, omitting empty groups, and ordered by severity then practical impact.
- Every finding is a checkbox. Unchecked means open; checked means resolved, declined, or determined to be a false flag.
- Each finding leads with its file path and line as a Markdown link, then a **bold one-sentence claim**, then the supporting detail. Every workspace file path is a link, including those inside the detail.
- A finding records the defect and its evidence, never how to resolve it — not a fix, not a direction, not a hint at one. The author derives the options when resolving, and anything written here anchors them to the reviewer's framing.
- Findings are resolved **in place**: the box is checked and a note appended beneath it. Declines and false flags are checked off like any other resolution, marked **Declined** or **False flag** in the note.
- Resolved findings stay where they are. They are not moved to a separate section or deleted — the list is the record.

Severity is what the defect does, not how it was found:

#### Critical

The system is unusable or its core function is broken: production data is corrupted or destroyed, the server crashes, or an unprivileged user reaches something they should never see. A finding here stops everything else — the fix ships before the feature does. The tier is rare, and inflating into it is exactly what costs it its meaning. If the damage is bounded or the path to it is narrow, the finding belongs lower.

#### High

Wrong behavior a user hits on a normal path. The system still runs, which is what separates this from Critical, but the feature does not do what the handoff claims: a silent behavior inversion, a request that never responds, a crash on ordinary input. These take priority over everything below them. Urgency here is about the damage that reaches users, not about how hard the fix looks.

#### Medium

A real defect on a narrower path, or one the code structurally guarantees will surface even though nothing has hit it yet — an authorization gap, a migration that cannot be re-run, a payload computed for one member and sent to many. The ordinary case still works, so the feature is usable, but the defect is real and someone will eventually reach it. These are resolved in the normal course of the handoff rather than deferred to a later release.

#### Low

Minor problems that do not significantly impact the user's experience: presentation defects, slight performance issues, or minor inconveniences. The cost falls on whoever reads or debugs the code next, not on the user. They are worth recording and usually cheap to close, but they can sometimes wait for a later release if a deadline is pressing. Style guide violations can also be recorded here. Group related style-guide violations together for convenience.

#### Advisory

Not a defect at all. This is where observations go — a latent hazard the current design happens to avoid, an assumption that holds today by coincidence, something that surprised you while reading. Nothing here obligates the author to change anything; the box is checked once it has been considered. Do not use the tier as a parking spot for claims you were not willing to verify — those get dropped rather than recorded.

### Coverage Specifics

The changed-file inventory: what the reviewer reads, and what each file contributes. Each entry is a link followed by one sentence on the file's role in this feature.

Links are absolute. Display text is the workspace-relative path; the link target is the same path prefixed with `/` (e.g. `[shared/missions/nodes/NodeAlert.ts](/shared/missions/nodes/NodeAlert.ts)`). Relative paths (`../`) and bare workspace-relative targets are not used.

When only part of a file is in scope, the entry says so and points at the handoff covering the rest: _"Scoped here to `migrateEffect`. (Argument members are covered by [handoffs/2.5.2/target-argument-system.md](/handoffs/2.5.2/target-argument-system.md).)"_
