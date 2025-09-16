# Schema Classes Reference

The schema classes provide the foundation for defining target environments and targets in your METIS plugins. These classes define the properties you need to configure to create functional target environments.

## Table of Contents

- [Overview](#overview)
- [TargetEnvSchema Class](#targetenvschema-class)
- [TargetSchema Class](#targetschema-class)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

METIS provides two primary schema classes for building target environment plugins:

- **`TargetEnvSchema`** - Defines the overall target environment (collection of targets)
- **`TargetSchema`** - Defines individual targets within an environment

These classes provide the structure for your target environment definitions. METIS automatically handles ID assignment based on your file structure during server startup.

## TargetEnvSchema Class

The `TargetEnvSchema` class represents a complete target environment - a collection of related targets that work together as a cohesive system.

### Constructor

```typescript
import TargetEnvSchema from '../../library/target-env-classes'

const targetEnv = new TargetEnvSchema({
  name: 'My Target Environment',
  description: 'A collection of targets for system integration',
  version: '1.0.0',
})

export default targetEnv
```

### Properties You Configure

#### `name` (string, required)

The human-readable name of your target environment. This appears in the METIS interface and should clearly identify the environment's purpose.

```typescript
const targetEnv = new TargetEnvSchema({
  name: 'User Management System',
  // ... other properties
})
```

#### `description` (string, required)

A detailed description explaining what this target environment does and its intended use cases.

```typescript
const targetEnv = new TargetEnvSchema({
  description:
    'Provides targets for managing user accounts, permissions, and authentication in the corporate directory system',
  // ... other properties
})
```

#### `version` (string, required)

The current version of your target environment. Use semantic versioning (e.g., "1.0.0", "2.1.3") to track environment evolution.

```typescript
const targetEnv = new TargetEnvSchema({
  version: '2.1.0',
  // ... other properties
})
```

## TargetSchema Class

The `TargetSchema` class represents an individual target within a target environment - a specific action or capability that can be executed.

### Constructor

```typescript
import TargetSchema from '../../../../library/target-env-classes/targets'

const target = new TargetSchema({
  name: 'Create User',
  description: 'Creates a new user account in the system',
  migrations: new TargetMigrationRegistry(),
  script: async (context, args) => {
    // Target implementation
    await createUser(args.username, args.email)
  },
  args: [
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      description: 'The username for the new account',
    },
    {
      _id: 'email',
      name: 'Email',
      type: 'string',
      required: true,
      description: 'The email address for the new account',
    },
  ],
})

export default target
```

### Properties You Configure

#### `name` (string, required)

The human-readable name of your target. This appears in the METIS interface and should clearly describe what action the target performs.

```typescript
const target = new TargetSchema({
  name: 'Create User Account',
  // ... other properties
})
```

#### `description` (string, required)

A detailed description explaining what this target does, its purpose, and any important usage notes.

```typescript
const target = new TargetSchema({
  description:
    'Creates a new user account in the corporate directory with specified permissions and sends a welcome email',
  // ... other properties
})
```

#### `script` (function, required)

The execution function that performs the target's action. This function receives context and arguments, and returns void.

```typescript
const target = new TargetSchema({
  script: async (context, args) => {
    // Your target logic here
    await performAction(args)
  },
  // ... other properties
})
```

#### `args` (array, required)

An array defining the arguments that users must provide when executing this target. These arguments are used by METIS to automatically generate forms in the user interface, allowing end-users to create effects by filling out the form fields. Each argument specifies its ID, display name, type, requirements, and default values.

```typescript
const target = new TargetSchema({
  args: [
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      default: 'john_doe',
    },
    {
      _id: 'email',
      name: 'Email Address',
      type: 'string',
      required: true,
      default: 'john@example.com',
    },
    {
      _id: 'role',
      name: 'User Role',
      type: 'string',
      required: false,
    },
  ],
  // ... other properties
})
```

#### `migrations` (TargetMigrationRegistry, optional)

Optional migration registry for handling target evolution over time. Allows you to define how to migrate existing effects when your target changes.

```typescript
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'

const migrations = new TargetMigrationRegistry()
// Configure migrations as needed

const target = new TargetSchema({
  name: 'My Target',
  description: 'Example target',
  script: myTargetScript,
  args: [],
  migrations: migrations,
})
```

## Best Practices

### Environment Organization

- Use descriptive names that clearly identify the environment's purpose
- Include version numbers for tracking environment evolution
- Group related targets within the same environment

### Target Definition

- Keep target names concise but descriptive
- Provide detailed descriptions explaining what the target does
- Define clear, well-documented arguments with appropriate types
- Implement the target logic in the script function

### Argument Design

- Use clear, descriptive argument IDs and names
- Set appropriate `required` flags
- Provide `default` values for required arguments

## Examples

### Target Environment File

Each target environment gets its own file with a single default export:

```typescript
// File: integration/target-env/user-management/schema.ts
import TargetEnvSchema from '../../library/target-env-classes'

const userManagementEnv = new TargetEnvSchema({
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
import TargetSchema from '../../../../library/target-env-classes/targets'
import { RestApi } from '../../../../library/api/rest-api'
import { loadConfig } from '../../../../library/config'

const createUserTarget = new TargetSchema({
  name: 'Create User',
  description: 'Creates a new user account with specified permissions',
  script: async (context, args) => {
    const api = RestApi.fromConfig(loadConfig())

    await api.post('/users', {
      username: args.username,
      email: args.email,
      role: args.role || 'user',
    })
  },
  args: [
    {
      _id: 'username',
      name: 'Username',
      type: 'string',
      required: true,
      description: 'Unique username for the account (3-50 characters)',
      default: 'john_doe',
    },
    {
      _id: 'email',
      name: 'Email',
      type: 'string',
      required: true,
      description: 'Email address for account notifications',
      default: 'john_doe@example.com',
    },
    {
      _id: 'role',
      name: 'Role',
      type: 'string',
      required: false,
      description: 'User role: admin, manager, or user',
    },
  ],
})

export default createUserTarget
```

### Another Target File

```typescript
// File: integration/target-env/user-management/targets/delete-user/schema.ts
import TargetSchema from '../../../../library/target-env-classes/targets'
import { RestApi } from '../../../../library/api/rest-api'
import { loadConfig } from '../../../../library/config'

const deleteUserTarget = new TargetSchema({
  name: 'Delete User',
  description: 'Removes a user account from the system',
  script: async (context, args) => {
    const api = RestApi.fromConfig(loadConfig())

    await api.delete(`/users/${args.userId}`)
  },
  args: [
    {
      _id: 'userId',
      name: 'User ID',
      type: 'string',
      required: true,
      description: 'The unique ID of the user to delete',
      default: '12345',
    },
  ],
})

export default deleteUserTarget
```

## Related Documentation

- **[Creating Target Environments](../guides/creating-target-environments.md)** - Step-by-step guide for building environments
- **[Defining Targets](../guides/defining-targets.md)** - Best practices for target definition
- **[Argument Types](../guides/argument-types.md)** - Working with target arguments
- **[REST API](./rest-api.md)** - HTTP client for target implementations
