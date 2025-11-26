# METIS - Mission Effects Training and Integration System

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

The core philosophy is **modular effects-based transmitter** - effects flow through a hierarchy (Mission → Force → Node → Action → Effect) and can target external systems or internal METIS components.

For complete architecture documentation including data flow diagrams and component interactions, see `/docs/devs/architecture.md`.

### Core Architecture Pattern

METIS uses a **shared component type system** where both client and server define component registries:

- `TMetisClientComponents` in `/client/src/index.tsx` (extends `TMetisBaseComponents`)
- `TMetisServerComponents` in `/server/global.d.ts` (extends `TMetisBaseComponents`)
- `TMetisBaseComponents` from `/shared/global.d.ts` provides the foundation

**Critical**: When adding new component types, they must be registered in BOTH client and server registries to maintain type safety across the WebSocket boundary.

## Development Workflows

### Essential Commands

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
- `@integrations/schema/*` → `/integration/library/schema/*` (server-side only)
- `metis/*` → `/shared/*` (used in test code)

**Component Hierarchy**: All entities follow this path pattern:

```typescript
// Example: Effect path varies based on trigger context
// For execution-triggered effects (most common):
get path(): [...MissionComponent<any, any>[], this] {
  return [this.mission, this.force, this.node, this.action, this]
}
// For session-triggered effects:
get path(): [...MissionComponent<any, any>[], this] {
  return [this.mission, this]
}
```

**Database Migrations**: Two-layer system:

- **Import builds** (`/server/missions/imports/builds/`) for legacy file imports (uses `.ts` files)
- **Database builds** (`/server/database/builds/`) for schema migrations (uses `.js` files)
- All builds are numbered sequentially (e.g., `build_000001.js` or `build_000001.ts`) and auto-applied
- Migration scripts use MongoDB shell syntax and check for existing properties

### Target-Environment Integration System

**Critical Pattern**: External system integrations use auto-discovery. For complete integration guides and examples, see `/docs/target-env-integration/index.md`.

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

### Pull Request Requirements

- **Tests Required**: All new features and bug fixes must include appropriate tests
- **Tests Must Pass**: Run `npm run test` before submitting - all tests must pass
- **Commit Messages**: Follow commit guidelines (concise, past-tense, impact-focused, 2 sentences max)
- **Repository Boundaries**: Never commit external target-environment code to this repository
- **Code Review**: Changes must be reviewed before merge

### Common Development Workflows

**Debugging WebSocket Issues**:

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

- **Components hierarchy**: Mission → Force → Node → Action → Effect
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

**File System Structure**: Monorepo with coordinated package installation - always run `npm install` from root to handle all sub-packages

## Testing & Debugging

**Logging**: Structured logging with Winston (see `/server/logging/`)

**Database inspection**: Use provided scripts in `/server/database/scripts/`

**Development mode**: Set `METIS_ENV_TYPE=dev` for enhanced debugging features

## Coding Style & Best Practices

Refer to `/docs/devs/style-guide.md` for detailed conventions including docstring requirements, naming patterns, and code organization. Key points:

- **Naming**: Use camelCase for variables/functions, PascalCase for classes/types
- **Comments**: Write clear, descriptive comments for complex logic and public APIs
- **TypeScript**: Prefer explicit types and interfaces for all data structures
- **Imports**: Use path aliases (`@shared/*`, `@client/*`, `@server/*`) instead of relative paths
- **Modularity**: Keep files focused; avoid large monolithic files
- **Immutability**: Favor pure functions and immutable data where possible
- **React**: Structure components for clarity and separation of concerns
- **Formatting**: Follow Prettier rules (tab width, quotes, trailing commas)
- **Variable Declarations**: Prefer `let` for most variables. Use `const` only for:
  - Arrow functions that don't change
  - True constants that should never vary at runtime (use ALL_CAPS_SNAKE_CASE naming)
  - Example: `const MAX_RETRIES = 3` or `const handleClick = () => {}`

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
