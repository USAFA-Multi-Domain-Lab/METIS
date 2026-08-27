---
name: perform-handoff-manual-tests
description: Work through a handoff's manual test checklist as the reviewer — take each test one at a time, close it out on a pass, and on a failure investigate the cause and record a finding the test points at. Use when the user asks to "perform the manual tests", "do the manual testing", or work through a handoff's Manual Tests section.
---

# Perform Handoff Manual Tests

Hand the reviewer one test at a time and close it out on their word. They verify the behavior in a running instance; you keep the document.

The reviewer should never need to open the handoff. Do not make them read it, scroll it, or hunt for what comes next.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It owns the checkbox forms, the note form, the cross-reference forms, and the status conditions; this skill is procedure only.

You run this as the handoff's **reviewer**. It **never edits implementation code and never writes tests** — a defect it finds is a finding, not a fix.

Phase 1 runs once. **Phases 2 through 5 are a cycle** — the last returns to the second, and the skill keeps going until no test is unchecked or the reviewer stops it.

## Phase 1 — Locate the handoff and take stock

If the user has a handoff open in the IDE, use it. Otherwise search the version directories under `handoffs/`, highest semantic version first — the handoff in play is nearly always in the newest — and ask which; do not guess between two candidates.

Find the Manual Tests section by its heading text, at whatever level it carries and whatever trails it. If the section is a sentence saying no manual testing is required rather than a list, say so and stop.

Number every item by position, from 1, counting checked and unchecked alike. That ordinal is the test's identity for the rest of the session.

Report the count and nothing else — how many tests, how many still unchecked. Do not list them.

Add the reviewer line if the review has not already done so, naming the user from `git config user.name`, and update the status if the guide's condition for its current value no longer holds. Say once, here and not again, that you can supply setup steps or where to find a control if they want them. If the app is not running, the `run` skill launches it.

## Phase 2 — Take the next test

The first `- [ ]` in document order. Give the count, then the test **verbatim, exactly as the document words it** — not paraphrased, not expanded, not broken into steps:

```
Manual #7 of 13 — 6 remaining

> Click the unban control, cancel the confirmation prompt, and confirm the member is still banned.
```

Then **stop**. Do not touch a file, and do not anticipate the outcome.

If they ask how to reach it, work it out from the code and answer, then stop again and keep waiting.

## Phase 3 — Take the outcome

Their words decide which of four it is:

| Outcome           | Box     | What happens                                                                                                |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| **Pass**          | `- [x]` | Check it, update the count, back to Phase 2. No note.                                                       |
| **Pass, but…**    | `- [x]` | The behavior held, so it is checked; the caveat goes in a note beneath it.                                  |
| **Fail**          | `- [ ]` | Phase 4.                                                                                                    |
| **Cannot run it** | `- [ ]` | Note saying why it was deferred, then back to Phase 2. A deferral is not a failure and produces no finding. |

**A behavior that did not hold stays unchecked.** A caveat that contradicts the test is a failure, whatever the reviewer called it.

A caveat that is a real observation rather than a defect may be worth an **Advisory** finding. Offer it; do not file it on your own.

## Phase 4 — Investigate the failure

The reviewer's account is the **symptom**, not the diagnosis. Trace it in the code before writing anything.

The verification discipline is `review-handoff` Phase 2's, and it applies here for the same reason — the finding this produces will be read by an author who has to act on it. Read the entry point and what it calls into and confirm the behavior actually follows. Check the git history before calling something a regression.

What comes out is one of:

- **A real defect no finding covers yet** — Phase 5 writes one.
- **A real defect an existing finding already covers** — Phase 5 updates that finding.
- **A test that does not match what the feature does.** The document is wrong, not the code. Say so and let the reviewer decide; do not file a defect against a mis-specified test.
- **Not reproducible from the code.** Ask for what is missing rather than guessing at a cause.

If the cause lands **outside what Coverage Specifics lists**, it is still filed. The handoff asked for the test, so a behavior it requires is in scope no matter which file breaks it — the finding says plainly that the cause sits outside the listed coverage.

Never fix it. Never adjust the test to match the behavior.

## Phase 5 — Record it

Both directions of the reference, then the counts.

**A new finding** takes the guide's format, at the severity its tier definitions warrant. The detail ends with the back-reference to the test.

**An existing finding** keeps its claim and its severity untouched, and the back-reference is appended to its detail.

**The note on the test** says what actually happened and ends with the pointer to the finding.

Then the tally line and the status line's manual count.

Nothing is committed, and nothing is staged. `handoffs/` is gitignored, so none of this reaches a commit.

Then **go back to Phase 2 and take the next test** without waiting to be asked.

## Closing out

The cycle ends when no test is unchecked, or whenever the reviewer stops it — which they may do at any gate.

Report the session: how many passed, what failed and the findings it produced, and anything deferred without being run.

Close by invoking `next-handoff-step`, which names what comes next.
