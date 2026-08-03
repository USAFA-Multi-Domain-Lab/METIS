# Data Stores Guide

Target environment stores provide a powerful way to cache and share data between script executions within a session. This guide covers how to use local and global stores to manage temporary data in your target environment scripts.

## Table of Contents

- [Overview](#overview)
- [Store Types](#store-types)
- [Basic Usage](#basic-usage)
- [Store Operations](#store-operations)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Related Documentation](#related-documentation)

## Overview

METIS provides three types of stores for target environment scripts:

- **Local Store** - Data specific to one realm and one target environment
- **Realm Store** - Data shared across target environments within one realm
- **Global Store** - Data shared across every realm and target environment in the session

A realm is an isolated copy of the launched mission. A multiplayer session runs as a single realm, so local and realm stores cover the whole session. A standalone session gives each participant their own realm, so those two stores hold data for one participant only, and the global store is the only one that reaches across all of them.

All three stores are automatically managed by METIS and are available through the target script context.

**Key Features:**

- **Instance-scoped**: Data belongs to the current run of the session, and a reset starts from empty
- **Type-safe**: Full TypeScript support with generic typing
- **Easy to use**: A single `use()` method that reads, writes, and initializes
- **Automatic cleanup**: Memory is freed when the session is destroyed
- **Isolation**: Local stores prevent data leakage between target environments and between realms

## Store Types

### Local Store

The local store is specific to both the realm and the target environment. Data stored here is only accessible by scripts running in the same target environment within the same realm.

```typescript
// Example: Store force posture for a specific target environment and realm
context.localStore.use('forcePosture', {
  readiness: 'high',
  location: 'AO Bravo',
})
```

### Realm Store

The realm store is specific to the realm but shared across all target environments. Use it when two environments need to coordinate on behalf of the same participant.

```typescript
// Example: Share the current objective between environments in one realm
context.realmStore.use('currentObjective', {
  name: 'Secure the relay',
  assignedAt: Date.now(),
})
```

### Global Store

The global store spans every realm and target environment in the session. It is the only store that reaches across realms, so use it for anything that belongs to the scenario as a whole rather than to a single participant.

```typescript
// Example: Store overall scenario state for the session
context.globalStore.use('scenarioState', {
  phase: 'execution',
  objectivesMet: 2,
})
```

## Basic Usage

### Accessing Stores

Stores are available through the context object passed to your target scripts:

```typescript
export default TargetSchema.create({
  _id: 'store-example',
  name: 'Store Example',
  description: 'Demonstrates basic store usage',
  script: async (context) => {
    // Access local store (realm and target environment specific)
    const localStore = context.localStore

    // Access realm store (realm wide, all target environments)
    const realmStore = context.realmStore

    // Access global store (session wide, all realms)
    const globalStore = context.globalStore

    // Your script logic here...
  },
  parameters: [],
})
```

### Storing and Retrieving Data

Use the `use()` method to get or set data with a default value:

```typescript
script: async (context) => {
  // Get or initialize a counter
  const counter = context.localStore.use('counter', 0)

  // Read the current value
  console.log(`Current count: ${counter.value}`)

  // Update the value
  counter.value += 1

  // The updated value is automatically stored
  console.log(`New count: ${counter.value}`)
}
```

## Store Operations

### use(key, defaultValue)

The primary method for accessing stored data. If the key doesn't exist, it creates it with the default value.

```typescript
// Initialize with default value if not exists
const posture = context.localStore.use('forcePosture', {
  readiness: 'medium',
  location: 'AO Alpha',
})

// Type-safe access
const apiCache = context.localStore.use<Map<string, any>>('apiCache', new Map())
```

`use()` is the only method a store exposes. It is synchronous, and the holder it returns stays valid for the rest of the session, so a value can be read and written through it repeatedly.

There is no method for removing a key. To discard data, set the value back to an empty or default state, or keep the data inside a collection you can clear yourself.

## Use Cases

### 1. API Response Caching

Cache expensive API calls to avoid repeated requests:

```typescript
script: async (context, { userId, notify }) => {
  const apiCache = context.localStore.use<Map<string, any>>(
    'apiCache',
    new Map(),
  )

  const cacheKey = `user_${userId}`

  if (!apiCache.value.has(cacheKey)) {
    // Fetch from API and cache the result
    apiCache.value.set(cacheKey, await fetchUserData(userId))
  }

  const userData = apiCache.value.get(cacheKey)
  context.sendOutput(`Loaded profile for ${userData.name}`, notify)
}
```

### 2. Session State Management

Track session-wide state across multiple target environments:

```typescript
// Target Environment A
script: async (context, { username }) => {
  const sessionState = context.globalStore.use('sessionState', {
    authenticated: false,
    currentUser: null,
    startTime: Date.now(),
  })

  // Update session state
  sessionState.value.authenticated = true
  sessionState.value.currentUser = username
}

// Target Environment B (different target, same session)
script: async (context) => {
  const sessionState = context.globalStore.use('sessionState', {})

  if (!sessionState.value.authenticated) {
    throw new Error('User must be authenticated')
  }

  // Use authenticated user data
  console.log(`Working as user: ${sessionState.value.currentUser}`)
}
```

> **Note:** Because the global store crosses realms, a standalone session shares this state between every participant. Use `realmStore` instead for anything that belongs to one participant.

### 3. Configuration Management

Store target-specific configuration that persists across script runs:

```typescript
script: async (context, { enableDebug }) => {
  const config = context.localStore.use('config', {
    retryAttempts: 3,
    timeout: 5000,
    debugMode: false,
  })

  // Update configuration based on arguments
  if (enableDebug) {
    config.value.debugMode = true
    config.value.timeout = 30000 // Longer timeout for debugging
  }

  // Use configuration in API calls
  await makeApiCall({
    timeout: config.value.timeout,
    retries: config.value.retryAttempts,
  })
}
```

### 4. Batch Processing State

Track progress in multi-step operations:

```typescript
script: async (context, { action, item, items, notify }) => {
  const batchState = context.localStore.use('batchProcessing', {
    totalItems: 0,
    processedItems: 0,
    errors: [],
    startTime: null,
  })

  if (action === 'start') {
    // Initialize batch processing
    batchState.value.totalItems = items.length
    batchState.value.processedItems = 0
    batchState.value.errors = []
    batchState.value.startTime = Date.now()
  } else if (action === 'process') {
    // Process single item
    try {
      await processSingleItem(item)
      batchState.value.processedItems += 1
    } catch (error) {
      batchState.value.errors.push({
        item: item,
        error: error.message,
      })
    }
  } else if (action === 'status') {
    // Report current status
    const progress =
      (batchState.value.processedItems / batchState.value.totalItems) * 100
    const duration = Date.now() - batchState.value.startTime
    context.sendOutput(
      `Progress: ${progress.toFixed(1)}% — ` +
        `${batchState.value.errors.length} error(s) in ${Math.round(duration / 1000)}s`,
      notify,
    )
  }
}
```

> **Note:** A target script returns nothing. Report progress with `context.sendOutput()` or leave it in a store for another target to read — a returned value goes nowhere.

## Best Practices

### Data Structure Design

- **Use meaningful keys**: Choose descriptive names for your store keys
- **Store whatever suits the job**: Values are held in memory and never serialized, so `Map`s, class instances, and API clients are all fine
- **Use appropriate defaults**: Provide sensible default values for initialization

```typescript
// Good: Clear, descriptive keys with appropriate defaults
const userPrefs = context.localStore.use('userPreferences', {
  theme: 'system',
  language: 'en-US',
  timezone: 'UTC',
})

// Good: Type-safe with proper defaults
const apiCache = context.localStore.use<Map<string, CacheEntry>>(
  'apiResponseCache',
  new Map<string, CacheEntry>(),
)
```

### Memory Management

- **Clean up temporary data**: Keys cannot be removed, so clear the contents of what you store when it is no longer needed
- **Use the narrowest store that works**: Local for one environment in one realm, realm for one participant across environments, global only for data the whole session shares
- **Avoid storing large objects**: Consider external storage for large datasets

```typescript
script: async (context) => {
  // Clean up old cache entries
  const cache = context.localStore.use<Map<string, any>>('cache', new Map())

  // Remove entries older than 1 hour
  for (const [key, entry] of cache.value.entries()) {
    if (Date.now() - entry.timestamp > 3600000) {
      cache.value.delete(key)
    }
  }
}
```

### Error Handling

- **Handle missing data gracefully**: Always provide defaults
- **Validate stored data**: Check data integrity before use
- **Log store operations**: Help with debugging and monitoring

```typescript
script: async (context, { notify }) => {
  try {
    const config = context.localStore.use('config', {})

    // Validate stored configuration
    if (!config.value.apiEndpoint) {
      throw new Error('API endpoint not configured')
    }

    // Use configuration...
  } catch (error) {
    context.sendOutput(`Store error: ${error.message}`, notify)
    throw error
  }
}
```

### Type Safety

Use TypeScript generics for type-safe store operations:

```typescript
interface UserSession {
  userId: string
  loginTime: number
  permissions: string[]
}

script: async (context, { userId }) => {
  // Type-safe store usage
  const session = context.globalStore.use<UserSession>('userSession', {
    userId: '',
    loginTime: 0,
    permissions: [],
  })

  // TypeScript will enforce the interface
  session.value.userId = userId
  session.value.loginTime = Date.now()
}
```

## Examples

### Complete Multi-Step Workflow

Here's a complete example showing how to use stores for a multi-step deployment workflow.

Several targets read and write the same stored value, so the shape and the key live in one module that each of them imports. Passing that type to `use()` is what makes the stored value typed at every call site:

```typescript
// deployment.ts

/**
 * The key under which the deployment state is stored.
 */
export const DEPLOYMENT_KEY = 'deployment'

/**
 * A single step within a deployment.
 */
export interface DeploymentStep {
  name: string
  startTime: number
  endTime?: number
  status: 'running' | 'completed' | 'failed'
  error?: string
}

/**
 * The state shared by every deployment target.
 */
export interface DeploymentState {
  id: string | null
  status: 'idle' | 'preparing' | 'running' | 'failed'
  steps: DeploymentStep[]
  startTime: number | null
  config: {
    environment?: string
    version?: string
    strategy?: string
  }
}

/**
 * The value a deployment starts from before anything has run.
 */
export const INITIAL_DEPLOYMENT: DeploymentState = {
  id: null,
  status: 'idle',
  steps: [],
  startTime: null,
  config: {},
}
```

```typescript
// targets/deploy-start/schema.ts

import {
  DEPLOYMENT_KEY,
  INITIAL_DEPLOYMENT,
  type DeploymentState,
} from '../../deployment'

export default TargetSchema.create({
  _id: 'deploy-start',
  name: 'Start Deployment',
  description: 'Initializes the deployment workflow',
  script: async (context, { notify, environment, version, strategy }) => {
    const deployment = context.realmStore.use<DeploymentState>(
      DEPLOYMENT_KEY,
      INITIAL_DEPLOYMENT,
    )

    // Initialize deployment
    deployment.value.id = `deploy_${Date.now()}`
    deployment.value.status = 'preparing'
    deployment.value.startTime = Date.now()
    deployment.value.config = {
      environment: environment,
      version: version,
      strategy: strategy,
    }

    context.sendOutput(`Deployment ${deployment.value.id} initialized`, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'environment',
      name: 'Environment',
      type: 'string',
      required: true,
      default: 'staging',
    },
    {
      _id: 'version',
      name: 'Version',
      type: 'string',
      required: true,
      default: '1.0.0',
    },
    {
      _id: 'strategy',
      name: 'Strategy',
      type: 'string',
      required: true,
      default: 'rolling',
    },
  ],
})
```

```typescript
// targets/deploy-step/schema.ts

import {
  DEPLOYMENT_KEY,
  INITIAL_DEPLOYMENT,
  type DeploymentState,
  type DeploymentStep,
} from '../../deployment'

export default TargetSchema.create({
  _id: 'deploy-step',
  name: 'Execute Deployment Step',
  description: 'Executes a single step in the deployment workflow',
  script: async (context, { notify, stepName }) => {
    const deployment = context.realmStore.use<DeploymentState>(
      DEPLOYMENT_KEY,
      INITIAL_DEPLOYMENT,
    )

    if (!deployment.value.id) {
      throw new Error('No active deployment found. Start deployment first.')
    }

    // Add step to history
    const step: DeploymentStep = {
      name: stepName,
      startTime: Date.now(),
      status: 'running',
    }

    deployment.value.steps.push(step)
    deployment.value.status = 'running'

    try {
      // Execute the step
      await executeDeploymentStep(stepName, deployment.value.config)

      // Mark step as completed
      step.status = 'completed'
      step.endTime = Date.now()

      context.sendOutput(`Step ${stepName} completed successfully`, notify)
    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      step.endTime = Date.now()
      deployment.value.status = 'failed'

      throw error
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'stepName',
      name: 'Step Name',
      type: 'string',
      required: true,
      default: 'build',
    },
  ],
})
```

```typescript
// targets/deploy-status/schema.ts

import {
  DEPLOYMENT_KEY,
  INITIAL_DEPLOYMENT,
  type DeploymentState,
} from '../../deployment'

export default TargetSchema.create({
  _id: 'deploy-status',
  name: 'Deployment Status',
  description: 'Gets the current status of the active deployment',
  script: async (context, { notify }) => {
    const deployment = context.realmStore.use<DeploymentState>(
      DEPLOYMENT_KEY,
      INITIAL_DEPLOYMENT,
    )

    if (!deployment.value.id || deployment.value.startTime === null) {
      context.sendOutput('No active deployment', notify)
      return
    }

    const duration = Date.now() - deployment.value.startTime
    const completedSteps = deployment.value.steps.filter(
      (step) => step.status === 'completed',
    ).length
    const failedSteps = deployment.value.steps.filter(
      (step) => step.status === 'failed',
    ).length

    context.sendOutput(
      `Deployment ${deployment.value.id} (${deployment.value.status})\n` +
        `Environment: ${deployment.value.config.environment} ` +
        `v${deployment.value.config.version}\n` +
        `Steps: ${completedSteps} completed, ${failedSteps} failed, ` +
        `${deployment.value.steps.length} total\n` +
        `Duration: ${Math.round(duration / 1000)}s`,
      notify,
    )
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
  ],
})
```

These three targets share state through `realmStore`, so each participant in a standalone session runs their own deployment. Switching them to `globalStore` would make every participant share one.

## Related Documentation

- **[Context API Reference](../references/context-api.md)** - Complete context object documentation
- **[Target Schemas](../references/schemas.md)** - Target schema creation and configuration
- **[Creating Target Environments](creating-target-environments.md)** - Step-by-step environment setup
- **[External API Integration](external-api-integration.md)** - Working with external APIs and caching responses
