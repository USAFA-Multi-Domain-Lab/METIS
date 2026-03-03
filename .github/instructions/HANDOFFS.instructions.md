# METIS: Code Handoff Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for creating code handoff documents in METIS.

## Overview

A **code handoff** is a Markdown document written for a coworker who will be performing a code review of a feature you have developed. It is not a code review itself — it is a structured briefing that tells the reviewer exactly which files to look at, what behavior to verify manually, and which tests still need to be written.

When a user says something like _"create a code handoff for this feature"_, you should:

1. Inspect the recent git changes (staged, unstaged, and recent commits) to identify which files are relevant to the feature.
2. Analyze the changed files to understand the shape of the feature.
3. Produce a handoff document in the `handoffs/` directory at the project root.

---

## Output Location

All handoff documents must be written to the `handoffs/` directory at the root of the workspace:

```
handoffs/{feature-name}.md
```

Use kebab-case for the filename (e.g., `handoffs/node-alert-system.md`, `handoffs/mission-export.md`). Create the `handoffs/` directory if it does not already exist.

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
- If pathing isn't obvious for integration tests, explore current organization of tests and create directories that fit with the existing structure.
- Unit tests should be placed in the same relative path as the source file, but with `.test` added before the extension. For example:
  - `shared/missions/nodes/NodeAlert.ts` → `tests/projects/unit/shared/missions/nodes/NodeAlert.test.ts`
  - `client/src/components/content/session/mission-map/ui/toasts/NodeAlertBox.tsx` → `tests/projects/unit/client/components/content/session/mission-map/ui/toasts/NodeAlertBox.test.tsx`
- Integration tests should be placed in the appropriate directory
  based on the type of integration, as described above. For example:
  - WebSocket integration test for mission map alerts → `tests/projects/integration/api/websocket/mission-map-alerts.test.ts`
  - Client-side integration test for mission map alert behavior → `tests/projects/integration/client/session/mission-map/MissionMap.test.tsx`

---
