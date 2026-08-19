---
name: next-handoff-step
description: Identify where a handoff stands and name the one next step for whoever is asking — the answer differs for the author and the reviewer — correcting the status line if it has drifted. Use when the user asks "what's next", "where does this handoff stand", or what is left to do on a handoff.
---

# Next Handoff Step

Answer "what do I do next?" for a handoff. Read the document, work out where it actually stands, correct the status if it drifted, and name the single next step for the person asking.

Read `.github/instructions/HANDOFFS.instructions.md` first. It is the authority on the document format and the status conditions; this skill is procedure only.

Three lines it holds throughout:

- **It reads the document, not the codebase.** No test runs, no `tsc`, no tracing code to check a claim. State is a document question, and keeping it one is what makes this cheap enough to ask casually.
- **It never performs the next step.** It names it, offers to start it, and stops.
- **It never invents source data.** See Phase 4.

One pass, no cycle.

## Phase 1 — Locate the handoff

If the user has a handoff open in the IDE, use it. Otherwise search the version directories under `handoffs/`, highest semantic version first — the handoff in play is nearly always in the newest — and ask which; do not guess between two candidates.

## Phase 2 — Read the state off the document

**Never trust the status line.** It is maintained by hand, it is the field most likely to be stale, and it is the one this skill exists to fix. Derive the state from the document instead — the reviewer line, each checklist's totals, and the Findings section's tally, contents, and provenance.

The four states and their conditions are the guide's. Two get misread:

- A test is **addressed** when it is checked, or unchecked with a note saying why. A bare unchecked box is unaddressed, and an unaddressed item is what holds a document in review — a failing test or an open finding does not.
- **A finding's provenance, not the tally line, is what says whether `review-handoff`'s pass has run.** Findings arrive from three places, and both checklists maintain the tally, so neither a tally nor a populated Findings section proves anyone read Coverage Specifics. The back-reference distinguishes them: a finding surfaced by a checklist cites `manual test {n}` or `automatic test {n}`, so one citing neither came from the read.

That inference runs one way only. A finding without a back-reference proves the pass ran; the absence of one proves nothing, since a pass that finds nothing leaves no trace. Where both checklists are complete and every finding traces back to one, whether anyone read Coverage Specifics cannot be known from the document — ask.

More generally, where the signals cannot settle the state, say what is ambiguous and ask. Do not take the flattering reading.

## Phase 3 — Work out who is asking

`git config user.name`, against the participant lines.

| Match                         | Role                                                 |
| ----------------------------- | ---------------------------------------------------- |
| Reviewer line                 | reviewer                                             |
| Author line                   | author                                               |
| Neither, and no reviewer line | the incoming reviewer                                |
| Neither, both lines present   | neither — report the state and name whose move it is |

A role the user states outranks the git name. "As the reviewer, what's next" is answered as the reviewer.

## Phase 4 — Reconcile the document

**Recompute what is derived; never invent what is not.**

May write:

- the status line — its value, its manual and automatic counts, its findings count
- the findings tally line
- the reviewer line, when Phase 3 resolved the user as reviewer and no line exists

Never writes a checkbox, a finding, a note, or any other prose. Each of those is a claim that work was done, and this skill does none.

Corrections run in both directions: a status ahead of the document is corrected as readily as one behind it.

Claiming the reviewer line is the one write that changes ownership rather than restating what the document already implies, and it is what takes a document out of `Awaiting review` — so the status moves to `In review` in the same edit. Say the reviewer line was claimed.

## Phase 5 — Answer for the asker

One next step, keyed on the state **as Phase 4 left it** rather than the status line as found.

| State                  | Author                                                             | Reviewer                               |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| **Awaiting review**    | Nothing yours — hand it to the reviewer.                           | Start. Recommend `review-handoff`.     |
| **In review**          | Wait. Name what the reviewer still owes.                           | The first outstanding pass, per below. |
| **Resolving findings** | `resolve-findings` — name the first open finding and its severity. | Nothing yours; the author has it.      |
| **Complete**           | Nothing.                                                           | Nothing.                               |

The author's `Awaiting review` answer stays vague: hand it to the reviewer, whoever that is. Do not remark on the absent reviewer line — who reviews it is not this skill's business.

Which pass the reviewer is pointed at, when more than one is outstanding:

1. **A checklist already in progress wins** — some items addressed, some not. Resuming is cheaper than starting cold: the setup is done, the app is likely still running, and partial progress is the best evidence of what the reviewer meant to do next. Only the two checklists can be in progress, `review-handoff`'s pass over Coverage Specifics being no checklist. If both are, manual first.
2. Otherwise `review-handoff`, where Phase 2 found no sign its pass has run — and a populated Findings section is not that sign. It comes first when it comes at all, since the findings it produces are what the checklists cross-reference.
3. Otherwise the untouched checklist, manual before automatic.

Then name the sibling skill that does it, offer to start it, and **stop**.

Keep the whole answer to a few lines. The value is knowing the one thing to do next, and a wall of state defeats it.
