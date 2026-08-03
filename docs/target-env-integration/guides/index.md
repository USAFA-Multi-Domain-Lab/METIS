# Implementation Guides

Step-by-step guides for developing target environments in METIS. Each guide provides detailed instructions, code examples, and best practices to get you building production-ready integrations quickly.

## 🚀 Start Here

New to target environment development? Follow this path:

1. **[Install an Existing Target Environment](installing-existing-target-environments.md)** → Pull one down with the METIS CLI
2. **[Creating Target Environments](creating-target-environments.md)** → Set up your project
3. **[Defining Targets](defining-targets.md)** → Build your first operations
4. **[Parameter and Argument Types](parameter-and-argument-types.md)** → Create user-friendly interfaces

## 🔗 Connect External Systems

- **[External API Integration](external-api-integration.md)** - REST APIs, authentication, and error handling
  - OAuth flows and API key management
  - Rate limiting and retry strategies
  - Security best practices

## 🛠️ Advanced Development

- **[Session Lifecycle & Instance Protection](session-lifecycle.md)** - Understanding session resets and context validation

  - Session instance ID system
  - OutdatedContextError handling
  - Safe asynchronous operations
  - Data store lifecycle management

- **[Environment Hooks](environment-hooks.md)** - Lifecycle methods for resource management

  - Session setup and teardown
  - Database and API connection management
  - Shared resource initialization
  - Cleanup and resource release

- **[Data Stores](data-stores.md)** - Cache and share data between script executions

  - Realm-scoped and session-scoped data persistence
  - Local, realm, and global store patterns
  - Performance optimization techniques

- **[Target-Effect Conversion](target-effect-conversion.md)** - How targets become effects

  - What your script receives for each parameter type
  - Unset values, and when an argument is `undefined`
  - Reconciling stored arguments when a target changes

- **[Migrations](migrations.md)** - Manage versions and data changes

  - Schema evolution and backward compatibility
  - Testing migration scripts
  - Production deployment strategies

- **[Tips & Conventions](tips-and-conventions.md)** - Production-ready patterns
  - Code organization and architecture
  - Performance optimization
  - Security and testing strategies

## Related Documentation

- **[Examples](../examples/index.md)** - See these guides in action
- **[Technical References](../references/index.md)** - API documentation and schemas
- **[Quickstart](../quickstart.md)** - Get started in 5 minutes
