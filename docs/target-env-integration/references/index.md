# Technical References

Complete technical documentation and API references for target environment development. This section provides detailed specifications, schemas, and API documentation for all components of the target-effect system.

## API References

### Runtime APIs

- **[Context API](context-api.md)** - Complete context object reference
  - Context properties and methods
  - Effect arguments and session data
  - File system and network access
  - State management and WebSocket communication

### Data Structures

- **[Schema Documentation](schemas.md)** - TypeScript schemas and types
  - Target environment schemas
  - Target definition interfaces
  - Argument type specifications
  - Validation rules and constraints

### Version Management

- **[Migrations](../guides/migrations.md)** - Migration system reference
  - Migration registry and versioning
  - Data transformation utilities
  - Upgrade and rollback patterns
  - Testing migration scripts

## Quick Reference

### Integration Points

- **METIS Server** → Context API provides server integration
- **Client UI** → Schemas define argument rendering
- **Database** → Migrations handle data persistence

## Related Documentation

- **[Implementation Guides](/docs/target-env-integration/guides/index.md)** - Step-by-step development guides
- **[Examples](/docs/target-env-integration/examples/index.md)** - Practical implementation examples
- **[API Documentation](/docs/api/target-environments.md)** - REST API endpoints
