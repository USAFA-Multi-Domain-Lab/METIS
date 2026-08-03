# Defining Targets

This guide covers everything you need to know about creating individual targets within a METIS target environment. Targets are the core building blocks that define what actions users can perform.

## Table of Contents

- [Overview](#overview)
- [Key Requirements](#key-requirements)
- [Basic Target Structure](#basic-target-structure)
- [Target Schema Properties](#target-schema-properties)
- [The Script Function](#the-script-function)
- [Working with Parameters](#working-with-parameters)
- [Working with Data Stores](#working-with-data-stores)
- [External API Integration](#external-api-integration)
- [Migrations](#migrations)
- [Examples](#examples)
- [Testing Your Targets](#testing-your-targets)
- [Folder Organization](#folder-organization)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Overview

A target is a single executable unit that:

- Accepts typed arguments from users
- Performs specific operations (API calls, file processing, system commands, etc.)
- Provides real-time output and results
- Supports conditional parameters

Each target lives in its own folder with a `schema.ts` file that default-exports a target created with `TargetSchema.create()`.

## Key Requirements

- **One target per folder** - The file must default-export the result of `TargetSchema.create()`
- **Declare an `_id`** - Every target sets its own `_id`, and it must be unique within the environment
- **Never set `targetEnvId`** - That is assigned from the environment's folder name
- **Kebab-case folder names** - Folders are only where discovery looks; they do not determine the target's `_id`
- **Start small** - Add parameters incrementally and test discovery and output early

> **Note:** The `_id` is what saved effects reference, so changing it on an existing target orphans every effect built from it. Treat it as permanent, or supply a migration.

## Basic Target Structure

### Minimal Target Example

```typescript
// integration/target-env/my-env/targets/ping/schema.ts

export default TargetSchema.create({
  _id: 'ping',
  name: 'Ping Host',
  description: 'Check if a host is reachable',
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'hostname',
      name: 'Hostname',
      type: 'string',
      required: true,
      default: 'localhost',
    },
  ],
  script: async (ctx, { notify, hostname }) => {
    ctx.sendOutput(`Pinging ${hostname}...`, notify)

    // Your implementation logic here
    // Example: perform a check here and set success accordingly
    const success = true

    if (success) {
      ctx.sendOutput(`${hostname} is reachable`, notify)
    } else {
      ctx.sendOutput(`${hostname} is not reachable`, notify)
    }
  },
})
```

## Target Schema Properties

> **Need detailed parameter types?** See the **[Parameter and Argument Types](parameter-and-argument-types.md)** for complete type reference and examples.

### Required Properties

| Property      | Type                     | Description                                          |
| ------------- | ------------------------ | ---------------------------------------------------- |
| `_id`         | `string`                 | Unique identifier for the target within its environment |
| `name`        | `string`                 | Display name shown in the UI                         |
| `description` | `string`                 | Brief explanation of what the target does            |
| `parameters`  | `TTargetParameterJson[]` | Inputs the effect's author fills in. Use `[]` for none |
| `script`      | `function`               | Async function that executes the target logic        |

### Optional Properties

| Property     | Type                      | Description                                    |
| ------------ | ------------------------- | ---------------------------------------------- |
| `migrations` | `TargetMigrationRegistry` | Registry for converting effects built against an older version of the target |

## The Script Function

The script function is where your target's logic lives. It receives two arguments: the context, and an object holding the argument values named after each parameter's `_id`.

### Context Overview

```typescript
script: async (ctx, { notify, applyTo, hostname }) => {
  // Effect and mission data
  const effectName = ctx.effect.name
  const missionId = ctx.mission._id

  // Who triggered it (null for session-triggered effects)
  const executor = ctx.triggeredBy

  // Send output and manipulate mission state
  ctx.sendOutput('Starting operation...', notify)
  ctx.modifySuccessChance(applyTo, 25) // +25 percentage points
  ctx.blockNodes(applyTo)
}
```

A script returns nothing. To report a result, send output or leave the value in a data store for another target to read — a returned value is discarded.

### Context Properties

| Property           | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `ctx.type`         | Whether the effect is session- or execution-triggered           |
| `ctx.effect`       | The current effect, its trigger, target, and where it lives     |
| `ctx.triggeredBy`  | The member who executed the action, or `null`                   |
| `ctx.session`      | Session name, state, and membership                             |
| `ctx.config`       | Session configuration and this environment's selected config    |
| `ctx.mission`      | The mission in this realm: `forces`, `allNodes`, `allActions`, `resources`, `files` |

### Context Methods

| Category          | Methods                                                                         | Purpose                  |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------ |
| **Output**        | `sendOutput()`                                                                  | Send output to a force or the whole mission |
| **Timing**        | `sleep()`                                                                       | Pause safely inside a session |
| **Data Stores**   | `localStore.use()`, `realmStore.use()`, `globalStore.use()`                     | Cache and share data     |
| **Node Control**  | `blockNodes()`, `unblockNodes()`, `updateNodeBlockStatus()`, `openNode()`, `closeNode()`, `updateNodeOpenState()`, `addNodeAlert()` | Control node states and alerts |
| **Action Tuning** | `modifySuccessChance()`, `modifyProcessTime()`, `modifyResourceCost()`           | Modify action properties |
| **Resources**     | `modifyResourcePool()`                                                          | Adjust force resources   |
| **File Access**   | `grantFileAccess()`, `revokeFileAccess()`, `updateFileAccess()`                  | Manage file permissions  |

Every mission-changing method takes the component to act on as its first argument, and fans out when given a broader one — passing a force affects all of its nodes, passing the mission affects everything.

> **For complete details** on all context properties, methods, and parameters, see the [Context API Reference](../references/context-api.md).

## Working with Parameters

Parameters define what inputs your target accepts. They create the form that appears when someone builds an effect from your target.

### Basic Parameter Structure

```typescript
parameters: [
  {
    _id: 'hostname', // Unique identifier
    name: 'Server Hostname', // Display name in UI
    type: 'string', // Input type
    required: true, // Whether a value is required
    default: 'localhost', // Required whenever `required` is true
    groupingId: 'connection', // Visual grouping
    tooltipDescription: 'Server to connect to', // Help text
  },
  {
    _id: 'priority',
    name: 'Priority Level',
    type: 'dropdown',
    required: true,
    default: 'normal', // The `_id` of one of the options below
    options: [
      { _id: 'low', name: 'Low', value: 'low' },
      { _id: 'normal', name: 'Normal', value: 'normal' },
      { _id: 'high', name: 'High', value: 'high' },
    ],
  },
]
```

Help text belongs in `tooltipDescription`. A `description` property compiles but is never rendered.

### Conditional Parameters

Parameters can be shown or hidden based on other values using `dependencies`:

```typescript
// Authentication Method and API Key Form Grouping
{
  _id: 'authMethod',
  name: 'Authentication Method',
  type: 'dropdown',
  required: true,
  default: 'none',
  options: [
    { _id: 'none', name: 'None', value: 'none' },
    { _id: 'basic', name: 'Basic', value: 'basic' },
    { _id: 'token', name: 'Token', value: 'token' },
  ],
  groupingId: 'authentication',
},
{
  _id: 'apiKey',
  name: 'API Key',
  type: 'string',
  required: true,
  default: '',
  groupingId: 'authentication',
  dependencies: [TargetDependency.EQUALS('authMethod', 'token')],  // Only show if authMethod is 'token'
},

// Priority and Encryption Level Form Grouping
{
  _id: 'priority',
  name: 'Priority Level',
  type: 'dropdown',
  required: true,
  default: 'normal',
  options: [
    { _id: 'low', name: 'Low', value: 'low' },
    { _id: 'normal', name: 'Normal', value: 'normal' },
    { _id: 'high', name: 'High', value: 'high' },
    { _id: 'urgent', name: 'Urgent', value: 'urgent' },
  ],
  groupingId: 'priority',
},
{
  _id: 'encryptionLevel',
  name: 'Encryption Level',
  type: 'dropdown',
  required: true,
  default: 'aes256',
  dependencies: [TargetDependency.EQUALS_SOME('priority', ['high', 'urgent'])],  // Show for high/urgent priority
  options: [
    { _id: 'aes128', name: 'AES-128', value: 'aes128' },
    { _id: 'aes256', name: 'AES-256', value: 'aes256' },
  ],
  groupingId: 'priority',
}
```

A dependency compares against the other parameter's **argument value**, which for a dropdown is the option's `value` rather than its `_id`. Note the asymmetry: a dropdown's `default` names an option's `_id`, while a dependency matches its `value`.

Neither the parameter `_id` a dependency names nor the value it compares against is checked at compile time, so a typo in either produces a parameter that silently never appears. Verify dependencies by exercising the form.

### Accessing Arguments in Scripts

Argument values arrive as the script's second parameter, named after each parameter's `_id`:

```typescript
script: async (ctx, { authMethod, apiKey, priority, encryptionLevel }) => {
  // A parameter with dependencies is undefined when they are unmet
  if (priority === 'high' || priority === 'urgent') {
    console.log(`Encrypting with ${encryptionLevel}`)
  }
}
```

If a parameter `_id` is not a valid identifier, rename it while destructuring:

```typescript
script: async (ctx, { ['api-key']: apiKey, ['auth-method']: authMethod }) => {
  // ...
}
```

Values can also be read by `_id` with `ctx.getArguments('hostname')`, which is useful in a helper that receives the context on its own.

> **For complete details** on all parameter types, dependencies, and examples, see:
>
> - **[Parameter and Argument Types](parameter-and-argument-types.md)** - Complete reference with all types and options
> - **[Target-Effect Conversion Guide](target-effect-conversion.md)** - How parameters become effect arguments and how to read them
> - **[Basic Target Example](../examples/basic-target.md)** - Simple parameter patterns
> - **[Complex Target Example](../examples/complex-target.md)** - Advanced parameter usage

## Working with Data Stores

METIS provides data stores that allow you to cache and share data between target executions within a session. This enables stateful operations, API response caching, and cross-target communication.

A realm is an isolated copy of the launched mission. A multiplayer session runs as one realm; a standalone session gives each participant their own. That distinction is what separates the three stores:

| Store | Scope |
| ----- | ----- |
| `localStore` | one target environment within one realm |
| `realmStore` | every target environment within one realm |
| `globalStore` | every target environment in every realm of the session |

### Local Store

Use the local store for data belonging to this environment within one realm:

```typescript
script: async (ctx, { notify, userId }) => {
  // Cache API responses to avoid repeated calls
  const userCache = ctx.localStore.use<Map<string, any>>('userCache', new Map())

  if (!userCache.value.has(userId)) {
    userCache.value.set(userId, await fetchUserFromAPI(userId))
    ctx.sendOutput('User data cached for future requests', notify)
  } else {
    ctx.sendOutput('Using cached user data', notify)
  }
}
```

### Global Store

Use the global store for data the whole session shares, across every realm:

```typescript
script: async (ctx, { notify, operationStatus }) => {
  const missionState = ctx.globalStore.use('missionState', {
    phase: 'planning',
    operationsComplete: 0,
    startTime: Date.now(),
  })

  // Update shared state
  missionState.value.operationsComplete += 1
  missionState.value.phase = operationStatus

  ctx.sendOutput(`Mission phase: ${missionState.value.phase}`, notify)
  ctx.sendOutput(
    `Operations completed: ${missionState.value.operationsComplete}`,
    notify,
  )
}
```

Because the global store crosses realms, every participant in a standalone session shares it. Use `realmStore` for anything belonging to one participant.

### Common Data Store Patterns

**Request Counter for Rate Limiting:**

```typescript
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

```typescript
script: async (ctx) => {
  // Target A sets up authentication
  const authState = ctx.realmStore.use<{
    token: string | null
    expires: number
  }>('auth', { token: null, expires: 0 })

  if (Date.now() > authState.value.expires) {
    authState.value.token = await getAuthToken()
    authState.value.expires = Date.now() + 3600000 // 1 hour
  }

  // Target B reads the same token from the same realm
}
```

Supply an explicit type argument whenever more than one target reads the value, otherwise the type is inferred from the initial value alone.

> **For comprehensive data store patterns and examples**, see the **[Data Stores Guide](data-stores.md)** which covers caching strategies, performance optimization, and advanced usage patterns.

## External API Integration

> **For comprehensive external API patterns**, see the **[External API Integration Guide](external-api-integration.md)** which covers authentication, error handling, and advanced patterns.

### Using REST APIs

Build a client from the configuration selected for the session:

```typescript
// integration/target-env/my-service/targets/create-user/schema.ts
import { RestApi } from '@metis/api/RestApi'

export default TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Create a new user account',
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      default: 'john_doe',
    },
    {
      _id: 'email',
      name: 'Email',
      type: 'string',
      required: true,
      default: 'john_doe@example.com',
    },
  ],
  script: async (ctx, { notify, username, email }) => {
    if (!ctx.config.targetEnvConfig) {
      throw new Error('No configuration selected for this session.')
    }
    const api = RestApi.fromConfig(ctx.config.targetEnvConfig.data)

    try {
      ctx.sendOutput('Creating user account...', notify)

      const response = await api.post('/users', {
        username,
        email,
        created_at: new Date().toISOString(),
      })

      ctx.sendOutput(`User created with ID: ${response.data.id}`, notify)
    } catch (error: any) {
      ctx.sendOutput(`Failed to create user: ${error.message}`, notify)
      throw error
    }
  },
})
```

A client acquired once in an `environment-setup` hook must be kept in a store rather than a module-level variable, because hooks run once per realm and a shared variable would be overwritten by each of them.

## Migrations

Use a `TargetMigrationRegistry` when a change to your target's parameters would leave existing effects holding arguments in the old shape — renaming a parameter `_id`, changing its type, or removing it.

- **Register migrations** against the target-environment version that introduced the change
- **Use `MigrationToolbox`** for common operations such as renaming a parameter `_id`
- An effect's stored arguments are an array of `{ _id, parameterId, type, value }` entries

> **For complete migration workflows**, see the **[Migrations Guide](migrations.md)** which covers version management, migration scripts, and best practices.

## Examples

For end-to-end patterns (batch processing, file handling, progress, error strategies), see:

- **[Basic Target Example](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target Example](../examples/complex-target.md)** - Advanced patterns and integrations

## Testing Your Targets

### Local Testing Checklist

1. **Discovery** - Verify your target shows up and executes
2. **Validation** - Try various input combinations
3. **Error Handling** - Trigger error conditions intentionally
4. **Performance** - Watch for long-running operations

### Reporting Progress

Send output as work proceeds rather than only at the end, and let a thrown error mark the effect as failed:

```typescript
script: async (ctx, { notify, users }) => {
  for (const user of users) {
    try {
      await MyApi.post(`/users/${user}/verify`)
      ctx.sendOutput(`${user} processed successfully`, notify)
    } catch (error: any) {
      ctx.sendOutput(`Failed to process ${user}: ${error.message}`, notify)
      throw error
    }
  }

  ctx.sendOutput('Batch processing completed', notify)
}
```

## Folder Organization

### Simple Structure

```text
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

```text
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

Discovery walks these folders looking for any `schema.ts`, so nesting is free. Grouping folders do not affect a target's `_id`.

## Performance Considerations

### Async Best Practices

- **Sequential operations** → Use `await`
- **Parallel operations** → Use `Promise.all()`
- **External calls** → Implement timeouts
- **Network failures** → Handle gracefully
- **Delays** → Use `ctx.sleep()`; `setTimeout` is blocked in target-environment code

### Output Management

- **Long operations** → Send incremental output
- **Structured data** → Include key data in output messages
- **Large content** → Avoid massive text blocks at once
- **User feedback** → Include progress indicators when possible

## Troubleshooting

| Issue                                              | Possible Cause                                  | Solution                                                                 |
| -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Target not appearing                               | Wrong filename, or the export is not a `TargetSchema` | Confirm `schema.ts` default-exports `TargetSchema.create(...)`. A target that fails to load is skipped, so it simply will not appear |
| Log says "does not export a valid TargetSchema instance" | The export is not built by the factory     | Use `TargetSchema.create(...)` rather than constructing the class        |
| Every script argument reports "does not exist"     | One entry in `parameters` is malformed          | Look for a missing `default` on a required parameter, or a dropdown `default` that is not one of its option `_id`s |
| A parameter never shows                            | A dependency names a parameter `_id` or compares a value that does not exist | Neither is compile-checked. Confirm the `_id` matches, and that the value matches an option's `value` rather than its `_id` |
| A parameter property seems ignored                 | The property does not exist on that type         | Help text is `tooltipDescription`; a `boolean` has no `required`. Unknown properties compile but are dropped |
| Script not executing                               | Error thrown before the first output             | Check server logs for the thrown error                                   |
| External API calls failing                         | No configuration selected for the session        | Check `ctx.config.targetEnvConfig` and the environment's `configs.json`  |

## Related Documentation

### Essential Guides

- **[Data Stores](data-stores.md)** - Session state management and caching patterns
- **[Parameter and Argument Types](parameter-and-argument-types.md)** - Complete parameter system reference
- **[Creating Target Environments](creating-target-environments.md)** - Environment setup guide
- **[Tips & Conventions](tips-and-conventions.md)** - Best practices and naming conventions

### Examples

- **[Basic Target](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target](../examples/complex-target.md)** - Advanced patterns and integrations

### References

- **[Context API](../references/context-api.md)** - Everything the context exposes
- **[Schema Classes](../references/schemas.md)** - `TargetSchema` and `TargetEnvSchema` properties
- **[REST API Reference](../references/rest-api.md)** - API client configuration
- **[Environment Configuration](../references/environment-configuration.md)** - Configuration file reference
