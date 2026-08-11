---
name: next-finding
description: Surface the next unresolved finding from a code-review report, verify its premise against the current code, explain it CONCISELY, and offer resolution options. Use when the user asks "what's next", "next finding", "next issue", or wants to work through a review report. Read-only — never edits code.
---

# Next Finding

Pull the next unresolved finding out of a review report, **check whether it is actually true**, and
present it with options. This skill never edits code and never commits.

## Locating the report

Reports live outside the repo, in iCloud:

```
~/Library/Mobile Documents/com~apple~CloudDocs/Proyectos/govcio/metis/documents/reports/<version>/from-<author>/
```

Finished reports are moved into a `complete/` subfolder there. If the user has a report open in the
IDE, use that one. Otherwise list the non-complete reports and ask which. Do not guess between two
candidates.

## Finding the next item

Findings are checklist items grouped under `#### High`, `#### Medium`, `#### Low`. Unresolved ones are
`- [ ]`. Work in severity order — High, then Medium, then Low — and take the first unresolved item
within a section.

```
awk '/^#### /,0' <report> | grep -n '^- \[ \]'
```

Report how many remain in each severity so the user knows the shape of what's left.

## Verify before presenting — this is the point of the skill

**Do not relay the finding's framing. Check it.** In practice these reports are wrong often enough
that repeating a claim unverified will send the user down the wrong path. Observed failure modes:

- **Stale line numbers.** The code has moved since the review. Search by symbol, not by line.
- **Already fixed.** The finding, and the report's own summary prose, can describe something that has
  since been resolved in a later commit.
- **Wrong framing.** A finding described "two doc comment blocks, the first a leftover" — implying
  delete one. Both were wrong in different ways against the type's actual fields, and the fix was to
  replace both.
- **A rule that does not exist.** A finding cited the style guide for a member-ordering rule that the
  guide does not contain. Check `AGENTS.md` and `docs/devs/style-guide.md` before accepting a
  style-based claim.
- **Never shipped.** A finding described migrating an orphaned parameter that was added _and_ removed
  during the same release, so no stored data could ever contain it.

So: read the cited code, read what it calls into, and confirm the described behavior really follows.
If the finding depends on an assumption (for example "intermediate migration output satisfies the
current schema"), say whether that assumption is stated anywhere or merely happens to hold.

## Presenting it

Keep it short — `AGENTS.md` prefers brevity, and the user will ask for more if they want it. Roughly:

1. **The finding**, in a sentence or two, with a clickable `path:line` reference.
2. **Whether it holds** — confirmed, partly, stale, or false. If it does not hold, say so up front and
   stop; do not invent work.
3. **Options**, usually two to four. Give each a name and a one-line consequence. Lead with the one
   you would pick and say why in one sentence.
4. **Anything that changes the decision** — a wire-format change, a behavior change, a knock-on to
   another finding, a constraint it would silently impose on future code.

Do not write the fix. Do not edit files. End by asking which option they want, and hand off to
`resolve-finding`.

## Options worth remembering

Not every finding should be fixed as written. Legitimate outcomes include:

- Fix as suggested.
- Fix differently, because the suggested fix assumes something unguaranteed.
- Fix a broader or narrower scope than described.
- Decline, when the suggestion trades away more clarity than it buys.
- Mark as a false flag, when the premise does not hold.

Present declining as a real option when it is one. The user's judgment on their own codebase
outranks the report's.
