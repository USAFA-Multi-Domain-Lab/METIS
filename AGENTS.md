# Agent-Specific Instructions for METIS

## What is METIS (Modular Effects-Based Transmitter for Integrated Simulations)?

METIS is a **real-time cybersecurity training platform** designed for military and educational institutions. It enables instructors to create dynamic, hierarchical training scenarios (missions) where effects can target both simulated environments and live external systems. Trainees gain hands-on experience with multi-domain operations, learning to coordinate actions across cyberspace, network infrastructure, and integrated simulation environments.

**Primary Users**: Military cyber operations training, university cybersecurity programs, red/blue team exercises

**Key Capabilities**: Mission planning and execution, real-time collaboration, external system integration through plugins, hierarchical effects management, session-based training environments

## General Instructions for Agents

- **Conversation Style** When answering questions, there is no need to go in depth if a simple question was asked. Brevity is preferred in most cases. If the user needs additional context, they can always ask for it.

Never use the word "linter" when changes are made. If a change has been made, it was almost certainly a manual change made by the user.

- **Working With JS Classes** Always order class members as follows: instance properties, constructor, instance methods, static properties, static methods. Group getters and setters with their private properties, such as `private _name`, `get name()`, and `set name(value)`, without line gaps. All other members should have a one line gap.

- **const vs let**: Use `let` for variables by default. `const` is only used for values where reassignment would be an actual concern. Most variables in the app are `let`.

- **Casting Types** Casting is discouraged whenever proper typing is possible. When its unavoidable that's fine, but it should be a last resort.

- **Naming Conventions** Typical abbreviations you would find in code are discouraged in this project. Please use terminology that would be safe for a professional email. No one-letter variable names in for loops or typing `req` instead of `request`. Spell the word out fully.

- **Implementations & Editing Files** NEVER edit files or proceed with an implementation without express approval. If a prompt uses language that strongly suggests that an edit is warranted, then proceed. However, if a user is simply asking for an opinion or suggesting a new direction, do not assume they are requesting an implementation right away.

## Instructions Covering Specific Topics

- [MissionComponent guide](.github/instructions/MISSION-COMPONENT.instructions.md) — Use when creating or managing components of a mission, such as a mission, a node, force, resource, etc. Covers implementation of this abstract class and how it is used throughout the codebase.
- [React class names guide](.github/instructions/CLASS-NAMES.instructions.md) — Use when constructing or conditionally applying CSS class names on React elements; covers the `ClassList` API, chaining, and naming conventions
- [LocalContext guide](.github/instructions/LOCAL-CONTEXT.instructions.md) — Use when a component owns subcomponents that need access to its props, state, or computed values; covers the `LocalContext` pattern, provider setup, and the `T{Name}_P/C/S/E` type convention
- [Tooltip guide](.github/instructions/TOOLTIP.instructions.md) — Use when displaying hover-triggered descriptive text on an interactive element; covers the `Tooltip` component API, placement rules, dynamic and conditional descriptions, and nesting conflicts
- [Buttons guide](.github/instructions/BUTTONS.instructions.md) — Use when adding interactive buttons; covers `ButtonText` vs `ButtonSvg`, the `ButtonSvgEngine`/`ButtonSvgPanel` pattern, simple and cross-component usage, layout, and pre-built button factories
- [Migration guide](.github/instructions/MIGRATIONS.instructions.md) — Database builds, import builds, checklist
- [Handoff guide](.github/instructions/HANDOFFS.instructions.md) — Format, sections, and output location for code handoff documents
- [Documentation guide](.github/instructions/DOCUMENTATION.instructions.md) — Structure, naming, linking, and index registration
- [Mission file guide](.github/instructions/MISSION-FILE.instructions.md) — Use when creating or editing a raw mission JSON/zip file for import; covers the `.metis.zip` format, prototype and structure requirements, required schema fields, and common import errors
