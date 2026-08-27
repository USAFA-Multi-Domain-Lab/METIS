---
name: resolve-findings
description: Work through a handoff's open findings as the author — verify each claim, offer fixes, apply the chosen one, then resolve and commit it before moving to the next. Use when the user asks to "resolve the findings", "fix what the review found", or work through a handoff's Findings section.
---

# Resolve Findings

Work through the findings a review left on a handoff until none are open. Every claim is verified before it is fixed, and nothing is committed until the author has seen the diff.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on the Findings format and the checkbox rules; this skill is procedure only.

You run this as the handoff's **author**.

Phase 1 runs once. **Phases 2 through 8 are a cycle** — the last phase returns to the second, and the skill keeps going until the list is empty or the author stops it.

## Phase 1 — Locate the handoff and take stock

If the user has a handoff open in the IDE, use it. Otherwise search the version directories under `handoffs/`, highest semantic version first — the handoff in play is nearly always in the newest — and ask which; do not guess between two candidates.

Read the whole document, then report what is unresolved at each severity so the author knows the size of the session before it starts.

Find the severity headings by their text, at whatever level they carry. The findings are the checkbox items beneath them.

## Phase 2 — Take the next finding

Severity order — Critical, High, Medium, Low, Advisory — taking the first `- [ ]` in the highest tier that still has one. Say which finding is in hand and how many remain.

## Phase 3 — Verify the claim

Read the cited code and what it calls into, and confirm the described behavior actually follows. What to expect:

- **Stale line numbers.** Start at the cited line — it is usually close and often still right. If it does not land, search by symbol and read around it. Line numbers are accurate when written and not maintained afterward, so drift is expected rather than suspicious.
- **Already fixed** in a later commit.
- **A cited rule that does not exist.** Check `AGENTS.md` and `docs/devs/style-guide.md` before accepting a style claim.
- **A parameter that never shipped.** Added and removed inside one release cycle, so no stored data can contain it.

State the verdict plainly: confirmed, partly, or does not hold. If it depends on an assumption, say whether the assumption is guaranteed anywhere or merely happens to hold today.

**A claim that fails verification is never marked off on your own judgment.** It goes to Phase 4 with `false flag` as the recommended option and waits — the author may be seeing something the verification missed.

## Phase 4 — Present options, then stop

One or more options — as many as genuinely exist, and no more. A finding with a single sensible fix gets one; padding the list to look thorough wastes the author's time. Each gets a name and a one-line consequence, recommendation first with one sentence of why.

Declining and marking a false flag are real options and are presented as such when they are. The author's judgment on their own codebase outranks the finding.

Call out anything that changes the decision: a wire-format change, a behavior change, an effect on another finding in the list.

Do not write the fix. Do not touch a file. Wait for the answer.

## Phase 5 — Apply and verify, then stop

Change what the chosen option requires and nothing else. No adjacent fixes — mention them instead. No reformatting untouched regions. No new or modified tests unless asked.

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npx eslint <changed files>
```

Run `npm test` only for a significant change — a behavior change, a client/shared/server crossing, a payload or wire-format change, a migration. For a doc comment, a rename, or anything else inert, skip tests rather than padding the report with a check that means nothing here. Do not be surprised if the author terminates the test early. Assume the author opted out of running the tests for this finding.

Prettier is not a project gate; several files fail `--check` at HEAD already. Run it only when the finding is itself about formatting, and confirm the failure is yours before acting on it:

```bash
git show HEAD:<file> > <scratchpad>/head.ts && npx prettier --check <scratchpad>/head.ts
```

Report what actually ran and name what did not, rather than implying it passed. A run the author stopped is the exception — leave it out, and do not ask why. Then **stop**. Do not stage, and do not check the box yet.

## Phase 6 — The author reviews the diff

They read and stage it themselves. Expect follow-up — they often edit the fix, extend it, or revert it after seeing why the original shape was right. Any feedback returns to Phase 5 and stops again.

**Say what sign-off does when you ask for it.** The author is told in the same breath that approving the diff resolves the finding in the document and commits it, so the approval is given knowingly rather than discovered afterward.

Once they sign off, re-run the Phase 5 checks if the fix changed while they were reviewing it. Those results are stale otherwise, and everything after this point — checking the box, checking a test that now passes, committing — rests on them.

When the chosen option requires no code change — a decline, a confirmed false flag — Phases 5 and 6 are skipped, and Phase 8 has nothing to commit.

## Phase 7 — Resolve in the document

Flip `- [ ]` to `- [x]` and append a note beneath any already there, in the form the guide defines. Keep it brief and say what was actually done — the fix, a **Decline**, or a **False flag** — including anywhere it departed from the option the author chose.

`[x]` means **resolved**, which covers a decline and a false flag as much as a fix.

What this phase may and may not touch:

- **Never alter the reviewer's finding text** — not its wording, not its severity, not its stale line numbers.
- **Do** maintain the tally line and the status line's `{n}/{n} findings resolved`.
- **Do** revisit any manual or automatic test box the review left unchecked against this finding. Re-run it, and check it if the fix makes it pass. Add a note beneath any other notes saying how the fix made it pass.

## Phase 8 — Commit, then return to Phase 2

Confirm the tree is on the feature branch the work belongs to. Run `git status --short` and commit what the author staged; if they staged a subset, respect that.

One commit per finding. The handoff is gitignored, so Phase 7's annotation is never part of it.

Report the hash, then **go back to Phase 2 and take the next finding** without waiting to be asked.

## Closing out

The cycle ends when no findings are open, or whenever the author stops it — which they may do at any gate.

Report the session: what was fixed, what was declined, what turned out to be a false flag, and anything still open.

Close by invoking `next-handoff-step`, which names what comes next.
