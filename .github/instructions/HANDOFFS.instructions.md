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

Every handoff report must follow this structure. Unlike the code handoff, this document is issue-first and result-oriented. It should summarize what the reviewer actually found and completed, not what they were originally asked to do.

````markdown
# {Feature Name} Report

This report captures review findings for the {feature-name} system using the same top-level structure as the original handoff. The goal is to give the original architect a feature-specific review artifact that is easy to compare against the implementation summary and easy to extend with future findings.

## Files to Review

### Review Summary

The following findings are limited to code review and automated test review. Manual UI validation is intentionally left open for a separate reviewer pass.

### Findings

- path/to/File.ts:123 — Severity. Finding description.
- path/to/OtherFile.tsx:45 — Severity. Finding description.

## Manual Tests

This section is intentionally reserved for manual UI validation findings. It has not been populated in this report.

Recommended use:

- Copy the manual checklist from the original handoff.
- Record pass/fail status per scenario.
- Add reproduction notes only for failed scenarios.

## Automatic Tests

### Implemented Coverage

- path/to/test-file.test.ts — Coverage summary.
- path/to/other-test.test.tsx — Coverage summary.

### Execution Result

Short summary of the current focused run.

```text
N files
X tests passed
Y tests failed
```

### Open Coverage Gaps

- Remaining uncovered test work or intentionally failing assertions.
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

- A handoff report is not a rewrite of the original handoff. It should report outcomes: findings, written tests, executed tests, and remaining gaps.
- The title should name the feature concisely followed by `Report`.
- Keep the same top-level headings as the original handoff where practical: `Files to Review`, `Manual Tests`, and `Automatic Tests`. This makes side-by-side comparison easy.
- Findings should come first and should be ordered by severity, then by practical impact.
- Each finding should include the file path and line number when available.
- If a requested test was written but currently fails because it exposes a real product mismatch, record it as implemented coverage and describe the failing status explicitly in the execution result or open gaps section.
- If the original handoff requested a test location that does not map cleanly to the repository's runnable Jest configuration, keep the intent but document the implemented equivalent path that actually runs in the current test setup.
- Do not silently convert product defects into "coverage gaps" once the test exists. At that point it is a failing implementation against a covered requirement.
- Manual-test sections may remain intentionally unfilled if the reviewer did not perform manual validation. State that explicitly rather than implying the tests passed.
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
  - REST API integration tests → `tests/projects/integration/api/rest/`
  - WebSocket integration tests → `tests/projects/integration/api/websocket/`
  - Client-side component integration tests (multiple React components interacting as a system) → `tests/projects/integration/client/`
- If the repository does not currently define a runnable Jest project for one of the ideal integration locations, place the test in the closest existing runnable project and document that decision in the handoff report.
- If pathing isn't obvious for integration tests, explore current organization of tests and create directories that fit with the existing structure.
- Unit tests should be placed in the same relative path as the source file, but with `.test` added before the extension. For example:
  - `shared/missions/nodes/NodeAlert.ts` → `tests/projects/unit/shared/missions/nodes/NodeAlert.test.ts`
  - `client/src/components/content/session/mission-map/ui/toasts/NodeAlertBox.tsx` → `tests/projects/unit/client/components/content/session/mission-map/ui/toasts/NodeAlertBox.test.tsx`
- Integration tests should be placed in the appropriate directory
  based on the type of integration, as described above. For example:
  - WebSocket integration test for mission map alerts → `tests/projects/integration/api/websocket/mission-map-alerts.test.ts`
  - Client-side integration test for mission map alert behavior → `tests/projects/integration/client/session/mission-map/MissionMap.test.tsx`

---
