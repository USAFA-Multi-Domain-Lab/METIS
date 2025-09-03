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
- **Automatic Execution** - METIS automatically runs pending migrations when effects execute

## 🔄 When to Use Migrations

Create migrations when you make **breaking changes** to target schemas:

### Argument Structure Changes

```ts
// Before (v1.0.0)
{
  _id: 'serverConfig',
  type: 'string',
}

// After (v1.1.0) - Breaking change: string → object
{
  _id: 'serverConfig',
  type: 'large-string', // Now expects JSON
}
// ✅ Need migration: Parse old string values
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

The `TargetMigrationRegistry` manages all migrations for a target:

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

  // Create new args object
  const newArgs = { ...effectArgs }

  // Rename the argument
  if (newArgs.hostName) {
    newArgs.hostname = newArgs.hostName
    delete newArgs.hostName
  }

  return newArgs
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
}
```

### Data Validation in Migrations

```ts
const migrateToV1_2_0 = (effectArgs) => {
  console.log('Migrating to version 1.2.0: Validating config format')

  const newArgs = { ...effectArgs }

  // Handle different config formats
  if (typeof newArgs.config === 'string') {
    try {
      // Parse JSON string to object
      newArgs.config = JSON.parse(newArgs.config)
    } catch (error) {
      console.warn('Invalid JSON in config, using default')
      newArgs.config = { default: true }
    }
  }

  // Ensure required properties exist
  newArgs.config = {
    timeout: 30,
    retries: 3,
    ...newArgs.config,
  }

  return newArgs
}
```

## 🏗️ Target Schema Integration

Integrate migrations into your target schema:

### Complete Target with Migrations

```ts
import TargetSchema from 'integration/library/target-env-classes/targets'
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'

// Define migrations
const migrations = new TargetMigrationRegistry()
  .register('1.1.0', (effectArgs) => {
    // Rename hostName → hostname
    const newArgs = { ...effectArgs }
    if (newArgs.hostName) {
      newArgs.hostname = newArgs.hostName
      delete newArgs.hostName
    }
    return newArgs
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
  },
})
```

### Migration-Only Updates

```ts
// When you only need to add migrations (no schema changes)
const migrations = new TargetMigrationRegistry().register(
  '1.0.1',
  (effectArgs) => {
    // Fix data corruption issue
    if (effectArgs.config && effectArgs.config.includes('{{')) {
      effectArgs.config = effectArgs.config.replace(/\{\{/g, '{')
    }
    return effectArgs
  },
)

export default new TargetSchema({
  name: 'Existing Target',
  description: 'Target with migration fixes',
  migrations, // Add migrations without changing args
  args: [
    // Existing args unchanged
  ],
  script: async (ctx) => {
    // Existing script unchanged
  },
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

### Migration Execution Order

METIS automatically determines which migrations to run:

```ts
// Effect created with Target Environment v1.0.0
// Current Target Environment v2.1.0
//
// METIS will run migrations in order:
// 1. v1.2.0 migration (renames arguments)
// 2. v2.0.0 migration (restructures arguments)
//
// Final result: Effect args compatible with v2.1.0
```

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

✅ **Keep migrations simple and focused**

```ts
// Good: Single responsibility
.register('1.1.0', (args) => renameHostname(args))
.register('1.2.0', (args) => addDefaults(args))

// Avoid: Multiple changes in one migration
.register('1.1.0', (args) => {
  // Don't combine unrelated changes
  args = renameHostname(args)
  args = restructureConfig(args)
  args = addNewFeatures(args)
  return args
})
```

✅ **Preserve data integrity**

```ts
const migrate = (effectArgs) => {
  // Create copy to avoid mutation
  const result = { ...effectArgs }

  // Preserve unknown fields
  const { knownField, ...unknownFields } = result

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
.register('2.0.0', (effectArgs) => {
  // Migration purpose: Combine authentication fields into single object
  // Breaking change: auth-type + api-key → auth: { type, key }
  return migrateAuthFields(effectArgs)
})
```

## ⚠️ Common Pitfalls

### Migration Versioning Issues

❌ **Wrong: Skipping migration versions**

```ts
// Target env: v1.0.0 → v1.1.0 → v2.0.0
// Migrations: v2.0.0 only
// Problem: Effects from v1.1.0 won't migrate properly
```

✅ **Correct: Complete migration chain**

```ts
const migrations = new TargetMigrationRegistry()
  .register('1.1.0', migrateFromV1_0_0) // Handle v1.0.0 → v1.1.0
  .register('2.0.0', migrateFromV1_1_0) // Handle v1.1.0 → v2.0.0
```

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

### Mutation Issues

❌ **Wrong: Mutating input arguments**

```ts
const migrate = (effectArgs) => {
  effectArgs.newField = effectArgs.oldField // ❌ Mutates input
  delete effectArgs.oldField
  return effectArgs
}
```

✅ **Correct: Creating new object**

```ts
const migrate = (effectArgs) => {
  const { oldField, ...rest } = effectArgs
  return {
    ...rest,
    newField: oldField,
  }
}
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

### Example 3: Data Type Migration

```ts
// v2.0.0 → v3.0.0: String config → JSON object
const migrations = new TargetMigrationRegistry().register(
  '3.0.0',
  (effectArgs) => {
    const result = { ...effectArgs }

    // Convert string config to object
    if (typeof result.config === 'string') {
      try {
        result.config = JSON.parse(result.config)
      } catch (error) {
        console.warn('Failed to parse config JSON, using defaults')
        result.config = {
          timeout: 30000,
          retries: 3,
        }
      }
    }

    // Ensure config has required fields
    result.config = {
      timeout: 30000,
      retries: 3,
      ...result.config,
    }

    return result
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

- **[TargetMigrationRegistry API](../references/migration-registry.md)** - Complete migration API reference
- **[Version Management](../references/version-management.md)** - Versioning best practices
