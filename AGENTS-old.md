# METIS — Modular Effects-Based Transmitter for Integrated Simulations

Complete guide and quick index for AI agents working in this workspace.

## What is METIS?

METIS is a **real-time cybersecurity training platform** designed for military and educational institutions. It enables instructors to create dynamic, hierarchical training scenarios (missions) where effects can target both simulated environments and live external systems. Trainees gain hands-on experience with multi-domain operations, learning to coordinate actions across cyberspace, network infrastructure, and integrated simulation environments.

**Primary Users**: Military cyber operations training, university cybersecurity programs, red/blue team exercises

**Key Capabilities**: Mission planning and execution, real-time collaboration, external system integration through plugins, hierarchical effects management, session-based training environments

## System Architecture

METIS is built with a **target-effect architecture** that enables external system integration. The system consists of:

- **Client**: React SPA (`/client/`) with TypeScript and Socket.IO
- **Server**: Node.js/Express backend (`/server/`) with MongoDB and real-time WebSocket support
- **Shared**: Common TypeScript interfaces (`/shared/`) used across client/server
- **Integration**: Target environment plugin system (`/integration/`) for external system connectivity

The core philosophy is **modular effects-based transmitter** — effects flow through a hierarchy (Mission → Force → Node → Action → Effect) and can target external systems or internal METIS components.

For complete architecture documentation including data flow diagrams and component interactions, see `/docs/devs/architecture.md`.

### Core Architecture Pattern

METIS uses a **shared component type system** where both client and server define component registries:

- `TMetisClientComponents` in `/client/src/index.tsx` (extends `TMetisBaseComponents`)
- `TMetisServerComponents` in `/server/global.d.ts` (extends `TMetisBaseComponents`)
- `TMetisBaseComponents` from `/shared/global.d.ts` provides the foundation

**Critical**: When adding new component types, they must be registered in BOTH client and server registries to maintain type safety across the WebSocket boundary.

## 🔧 Development Commands

```bash
# Root-level installation (runs all sub-packages)
npm install

# Production server start
npm start

# Development (auto-restart server with tsx watch)
npm run dev

# Client development server
npm run react

# Production build (client only)
npm run build

# Test suite (server-side tests only)
npm run test

# Docker deployment (auto-generates config)
./cli.sh docker up
```

### Project Structure & Key Conventions

**TypeScript Path Mapping**: The system uses extensive path aliases:

- `@shared/*` → `/shared/*` (used in client, server, and integration code)
- `@client/*` → `/client/src/*` (client-side only)
- `@server/*` → `/server/*` (server-side only)
- `@metis/*` → `/integration/library/*` (target-environment integration library)

**Component Hierarchy**: All entities follow this path: `Mission → Force → Node → Action → Effect`

**Database Migrations**: Two-layer system — see [MIGRATIONS.instructions.md](.github/instructions/MIGRATIONS.instructions.md) for the full checklist and step-by-step guide.

**Target-Environment Integration**: External system integrations use auto-discovery. Create structure in `/integration/target-env/your-env/`, define `schema.ts` using `TargetEnvSchema`, and server restart automatically registers the environment. See `/docs/target-env-integration/index.md` for complete guides.

## 📋 Key Resources by Task

**Writing code:**

- [Style guide](.github/instructions/STYLE-GUIDE.instructions.md) — Required conventions
- [React class names guide](.github/instructions/CLASS-NAMES.instructions.md) — Use when constructing or conditionally applying CSS class names on React elements; covers the `ClassList` API, chaining, and naming conventions
- [LocalContext guide](.github/instructions/LOCAL-CONTEXT.instructions.md) — Use when a component owns subcomponents that need access to its props, state, or computed values; covers the `LocalContext` pattern, provider setup, and the `T{Name}_P/C/S/E` type convention
- [Tooltip guide](.github/instructions/TOOLTIP.instructions.md) — Use when displaying hover-triggered descriptive text on an interactive element; covers the `Tooltip` component API, placement rules, dynamic and conditional descriptions, and nesting conflicts
- [Buttons guide](.github/instructions/BUTTONS.instructions.md) — Use when adding interactive buttons; covers `ButtonText` vs `ButtonSvg`, the `ButtonSvgEngine`/`ButtonSvgPanel` pattern, simple and cross-component usage, layout, and pre-built button factories
- [Architecture](docs/devs/architecture.md) — System design patterns
- [WebSocket](docs/devs/websocket.md) — Real-time communication

**Writing integrations:**

- [Integration quickstart](docs/target-env-integration/quickstart.md)
- [Integration architecture](docs/target-env-integration/architecture.md)

**Writing migrations:**

- [Migration guide](.github/instructions/MIGRATIONS.instructions.md) — Database builds, import builds, checklist

**Writing code handoffs:**

- [Handoff guide](.github/instructions/HANDOFFS.instructions.md) — Format, sections, and output location for code handoff documents

**Writing documentation:**

- [Documentation guide](.github/instructions/DOCUMENTATION.instructions.md) — Structure, naming, linking, and index registration

**Understanding APIs:**

- [API overview](docs/api/overview.md)
- [Specific endpoints](docs/api/)

## Development Guidelines

### Pull Request Requirements

- **Tests Required**: All new features and bug fixes must include appropriate tests
- **Tests Must Pass**: Run `npm run test` before submitting — all tests must pass
- **Commit Messages**: Follow commit guidelines below
- **Repository Boundaries**: Never commit external target-environment code to this repository
- **Code Review**: Changes must be reviewed before merge

### Debugging WebSocket Issues

- Check structured logs in `/server/logging/` (Winston)
- Review WebSocket event system in `/shared/connect/`
- Use `METIS_ENV_TYPE=dev` for enhanced debugging
- For WebSocket patterns and real-time communication details, see `/docs/devs/websocket.md`

### Security Best Practices

- **Input Validation**: Always use Zod schemas for runtime validation
- **Authentication**: Session-based only (Express cookies, not JWT)
- **File Access**: Use `FileReference` system with proper access control
- **Effect Execution**: Effects run server-side with secure `TargetEnvContext`
- **Error Handling**: Use `ServerEmittedError` for WebSocket responses
- **Rate Limiting**: HTTP and WebSocket rate limits configured in environment
- **Migration Safety**: Always check for existing properties in database builds

### When Working with Missions

- **Component hierarchy**: Mission → Force → Node → Action → Effect
- **Local keys**: Client-side components (forces, nodes, actions) use `localKey` for UI state tracking alongside `_id`
- **Real-time sync**: Mission state updates broadcast via WebSocket to all session members

### When Working with Sessions

- **Member roles**: System has hierarchical permission model
- **Session management**: Session-based authentication with Express cookies (not JWT)
- **Execution context**: Effects run server-side with secure `TargetEnvContext`

### Environment Configuration

- **Config files**: Use `/config/*.env` pattern
- **Environment types**: `dev`, `prod`, `test`, `docker`
- **Docker deployment**: Use `./cli.sh docker up` (not manual docker-compose)

## Integration Points

**WebSocket Events**: Real-time communication uses structured event system in `/shared/connect/`

**Database Models**: Mongoose models in `/server/database/models/` with automatic schema validation

**API Endpoints**: RESTful APIs follow pattern `/api/v1/resource` with session authentication. For complete API documentation, see `/docs/api/index.md`.

**Component Registration**: Use static `REGISTRY` pattern for discoverable components (see `ServerTargetEnvironment.REGISTRY`)

**File System Structure**: Monorepo with coordinated package installation — always run `npm install` from root to handle all sub-packages

## Testing & Debugging

**Logging**: Structured logging with Winston (see `/server/logging/`)

**Database inspection**: Use provided scripts in `/server/database/scripts/`

**Development mode**: Set `METIS_ENV_TYPE=dev` for enhanced debugging features

## Architecture Decision Records

**Shared Component Registry**: Both client and server must register component types to maintain WebSocket type safety across boundaries.

**Effects-Based Design**: All system interactions flow through the hierarchical effects system (Mission → Force → Node → Action → Effect) for traceability and extensibility.

**Auto-Discovery Pattern**: Target environments and integrations are discovered at server startup, enabling plugin-style extensibility without code changes.

## Git Commit Guidelines

**Commit Message Format**: Keep commits modular and granular with concise, impact-focused messages.

- **Length**: Two sentences or less
- **Style**: Concise and focused on major changes in that specific commit
- **Format**: Past-tense descriptive sentences written as if explaining to a future developer
- **Examples**:
  - `Added WebSocket API with event-driven architecture for target-environment plugins`
  - `Fixed connection timeout issues by implementing native handshakeTimeout option`
  - `Updated integration documentation to include WebSocket usage examples`

**Commit Scope**: Each commit should represent a single logical change or feature addition. Avoid bundling unrelated changes together.

## Changelog Guidelines

When updating `/docs/changelog.md`:

- **Complete Sentences**: All bullet points must be complete, grammatically correct sentences (include subject and verb)
- **Conciseness**: Keep entries brief while conveying the essential information
- **Past Tense**: Write entries in past tense (e.g., "was added", "were improved", "has been implemented")
- **User-Focused**: Focus on user-visible changes and their impact rather than implementation details
- **Grouping**: Organize related changes together when possible (e.g., combining multiple fixes to the same system)

## Target-Environment Structure

**Repository Boundaries**: Target-environments are treated as external systems with clear separation from core METIS.

- **METIS Core**: Only `/integration/target-env/METIS/` belongs in the METIS repository
- **External Systems**: All other target-environments (e.g., MACE, ASCOT, test-env) are gitignored and treated as separate repositories
- **Integration Library**: `/integration/library/` provides shared APIs and utilities for all target-environments
- **Commit Guidelines**: Never reference external target-environment specifics in METIS commit messages — focus only on core platform capabilities

**Architecture**: Target-environments use the plugin system to integrate with METIS but maintain their own codebases, configurations, and repositories.
