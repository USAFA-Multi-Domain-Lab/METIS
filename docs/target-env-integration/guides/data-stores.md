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

## Overview

METIS provides two types of stores for target environment scripts:

- **Local Store** - Data specific to a session and target environment
- **Global Store** - Data shared across target environments within the same session

Both stores are automatically managed by METIS and are available through the target script context. Data stored in these stores persists for the duration of the session and is automatically cleaned up when the session ends.

**Key Features:**

- **Session-scoped**: Data persists only for the current session
- **Type-safe**: Full TypeScript support with generic typing
- **Easy to use**: Simple get/set API with default values
- **Automatic cleanup**: Memory is freed when sessions end
- **Isolation**: Local stores prevent data leakage between target environments

## Store Types

### Local Store

The local store is specific to both the session and the target environment. Data stored here is only accessible by scripts running in the same target environment within the same session.

```typescript
// Example: Store force posture for a specific target environment and session
context.localStore.use('forcePosture', {
  readiness: 'high',
  location: 'AO Bravo',
})
```

### Global Store

The global store is specific to the session but shared across all target environments. This allows different target environments to share data within the same session.

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
export default new TargetSchema({
  name: 'Store Example',
  description: 'Demonstrates basic store usage',
  script: async (context) => {
    // Access local store (target environment specific)
    const localStore = context.localStore

    // Access global store (session wide)
    const globalStore = context.globalStore

    // Your script logic here...
  },
  args: [],
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

## Use Cases

### 1. API Response Caching

Cache expensive API calls to avoid repeated requests:

```typescript
script: async (context) => {
  const apiCache = context.localStore.use<Map<string, any>>(
    'apiCache',
    new Map(),
  )

  const cacheKey = `user_${args.userId}`

  if (apiCache.value.has(cacheKey)) {
    // Return cached data
    return apiCache.value.get(cacheKey)
  }

  // Fetch from API
  const userData = await fetchUserData(args.userId)

  // Cache the result
  apiCache.value.set(cacheKey, userData)

  return userData
}
```

### 2. Session State Management

Track session-wide state across multiple target environments:

```typescript
// Target Environment A
script: async (context) => {
  const sessionState = context.globalStore.use('sessionState', {
    authenticated: false,
    currentUser: null,
    startTime: Date.now(),
  })

  // Update session state
  sessionState.value.authenticated = true
  sessionState.value.currentUser = args.username
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

### 3. Configuration Management

Store target-specific configuration that persists across script runs:

```typescript
script: async (context) => {
  const config = context.localStore.use('config', {
    retryAttempts: 3,
    timeout: 5000,
    debugMode: false,
  })

  // Update configuration based on arguments
  if (args.enableDebug) {
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
script: async (context) => {
  const batchState = context.localStore.use('batchProcessing', {
    totalItems: 0,
    processedItems: 0,
    errors: [],
    startTime: null,
  })

  if (args.action === 'start') {
    // Initialize batch processing
    batchState.value.totalItems = args.items.length
    batchState.value.processedItems = 0
    batchState.value.errors = []
    batchState.value.startTime = Date.now()
  } else if (args.action === 'process') {
    // Process single item
    try {
      await processSingleItem(args.item)
      batchState.value.processedItems += 1
    } catch (error) {
      batchState.value.errors.push({
        item: args.item,
        error: error.message,
      })
    }
  } else if (args.action === 'status') {
    // Return current status
    const progress =
      (batchState.value.processedItems / batchState.value.totalItems) * 100
    return {
      progress: `${progress.toFixed(1)}%`,
      errors: batchState.value.errors.length,
      duration: Date.now() - batchState.value.startTime,
    }
  }
}
```

## Best Practices

### Data Structure Design

- **Use meaningful keys**: Choose descriptive names for your store keys
- **Keep data serializable**: Avoid storing functions or complex objects
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

- **Clean up temporary data**: Remove data that's no longer needed
- **Use appropriate store scope**: Local for target-specific data, global for shared data
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
script: async (context) => {
  try {
    const config = context.localStore.use('config', {})

    // Validate stored configuration
    if (!config.value.apiEndpoint) {
      throw new Error('API endpoint not configured')
    }

    // Use configuration...
  } catch (error) {
    context.sendOutput(`Store error: ${error.message}`)
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

script: async (context) => {
  // Type-safe store usage
  const session = context.globalStore.use<UserSession>('userSession', {
    userId: '',
    loginTime: 0,
    permissions: [],
  })

  // TypeScript will enforce the interface
  session.value.userId = args.userId
  session.value.loginTime = Date.now()
}
```

## Examples

### Complete Multi-Step Workflow

Here's a complete example showing how to use stores for a multi-step deployment workflow:

```typescript
// targets/deploy-finish/schema.ts

export default new TargetSchema({ deployment workflow',
  script: async (context) => {
    const deployment = context.globalStore.use('deployment', {
      id: null,
      status: 'idle',
      steps: [],
      startTime: null,
      config: {},
    })

    // Initialize deployment
    deployment.value.id = `deploy_${Date.now()}`
    deployment.value.status = 'preparing'
    deployment.value.startTime = Date.now()
    deployment.value.config = {
      environment: args.environment,
      version: args.version,
      strategy: args.strategy || 'rolling',
    }

    context.sendOutput(`Deployment ${deployment.value.id} initialized`)

    return {
      deploymentId: deployment.value.id,
      status: deployment.value.status,
    }
  },
  args: [
    { _id: 'environment', name: 'Environment', type: 'string' },
    { _id: 'version', name: 'Version', type: 'string' },
    { _id: 'strategy', name: 'Strategy', type: 'string' },
  ],
})
```

```typescript
// targets/deploy-step/schema.ts

export default new TargetSchema({
  name: 'Execute Deployment Step',
  description: 'Executes a single step in the deployment workflow',
  script: async (context) => {
    const deployment = context.globalStore.use('deployment', {})

    if (!deployment.value.id) {
      throw new Error('No active deployment found. Start deployment first.')
    }

    // Add step to history
    const step = {
      name: args.stepName,
      startTime: Date.now(),
      status: 'running',
    }

    deployment.value.steps.push(step)
    deployment.value.status = 'running'

    try {
      // Execute the step
      await executeDeploymentStep(args.stepName, deployment.value.config)

      // Mark step as completed
      step.status = 'completed'
      step.endTime = Date.now()

      context.sendOutput(`Step ${args.stepName} completed successfully`)
    } catch (error) {
      step.status = 'failed'
      step.error = error.message
      step.endTime = Date.now()
      deployment.value.status = 'failed'

      throw error
    }

    return {
      deploymentId: deployment.value.id,
      stepStatus: step.status,
      totalSteps: deployment.value.steps.length,
    }
  },
  args: [{ _id: 'stepName', name: 'Step Name', type: 'string' }],
})
```

```typescript
// targets/deploy-status/schema.ts

export default new TargetSchema({
  name: 'Deployment Status',
  description: 'Gets the current status of the active deployment',
  script: async (context) => {
    const deployment = context.globalStore.use('deployment', {})

    if (!deployment.value.id) {
      return { message: 'No active deployment' }
    }

    const duration = Date.now() - deployment.value.startTime
    const completedSteps = deployment.value.steps.filter(
      (s) => s.status === 'completed',
    ).length
    const failedSteps = deployment.value.steps.filter(
      (s) => s.status === 'failed',
    ).length

    return {
      deploymentId: deployment.value.id,
      status: deployment.value.status,
      duration: `${Math.round(duration / 1000)}s`,
      totalSteps: deployment.value.steps.length,
      completedSteps,
      failedSteps,
      environment: deployment.value.config.environment,
      version: deployment.value.config.version,
    }
  },
  args: [],
})
```

## Related Documentation

- **[Context API Reference](../references/context-api.md)** - Complete context object documentation
- **[Target Schemas](../references/schemas.md)** - Target schema creation and configuration
- **[Creating Target Environments](creating-target-environments.md)** - Step-by-step environment setup
- **[External API Integration](external-api-integration.md)** - Working with external APIs and caching responses
