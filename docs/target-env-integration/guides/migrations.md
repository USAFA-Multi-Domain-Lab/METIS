# Target Migrations

This guide explains how to create and manage target migrations to handle schema changes and maintain compatibility with existing effects.

## Table of Contents

- [Overview](#overview)
- [🔄 When to Use Migrations](#-when-to-use-migrations)
- [📋 Migration Registry](#-migration-registry)
- [✍️ Writing Migration Scripts](#️-writing-migration-scripts)
- [🏗️ Target Schema Integration](#️-target-schema-integration)
- [🔗 Version Management](#-version-management)
- [🧪 Testing Migrations](#-testing-migrations)
- [💡 Best Practices](#-best-practices)
- [⚠️ Common Pitfalls](#️-common-pitfalls)
- [📚 Examples](#-examples)
- [📖 Related Documentation](#-related-documentation)

## Overview

Target migrations allow you to update target schemas while maintaining compatibility with existing effects. When you modify argument structures, rename fields, or change argument types, migrations ensure that old effects continue to work with the new target version.

**Key Concepts:**

- **Migration Registry** - Container for all migration scripts for a target
- **Migration Script** - Function that transforms old effect arguments to new format
- **Version Alignment** - Migration versions should align with target environment versions
- **Manual Execution** - Migrations are manually triggered through the mission page user-interface
- **Effect Args Only** - Current system only supports migrating effect arguments (more features planned)

## 🔄 When to Use Migrations

Create migrations when you make **breaking changes** to target schemas:

### Argument Structure Changes

```ts
// Before (v1.0.0)
{
  _id: 'serverConfig',
  type: 'string',
}

// After (v1.1.0) - Breaking change: string → large-string
{
  _id: 'serverConfig',
  type: 'large-string',
}
// ✅ Need migration: Convert short configs to multi-line format
```

### Argument ID Changes

```ts
// Before (v1.0.0)
{
  _id: 'hostName',
  type: 'string',
}

// After (v1.1.0) - Breaking change: rename
{
  _id: 'hostname', // Renamed to match conventions
  type: 'string',
}
// ✅ Need migration: Rename hostName → hostname
```

### Argument Removal/Addition

```ts
// Before (v1.0.0)
args: [
  { _id: 'port', type: 'number' },
  { _id: 'useSSL', type: 'boolean' },
]

// After (v1.1.0) - Breaking change: combine args
args: [
  { _id: 'endpoint', type: 'string' }, // Combines port + SSL
]
// ✅ Need migration: Combine port + useSSL → endpoint
```

### Non-Breaking Changes (No Migration Needed)

```ts
// Adding optional arguments
// Changing help text or descriptions
// Adding default values to required arguments
// Reordering arguments
```

## 📋 Migration Registry

A `TargetMigrationRegistry` object manages all migrations for a target:

### Basic Registry Setup

```ts
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'

// Create registry and register migrations
const migrations = new TargetMigrationRegistry()
  .register('1.1.0', (effectArgs) => {
    // Migration script for v1.1.0
    return transformedArgs
  })
  .register('1.2.0', (effectArgs) => {
    // Migration script for v1.2.0
    return transformedArgs
  })
```

### Chained Registration

```ts
const migrations = new TargetMigrationRegistry()
  .register('1.1.0', migrateToV1_1_0)
  .register('1.2.0', migrateToV1_2_0)
  .register('2.0.0', migrateToV2_0_0)

// Migration scripts can be separate functions
function migrateToV1_1_0(effectArgs) {
  // Handle v1.1.0 changes
  return effectArgs
}
```

## ✍️ Writing Migration Scripts

Migration scripts receive old effect arguments and return transformed arguments:

### Script Signature

```ts
type MigrationScript = (effectArgs: Record<any, any>) => Record<any, any>
```

### Basic Migration Example

```ts
// Migration from v1.0.0 to v1.1.0: Rename argument
const migrateToV1_1_0 = (effectArgs) => {
  console.log('Migrating to version 1.1.0: Renaming hostName to hostname')

  // Rename the argument
  if (effectArgs.hostName) {
    effectArgs.hostname = effectArgs.hostName
    delete effectArgs.hostName
  }

  return effectArgs
}
```

### Complex Migration Example

```ts
// Migration from v1.1.0 to v2.0.0: Restructure arguments
const migrateToV2_0_0 = (effectArgs) => {
  console.log('Migrating to version 2.0.0: Restructuring server config')

  const { port, useSSL, hostname, ...otherArgs } = effectArgs

  // Combine multiple args into endpoint
  const protocol = useSSL ? 'https' : 'http'
  const endpoint = `${protocol}://${hostname}:${port}`

  return {
    ...otherArgs,
    endpoint,
    // Add new optional args with defaults
    timeout: 30000,
    retryCount: 3,
}
```

## 🏗️ Target Schema Integration

Integrate migrations into your target schema:

### Complete Target with Migrations

```ts
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'

// Define migrations
const migrations = new TargetMigrationRegistry()
  .register('1.1.0', (effectArgs) => {
    // Rename hostName → hostname
    if (effectArgs.hostName) {
      effectArgs.hostname = effectArgs.hostName
      delete effectArgs.hostName
    }
    return effectArgs
  })
  .register('2.0.0', (effectArgs) => {
    // Combine port + SSL → endpoint
    const { port = 80, useSSL = false, hostname, ...rest } = effectArgs
    const protocol = useSSL ? 'https' : 'http'
    return {
      ...rest,
      endpoint: `${protocol}://${hostname}:${port}`,
    }
  })

// Create target with migrations
export default new TargetSchema({
  name: 'Deploy Service',
  description: 'Deploy service to remote server',
  migrations, // ✅ Add migrations to schema
  args: [
    {
      _id: 'endpoint',
      name: 'Server Endpoint',
      type: 'string',
      required: true,
    },
    {
      _id: 'deployKey',
      name: 'Deployment Key',
      type: 'string',
      required: true,
    },
  ],
  script: async (ctx) => {
    const { endpoint, deployKey } = ctx.effect.args

    ctx.sendOutput(`Deploying to ${endpoint}`)
    // Deploy logic here...
})
```

## 🔗 Version Management

Migration versions should align with your target environment versioning:

### Version Alignment Strategy

```ts
// Target Environment v1.0.0
// - Initial target release

// Target Environment v1.1.0
// - Added new optional argument
// - No migration needed (non-breaking)

// Target Environment v1.2.0
// - Renamed argument ID
// - ✅ Need migration for v1.2.0

// Target Environment v2.0.0
// - Major restructure of arguments
// - ✅ Need migration for v2.0.0

const migrations = new TargetMigrationRegistry()
  .register('1.2.0', handleArgumentRename)
  .register('2.0.0', handleMajorRestructure)
```

### Migration Execution

Migrations are manually triggered through the METIS mission page user-interface:

```ts
// Effect created with Target Environment v1.0.0
// Current Target Environment v2.1.0

// When triggered via mission page UI, METIS will run migrations in order:
// 1. v1.2.0 migration (renames arguments)
// 2. v2.0.0 migration (restructures arguments)

// Final result: Effect args compatible with v2.1.0
```

> **Note:** The migration system currently only supports migrating **effect arguments**. This system is designed to be expanded in the future to handle other types of migrations and provide more robust migration capabilities.

## 🧪 Testing Migrations

### Manual Testing

```ts
const migrations = new TargetMigrationRegistry().register(
  '1.1.0',
  (effectArgs) => {
    console.log('Input:', effectArgs)
    const result = migrateToV1_1_0(effectArgs)
    console.log('Output:', result)
    return result
  },
)

// Test with sample data
const oldArgs = { hostName: 'api.example.com', port: 443 }
const newArgs = migrations.migrate('1.1.0', oldArgs)
console.log('Migration result:', newArgs)
// Expected: { hostname: 'api.example.com', port: 443 }
```

### Validation Testing

```ts
const migrateWithValidation = (effectArgs) => {
  // Validate input
  if (!effectArgs.hostname) {
    throw new Error('Migration failed: hostname is required')
  }

  const result = performMigration(effectArgs)

  // Validate output
  if (!result.endpoint) {
    throw new Error('Migration failed: endpoint not generated')
  }

  return result
}
```

## 💡 Best Practices

### Migration Design

✅ **Keep migrations focused but comprehensive**

```ts
// Good: Handle all breaking changes for a version
new TargetMigrationRegistry().register('2.0.0', (args) => {
  // Multiple related changes in v2.0.0
  const result = { ...args }

  // Rename fields for consistency
  if (result.hostName) {
    result.hostname = result.hostName
    delete result.hostName
  }

  // Restructure authentication
  if (result.apiKey && result.authType) {
    result.auth = {
      type: result.authType,
      key: result.apiKey,
    }
    delete result.apiKey
    delete result.authType
  }

  // Add required defaults for new features
  result.timeout = result.timeout || 30000
  result.retryCount = result.retryCount || 3

  return result
})

// Also good: Single change when that's what the version contains
new TargetMigrationRegistry().register('1.1.0', (args) => renameHostname(args))
```

✅ **Preserve data integrity**

```ts
const migrate = (effectArgs) => {
  // Preserve unknown fields when restructuring
  const { knownField, ...unknownFields } = effectArgs

  // Option 1: Mutate original object
  effectArgs.newKnownField = knownField
  delete effectArgs.knownField
  return effectArgs

  // Option 2: Create new object (preserves unknowns)
  return {
    newKnownField: knownField,
    ...unknownFields, // Keep anything we don't recognize
  }
}
```

✅ **Handle edge cases gracefully**

```ts
const migrate = (effectArgs) => {
  // Handle missing data
  const hostname = effectArgs.hostname || effectArgs.hostName || 'localhost'

  // Handle different data types
  const port =
    typeof effectArgs.port === 'string'
      ? parseInt(effectArgs.port)
      : effectArgs.port || 80

  return { hostname, port }
}
```

### Version Strategy

✅ **Use semantic versioning consistently**

```ts
// Target Environment versions: 1.0.0, 1.1.0, 1.2.0, 2.0.0
// Migration versions: 1.2.0, 2.0.0 (only for breaking changes)
```

✅ **Document migration purpose**

```ts
new TargetMigrationRegistry().register('2.0.0', (effectArgs) => {
  // Migration purpose: Combine authentication fields into single object
  // Breaking change: auth-type + api-key → auth: { type, key }
  return migrateAuthFields(effectArgs)
})
```

## ⚠️ Common Pitfalls

### Migration Versioning Strategy

✅ **Create migrations only for versions with breaking changes**

```ts
// Your target environment releases:
// v1.0.0 - Initial release
// v1.1.0 - Added optional field (no breaking changes)
// v1.2.0 - Renamed 'hostName' to 'hostname' (BREAKING)
// v2.0.0 - Combined port + SSL into 'endpoint' (BREAKING)
// v2.1.0 - Added new optional timeout field (no breaking changes)

// Only create migrations for breaking change versions:
const migrations = new TargetMigrationRegistry()
  .register('1.2.0', (effectArgs) => {
    // Migrate effects created before v1.2.0
    if (effectArgs.hostName) {
      effectArgs.hostname = effectArgs.hostName
      delete effectArgs.hostName
    }
    return effectArgs
  })
  .register('2.0.0', (effectArgs) => {
    // Migrate effects created before v2.0.0
    const { port = 80, useSSL = false, hostname, ...rest } = effectArgs
    const protocol = useSSL ? 'https' : 'http'
    return {
      ...rest,
      endpoint: `${protocol}://${hostname}:${port}`,
    }
  })
```

**How it works:**

When an effect needs to be migrated, METIS runs all migrations between the effect's version and the current target version:

| Effect Created With | Current Target | Migrations Applied | Result                    |
| ------------------- | -------------- | ------------------ | ------------------------- |
| v1.0.0              | v2.1.0         | `1.2.0` → `2.0.0`  | ✅ Compatible with v2.1.0 |
| v1.1.0              | v2.1.0         | `1.2.0` → `2.0.0`  | ✅ Compatible with v2.1.0 |
| v1.2.0              | v2.1.0         | `2.0.0` only       | ✅ Compatible with v2.1.0 |
| v2.0.0+             | v2.1.0         | None needed        | ✅ Already compatible     |

> 💡 **Key insight:** You only need migrations for versions that introduced breaking changes. METIS automatically chains them together to bridge any version gap.

### Data Loss

❌ **Wrong: Losing data during migration**

```ts
const migrate = (effectArgs) => {
  // Only keeping known fields - loses custom data!
  return {
    hostname: effectArgs.hostname,
    port: effectArgs.port,
  }
}
```

✅ **Correct: Preserving unknown data**

```ts
const migrate = (effectArgs) => {
  const { oldField, ...preservedFields } = effectArgs
  return {
    ...preservedFields,
    newField: oldField,
  }
}
```

### Object Handling

✅ **Mutation is allowed - choose your preferred approach**

```ts
// Option 1: Mutate the original (allowed and efficient)
const migrate = (effectArgs) => {
  effectArgs.newField = effectArgs.oldField
  delete effectArgs.oldField
  return effectArgs
}

// Option 2: Create new object (also perfectly valid)
const migrate = (effectArgs) => {
  const { oldField, ...rest } = effectArgs
  return {
    ...rest,
    newField: oldField,
  }
}

// Both approaches are supported by the migration system
```

## 📚 Examples

### Example 1: Simple Field Rename

```ts
// v1.0.0 → v1.1.0: Standardize naming
const migrations = new TargetMigrationRegistry().register(
  '1.1.0',
  (effectArgs) => {
    const renames = {
      userName: 'username',
      hostName: 'hostname',
      portNum: 'port',
    }

    const result = { ...effectArgs }

    Object.entries(renames).forEach(([oldKey, newKey]) => {
      if (result[oldKey] !== undefined) {
        result[newKey] = result[oldKey]
        delete result[oldKey]
      }
    })

    return result
  },
)
```

### Example 2: Structure Transformation

```ts
// v1.1.0 → v2.0.0: Flatten nested config
const migrations = new TargetMigrationRegistry().register(
  '2.0.0',
  (effectArgs) => {
    const { serverConfig, authConfig, ...rest } = effectArgs

    // Flatten nested objects
    return {
      ...rest,
      hostname: serverConfig?.hostname || 'localhost',
      port: serverConfig?.port || 80,
      username: authConfig?.username || '',
      password: authConfig?.password || '',
    }
  },
)
```

## 📖 Related Documentation

### 📋 Essential Guides

- **[Defining Targets](defining-targets.md)** - Target schema creation and structure
- **[Target-Effect Conversion](target-effect-conversion.md)** - How arguments flow through the system
- **[Creating Target Environments](creating-target-environments.md)** - Environment versioning strategies

### 💡 Examples

- **[Basic Target](../examples/basic-target.md)** - Simple target patterns
- **[Complex Target](../examples/complex-target.md)** - Advanced target with migrations

### 🔗 References

- **[Schema Documentation](../references/schemas.md)** - Target schema and versioning patterns
- **[Tips & Conventions](tips-and-conventions.md)** - Versioning best practices
