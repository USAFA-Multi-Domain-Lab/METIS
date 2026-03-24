# Agent-Specific Instructions for METIS

## What is METIS (Modular Effects-Based Transmitter for Integrated Simulations)?

METIS is a **real-time cybersecurity training platform** designed for military and educational institutions. It enables instructors to create dynamic, hierarchical training scenarios (missions) where effects can target both simulated environments and live external systems. Trainees gain hands-on experience with multi-domain operations, learning to coordinate actions across cyberspace, network infrastructure, and integrated simulation environments.

**Primary Users**: Military cyber operations training, university cybersecurity programs, red/blue team exercises

**Key Capabilities**: Mission planning and execution, real-time collaboration, external system integration through plugins, hierarchical effects management, session-based training environments

**General Instructions for Agents**

- **Working With Classes** Always order class members as follows: instance properties, constructor, instance methods, static properties, static methods. Group getters and setters with their private properties, such as `private _name`, `get name()`, and `set name(value)`, without line gaps. All other members should have a one line gap.

**Instructions Covering Specific Topics**

- [MissionComponent guide](.github/instructions/MISSION-COMPONENT.instructions.md) — Use when creating or managing components of a mission, such as a mission, a node, force, resource, etc. Covers implementation of this abstract class and how it is used throughout the codebase.
- [React class names guide](.github/instructions/CLASS-NAMES.instructions.md) — Use when constructing or conditionally applying CSS class names on React elements; covers the `ClassList` API, chaining, and naming conventions
- [LocalContext guide](.github/instructions/LOCAL-CONTEXT.instructions.md) — Use when a component owns subcomponents that need access to its props, state, or computed values; covers the `LocalContext` pattern, provider setup, and the `T{Name}_P/C/S/E` type convention
- [Tooltip guide](.github/instructions/TOOLTIP.instructions.md) — Use when displaying hover-triggered descriptive text on an interactive element; covers the `Tooltip` component API, placement rules, dynamic and conditional descriptions, and nesting conflicts
- [Buttons guide](.github/instructions/BUTTONS.instructions.md) — Use when adding interactive buttons; covers `ButtonText` vs `ButtonSvg`, the `ButtonSvgEngine`/`ButtonSvgPanel` pattern, simple and cross-component usage, layout, and pre-built button factories
- [Migration guide](.github/instructions/MIGRATIONS.instructions.md) — Database builds, import builds, checklist
- [Handoff guide](.github/instructions/HANDOFFS.instructions.md) — Format, sections, and output location for code handoff documents
- [Documentation guide](.github/instructions/DOCUMENTATION.instructions.md) — Structure, naming, linking, and index registration
