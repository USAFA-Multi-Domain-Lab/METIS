---
name: resolve-finding
description: Implement a chosen resolution for a review-report finding, verify it, then stop and wait for the user to stage and approve. On approval, commit and annotate the report. Use when the user says how they want a finding resolved ("fix it by...", "resolve this with...", "decline this one because..."). Never commits without approval in that same message.
---

# Resolve Finding

Implement the user's chosen resolution, verify it, then **stop**. The user reviews and stages every
change themselves. Commit only after they approve, in that message.

## Phase 1 — Implement

Confirm which finding and which approach before touching anything. If the premise has not been checked
yet (see `next-finding`), check it first — do not implement a fix for a claim that is not true.

Scope discipline:

- Change what the chosen resolution requires, nothing more.
- Do not reformat untouched regions. Do not fix adjacent things you notice — mention them instead.
- Do not write or modify tests. Not unless the user asks, and a fix request does not imply coverage.

Follow `AGENTS.md`: `let` by default, no abbreviated names, class members ordered instance properties
→ constructor → instance methods → static properties → static methods. Doc comments state behavior;
rationale belongs in the commit message.

Prefer a narrowing guard or type predicate over a cast, and a direct precondition check over
`try`/`catch`, when either is available — a catch also swallows unrelated throws.

## Phase 2 — Verify

TypeScript is the real gate in this repo. Always run all three, plus lint on what changed:

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npx eslint <changed files>
```

**Tests only for a significant change** — a behavior change, anything crossing the client / shared /
server boundary, a payload or wire-format change, a migration. When it qualifies, run everything:

```bash
npm test
```

The project does not carry much unit coverage, so a green `test:unit` proves little on its own. That
is exactly why the significant changes get the full suite rather than the fast tier. For a doc comment,
a rename, a type-only change, or anything else inert, skip tests entirely — do not pad the report with
a check that means nothing here.

**Prettier is not a project gate.** There is no `format` script, no pre-commit hook, and it is not a
pinned devDependency, so `npx` resolves whatever is current and several files fail `--check` at HEAD on
union-type formatting alone. Run it only when the finding is itself about formatting, and confirm the
failure is yours before acting:

```bash
git show HEAD:<file> > <scratchpad>/head.ts && npx prettier --check <scratchpad>/head.ts
```

If HEAD fails the same way, it is pre-existing — say so and leave it. Never reformat untouched regions.

Report the real result of whatever ran, and name anything that did not run rather than implying it
passed. If the sandbox classifier is unavailable, retry rather than skipping silently.

## Phase 3 — Stop

Report **concisely**: what changed, what verification passed, anything you deliberately left alone.

Then **stop**. Do not stage. Do not commit. Do not check off the report yet.

The user reviews the diff hunk by hunk and stages it. Expect follow-up: they often edit the fix, extend
it, or revert it entirely after realizing why the original shape was right. When they say "check now"
or "what do you think", re-read the file, review honestly, and flag anything still wrong — including
things they believed they had fixed. Then stop again.

## Phase 4 — Commit, on approval only

Approval means the user asks in that message. **A commit request covers that commit only and is never
standing permission.** Approving the implementation is not approving a commit.

Before committing:

- `git status --short` — commit what the user staged. If they staged a subset, respect that.
- Confirm the tree is on a feature branch, not `main`.
- Re-run verification if anything changed since Phase 2.

Commit message: imperative subject line, then prose explaining the defect and the reasoning — in
particular _why_ the chosen approach, when the report's suggestion was declined or adapted. End with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## Phase 5 — Annotate the report

The report was written **for** the user, not by them. **Never alter its original content.** Do not fix
its stale line numbers, its severity counts, its summary prose, or its wording, and do not add new
findings to it. Two changes only:

1. Flip `- [ ]` to `- [x]` on the finding.
2. Append a blockquote note directly beneath that item.

`[x]` means **resolved**, not "the suggestion was taken". The note carries that distinction:

```markdown
> **Jordan Stokes** _07:30:2026:08:42_ Fixed as suggested. <what changed and where>

> **Jordan Stokes** _07:30:2026:08:42_ Resolved, but the suggested fix was **not** taken. <why the
> suggestion was wrong or costly, then what was done instead>

> **Jordan Stokes** _07:30:2026:08:42_ **Declined — no change made.** <the reasoning>

> **Jordan Stokes** _07:30:2026:08:42_ **False flag — no change made.** <why the premise fails>
```

Timestamp is `MM:DD:YYYY:HH:MM` from `date "+%m:%d:%Y:%H:%M"`. Indent two spaces to stay inside the
list item, and prefix every wrapped line with `>`. Separate paragraphs with a bare `>`.

Write what actually happened. If the fix went somewhere the finding did not anticipate, if it exposed a
separate bug, if part was declined — say so. These notes are the record of the decision, and a note
claiming a suggestion was taken when it was not is worse than no note.

The report is outside the git repo, so annotating it is never part of any commit.

## Afterwards

Report the commit hash and how many findings remain. Offer `next-finding` for the next one.
