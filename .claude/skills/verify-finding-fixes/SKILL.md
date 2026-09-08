---
name: verify-finding-fixes
description: Sanity-check the fixes a handoff's findings produced, as the author — read them as a set, record anything they introduced, and mark the document complete when they are clean. Use when the user asks to "sanity check the fixes", "verify the fixes", or accepts the offer of a last pass before a handoff is marked complete.
---

# Verify Finding Fixes

The last pass before a handoff is complete. Read the fixes the findings produced and work out whether closing them opened anything new. This skill **writes findings and nothing else** — it never fixes code.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on the Findings format and the cross-reference forms; this skill is procedure only.

You run this as the handoff's **author**, over your own fixes. The pass is optional: `next-handoff-step` offers it whenever the document is otherwise ready to be marked complete, and declining is a complete answer.

One pass, no cycle. It may run more than once on the same document — a pass that turns up findings sends the author back to `resolve-findings`, and the fixes that produces are eligible for a pass of their own.

## Phase 1 — Locate the handoff and settle the range

If the user has a handoff open in the IDE, use it. Otherwise search the version directories under `handoffs/`, highest semantic version first — the handoff in play is nearly always in the newest — and ask which; do not guess between two candidates.

`resolve-findings` makes one commit per finding and writes its short hash into the resolution note, so the fix set is read off the document rather than reconstructed:

- **A fix made earlier in this session is already in hand.** Do not dig up a diff you have. Where the author edited or restaged it after you applied it, the commit is what shipped and the commit is what you read.
- **The hashes in the resolution notes are the set**, each already paired with the finding it closed. A note without a hash predates the convention or was written by hand — search for its commit on the feature branch, by the note's timestamp and what it says was changed.
- **A finding citing `the fix for {Severity} #{n}` means a pass has already run.** Scope narrows to the fixes for the findings that pass produced, plus anything resolved after them. The rest have been read.
- **A decline or a false flag has no commit** and nothing to read.

Show the commits and **confirm the set before reading anything**. A wrong range is the one failure that wastes the whole pass.

## Phase 2 — Read the fixes as a set

Take each commit against the finding it closed. Two questions of every one: does the fix do what its note claims, and what else did it reach?

What only a set-wide pass can see, and therefore what this one is for:

- **Fixes that collide.** Two findings whose fixes touched the same code, where the later undid, duplicated, or invalidated the earlier. Nothing in `resolve-findings` looks across findings, so this arrives here or not at all.
- **Callers the fix did not account for.** The cited defect is closed and a second call site now takes the changed path.
- **Scope beyond the finding.** A fix that changed more than its option called for is code no reviewer has read.
- **Claims the fixes made false.** A checked manual or automatic test whose behavior has since moved, or a Summary walkthrough that no longer matches. Both were true when they were checked.

A test the fixes broke is verified by running it, not by reading it.

Verification discipline is `review-handoff` Phase 2's, and it applies for the same reason — you will be the one acting on whatever this writes. Read the code and what it calls into, check style claims against `AGENTS.md` and `docs/devs/style-guide.md`, and drop anything that does not survive. Do not pad the list.

A pass that finds nothing is the expected outcome. Manufacturing a finding to justify the pass is worse than the pass not having run.

## Phase 3 — Write what you found

Follow the guide's format and assign severity from its tier definitions, exactly as the review did. Each new finding appends to the end of its tier and takes the next number there.

The cross-reference is written on both sides:

- The new finding's detail ends with `the fix for {Severity} #{n}`.
- A note appended beneath that resolved finding points forward to the new one. Its box stays `[x]` — the fix still resolved what it was written against.

Then the tally line.

## Phase 4 — Run the static checks

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npx eslint <changed files>
```

Report what actually ran and name anything that did not rather than implying it passed.

## Phase 5 — Close the document out

**Nothing found** — write `Complete` on the status line. Every box was already checked, and the pass is what the transition was waiting on.

**Something found** — leave the status at `Resolving findings`. The new findings are open and the author has them.

Report concisely: the range you read, and either that it was clean or what came out of it. Then **stop. Do not fix anything**, including a defect you introduced yourself. It closes through `resolve-findings` like any other.

Close by invoking `next-handoff-step`, which names what comes next.
