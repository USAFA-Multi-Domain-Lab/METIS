# METIS: Code Handoff Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for creating code handoff documents in METIS.

## Overview

A **code handoff** is a Markdown document written for a coworker who will be performing a code review of a feature you have developed. It is not a code review itself — it is a structured briefing that tells the reviewer exactly which files to look at, what behavior to verify manually, and which tests still need to be written.

A **handoff report** is the second half of the same process. It is written after the review and test work has been performed, and it records what was actually reviewed, what findings were identified, what automated coverage was added, and what still remains open.

Together, these two documents form the complete handoff workflow:

1. The feature author creates the code handoff.
2. A reviewer uses that handoff to perform review and testing.
3. The reviewer creates or updates the handoff report with findings and results.

When a user says something like _"create a code handoff for this feature"_, you should:

1. Inspect the recent git changes (staged, unstaged, and recent commits) to identify which files are relevant to the feature.
2. Analyze the changed files to understand the shape of the feature.
3. Produce a handoff document in the `handoffs/` directory at the project root.

When a user says something like _"update the handoff report"_, _"document what was reviewed"_, or _"record the testing results"_, you should:

1. Read the original handoff document first.
2. Review the implemented code, findings, tests, and test results that now exist.
3. Produce or update a handoff report in the `handoffs/` directory at the project root.

---

## Output Location

All handoff documents and reports must be written to the `handoffs/` directory at the root of the workspace:

```
handoffs/{feature-name}.md
handoffs/{feature-name}-report.md
```

Use kebab-case for the filename (e.g., `handoffs/node-alert-system.md`, `handoffs/mission-export.md`, `handoffs/node-alert-report.md`). Create the `handoffs/` directory if it does not already exist.

Use these naming rules:

- The initial reviewer briefing uses `handoffs/{feature-name}.md`.
- The follow-up review artifact uses `handoffs/{feature-name}-report.md`.
- The report should generally use the same feature name as the original handoff so the pairing is obvious.

---

## Document Format

Every code handoff document must follow this exact structure. The prose lines under each section heading (e.g. "First things first...", "Secondly...", "Thirdly...") are fixed boilerplate and must be copied verbatim into every generated document.

```markdown
# {Feature Name} — Code Handoff

## Files to Review

First things first, review the following files and verify the code matches style-guide rules and
general best practices. Skim code for any glaring issues. Make note of any security concerns or potential bugs.

- [path/to/File.ts](/path/to/File.ts) — Brief description of what this file contains and why it is relevant to the feature.
- [path/to/Component.tsx](/path/to/Component.tsx) — Brief description.

---

## Manual Tests - Test End-User Experience Via UI

Secondly, run the application and verify the following behaviors by interacting with the UI:

- [ ] Manually verifiable behavior item.
- [ ] Another behavior item.

---

## Automatic Tests - Write Repeatable Jest Tests

Thirdly, write Jest tests to verify the following test cases:

### `ClassName.methodName`

Tests should be placed in `path-to-file/ClassName.test.tsx`.

- [ ] Specific test case.
- [ ] Another test case.

### `ComponentName`

Tests should be placed in `path-to-file/ComponentName.test.tsx`.

- [ ] Specific test case.
- [ ] Another test case.
```

---

## Handoff Report Format

Every handoff report must follow this structure. Unlike the code handoff, this document is issue-first and result-oriented. It should summarize what the reviewer actually found and completed while carrying out the original handoff, not expand the assigned scope of work.

````markdown
# {Feature Name} Report

This report captures review findings for the {feature-name} system using the same top-level structure as the original handoff. The goal is to give the original architect a feature-specific review artifact that is easy to compare against the implementation summary and easy to extend with future findings. Use it to record the results of the manual tests and automated tests requested by the handoff, along with any findings or advisory follow-up suggestions discovered during that work.

## Files to Review

### Review Summary

The following findings summarize the review, manual test execution, and automated test work completed for the assigned handoff scope.

### Findings

#### Severity Snapshot

- Highest current severity: Medium
- Critical: 0
- High: 0
- Medium: 1
- Low: 2

#### Medium

- path/to/File.ts:123 — Medium. Finding description.

#### Low

- path/to/OtherFile.tsx:45 — Low. Finding description.

## Manual Tests

### Execution Result

Short summary of the current manual test pass. If no manual issues were found, say so plainly.

{Copy the manual test checklist from the original handoff verbatim, preserving each item as an unchecked checkbox for the reviewing engineer to perform. If the original handoff explicitly stated that no manual testing was required, write a single sentence such as: "No manual testing was required for this handoff."}

- [ ] Manual test item copied from the original handoff.
- [ ] Another manual test item.

## Automatic Tests

### Summary

Reference the original handoff's requested automated test work at a high level, note which existing suites were inspected or executed during the report pass, and state whether any of the originally requested tests were actually written.

### New Tests Written

- path/to/new-test-file.test.ts — New automated coverage written during this report pass.

### Tests That Need To Be Repaired

- path/to/existing-test.test.tsx — Existing test coverage that is stale, broken, or no longer aligned with the implementation changes introduced by the feature.

### Additional Tests That Would Be Helpful

- path/to/source-file.tsx — Advisory follow-up automated coverage that would improve regression protection.

### Overall Results

Short summary of the current focused runs relevant to the feature or system under review.

```text
N files
X tests passed
Y tests failed
```
````

---

## Section Guidelines

### Title

The title should name the feature concisely followed by `— Code Handoff`.

```markdown
# NodeAlert System — Code Handoff

# Mission Export — Code Handoff
```

### Files to Review

- List **only files that changed** as part of this feature. Do not list files that were unchanged.
- Use absolute Markdown links so the links resolve correctly regardless of where the document is opened. The display text should be the workspace-relative path; the link target should be the same path prefixed with `/` (e.g. `[shared/missions/nodes/NodeAlert.ts](/shared/missions/nodes/NodeAlert.ts)`). Do **not** use relative paths (`../`) or bare workspace-relative paths as link targets.
- After each link, write a one-sentence description of what the file is and what role it plays in this feature. Be specific — avoid generic descriptions like "was updated".
- Order files from most foundational (shared models, server logic) to most surface-level (client components).

### Handoff Reports

- A handoff report is not a rewrite of the original handoff. It should report outcomes from the assigned review work: findings, written tests, executed tests, and remaining gaps.
- The title should name the feature concisely followed by `Report`.
- Keep the same top-level headings as the original handoff where practical: `Files to Review`, `Manual Tests`, and `Automatic Tests`. This makes side-by-side comparison easy.
- Under `Review Summary`, include a short `Severity Snapshot` that makes the current urgency obvious at a glance. A simple count by severity plus the highest current severity is usually enough.
- Findings should come first and should be ordered by severity, then by practical impact.
- Group findings under severity-specific subheaders such as `Critical`, `High`, `Medium`, and `Low`. Omit empty groups if there are no findings at that severity.
- Each finding should include the file path and line number when available.
- When a handoff report references a workspace file path in findings or automated-test sections, render it as a Markdown link so the reader can navigate directly from the report.
- The reviewer should perform the manual tests and automated test work requested by the original handoff, then record the results in the report. Do not expand the scope by fixing defects, changing implementation, or writing additional automated coverage unless the user explicitly asks for that extra work.
- Keep the concerns separated: `Findings` should capture issues discovered while reviewing the files listed in the handoff, while automated-test status should be reported only inside the `Automatic Tests` section.
- The `Manual Tests` section should preserve the original checklist verbatim and may include a short execution summary describing whether the manual pass was completed and whether any issues were found.
- The `Automatic Tests` section should begin with a summary that references the original handoff's requested automated test work and identifies which relevant suites were executed during the report pass.
- Do not duplicate the original handoff's required automated-test checklist inside the report unless the user explicitly asks for that mirrored format. The original handoff should remain the source of truth for the required new test backlog.
- If no new tests were written during the report pass, state that explicitly under `New Tests Written` rather than implying the work was completed.
- Existing tests that were broken or made stale by the feature changes belong under `Tests That Need To Be Repaired`, not under `Findings`.
- If a requested test was written but currently fails because it exposes a real product mismatch, record it under `New Tests Written` and describe the failing status explicitly in `Overall Results`.
- If the original handoff requested a test location that does not map cleanly to the repository's runnable Jest configuration, keep the intent but document the implemented equivalent path that actually runs in the current test setup.
- Do not silently convert product defects into "coverage gaps" once the test exists. At that point it is a failing implementation against a covered requirement.
- Prefer clear report language such as `Tests That Need To Be Repaired` for stale or broken existing suites and `Additional Tests That Would Be Helpful` for advisory follow-up coverage suggestions.
- `Additional Tests That Would Be Helpful` should be reserved for extra advisory coverage ideas discovered during review, not for restating the original handoff's required tests.
- Phrase new automated coverage or implementation fixes discovered during review as advisory follow-up work rather than assigning them to a specific developer. Prefer wording such as `would be useful`, `would be valuable`, or `should be updated` over imperative language like `write these tests now` unless the user explicitly asks for that stronger framing.
- Manual testing and automated testing may overlap, but the report should still document them separately. The Manual Tests section records execution of the handoff's manual QA checklist, and the Automatic Tests section records the status of the original handoff's requested automated coverage, any broken pre-existing suites affected by the feature, any new tests written, and any additional advisory test suggestions.
- The Manual Tests section of a handoff report must copy the manual test checklist from the original handoff verbatim, with each item preserved as an unchecked checkbox for the reviewing engineer to work through. Do not replace the list with placeholder prose or a "reserved" note.
- If the original handoff explicitly stated that no manual testing was required (e.g. "Manual UI validation is intentionally skipped for this feature"), the report's Manual Tests section must reflect that directly with a single sentence such as "No manual testing was required for this handoff." Do not use the generic reserved-section boilerplate in that case.
- The report should be updated as work progresses. It does not need to be written only once at the end.
- If both documents exist, the handoff remains the request for review work, and the handoff report becomes the record of completed review work.

## Manual Tests - Test End-User Experience Via UI

- Write these as manual QA steps a coworker could follow in a running instance of the application **without reading the code**. A non-developer tester should be able to work through the list.
- Each item should describe a discrete, verifiable behavior — not an implementation detail. Do not reference class names, method names, component names, event names, or internal conditions.
- Where relevant, include the trigger (e.g., "via the session page", "as an instructor").
- Include both happy-path and edge-case scenarios (e.g., empty state, real-time sync behavior, most-severe-wins logic, behavior when no items exist).

## Automatic Tests - Write Repeatable Jest Tests

- Group test cases under a `###` heading named after the class or component being tested.
- Each bullet is a single concrete test case — specific enough that a developer can write it without guessing.
- Focus on public API surface: constructors, static methods, public methods, props, rendered output, and user interactions.
- Consider unit vs integration tests. Individual components and classes should be tested in isolation as unit tests. When a test verifies the behavior of multiple components or layers working together as a system, it is an integration test.
- Do not list tests that already exist.
- Follow the existing test project layout:
  - Shared class tests → `tests/projects/unit/shared/`
  - Client component tests (isolated) → `tests/projects/unit/client/`
  - Server class tests → `tests/projects/unit/server/`
  - METIS REST API integration tests → `tests/projects/integration/metis-server/api/rest/`
  - METIS Socket.IO integration tests → `tests/projects/integration/metis-server/api/socket/`
  - Client-side component integration tests (multiple React components interacting as a system) → `tests/projects/integration/client/`
- If the repository does not currently define a runnable Jest project for one of the ideal integration locations, place the test in the closest existing runnable project and document that decision in the handoff report.
- If pathing isn't obvious for integration tests, explore current organization of tests and create directories that fit with the existing structure.
- Unit tests should be placed in the same relative path as the source file, but with `.test` added before the extension. For example:
  - `shared/missions/nodes/NodeAlert.ts` → `tests/projects/unit/shared/missions/nodes/NodeAlert.test.ts`
  - `client/src/components/content/session/mission-map/ui/toasts/NodeAlertBox.tsx` → `tests/projects/unit/client/components/content/session/mission-map/ui/toasts/NodeAlertBox.test.tsx`
- Integration tests should be placed in the appropriate directory
  based on the type of integration, as described above. For example:
  - Socket.IO integration test for mission map alerts → `tests/projects/integration/metis-server/api/socket/mission-map-alerts.test.ts`
  - Client-side integration test for mission map alert behavior → `tests/projects/integration/client/session/mission-map/MissionMap.test.tsx`

---
