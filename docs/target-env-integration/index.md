# Target Environment Integration

Welcome to the METIS Target Environment Integration documentation. This section provides comprehensive guidance for creating and integrating target environments into the METIS system.

## What is the Target-Effect System?

The target-effect system is METIS's framework for creating reusable, configurable operations that can be executed during mission sessions. Target environments provide collections of **targets** (operation templates) that users can configure into **effects** (specific operation instances) within their missions.

## Quick Start

- **[Install an Existing Target Environment](guides/installing-existing-target-environments.md)** - Use the METIS CLI to install public or private target environment repositories
- **[Quickstart Guide](quickstart.md)** - Create your first target environment in 10 minutes
- **[Overview](overview.md)** - Understand the core concepts first
- **[Architecture](architecture.md)** - See how everything fits together

## 📚 Learning Paths

### New to Target Environments?

1. **[Overview](overview.md)** → Understand concepts
2. **[Quickstart](quickstart.md)** → Get hands-on experience
3. **[Creating Target Environments](guides/creating-target-environments.md)** → Learn the structure
4. **[Defining Targets](guides/defining-targets.md)** → Build your first targets
5. **[Basic Example](examples/basic-target.md)** → See it in action
6. **[Session Lifecycle](guides/session-lifecycle.md)** → Understand session resets and context protection
7. **[Data Stores](guides/data-stores.md)** → Cache and share data between scripts
8. **[Argument Types](guides/argument-types.md)** → Create better UIs
9. **[Advanced Example](examples/complex-target.md)** → Learn advanced patterns

### Integrating External Systems?

1. **[External API Integration](guides/external-api-integration.md)** → Master API connections
2. **[REST API Reference](references/rest-api.md)** → HTTP patterns and authentication
3. **[WebSocket API Reference](references/websocket-api.md)** → Real-time bidirectional communication
4. **[Environment Hooks](guides/environment-hooks.md)** → Lifecycle management for persistent connections
5. **[Environment Configuration](references/environment-configuration.md)** → Setup and deployment

### Need Reference Documentation?

- **[Context API](references/context-api.md)** → Complete runtime API
- **[REST API](references/rest-api.md)** → HTTP integration patterns
- **[WebSocket API](references/websocket-api.md)** → Real-time WebSocket communication
- **[Configs.json](references/configs-json.md)** → Configuration file format
- **[Schema Documentation](references/schemas.md)** → TypeScript types and validation
- **[Tips & Conventions](guides/tips-and-conventions.md)** → Best practices

## Complete Documentation

### Implementation Guides

- **[Installing Existing Target Environments](guides/installing-existing-target-environments.md)** - Install public and private target environment repositories with the METIS CLI
- **[Creating Target Environments](guides/creating-target-environments.md)** - Project setup and structure
- **[Defining Targets](guides/defining-targets.md)** - Creating operations and business logic
- **[Session Lifecycle & Instance Protection](guides/session-lifecycle.md)** - Session resets and context validation
- **[Environment Hooks](guides/environment-hooks.md)** - Lifecycle management and persistent connections
- **[Data Stores](guides/data-stores.md)** - Caching and sharing data between script executions
- **[External API Integration](guides/external-api-integration.md)** - Connecting to external systems
- **[Argument Types](guides/argument-types.md)** - Building typed user interfaces
- **[Migrations](guides/migrations.md)** - Version management and upgrades
- **[Tips & Conventions](guides/tips-and-conventions.md)** - Best practices and patterns

### Real-World Examples

- **[Basic Target Example](examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target Example](examples/complex-target.md)** - Advanced patterns and features

### Technical References

- **[Context API](references/context-api.md)** - Complete runtime API documentation
- **[REST API](references/rest-api.md)** - HTTP endpoints and patterns
- **[WebSocket API](references/websocket-api.md)** - Real-time WebSocket communication
- **[Configs.json](references/configs-json.md)** - Configuration file reference
- **[Schema Documentation](references/schemas.md)** - TypeScript types and validation
- **[Environment Configuration](references/environment-configuration.md)** - Setup and deployment

## Related Documentation

- **[Target Environments API](/docs/api/target-environments.md)** - REST API endpoints
- **[WebSocket System](/docs/devs/websocket.md)** - Real-time communication
- **[System Architecture](/docs/devs/architecture.md)** - Overall METIS architecture
