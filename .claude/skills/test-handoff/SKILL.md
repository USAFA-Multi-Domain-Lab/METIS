---
name: test-handoff
description: Write the automated tests a handoff requests, verify they can actually fail, check off the cases, and record the run results. Use when the user asks to "write the handoff tests", "do the automatic tests", or work through a handoff's Automatic Tests section.
---

# Test Handoff

Write the tests a handoff's Automatic Tests section asks for, then record the outcome in the document.
This skill writes tests and **never changes implementation**.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything — it owns the checkbox
rules and the test-placement layout. This skill covers procedure and the parts of the repo's test
setup that are easy to get wrong.

Write what the handoff requests, plus any additional coverage you judge worth having (the guide allows
this without asking). Do not write tests for anything else.

## Phase 1 — Confirm the target paths actually run

**Do this before writing a line.** Jest here runs a fixed set of explicitly-rooted projects. A test
outside every root is silently never executed — it does not fail, it does not appear in any count, and
the checkbox gets ticked for coverage that does not exist.

Read the roots from the config rather than assuming them; projects get added and moved:

```bash
grep -n "displayName\|roots: \[" tests/jest.config.js
```

Then confirm your intended path falls under one of them. New subdirectories **under** an existing root
are fine — `tests/projects/unit/server/sessions/` runs because `unit:server` covers everything beneath
it. A new top-level directory is not.

Not every plausible-looking location has a project behind it. A path can match the repo's naming
conventions perfectly and still be dead, so check the config every time rather than reasoning from what
the directory tree looks like.

If the handoff requests a path no project covers, place the test in the closest runnable project and
note that decision beneath the test's heading in the document. Do not invent a directory and assume it
runs, and do not add a Jest project to make it fit unless the user asks.

## Phase 2 — Read the neighbours first

Before writing, read two or three existing suites nearest the code under test. This repo has
established patterns that are cheaper to follow than to rediscover:

- Database builds run on `require` under stubbed mongosh globals — `use`, `print`, and `db` must be
  stubbed **before** the build is loaded.
- Where the same algorithm exists in two languages (a database build and its import build), the
  precedent is a shared helper module owning both the fixture and the assertions, consumed by both
  suites, so the copies cannot drift. See the `build_000055` and `build_000058` suites.
- Where the two copies report through different channels, the assertion takes the emitted output as an
  argument and each suite captures its own.

`ts-jest` type-checks as it runs, so a type error in a test file fails the run outright. Type errors
here are test failures, not warnings.

## Phase 3 — Write the tests

Follow `AGENTS.md`: `let` by default, no abbreviated names, spell words out fully.

Scope discipline:

- Do not change implementation to make a test pass. If the implementation is wrong, that is a
  **finding** — see Phase 5.
- Do not modify existing passing tests to accommodate new ones.
- Do not fix adjacent things you notice while reading. Mention them.

## Phase 4 — Verify the test can fail

A test that passes against the broken code is worse than no test — it certifies a defect. For every
case guarding something that would corrupt data, cross a permission boundary, or crash the server,
confirm the assertion actually bites:

1. Temporarily reintroduce the defect the test exists to catch.
2. Run the suite and confirm it fails **at that assertion**, not somewhere incidental.
3. Restore from git — `git checkout <file>` — and confirm the suite is green again.

Say in your report which cases you verified this way. If a mutation does not produce a failure, the
test is not testing what its name claims.

## Phase 5 — Record the outcome

Update the handoff. The checkbox rules are the guide's; the ones that get misapplied:

- Checked means written **and passing**. Nothing else.
- A test written but failing stays **unchecked**, with a one-line note beneath it saying it was written,
  that it fails, and why. It does not get checked with a caveat.
- If it fails because it exposes a real defect, that defect belongs in **Findings**. Do not describe it
  as a coverage gap — the coverage exists and the implementation is what failed. Add the finding at the
  severity the defect warrants and update the tally.
- Additional coverage you chose to write goes in the checklist as a new checked item, in the group it
  belongs to.

The checklist is the whole record. A checked box says written and passing; a failure carries its
explanation in the note beneath it. Run output goes to the user in Phase 6, not into the document.

Run enough to know which boxes are honest:

```bash
npm run test:unit:server        # or the focused project(s) relevant to the feature
npm test                        # full suite, for migrations or anything crossing client/shared/server
```

A green `test:unit` proves less here than it would elsewhere — the project does not carry much unit
coverage. That matters for what you tell the user in Phase 6: name the suites that actually ran rather
than implying broad safety.

## Phase 6 — Stop

Report concisely: which cases were written, which were verified by mutation, what failed and why, and
any finding you added.

Then stop. Do not fix the implementation, and do not stage or commit — the user reviews the diff
themselves.
