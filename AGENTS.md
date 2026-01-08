# METIS Agent Guide

This file is a quick index for workspace rules that apply to AI agents (and humans). Refer to the linked sources for full details.

## Authoritative instruction sources

- [.github/instructions/style-guide.instructions.md](.github/instructions/style-guide.instructions.md) — Required docstring format, naming, ordering, and related coding conventions. Applies to all code paths.

## High-signal conventions to remember

- Docstrings: required for exported members, types, classes, functions, enums, and properties with parameters; use @param/@returns/@throws and @resolves/@rejects for promises; document defaults with @default.
- Naming: types/interfaces prefixed with T; AJAX methods that call the server are prefixed with $; constants are ALL_CAPS_SNAKE_CASE; prefer concise, unambiguous names.
- Variables: prefer let; reserve const for arrow functions or true constants.
- Files: classes/components use PascalCase filenames; general utilities use kebab-case; migration builds use build\_**\*\***.\* numbering.
- Class layout: non-static properties, constructor, non-static methods, static properties, static methods; group getters/setters with their backing fields.
- Path aliases: use @shared/_, @client/_, @server/_, @integrations/schema/_, metis/\* instead of deep relative paths.
- Tests and migrations: keep build numbering sequential for database/import builds; add tests for new features/bug fixes when practical.

## Helpful references (non-authoritative)

- [docs/devs/style-guide.md](docs/devs/style-guide.md) — Additional project style guidance.
- [docs/devs/architecture.md](docs/devs/architecture.md) — System overview and component interactions.
- [docs/target-env-integration/index.md](docs/target-env-integration/index.md) — Target-environment plugin patterns.

If new instruction files are added, link them here so agents have a single starting point.
