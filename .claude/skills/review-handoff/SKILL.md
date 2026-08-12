---
name: review-handoff
description: Review the files a handoff lists in Coverage Specifics and populate its Findings section with verified, severity-ranked findings. Use when the user asks to "review this handoff", "do the code review", or work through a handoff as the reviewer.
---

# Review Handoff

Perform the code review a handoff asks for and record what you find. This skill **writes findings and
nothing else** — it never fixes code.

Read `.github/instructions/HANDOFFS.instructions.md` before writing anything. It is the authority on
the Findings format; this skill covers procedure and severity judgment only.

## Phase 1 — Locate and scope

Handoffs live in `handoffs/`. If the user has one open in the IDE, use it. Otherwise list the
directory and ask which — do not guess between two candidates.

Read the whole document first, then review **only what Coverage Specifics lists**:

- A scoped entry means only that part is yours. `Scoped here to migrateEffect` means the rest of the
  file belongs to another handoff, and a finding against it will be rejected as out of scope.
- Sibling handoffs named in the Summary are someone else's pass. Do not report their findings.
- The Summary's walkthrough is the author's claim about how the system works. Check it against the
  code as you go — a walkthrough that does not match the implementation is itself a finding.

## Phase 2 — Verify before you write

**This is the point of the skill.** These documents get read months later by someone who trusts them,
and a confident wrong finding costs more than a missed one.

The failure modes catalogued in `next-finding` are exactly what this skill exists to avoid producing:
stale line numbers, things already fixed in a later commit, a cited rule that does not exist, a
parameter that never shipped, framing that implies the wrong fix.

So for every candidate finding, before it goes in the document:

- Read the cited code and what it calls into. Confirm the described behavior actually follows.
- Check style claims against `AGENTS.md` and `docs/devs/style-guide.md`. Do not cite a rule without
  confirming it is written down. The style guide has no rule against casting, and `let` is the house
  default over `const` — both have produced false findings before.
- Check the git history before calling something a regression. A parameter added and removed within
  the same release cycle can never appear in stored data.
- Separate "this is wrong" from "this is currently harmless but structurally guaranteed to break." Both
  are worth recording; they are not the same severity, and the finding should say which it is.
- If a finding depends on an assumption, say whether the assumption is guaranteed anywhere or merely
  happens to hold today.

If a claim does not survive this, drop it. Do not pad the list.

## Phase 3 — Assign severity

| Tier         | What belongs                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Corrupts or destroys production data now, or opens a security hole an unprivileged user can reach today. Rare — do not inflate into it.                                                        |
| **High**     | Wrong behavior that reaches users or data on a normal path: silent behavior inversion, a request that never responds, a crash on real input.                                                   |
| **Medium**   | A real defect on a narrower path, or a latent one the code structurally guarantees: authorization gaps, a migration that cannot be re-run, a payload computed for one member and sent to many. |
| **Low**      | Doc drift, dead code, unused imports, always-true conditions, naming and style-guide deviations, diagnosability costs.                                                                         |
| **Advisory** | Not a defect. Observations, latent hazards, things that surprised you. Excluded from the real tally so it stays meaningful.                                                                    |

Order within a tier by practical impact, not by file order.

## Phase 4 — Write the findings

Follow the guide's format. What matters most in practice:

- Lead with the **bold one-sentence claim**. A reader scanning only the bold lines should understand
  the review. Write the claim, then the evidence — never the reverse.
- Cite `file:line` as a Markdown link for every path mentioned, including paths inside the supporting
  detail.
- Say what closing it would take. A finding that describes a problem with no direction costs the
  resolver a second investigation.
- A test that fails because it exposes a real defect is a **finding**, not a coverage gap. The coverage
  exists; the implementation is what failed.
- Pre-existing tests broken by the feature are not findings — the handoff should have arrived green.
  If it did not, say so to the user rather than absorbing it into the review.

Then update the tally line and the status line to match.

## Phase 5 — Run the static checks

These back the findings — a type or lint error in reviewed code is a finding, and a clean run is what
lets you say the rest of the review is about behavior rather than compilation.

```bash
npx tsc --noEmit -p shared/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
npx tsc --noEmit -p client/tsconfig.json
npx eslint <reviewed files>
```

Prettier is not a project gate in this repo — several files fail `--check` at HEAD. Only run it when a
finding is itself about formatting, and confirm the failure is not pre-existing before reporting it.

Output goes to the user in Phase 6, not into the document. Report what actually ran and name anything
that did not rather than implying it passed.

## Phase 6 — Stop

Report concisely: how many findings at each severity, and the one or two that actually matter.

Then stop. **Do not fix anything.** A defect found while reviewing is a finding, not a task — that
separation is what makes the document a record rather than a changelog. Writing additional tests is the
one exception the guide allows; fixing implementation is not.

Hand off to `next-finding` when the user is ready to work through what you found.
