---
name: write-handoff-automatic-tests
description: Work through a handoff's Automatic Tests section as the reviewer — take one group at a time, agree to the approach before writing it, verify the tests can fail, then record and commit the group before moving to the next. Use when the user asks to "write the automatic tests" or work through a handoff's Automatic Tests section. Not for manual tests.
---

# Write Handoff Automatic Tests

Write the tests a handoff's Automatic Tests section asks for, one group at a time, and record the outcome in the document. The reviewer agrees to the approach before it is written and reads the diff before it is committed.

This skill writes tests and **never changes implementation**. A defect it uncovers is a finding, not a fix.

You run this as the handoff's **reviewer**.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything — it owns the checkbox rules, the note form, the cross-reference forms, and the status conditions. This skill covers procedure and the parts of the repo's test setup that are easy to get wrong.

Write what the handoff requests, plus any additional coverage you judge worth having (the guide allows this without asking). Do not write tests for anything else.

Phase 1 runs once. **Phases 2 through 8 are a cycle** — the last returns to the second, and the skill keeps going until no group has an unchecked case or the reviewer stops it. They may stop at any gate, and they may waive the gates and have the remaining groups run straight through; the commit and the record still happen per group.

## Phase 1 — Locate the handoff and take stock

If the user has a handoff open in the IDE, use it. Otherwise list `handoffs/` and ask which — do not guess between two candidates.

Find the Automatic Tests section by its heading. If it is a sentence saying no automatic testing is required rather than a list of groups, say so and stop.

Number the `###` groups by position, from 1. Number the cases from the top of the whole checklist, spanning groups — that ordinal is what a finding's back-reference cites.

**Confirm every group's target path actually runs, here, before any of them is written.** Jest runs a fixed set of explicitly-rooted projects. A test outside every root is silently never executed — it does not fail, it does not appear in any count, and the checkbox gets ticked for coverage that does not exist.

Read the roots from the config rather than assuming them; projects get added and moved:

```bash
grep -n "displayName\|roots: \[" tests/jest.config.js
```

New subdirectories **under** an existing root are fine — `tests/projects/unit/server/sessions/` runs because `unit:server` covers everything beneath it. A new top-level directory is not. Not every plausible-looking location has a project behind it: a path can match the repo's naming conventions perfectly and still be dead, so check the config rather than reasoning from what the directory tree looks like.

Report the counts — how many groups, how many cases, how many still unchecked — and name any group whose requested path no project covers. Nothing else; do not list the cases.

Add the reviewer line if the review has not already done so, naming the user from `git config user.name`, and update the status if the guide's condition for its current value no longer holds.

## Phase 2 — Take the next group

The first group in document order holding an unchecked case; a group whose cases are all checked is passed over. Give the count, the group's heading, its test file, and its unchecked cases verbatim.

Then read two or three existing suites nearest the code under test. This repo has established patterns that are cheaper to follow than to rediscover.

## Phase 3 — Propose the approach, then stop

A few lines, not a design document:

- Where the tests go, and why, if that is not where the handoff asks for them.
- The shape — one suite, or a shared helper consumed by two — and what each case stubs or fixtures.
- Anything in the group you cannot cover, and what is missing.

Name an alternative only where a real fork exists. Do not pad the proposal with approaches you would not take.

Where Phase 1 found no project covering the requested path, the placement is settled here rather than assumed. Adding a Jest project is the reviewer's call, not yours.

Do not write the tests. Do not touch a file. Wait for the answer.

## Phase 4 — Write the group

Change what the agreed approach requires and nothing else:

- Do not change implementation to make a test pass. If the implementation is wrong, that is a **finding** — see Phase 7.
- Do not change what an existing passing test asserts, unless the reviewer asks or it is a refactor onto a shared helper — which must still fail under Phase 5's mutation.
- Do not fix adjacent things you notice while reading. Mention them.

`ts-jest` type-checks as it runs, so a type error in a test file fails the run outright. Type errors here are test failures, not warnings.

Then run the group's file — not the whole project, and never `npm test`:

```bash
npx jest --runInBand --config tests/jest.config.js --selectProjects=unit:shared --testPathPattern SomeThing
```

Take the project name from the roots read in Phase 1. `--selectProjects` is an array option and silently swallows a trailing path into its own value list, so the file goes in `--testPathPattern` — as a positional argument it is ignored and the entire project runs. The flag is singular; `--testPathPatterns` is rejected. Run a whole project only when the change reached files outside the group, such as a refactor onto a shared helper: `npm run test:unit:shared`.

**Read the outcome off the `Tests:` summary line, never the exit code.** `globalTeardown` connects to MongoDB and throws when it is not running locally, so a fully green run still exits 1.

## Phase 5 — Verify the tests can fail

A test that passes against the broken code is worse than no test — it certifies a defect. For every case guarding something that would corrupt data, cross a permission boundary, or crash the server, confirm the assertion actually bites.

**Say what you are about to do before you touch anything.** Name the implementation file, the defect you are reintroducing, and that it is restored immediately afterwards. The reviewer is watching production files change in a skill that promises never to change them, and should not have to wonder why. It is a heads-up, not a gate — say it and keep going.

Then, per case:

1. Record the file's baseline with `git status --short <file>`, and copy the file to the scratchpad.
2. Reintroduce the defect the test exists to catch.
3. Run that one case — the Phase 4 command plus `-t '<test name>'` — and confirm it fails **at that assertion**, not somewhere incidental.
4. Restore by copying the scratchpad copy back. Do not use `git checkout <file>` — that overwrites from the index and destroys any uncommitted work the file was already carrying.
5. Confirm the restore against the baseline, and that the case is green again.

If a mutation does not produce a failure, the test is not testing what its name claims.

The tree must be free of every mutation before Phase 6 opens. The reviewer reads that diff, and the next phase commits it.

## Phase 6 — The reviewer reads the diff, then stop

Report what ran: the suites, what passed and what failed, which cases the mutation bit for, and any defect the run exposed. Confirm the diff is test files only.

**Say what sign-off does when you ask for it.** The reviewer is told in the same breath that approving the diff checks the boxes, records the outcome, and commits the group, so the approval is given knowingly rather than discovered afterwards.

Feedback returns to Phase 4 and stops here again. If the tests changed while they were reviewing, run them again before going on — everything after this rests on that result.

## Phase 7 — Record the outcome

The checkbox rules are the guide's; the ones that get misapplied:

- Checked means written **and passing**. Nothing else.
- A test written but failing stays **unchecked**, with a note beneath it in the guide's form saying it was written, that it fails, and why. It does not get checked with a caveat.
- If it fails because it exposes a real defect, that defect belongs in **Findings**, at the severity `review-handoff`'s tier table warrants. Do not describe it as a coverage gap — the coverage exists and the implementation is what failed. Record the defect and its evidence, never how to resolve it; `resolve-findings` derives the options, and anything written here anchors it to your framing. Both directions of the reference: the finding's detail ends with `automatic test {n}`, and the note on the test ends with the pointer to the finding.
- Additional coverage you chose to write goes in the checklist as a new checked item, in the group it belongs to.

Then the tally line and the status line's automatic count. Run output goes to the reviewer in Phase 6, not into the document.

## Phase 8 — Commit, then return to Phase 2

Confirm the tree is on the feature branch the work belongs to. Run `git status --short` and commit the group's test files; if the reviewer staged a subset, respect that.

One commit per group. `handoffs/` is gitignored, so Phase 7's annotation is never part of it.

Report the hash, then **go back to Phase 2 and take the next group** without waiting to be asked.

## Closing out

The cycle ends when no group has an unchecked case, or whenever the reviewer stops it.

Update the status if the guide's condition for its current value no longer holds. Then report the session: which cases were written, which were verified by mutation, what failed and why, and any finding you added.

Name the suites that actually ran. Unit coverage here is thin, so a green `test:unit` does not mean what it would elsewhere — do not let it imply broad safety.

Do not fix the implementation. A defect this turned up is the author's to close with `resolve-findings`.
