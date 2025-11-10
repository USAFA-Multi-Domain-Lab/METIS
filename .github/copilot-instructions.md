# METIS AI Coding Agent Instructions

## System Overview

METIS is a **real-time training system** for cybersecurity education built with a **target-effect architecture** that enables external system integration. The system consists of:

- **Client**: React SPA (`/client/`) with TypeScript and Socket.IO
- **Server**: Node.js/Express backend (`/server/`) with MongoDB and real-time WebSocket support
- **Shared**: Common TypeScript interfaces (`/shared/`) used across client/server
- **Integration**: Target environment plugin system (`/integration/`) for external system connectivity

The core philosophy is **modular effects-based transmitter** - effects flow through a hierarchy (Mission → Force → Node → Action → Effect) and can target external systems or internal METIS components.

### Core Architecture Pattern

METIS uses a **shared component type system** where both client and server define component registries:

- `TMetisClientComponents` in `/client/src/index.tsx` (extends `TMetisBaseComponents`)
- `TMetisServerComponents` in `/server/index.ts` (extends `TMetisBaseComponents`)
- `TMetisBaseComponents` from `/shared/index.ts` provides the foundation

**Critical**: When adding new component types, they must be registered in BOTH client and server registries to maintain type safety across the WebSocket boundary.

## Development Workflows

### Essential Commands

```bash
# Root-level installation (runs all sub-packages)
npm install

# Development (auto-restart server with nodemon)
npm run dev

# Production build and start
npm run build && npm run prod

# Test suite (server-side tests only)
npm run test

# Docker deployment (auto-generates config)
./cli.sh docker up

# Individual package commands
npm run client-install  # Client dependencies only
npm run server-install  # Server dependencies only
```

### Project Structure & Key Conventions

**TypeScript Path Mapping**: The system uses extensive path aliases:

- `metis/*` → `/shared/*` (shared components)
- `metis/server/*` → `/server/*` (server-side only)
- `integration/library/*` → `/integration/library/*` (plugin utilities)

**Component Hierarchy**: All entities follow this path pattern:

```typescript
// Example: Effect path includes full mission hierarchy
get path(): [...MissionComponent<any, any>[], this] {
  return [this.mission, this.force, this.node, this.action, this]
}
```

**Database Migrations**: Two-layer system:

- **Import builds** (`/server/missions/imports/builds/`) for legacy file imports
- **Database builds** (`/server/database/builds/`) for schema migrations
- All builds are numbered sequentially (e.g., `build_000001.js`) and auto-applied
- Migration scripts use MongoDB shell syntax and check for existing properties

### Target-Environment Integration System

**Critical Pattern**: External system integrations use auto-discovery:

1. **Create structure** in `/integration/target-env/your-env/`
2. **Define environment** in `schema.ts` using `TargetEnvSchema`
3. **Create targets** in `targets/operation/schema.ts` using `TargetSchema`
4. **Server restart** automatically discovers and registers new integrations

**Example target structure**:

```typescript
const target = new TargetSchema({
  name: 'Change Traffic Light',
  script: async (context) => {
    // Execute operation with context.effect.args
  },
  args: [
    {
      _id: 'color',
      type: 'dropdown',
      options: [{ _id: 'red', name: 'Red', value: 'red' }],
    },
  ],
})
```

## Development Guidelines

### When Working with Missions

- **Components hierarchy**: Mission → Force → Node → Action → Effect
- **Local keys**: All components have `localKey` for UI state management alongside `_id`
- **Real-time sync**: Mission state updates broadcast via WebSocket to all session members

### When Working with Sessions

- **Authentication**: Session-based with Express cookies (not JWT)
- **Member roles**: System has hierarchical permission model
- **Execution context**: Effects run server-side with secure `TargetEnvContext`

### When Working with Files

- **File references**: Use `FileReference` system, not direct file paths
- **Storage**: Files stored in configurable directories per environment
- **Access control**: File permissions managed through target-effect system

### Environment Configuration

- **Config files**: Use `/config/*.env` pattern (not `environment.json`)
- **Environment types**: `dev`, `prod`, `test`, `docker`
- **Docker deployment**: Use `./cli.sh docker up` (not manual docker-compose)

### Error Handling Patterns

- **Server errors**: Use `ServerEmittedError` for WebSocket responses
- **Migration safety**: Always check for existing properties in database builds
- **Validation**: Extensive use of Zod schemas for runtime validation

## Integration Points

**WebSocket Events**: Real-time communication uses structured event system in `/shared/connect/data.ts`

**Database Models**: Mongoose models in `/server/database/models/` with automatic schema validation

**API Endpoints**: RESTful APIs follow pattern `/api/v1/resource` with session authentication

**Component Registration**: Use static `REGISTRY` pattern for discoverable components (see `ServerTargetEnvironment.REGISTRY`)

**File System Structure**: Monorepo with coordinated package installation - always run `npm install` from root to handle all sub-packages

## Testing & Debugging

**Test data**: Comprehensive test fixtures in `/server/tests/data.ts`

**Logging**: Structured logging with Winston (see `/server/logging/`)

**Database inspection**: Use provided scripts in `/server/database/scripts/`

**Development mode**: Set `METIS_ENV_TYPE=dev` for enhanced debugging features

## Coding Style & Best Practices

Refer to `/docs/devs/style-guide.md` for detailed conventions. Key points:

- **Naming**: Use camelCase for variables/functions, PascalCase for classes/types.
- **Comments**: Write clear, descriptive comments for complex logic and public APIs.
- **TypeScript**: Prefer explicit types and interfaces for all data structures.
- **Imports**: Use path aliases (`metis/*`, etc.) instead of brittle relative paths.
- **Modularity**: Keep files focused; avoid large monolithic files.
- **Immutability**: Favor pure functions and immutable data where possible.
- **Error Handling**: Use explicit, meaningful error messages.
- **React**: Structure components for clarity and separation of concerns.
- **Validation**: Use Zod schemas for runtime validation.
- **Formatting**: Follow Prettier rules (tab width, quotes, trailing commas).

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

## Target-Environment Structure

**Repository Boundaries**: Target-environments are treated as external systems with clear separation from core METIS.

- **METIS Core**: Only `/integration/target-env/METIS/` belongs in the METIS repository
- **External Systems**: All other target-environments (e.g., MACE, ASCOT, test-env) are gitignored and treated as separate repositories
- **Integration Library**: `/integration/library/` provides shared APIs and utilities for all target-environments
- **Commit Guidelines**: Never reference external target-environment specifics in METIS commit messages - focus only on core platform capabilities

**Architecture**: Target-environments use the plugin system to integrate with METIS but maintain their own codebases, configurations, and repositories.

Following these conventions ensures code is readable, maintainable, and easy to extend in METIS.
