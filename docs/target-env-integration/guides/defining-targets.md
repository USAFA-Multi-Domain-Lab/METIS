# Defining Targets

This guide covers everything you need to know about creating individual targets within a METIS target environment. Targets are the core building blocks that define what actions users can perform.

## Table of Contents

- [Overview](#overview)
- [⚠️ Key Requirements](#️-key-requirements)
- [Basic Target Structure](#basic-target-structure)
- [Target Schema Properties](#target-schema-properties)
- [The Script Function](#the-script-function)
- [Working with Arguments](#working-with-arguments)
- [Working with Data Stores](#working-with-data-stores)
- [🔗 External API Integration](#-external-api-integration)
- [🔄 Migrations](#-migrations)
- [📚 Examples](#-examples)
- [🧪 Testing Your Targets](#-testing-your-targets)
- [📁 Folder Organization](#-folder-organization)
- [⚡ Performance Considerations](#-performance-considerations)
- [🔧 Troubleshooting](#-troubleshooting)
- [📖 Related Documentation](#-related-documentation)

## Overview

A target is a single executable unit that:

- Accepts typed arguments from users
- Performs specific operations (API calls, file processing, system commands, etc.)
- Provides real-time output and results
- Supports conditional arguments

Each target lives in its own folder with a `schema.ts` file that exports a `TargetSchema`.

## ⚠️ Key Requirements

- **One target per folder** - File must default-export `TargetSchema`
- **Kebab-case folder names** - Folder name becomes the target `_id`
- **System-managed IDs** - Don't hardcode `_id` or `targetEnvId`
- **Start small** - Add args incrementally and test discovery/output early

## Basic Target Structure

### Minimal Target Example

```ts
// integration/target-env/my-env/targets/ping/schema.ts
import TargetSchema from '../../../../library/target-env-classes/targets'

export default new TargetSchema({
  name: 'Ping Host',
  description: 'Check if a host is reachable',
  args: [
    {
      _id: 'hostname',
      name: 'Hostname',
      type: 'string',
      required: true,
    },
  ],
  script: async (ctx) => {
    const { hostname } = ctx.effect.args
    ctx.sendOutput(`Pinging ${hostname}...`)

    // Your implementation logic here
    // Example: perform a check here and set success accordingly
    const success = true

    if (success) {
      ctx.sendOutput(`✓ ${hostname} is reachable`)
    } else {
      ctx.sendOutput(`✗ ${hostname} is not reachable`)
      // Consider early return or additional handling as needed
    }
  },
})
```

## Target Schema Properties

> 💡 **Need detailed argument types?** See the **[Argument Types Guide](argument-types.md)** for complete type reference and examples.

### Required Properties

| Property      | Type          | Description                                   |
| ------------- | ------------- | --------------------------------------------- |
| `name`        | string        | Display name shown in the UI                  |
| `description` | string        | Brief explanation of what the target does     |
| `script`      | TTargetScript | Async function that executes the target logic |

### Optional Properties

| Property     | Type                      | Description                                                             |
| ------------ | ------------------------- | ----------------------------------------------------------------------- |
| `args`       | `TTargetArgJson[]`        | Array of argument definitions (see [Argument Types](argument-types.md)) |
| `migrations` | `TargetMigrationRegistry` | Registry for handling target schema migrations                          |

## The Script Function

The script function is where your target's logic lives. It receives a context object with properties and methods for interacting with the METIS system.

### Context Overview

```ts
script: async (ctx) => {
  // Access arguments and effect data
  const { hostname } = ctx.effect.args
  const effectName = ctx.effect.name

  // Access mission and user information
  const missionId = ctx.mission._id
  const username = ctx.user.username

  // Send output and manipulate mission state
  ctx.sendOutput('Starting operation...')
  ctx.modifySuccessChance(25) // +25% success chance
  ctx.blockNode({ nodeKey: '<node-key>' })
}
```

### 📋 Context Properties

| Property      | Description                                |
| ------------- | ------------------------------------------ |
| `ctx.effect`  | Current effect with arguments and metadata |
| `ctx.mission` | Mission context with forces and nodes      |
| `ctx.user`    | User who triggered the effect              |

### 🔧 Context Methods

| Category          | Methods                                                                | Purpose                  |
| ----------------- | ---------------------------------------------------------------------- | ------------------------ |
| **Output**        | `sendOutput()`                                                         | Send output to users     |
| **Data Stores**   | `localStore.use()`, `globalStore.use()`                                | Cache and share data     |
| **Node Control**  | `blockNode()`, `unblockNode()`, `openNode()`                           | Control node states      |
| **Action Tuning** | `modifySuccessChance()`, `modifyProcessTime()`, `modifyResourceCost()` | Modify action properties |
| **Resources**     | `modifyResourcePool()`                                                 | Adjust force resources   |
| **File Access**   | `grantFileAccess()`, `revokeFileAccess()`                              | Manage file permissions  |

> 📘 **For complete details** on all context properties, methods, parameters, and options, see the [Context API Reference](../references/context-api.md).

## Working with Arguments

Arguments define what inputs your target accepts from users. They create the user interface form that appears when someone configures your target.

### Basic Argument Structure

```ts
args: [
  {
    _id: 'hostname', // Unique identifier
    name: 'Server Hostname', // Display name in UI
    type: 'string', // Input type
    required: true, // Whether required
    groupingId: 'connection', // Visual grouping
    tooltipDescription: 'Server to connect to', // Help text
  },
  {
    _id: 'priority',
    name: 'Priority Level',
    type: 'dropdown',
    required: true,
    default: { _id: 'normal', name: 'Normal', value: 'normal' },
    options: [
      { _id: 'low', name: 'Low', value: 'low' },
      { _id: 'normal', name: 'Normal', value: 'normal' },
      { _id: 'high', name: 'High', value: 'high' },
    ],
  },
]
```

### Conditional Arguments

Arguments can be shown/hidden based on other argument values using `dependencies`:

```ts
// Authentication Method and API Key Form Grouping
{
  _id: 'auth-method',
  name: 'Authentication Method',
  type: 'dropdown',
  required: true,
  options: [
    { _id: 'none', name: 'None', value: 'none' },
    { _id: 'basic', name: 'Basic', value: 'basic' },
    { _id: 'token', name: 'Token', value: 'token' },
  ],
  groupingId: 'authentication',
},
{
  _id: 'api-key',
  name: 'API Key',
  type: 'string',
  required: true,
  groupingId: 'authentication',
  dependencies: [Dependency.EQUALS('auth-method', 'token')],  // Only show if auth-method is 'token'
},

// Priority and Encryption Level Form Grouping
{
  _id: 'priority',
  name: 'Priority Level',
  type: 'dropdown',
  required: true,
  default: { _id: 'normal', name: 'Normal', value: 'normal' },
  options: [
    { _id: 'low', name: 'Low', value: 'low' },
    { _id: 'normal', name: 'Normal', value: 'normal' },
    { _id: 'high', name: 'High', value: 'high' },
  ],
  groupingId: 'priority',
},
{
  _id: 'encryptionLevel',
  name: 'Encryption Level',
  type: 'dropdown',
  required: true,
  dependencies: [Dependency.EQUALS_SOME('priority', ['high', 'urgent'])],  // Show for high/urgent priority
  options: [
    { _id: 'aes128', name: 'AES-128', value: 'aes128' },
    { _id: 'aes256', name: 'AES-256', value: 'aes256' },
  ],
  groupingId: 'priority',
}
```

### Accessing Arguments in Scripts

```ts
script: async (ctx) => {
  // Extract arguments from the effect
  const {
    ['auth-method']: authMethod,
    ['api-key']: apiKey,
    priority,
    encryptionLevel,
  } = ctx.effect.args

  // Use arguments in your logic
  restApi.post(
    '/path/for/request',
    {
      priority,
      encryptionLevel,
    },
    {
      headers: {
        'api-key': apiKey,
        'auth-method': authMethod,
      },
    },
  )
}
```

> 📘 **For complete details** on all argument types, scripts, properties, dependencies, and examples, see:
>
> - **[Argument Types Guide](argument-types.md)** - Complete reference with all types and options
> - **[Target-Effect Conversion Guide](target-effect-conversion.md)** - Guide on how target arguments are converted to effect arguments and how to extract them to use in target scripts
> - **[Basic Target Example](../examples/basic-target.md)** - Simple argument patterns
> - **[Complex Target Example](../examples/complex-target.md)** - Advanced argument usage

## Working with Data Stores

METIS provides data stores that allow you to cache and share data between target executions within a session. This enables stateful operations, API response caching, and cross-target communication.

### Local Store (Target Environment Scoped)

Use the local store for data that should persist within a specific target environment:

```ts
script: async (ctx) => {
  const { userId } = ctx.effect.args

  // Cache API responses to avoid repeated calls
  const userCache = ctx.localStore.use<Map<string, any>>('userCache', new Map())

  if (userCache.value.has(userId)) {
    ctx.sendOutput('Using cached user data')
    return userCache.value.get(userId)
  }

  // Fetch and cache user data
  const userData = await fetchUserFromAPI(userId)
  userCache.value.set(userId, userData)

  ctx.sendOutput('User data cached for future requests')
  return userData
}
```

### Global Store (Session Wide)

Use the global store for data that should be shared across different target environments:

```ts
script: async (ctx) => {
  const { operationStatus } = ctx.effect.args

  // Share mission state across all target environments
  const missionState = ctx.globalStore.use('missionState', {
    phase: 'planning',
    operationsComplete: 0,
    startTime: Date.now(),
  })

  // Update shared state
  missionState.value.operationsComplete += 1
  missionState.value.phase = operationStatus

  ctx.sendOutput(`Mission phase: ${missionState.value.phase}`)
  ctx.sendOutput(
    `Operations completed: ${missionState.value.operationsComplete}`,
  )
}
```

### Common Data Store Patterns

**Request Counter for Rate Limiting:**

```ts
script: async (ctx) => {
  const requestTracker = ctx.localStore.use('requests', {
    count: 0,
    lastReset: Date.now(),
  })

  // Reset counter every minute
  if (Date.now() - requestTracker.value.lastReset > 60000) {
    requestTracker.value.count = 0
    requestTracker.value.lastReset = Date.now()
  }

  if (requestTracker.value.count >= 10) {
    throw new Error('Rate limit exceeded: max 10 requests per minute')
  }

  requestTracker.value.count += 1
  // Proceed with request...
}
```

**Cross-Target Communication:**

```ts
script: async (ctx) => {
  // Target A sets up authentication
  const authState = ctx.globalStore.use('auth', { token: null, expires: 0 })

  if (Date.now() > authState.value.expires) {
    authState.value.token = await getAuthToken()
    authState.value.expires = Date.now() + 3600000 // 1 hour
  }

  // Now Target B can use the same token
  return authState.value.token
}
```

> 📘 **For comprehensive data store patterns and examples**, see the **[Data Stores Guide](data-stores.md)** which covers caching strategies, performance optimization, and advanced usage patterns.

## 🔗 External API Integration

> 🔗 **For comprehensive external API patterns**, see the **[External API Integration Guide](external-api-integration.md)** which covers authentication, error handling, and advanced patterns.

### Using REST APIs

If your environment has a REST client configured, use it in your targets:

```ts
// Import the client from your environment schema
import { MyServiceApi } from '../schema'

export default new TargetSchema({
  name: 'Create User',
  description: 'Create a new user account',
  args: [
    { _id: 'username', name: 'Username', type: 'string', required: true },
    { _id: 'email', name: 'Email', type: 'string', required: true },
  ],
  script: async (ctx) => {
    const { username, email } = ctx.effect.args

    try {
      ctx.sendOutput('Creating user account...')

      const response = await MyServiceApi.post('/users', {
        username,
        email,
        created_at: new Date().toISOString(),
      })

      ctx.sendOutput(`✓ User created with ID: ${response.data.id}`)
    } catch (error) {
      ctx.sendOutput(`✗ Failed to create user: ${error.message}`)
      return
    }
  },
})
```

## 🔄 Migrations

Use a `TargetMigrationRegistry` when you change target schema in ways that affect existing effects (for example, renaming argument IDs, changing shapes, or removing fields).

- **Register migrations** on the `migrations` option of `TargetSchema`
- **Align versions** with the target environment versioning

> 📖 **For complete migration workflows**, see the **[Migrations Guide](migrations.md)** which covers version management, migration scripts, and best practices.

## 📚 Examples

For end-to-end patterns (batch processing, file handling, progress, error strategies), see:

- **[Basic Target Example](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target Example](../examples/complex-target.md)** - Advanced patterns and integrations

## 🧪 Testing Your Targets

### Local Testing Checklist

1. **✅ Discovery** - Verify your target shows up and executes
2. **🔍 Validation** - Try various input combinations
3. **⚠️ Error Handling** - Trigger error conditions intentionally
4. **⚡ Performance** - Watch for long-running operations

### Debug Output

```ts
      try {
        await MyApi.post(`/users/${user}/${operation}`)
        ctx.sendOutput(`✓ ${user} processed successfully`)
      } catch (error) {
        throw error
        ctx.sendOutput(`✗ Failed to process ${user}: ${error.message}`)
      }
    }

    ctx.sendOutput('✓ Batch processing completed')
  },
})
```

## 📁 Folder Organization

### Simple Structure

```
integration/target-env/my-service/
├── targets/
│   ├── ping/
│   │   └── schema.ts
│   ├── health-check/
│   │   └── schema.ts
│   └── deploy/
│       └── schema.ts
```

### Grouped Structure

```
integration/target-env/my-service/
├── targets/
│   ├── monitoring/
│   │   ├── ping/
│   │   │   └── schema.ts
│   │   └── health-check/
│   │       └── schema.ts
│   ├── deployment/
│   │   ├── build/
│   │   │   └── schema.ts
│   │   └── deploy/
│   │       └── schema.ts
│   └── admin/
│       ├── user-management/
│       │   └── schema.ts
│       └── cleanup/
│           └── schema.ts
```

## ⚡ Performance Considerations

### Async Best Practices

- **Sequential operations** → Use `await`
- **Parallel operations** → Use `Promise.all()`
- **External calls** → Implement timeouts
- **Network failures** → Handle gracefully

### Output Management

- **Long operations** → Send incremental output
- **Structured data** → Include key data in output messages
- **Large content** → Avoid massive text blocks at once
- **User feedback** → Include progress indicators when possible

## 🔧 Troubleshooting

| Issue                         | Possible Cause                    | Solution                                  |
| ----------------------------- | --------------------------------- | ----------------------------------------- |
| 🚫 Target not appearing       | Wrong filename or export          | Ensure `schema.ts` exports `TargetSchema` |
| 📝 Arguments not showing      | Invalid argument definition       | Check argument types and required fields  |
| ⚠️ Script not executing       | Syntax error in script function   | Check console logs for JavaScript errors  |
| 🌐 External API calls failing | Missing environment configuration | Check `.env` files and API client setup   |

## 📖 Related Documentation

### 📋 Essential Guides

- **[Data Stores](data-stores.md)** - Session state management and caching patterns
- **[Argument Types](argument-types.md)** - Complete argument system reference
- **[Creating Target Environments](creating-target-environments.md)** - Environment setup guide
- **[Tips & Conventions](tips-and-conventions.md)** - Best practices and naming conventions

### 💡 Examples

- **[Basic Target](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target](../examples/complex-target.md)** - Advanced patterns and integrations

### 🔗 References

- **[REST API Reference](../references/rest-api.md)** - API client configuration
- **[Environment Configuration](../references/environment-configuration.md)** - Configuration file reference
