# Schema Classes Reference

The schema classes provide the foundation for defining target environments and targets in your METIS plugins. These classes define the properties you need to configure to create functional target environments.

## Table of Contents

- [Overview](#overview)
- [TargetEnvSchema Class](#targetenvschema-class)
- [TargetSchema Class](#targetschema-class)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Related Documentation](#related-documentation)

## Overview

METIS provides two primary schema classes for building target environment plugins:

- **`TargetEnvSchema`** - Defines the overall target environment (collection of targets)
- **`TargetSchema`** - Defines individual targets within an environment

Both are made through a static factory — `TargetEnvSchema.create({ ... })` and `TargetSchema.create({ ... })`. Neither constructor is accessible. For a target, the factory is also what lets TypeScript read the target's `parameters` and type the argument values its script receives.

An environment's ID is assigned automatically from the name of the folder that holds its `schema.ts`. A target's ID is **not** — every target declares its own `_id`, which is independent of its folder name.

## TargetEnvSchema Class

The `TargetEnvSchema` class represents a complete target environment: a collection of related targets that work together as a cohesive system.

### Creating an Environment

Environments are created with `TargetEnvSchema.create()`. The constructor is not accessible.

```typescript
const targetEnv = TargetEnvSchema.create({
  name: 'My Target Environment',
  description: 'A collection of targets for system integration',
  version: '1.0.0',
})

export default targetEnv
```

### Environment Properties

| Property | Type | Required | Description |
| -------- | ---- | :------: | ----------- |
| `name` | `string` | ✓ | The human-readable name shown in the METIS interface. Should clearly identify the environment's purpose. |
| `description` | `string` | ✓ | Explains what the environment does and its intended use cases. |
| `version` | `string` | ✓ | The current version. Use semantic versioning, since migrations are keyed to these values. |
| `multiRealmSupport` | `boolean` | | Whether the environment can be used by a session running several realms at once. Absent means `false`. |

A **standalone** session gives every participant their own realm, and runs them in parallel. An environment that has not declared `multiRealmSupport` is **disabled for the whole session** in that mode — its effects do not execute, and the manager cannot switch it back on. Declare it only if the environment can tell concurrent realms apart, for example by keying external state on the realm rather than sharing one connection or one remote record across all of them.

```typescript
const targetEnv = TargetEnvSchema.create({
  name: 'User Management System',
  description:
    'Provides targets for managing user accounts, permissions, and authentication in the corporate directory system',
  version: '2.1.0',
})
```

The environment's `_id` is not configured here. It comes from the folder name, so an environment in `integration/target-env/user-management/` has the ID `user-management`.

Hooks are registered on the environment after it is created, using `.on()`:

```typescript
targetEnv.on('environment-setup', async (context) => {
  // Acquire connections or validate configuration
})

targetEnv.on('environment-teardown', async (context) => {
  // Release whatever setup acquired
})
```

> **See also:** [Environment Hooks Guide](../guides/environment-hooks.md) for what a hook can and cannot do.

## TargetSchema Class

The `TargetSchema` class represents an individual target within an environment: a specific action or capability an effect can invoke.

### Creating a Target

Targets are created with `TargetSchema.create()`. The constructor is not accessible.

```typescript
const target = TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Creates a new user account in the system',
  script: async (context, { username, email }) => {
    await createUser(username, email)
  },
  parameters: [
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      default: 'john_doe',
      tooltipDescription: 'The username for the new account',
    },
    {
      _id: 'email',
      name: 'Email',
      type: 'string',
      required: true,
      default: 'john_doe@example.com',
      tooltipDescription: 'The email address for the new account',
    },
  ],
})

export default target
```

### Target Properties

| Property | Type | Required | Description |
| -------- | ---- | :------: | ----------- |
| `_id` | `string` | ✓ | Unique identifier for the target within its environment. Independent of the folder name. |
| `name` | `string` | ✓ | The human-readable name shown in the METIS interface. Should describe the action the target performs. |
| `description` | `string` | ✓ | Explains what the target does and any important usage notes. |
| `parameters` | `TTargetParameterJson[]` | ✓ | Defines the form an effect's author fills in. Pass an empty array for a target that needs no input. |
| `script` | `function` | ✓ | The function that carries out the target's action. |
| `migrations` | `TargetMigrationRegistry` | — | Handles converting existing effects when the target's parameters change. |

### The Script Function

The script receives two arguments: the context, and an object holding the argument values named after each parameter's `_id`.

```typescript
const target = TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Creates a new user account',
  script: async (context, { notify, username, email }) => {
    // Use data stores for caching or shared state
    const userCache = context.localStore.use('userCache', new Map())

    // Your target logic here
    await performAction({ username, email })

    // Send output to a mission interface
    context.sendOutput('User created successfully', notify)
  },
  parameters: [
    /* ... */
  ],
})
```

A script returns nothing. To report a result, send output or leave the value in a data store for another target to read.

> **See also:** [Context API Reference](context-api.md) for everything the context exposes.

### Parameters

Each parameter specifies its ID, display name, type, and whether a value is required. METIS builds the effect-creation form from this array.

```typescript
parameters: [
  {
    _id: 'username',
    name: 'Username',
    type: 'string',
    required: true,
    default: 'john_doe',
    tooltipDescription: 'Unique username for the account',
  },
  {
    _id: 'role',
    name: 'User Role',
    type: 'string',
    required: false,
  },
]
```

Two details catch people out:

- A `required` `string`, `large-string`, `number`, or `dropdown` **must** declare a `default`. A required dropdown's `default` is the `_id` of one of its options.
- Help text goes in `tooltipDescription`. A `description` property on a parameter is accepted by the compiler but never rendered, so it is silently ignored.

> **See also:** [Parameter and Argument Types](../guides/parameter-and-argument-types.md) for every parameter type and its options.

### Migrations

Supply a `TargetMigrationRegistry` when a change to the target's parameters would leave existing effects with arguments in the old shape.

```typescript
// File: targets/create-user/migrations.ts
import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

const migrations = new TargetMigrationRegistry()

migrations.register('2.0.0', (effect) => {
  MigrationToolbox.updateParameterId(effect, 'user', 'username')
})

export { migrations }
```

```typescript
// File: targets/create-user/schema.ts
import { migrations } from './migrations'

const target = TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Example target',
  script: myTargetScript,
  parameters: [],
  migrations,
})
```

Each migration is registered against the target-environment version that introduced the change.

> **See also:** [Migrations Guide](../guides/migrations.md) for the full migration workflow.

## Best Practices

### Environment Organization

- Use descriptive names that clearly identify the environment's purpose
- Keep the version accurate, since migrations are keyed to it
- Group related targets within the same environment

### Target Definition

- Keep target names concise but descriptive
- Provide detailed descriptions explaining what the target does
- Give every target an `_id` that stays stable, since saved effects reference it
- Implement the target logic in the script function

### Parameter Design

- Use clear, descriptive parameter IDs and names
- Set appropriate `required` flags, and supply a `default` wherever `required` is true
- Put help text in `tooltipDescription`
- Group related parameters with a shared `groupingId`

## Examples

### Target Environment File

Each target environment gets its own file with a single default export:

```typescript
// File: integration/target-env/user-management/schema.ts

const userManagementEnv = TargetEnvSchema.create({
  name: 'User Management System',
  description:
    'Targets for managing user accounts and permissions in the corporate directory',
  version: '2.1.0',
})

export default userManagementEnv
```

### Target File

Each target gets its own file with a single default export:

```typescript
// File: integration/target-env/user-management/targets/create-user/schema.ts
import { RestApi } from '@metis/api/RestApi'

const createUserTarget = TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Creates a new user account with specified permissions',
  script: async (context, { notify, username, email, role }) => {
    // Verify configuration is selected
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected.')
    }

    // Create API client from configuration
    const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

    await api.post('/users', {
      username: username,
      email: email,
      role: role || 'user',
    })

    context.sendOutput(`Created account for ${username}`, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
      tooltipDescription: 'Where to report the result',
    },
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      default: 'john_doe',
      tooltipDescription: 'Unique username for the account (3-50 characters)',
    },
    {
      _id: 'email',
      name: 'Email',
      type: 'string',
      required: true,
      default: 'john_doe@example.com',
      tooltipDescription: 'Email address for account notifications',
    },
    {
      _id: 'role',
      name: 'Role',
      type: 'string',
      required: false,
      tooltipDescription: 'User role: admin, manager, or user',
    },
  ],
})

export default createUserTarget
```

### Another Target File

```typescript
// File: integration/target-env/user-management/targets/delete-user/schema.ts
import { RestApi } from '@metis/api/RestApi'

const deleteUserTarget = TargetSchema.create({
  _id: 'delete-user',
  name: 'Delete User',
  description: 'Removes a user account from the system',
  script: async (context, { notify, userId }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected.')
    }
    const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

    await api.delete(`/users/${userId}`)

    context.sendOutput(`Deleted user ${userId}`, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
      tooltipDescription: 'Where to report the result',
    },
    {
      _id: 'userId',
      name: 'User ID',
      type: 'string',
      required: true,
      default: '12345',
      tooltipDescription: 'The unique ID of the user to delete',
    },
  ],
})

export default deleteUserTarget
```

## Related Documentation

- **[Creating Target Environments](../guides/creating-target-environments.md)** - Step-by-step guide for building environments
- **[Defining Targets](../guides/defining-targets.md)** - Best practices for target definition
- **[Environment Hooks](../guides/environment-hooks.md)** - Setup and teardown for an environment
- **[Data Stores](../guides/data-stores.md)** - Caching and sharing data between script executions
- **[Context API](context-api.md)** - Complete context object reference and data store API
- **[Parameter and Argument Types](../guides/parameter-and-argument-types.md)** - Working with target parameters
- **[Migrations](../guides/migrations.md)** - Converting existing effects when a target changes
- **[REST API](rest-api.md)** - HTTP client for target implementations
