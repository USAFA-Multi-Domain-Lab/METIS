# Environment Hooks

Environment hooks are lifecycle methods that allow your target environment to execute code during session setup and teardown. They're essential for managing resources, establishing connections, and cleaning up when sessions start and end.

## Table of Contents

- [Overview](#overview)
- [Available Hooks](#available-hooks)
- [Basic Usage](#basic-usage)
- [Hook Context](#hook-context)
- [Common Use Cases](#common-use-cases)
- [Execution Order](#execution-order)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Overview

Environment hooks provide a way to run initialization and cleanup code at the environment level, separate from individual target executions. This is useful for:

- **Resource Management** - Open/close database connections, file handles, or network sockets
- **Authentication** - Establish long-lived authentication sessions
- **State Initialization** - Prepare shared state or cache data before targets execute
- **Cleanup** - Release resources and close connections when sessions end

**Key Features:**

- Execute once per session (not per target execution)
- Run before/after mission-level effects
- Access to session context and data stores
- Async support for long-running operations

## Available Hooks

### environment-setup

Executes when a session starts, **before** any `session-setup` mission effects run.

**When to use:**

- Open connections to external systems
- Initialize authentication sessions
- Load configuration or cache data
- Set up shared resources

### environment-teardown

Executes when a session ends, **after** all `session-teardown` mission effects complete.

**When to use:**

- Close database connections
- Clean up temporary files
- Log out of authentication sessions
- Release allocated resources

## Basic Usage

Hooks are registered in your target environment's `schema.ts` file using the `.on()` method:

```typescript
// integration/target-env/my-environment/schema.ts

const environment = new TargetEnvSchema({
  name: 'My Environment',
  description: 'Example environment with hooks',
  version: '1.0.0',
})

// Register setup hook
environment.on('environment-setup', async (context) => {
  context.sendOutput('🔧 Setting up My Environment...')

  // Your setup logic here

  context.sendOutput('✅ My Environment ready')
})

// Register teardown hook
environment.on('environment-teardown', async (context) => {
  context.sendOutput('🧹 Cleaning up My Environment...')

  // Your cleanup logic here

  context.sendOutput('✅ My Environment cleaned up')
})

export default environment
```

## Hook Context

Hooks receive a context object with access to session data and utilities:

### Available Properties

```typescript
context = {
  // Session information
  session: {
    _id: string,
    name: string,
    state: TSessionState,
    config: TSessionConfig,
    // ... other session properties
  },

  // Configuration (if selected for this session)
  config: {
    targetEnvConfig?: {
      _id: string,
      name: string,
      data: object,  // Your configuration data
    }
  },

  // Target environment information
  environment: {
    _id: string,
    name: string,
    version: string,
  },

  // User who created the session
  user: {
    _id: string,
    username: string,
    // ... other user properties
  },

  // Data storage
  localStore: Map<string, any>,
  globalStore: Map<string, any>,

  // Utility functions
  sendOutput: (message: string) => void,
  sleep: (ms: number) => Promise<void>,
}
```

### Key Methods

**sleep(ms)**

- Async delay (use instead of setTimeout)
- Automatically aborts if session resets
- Safe for session lifecycle

## Common Use Cases

### Database Connection Management

```typescript
import { DatabaseClient } from 'some-database-library'

const environment = new TargetEnvSchema({
  name: 'Database Environment',
  version: '1.0.0',
})

let dbConnection: DatabaseClient | null = null

environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No database configuration selected.')
  }

  const { host, port, database, username, password } =
    context.config.targetEnvConfig.data

  context.sendOutput('Connecting to database...')

  dbConnection = new DatabaseClient({
    host,
    port,
    database,
    username,
    password,
  })

  await dbConnection.connect()

  context.sendOutput(`✅ Connected to database: ${database}`)

  // Store connection in globalStore for targets to access
  context.globalStore.set('dbConnection', dbConnection)
})

environment.on('environment-teardown', async (context) => {
  if (dbConnection) {
    context.sendOutput('Closing database connection...')
    await dbConnection.disconnect()
    dbConnection = null
    context.sendOutput('✅ Database connection closed')
  }
})

export default environment
```

### API Authentication Session

```typescript
import { RestApi } from '@metis/api/RestApi'

const environment = new TargetEnvSchema({
  name: 'API Environment',
  version: '1.0.0',
})

environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No API configuration selected.')
  }

  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)
  const { username, password } = context.config.targetEnvConfig.data

  context.sendOutput('Authenticating with API...')

  // Get authentication token
  const response = await api.post('/auth/login', {
    username,
    password,
  })

  const { token, expiresAt } = response.data

  // Store token in globalStore for targets to use
  context.globalStore.set('authToken', token)
  context.globalStore.set('tokenExpiry', expiresAt)

  context.sendOutput('✅ API authentication successful')
})

environment.on('environment-teardown', async (context) => {
  if (!context.config.targetEnvConfig) return

  const token = context.globalStore.get('authToken')
  if (!token) return

  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  context.sendOutput('Logging out of API...')

  try {
    await api.post(
      '/auth/logout',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    context.sendOutput('✅ Logged out successfully')
  } catch (error) {
    context.sendOutput('⚠️ Logout failed (token may have expired)')
  } finally {
    context.globalStore.delete('authToken')
    context.globalStore.delete('tokenExpiry')
  }
})

export default environment
```

### Cache Preloading

```typescript
import { RestApi } from '@metis/api/RestApi'

const environment = new TargetEnvSchema({
  name: 'Cached API',
  version: '1.0.0',
})

environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No configuration selected.')
  }

  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  context.sendOutput('Preloading reference data...')

  // Fetch commonly-used data
  const [users, devices, locations] = await Promise.all([
    api.get('/users'),
    api.get('/devices'),
    api.get('/locations'),
  ])

  // Cache in globalStore
  context.globalStore.set('users', users.data)
  context.globalStore.set('devices', devices.data)
  context.globalStore.set('locations', locations.data)

  context.sendOutput(
    `✅ Cached ${users.data.length} users, ${devices.data.length} devices, ${locations.data.length} locations`,
  )
})

environment.on('environment-teardown', async (context) => {
  // Clear cache
  context.globalStore.delete('users')
  context.globalStore.delete('devices')
  context.globalStore.delete('locations')

  context.sendOutput('✅ Cache cleared')
})

export default environment
```

## Execution Order

Understanding when hooks execute is important for proper resource management:

### Session Start Sequence

1. **Session created** - Session enters "starting" state
2. **Environment setup hooks** - All `environment-setup` hooks execute
3. **Mission setup effects** - All `session-setup` effects execute
4. **Session starts** - Session enters "started" state
5. **Mission start effects** - All `session-start` effects execute

### Session End Sequence

1. **Session ending** - Session enters "ending" state
2. **Mission teardown effects** - All `session-teardown` effects execute
3. **Environment teardown hooks** - All `environment-teardown` hooks execute
4. **Session ended** - Session enters "ended" state, then deleted

**Key Insight:** Environment hooks "sandwich" mission effects:

- Setup hooks run **before** setup effects
- Teardown hooks run **after** teardown effects

This ensures external resources are available when effects need them.

## Best Practices

### Error Handling

Always handle errors gracefully in hooks:

```typescript
environment.on('environment-setup', async (context) => {
  try {
    context.sendOutput('Connecting to service...')
    // ... connection logic
    context.sendOutput('✅ Connected')
  } catch (error) {
    context.sendOutput(`❌ Setup failed: ${error.message}`)
    throw error // Re-throw to prevent session from starting
  }
})
```

### Resource Cleanup

Always clean up resources in teardown, even if setup failed:

```typescript
let connection: Connection | null = null

environment.on('environment-setup', async (context) => {
  connection = await createConnection()
})

environment.on('environment-teardown', async (context) => {
  if (connection) {
    try {
      await connection.close()
    } catch (error) {
      context.sendOutput(`⚠️ Cleanup warning: ${error.message}`)
    } finally {
      connection = null
    }
  }
})
```

### Use globalStore for Shared State

Store resources in `globalStore` so targets can access them:

```typescript
environment.on('environment-setup', async (context) => {
  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  // Store for targets to use
  context.globalStore.set('api', api)
})

// In target scripts:
script: async (context) => {
  const api = context.globalStore.get('api')
  const response = await api.get('/endpoint')
}
```

### Configuration Validation

Validate required configuration early:

```typescript
environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('Configuration required but not selected.')
  }

  const { host, apiKey } = context.config.targetEnvConfig.data

  if (!host || !apiKey) {
    throw new Error('Configuration missing required fields: host, apiKey')
  }

  // Continue with setup...
})
```

### Avoid setTimeout/setInterval

Use `context.sleep()` instead of timers:

```typescript
// ❌ BAD - Will cause issues on session reset
environment.on('environment-setup', async (context) => {
  setTimeout(() => {
    context.sendOutput('Delayed message')
  }, 5000)
})

// ✅ GOOD - Safe and session-aware
environment.on('environment-setup', async (context) => {
  await context.sleep(5000)
  context.sendOutput('Delayed message')
})
```

## Complete Example

### WebSocket Connection Manager

```typescript
import { WebSocketApi } from '@metis/api/WebSocketApi'

const environment = new TargetEnvSchema({
  name: 'WebSocket Environment',
  version: '1.0.0',
})

let wsConnection: WebSocketApi | null = null

environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No WebSocket configuration selected.')
  }

  context.sendOutput('Establishing WebSocket connection...')

  try {
    wsConnection = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

    // Set up event handlers
    wsConnection.on('connect', () => {
      context.sendOutput('✅ WebSocket connected')
    })

    wsConnection.on('disconnect', () => {
      context.sendOutput('⚠️ WebSocket disconnected')
    })

    wsConnection.on('error', (error) => {
      context.sendOutput(`❌ WebSocket error: ${error.message}`)
    })

    // Connect
    await wsConnection.connect()

    // Store for targets to use
    context.globalStore.set('wsConnection', wsConnection)
  } catch (error) {
    context.sendOutput(`❌ WebSocket setup failed: ${error.message}`)
    throw error
  }
})

environment.on('environment-teardown', async (context) => {
  if (wsConnection) {
    context.sendOutput('Closing WebSocket connection...')

    try {
      await wsConnection.disconnect()
      context.sendOutput('✅ WebSocket disconnected')
    } catch (error) {
      context.sendOutput(`⚠️ WebSocket disconnect error: ${error.message}`)
    } finally {
      wsConnection = null
      context.globalStore.delete('wsConnection')
    }
  }
})

export default environment
```

## Troubleshooting

### Hook Not Executing

**Problem:** Hook doesn't seem to run

**Solutions:**

1. Verify hook is registered in `schema.ts` (not in individual targets)
2. Check console and/or server logs for hook execution errors
3. Ensure session actually starts (hooks only run on session lifecycle events)
4. Verify hook method name is correct: `'environment-setup'` or `'environment-teardown'`

### Session Won't Start

**Problem:** Session fails to start after adding setup hook

**Solutions:**

1. Check if setup hook is throwing an error
2. Review server logs for error messages
3. Add try-catch to identify specific failure point
4. Verify configuration is selected if hook requires it

### Resources Not Available in Targets

**Problem:** Targets can't access resources created in setup hook

**Solutions:**

1. Ensure you're storing resources in `context.globalStore`
2. Verify targets are accessing the correct store key
3. Check that setup completed successfully before targets execute

### Cleanup Not Happening

**Problem:** Teardown hook doesn't clean up resources

**Solutions:**

1. Verify session actually ends (not just crashes)
2. Check if teardown hook has errors preventing completion
3. Add defensive checks (null checks) in teardown
4. Use `finally` blocks to ensure cleanup always runs

## Related Documentation

- **[Session Lifecycle & Instance Protection](./session-lifecycle.md)** - Session resets and context validation
- **[Data Stores](./data-stores.md)** - Using localStore and globalStore
- **[Context API](../references/context-api.md)** - Complete context reference
- **[Creating Target Environments](./creating-target-environments.md)** - Basic environment setup
- **[External API Integration](./external-api-integration.md)** - Working with external APIs
- **[configs.json Reference](../references/configs-json.md)** - Configuration management
