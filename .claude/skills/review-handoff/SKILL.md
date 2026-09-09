---
name: review-handoff
description: Review the files a handoff lists in Coverage Specifics and populate its Findings section with verified, severity-ranked findings. Use when the user asks to "review this handoff", "do the code review", or work through a handoff as the reviewer.
---

# Review Handoff

Perform the code review a handoff asks for and record what you find. This skill **writes findings and nothing else** — it never fixes code.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on the Findings format and the severity tiers; this skill covers procedure only.

## Phase 1 — Locate and scope

If the user has a handoff open in the IDE, use it. Otherwise search the version directories under `handoffs/`, highest semantic version first — the handoff in play is nearly always in the newest — and ask which; do not guess between two candidates.

Read the whole document first, then add the reviewer line beneath the author line, naming the user from `git config user.name`, and update the status if the guide's condition for its current value no longer holds. Findings may only land on **what Coverage Specifics lists** — read whatever you need to understand it:

- A scoped entry means only that part is yours. `Scoped here to migrateEffect` means the rest of the file belongs to another handoff, and a finding against it will be rejected as out of scope.
- Sibling handoffs named in the Summary are someone else's pass. Do not report their findings.
- The Summary's walkthrough is the author's claim about how the system works. Check it against the code as you go — a walkthrough that does not match the implementation is itself a finding.

## Phase 2 — Verify before you write

The failure modes catalogued in `resolve-findings` are exactly what this skill exists to avoid producing: stale line numbers, things already fixed in a later commit, a cited rule that does not exist, a parameter that never shipped.

So for every candidate finding, before it goes in the document:

- Read the cited code and what it calls into. Confirm the described behavior actually follows.
- Check style claims against `AGENTS.md` and `docs/devs/style-guide.md`. Do not cite a rule without confirming it is written down.
- Check the git history before calling something a regression. A parameter added and removed within the same release cycle can never appear in stored data.
- Separate "this is wrong" from "this is currently harmless but structurally guaranteed to break." Both are worth recording; they are not the same severity, and the finding should say which it is.
- If the premise for a finding relies on an assumption, verify the assumption. A finding that depends on a false assumption is a waste of time at best and misleading at worst.
- Work out what closing it would take, but keep it out of the document. A fix you cannot picture usually means a finding you have not understood.

If a claim does not survive this, drop it. Do not pad the list.

## Phase 3 — Write the findings

Follow the guide's format, and assign severity from its tier definitions. What matters most in practice:

- Lead with the **bold one-sentence claim**. A reader scanning only the bold lines should understand the review. Write the claim, then the evidence — never the reverse.
- Cite `file:line` as a Markdown link for every path mentioned, including paths inside the supporting detail.
- Pre-existing tests broken by the feature are not findings — the handoff should have arrived green. If it did not, say so to the user rather than absorbing it into the review.
- Number each finding from 1 within its severity group as you write it. That number is what every later reference cites, so it is never reassigned once the document reaches `Resolving findings`. Withdraw a finding before then and its tier is renumbered.

Then update the tally line and the status line to match, adding the findings count the author left off.

## Phase 4 — Run the static checks

These back the findings — a type or lint error in reviewed code is a finding, and a clean run is what lets you say the rest of the review is about behavior rather than compilation.

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npx eslint <reviewed files>
```

Prettier is not a project gate in this repo — several files fail `--check` at HEAD. Only run it when a finding is itself about formatting, and confirm the failure is not pre-existing before reporting it.

Report what actually ran and name anything that did not rather than implying it passed.

## Phase 5 — Stop

Report concisely: how many findings at each severity, and the one or two that actually matter.

Close by invoking `next-handoff-step`, which names what comes next.

Then stop. **Do not fix anything.** A defect found while reviewing is a task for the author, not the reviewer.

The author will use the `resolve-findings` skill when they are ready to fix what was found.
