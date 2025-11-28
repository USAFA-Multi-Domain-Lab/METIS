# Session Lifecycle & Instance Protection

Understanding session lifecycle and instance protection is critical for writing robust target environment code. METIS automatically protects against stale callbacks and ensures your code doesn't execute against outdated session state.

## Table of Contents

- [Overview](#overview)
- [Session Instance ID System](#session-instance-id-system)
- [Session States](#session-states)
- [Context Validation](#context-validation)
- [OutdatedContextError](#outdatedcontexterror)
- [Safe Asynchronous Operations](#safe-asynchronous-operations)
- [Data Store Lifecycle](#data-store-lifecycle)
- [Best Practices](#best-practices)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Overview

Sessions in METIS have a lifecycle with multiple states and can be reset without being destroyed. The **session instance ID system** protects your target environment code from executing against outdated session state after a reset.

**Key concepts:**

- **Session ID** - Permanent identifier for a session (remains constant)
- **Instance ID** - Changes each time a session resets (uniquely identifies session lifecycle)
- **Context validation** - Automatic checks that prevent stale code execution
- **OutdatedContextError** - Exception thrown when code tries to access outdated context

**Why this matters:**

```ts
// ❌ Without protection, this could fail:
script: async (context) => {
  await context.sleep(30000) // 30 seconds

  // What if session reset during sleep?
  // Without protection, this would execute against NEW session state
  context.sendOutput('This is dangerous!')
}

// ✅ With protection, METIS automatically prevents this:
script: async (context) => {
  await context.sleep(30000) // 30 seconds

  // If session reset, this throws OutdatedContextError
  // Preventing execution against wrong session instance
  context.sendOutput('This is safe!')
}
```

## Session Instance ID System

### What is an Instance ID?

Every session has two identifiers:

1. **Session ID** (`session._id`)

   - Permanent identifier
   - Never changes during session lifetime
   - Used for database records and client connections

2. **Instance ID** (`session.instanceId`)
   - Temporary identifier
   - Changes on every session reset
   - Used for context validation and data store isolation

### When Instance ID Changes

The instance ID is regenerated in two scenarios:

**1. Session Creation**

```ts
// New session created
const session = new SessionServer(_id, name, owner, config, mission)
// Instance ID: "abc123def456" (random)
```

**2. Session Reset**

```ts
// Session reset triggered
await session.reset()
// Instance ID: "xyz789ghi012" (NEW random ID)
// Session ID: (unchanged)
```

**Session reset occurs when:**

- User clicks "Reset Session" in UI
- Manager triggers reset via API
- Mission configuration requires reset

### Instance ID Lifecycle Diagram

```
Session Created
    ↓
[Session ID: session-001]
[Instance ID: abc123]
    ↓
Session Starts
    ↓
Effects Execute (using Instance ID: abc123)
    ↓
Session Reset Triggered
    ↓
Teardown (Instance ID: abc123)
    ├─ Abort running effects
    ├─ Clean up sleep calls
    ├─ Execute teardown effects
    └─ Run environment-teardown hooks
    ↓
[Instance ID: xyz789]  ← NEW INSTANCE ID
    ↓
Setup (Instance ID: xyz789)
    ├─ Recreate mission from JSON
    ├─ Execute setup effects
    └─ Run environment-setup hooks
    ↓
Session Continues (with NEW instance)
```

### Accessing Instance Information

```ts
script: async (context) => {
  // Session ID (permanent)
  const sessionId = context.session._id
  context.sendOutput(`Session ID: ${sessionId}`)

  // Instance ID (not directly exposed, but used internally)
  // You cannot access instance ID directly from context
  // METIS handles validation automatically
}
```

**Important:** The instance ID is used internally by METIS for validation. You don't need to (and cannot) access it directly in your target scripts.

## Session States

Sessions transition through multiple states:

### State Lifecycle

```
unstarted → starting → started → resetting → started
                ↓                      ↓
              ending → ended      ending → ended
```

### State Definitions

| State       | Description                         | Context Valid? |
| ----------- | ----------------------------------- | -------------- |
| `unstarted` | Session created but not started     | ❌ No          |
| `starting`  | Session initialization in progress  | ⚠️ Limited     |
| `started`   | Session active, effects can execute | ✅ Yes         |
| `resetting` | Session reset in progress           | ❌ No          |
| `ending`    | Session teardown in progress        | ⚠️ Limited     |
| `ended`     | Session completed                   | ❌ No          |

### Context Operations by State

```ts
// Context methods check both state AND instance ID
script: async (context) => {
  // This works in "started" state
  context.sendOutput('Hello!')

  // If session resets during this sleep...
  await context.sleep(30000)

  // This throws OutdatedContextError after reset
  // - State changed: started → resetting → started
  // - Instance ID changed: abc123 → xyz789
  context.sendOutput('This will error!')
}
```

## Context Validation

METIS automatically validates context before executing any operation that could affect session state.

### Validation Checks

Every context method performs two checks:

**1. Instance ID Match**

```ts
if (context._instanceId !== session.instanceId) {
  throw new OutdatedContextError(
    'Context instance ID does not match current session instance ID',
  )
}
```

**2. Session State Check**

```ts
if (['unstarted', 'ended'].includes(session.state)) {
  throw new OutdatedContextError('Session is not in "started" state')
}
```

### Protected Operations

All context methods are automatically protected:

```ts
// All of these check context validity before execution:
context.sendOutput('message')
context.blockNode()
context.modifySuccessChance(25)
context.modifyResourcePool(50)
context.grantFileAccess(fileId, forceKey)
await context.sleep(5000)

// Data stores also validate:
const counter = context.localStore.use('count', 0)
counter.value++ // Protected access
```

### Unprotected Operations

Pure JavaScript operations are NOT protected:

```ts
script: async (context) => {
  let localVariable = 0

  await context.sleep(30000)

  // ❌ This executes even after reset (no protection)
  localVariable++
  console.log(localVariable)

  // ✅ This is protected (throws OutdatedContextError)
  context.sendOutput(localVariable.toString())
}
```

## OutdatedContextError

### Error Description

`OutdatedContextError` is thrown when code attempts to execute context operations after the session has reset or ended.

**Error structure:**

```ts
class OutdatedContextError extends Error {
  name: 'OutdatedContextError'
  message: string
}
```

### Error Messages

**Instance ID Mismatch:**

```
Cannot perform target-environment callback operation.
TargetEnvContext instance ID "abc123" does not match
current session instance ID "xyz789". This is likely
due to delayed asynchronous code execution from the
previous session instance.
```

**Invalid Session State:**

```
Cannot perform target-environment callback operation.
TargetEnvContext session "session-001" is not in
"started" state (current state: "ended"). This is
likely due to delayed asynchronous code execution
from the previous session instance.
```

### Handling OutdatedContextError

**METIS handles these errors automatically** - you typically don't need to catch them:

```ts
// ❌ Don't do this (unnecessary)
script: async (context) => {
  try {
    await context.sleep(30000)
    context.sendOutput('After sleep')
  } catch (error) {
    if (error.name === 'OutdatedContextError') {
      // METIS already handles this gracefully
      // No need to catch manually
    }
  }
}

// ✅ Let METIS handle it (recommended)
script: async (context) => {
  await context.sleep(30000)
  context.sendOutput('After sleep') // Automatically protected
}
```

### When to Catch OutdatedContextError

Only catch if you need **custom cleanup logic**:

```ts
script: async (context) => {
  const externalConnection = await establishConnection()

  try {
    // Long-running operation
    for (let i = 0; i < 100; i++) {
      await context.sleep(1000)
      context.sendOutput(`Progress: ${i}%`)
    }
  } catch (error) {
    if (error.name === 'OutdatedContextError') {
      // Clean up external resources before letting error propagate
      await externalConnection.close()
      context.sendOutput('Session reset - cleaned up connection')
    }
    throw error // Re-throw for METIS to handle
  } finally {
    await externalConnection.close()
  }
}
```

### Logging

Outdated context errors are automatically logged:

```ts
// Logged by METIS target environment logger
targetEnvLogger.warn(
  'Cannot perform target-environment callback operation. ' +
    'TargetEnvContext instance ID "abc123" does not match ' +
    'current session instance ID "xyz789".',
)
```

Check logs at `/server/logs/` for debugging.

## Safe Asynchronous Operations

### The Challenge

Asynchronous code can execute after session state changes:

```ts
// ⚠️ Problem scenario
script: async (context) => {
  // Session instance: abc123, state: started

  setTimeout(() => {
    // Session may have reset by now!
    // Instance: xyz789, state: started (NEW instance)
    context.sendOutput('Danger!') // Would fail without protection
  }, 30000)
}
```

### The Solution: context.sleep()

Always use `context.sleep()` instead of `setTimeout()`:

```ts
// ✅ Safe with context.sleep()
script: async (context) => {
  await context.sleep(30000)

  // Protected: If session reset, OutdatedContextError thrown
  context.sendOutput('Safe!') // Won't execute if session reset
}
```

**Why `context.sleep()` is safe:**

1. Automatically aborts if session resets
2. Validates context before resuming
3. Integrated with session lifecycle
4. Cleans up on teardown

### setTimeout is Disabled

METIS blocks `setTimeout` and `setInterval` in target scripts:

```ts
// ❌ This throws an error
setTimeout(() => {
  context.sendOutput('This will error')
}, 5000)

// ❌ This also throws an error
setInterval(() => {
  context.sendOutput('This will error')
}, 1000)

// ✅ Use context.sleep() instead
const delay = async (ms: number) => {
  await context.sleep(ms)
}

await delay(5000)
context.sendOutput('Safe alternative')
```

### Safe Polling Pattern

```ts
script: async (context) => {
  const pollInterval = 2000 // 2 seconds
  const maxPolls = 30 // 60 seconds total

  for (let i = 0; i < maxPolls; i++) {
    // Check condition
    const status = await checkExternalStatus()

    if (status === 'complete') {
      context.sendOutput('✅ Operation complete')
      break
    }

    context.sendOutput(`Polling... attempt ${i + 1}/${maxPolls}`)

    // Safe sleep - aborts if session resets
    await context.sleep(pollInterval)

    // This line only executes if session still valid
    // Otherwise OutdatedContextError thrown above
  }
}
```

### Safe Event Listeners with Environment Hooks

Use environment hooks for persistent operations:

```ts
import { WebSocketApi } from '@metis/api/WebSocketApi'

let wsConnection: WebSocketApi | null = null

// Set up during environment setup
environment.on('environment-setup', async (context) => {
  wsConnection = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  // Event listener is tied to session instance
  wsConnection.addEventListener('message', (event) => {
    // ✅ Safe: context is from setup, automatically invalidated on reset
    context.sendOutput(`Message: ${event.data}`)
  })

  await wsConnection.connect()
})

// Clean up during teardown
environment.on('environment-teardown', async (context) => {
  if (wsConnection) {
    wsConnection.disconnect()
    wsConnection = null
  }
})
```

## Data Store Lifecycle

### Store Isolation by Instance

Data stores are scoped to session instance:

```ts
script: async (context) => {
  // Accessing store for current instance (abc123)
  const counter = context.localStore.use('count', 0)
  counter.value++ // count = 1

  context.sendOutput(`Count: ${counter.value}`)
}

// After session reset...
// New instance ID: xyz789
// Previous store data is inaccessible

script: async (context) => {
  // This is a NEW store (instance xyz789)
  const counter = context.localStore.use('count', 0)
  // count = 0 (starts fresh)

  context.sendOutput(`Count: ${counter.value}`) // Outputs: 0
}
```

### Store Key Format

Stores use instance-aware keys internally:

```ts
// Local store key format:
;`${sessionId}::${instanceId}::${environmentId}`// Global store key format:
`${sessionId}::${instanceId}`

// Example keys:
// Local:  "session-001::abc123::metis"
// Global: "session-001::abc123"

// After reset (new instance):
// Local:  "session-001::xyz789::metis"  ← Different key
// Global: "session-001::xyz789"         ← Different key
```

### Store Cleanup

Stores are automatically cleaned up on session reset:

```ts
// Before reset
const data = context.localStore.use('cache', { items: [] })
data.value.items.push('item1')
// Store key: session-001::abc123::metis

// Session resets...
// - Teardown runs
// - New instance ID generated
// - Old store becomes inaccessible
// - New store created with same logical key

// After reset
const data = context.localStore.use('cache', { items: [] })
// Store key: session-001::xyz789::metis
// data.value.items = [] (fresh default value)
```

### Persistent Data Across Resets

If you need data to survive resets, use external storage:

```ts
// ❌ Does NOT persist across resets
const config = context.localStore.use('config', { setting: 'value' })

// ✅ Persists across resets (external database)
import { RestApi } from '@metis/api/RestApi'

const api = RestApi.fromConfig(context.config.targetEnvConfig.data)
const config = await api.get('/config')
```

## Best Practices

### DO: Use context.sleep()

```ts
✅ await context.sleep(5000)
❌ setTimeout(() => {...}, 5000)
❌ await new Promise(resolve => setTimeout(resolve, 5000))
```

### DO: Let METIS Handle Errors

```ts
// ✅ Automatic protection
script: async (context) => {
  await longRunningOperation()
  context.sendOutput('Done') // Protected automatically
}

// ❌ Unnecessary error handling
script: async (context) => {
  try {
    await longRunningOperation()
    context.sendOutput('Done')
  } catch (error) {
    if (error.name === 'OutdatedContextError') {
      // METIS already handles this
    }
  }
}
```

### DO: Use Environment Hooks for Persistent Connections

```ts
// ✅ Connection lifecycle matches session instance
environment.on('environment-setup', async (context) => {
  connection = await createConnection()
})

environment.on('environment-teardown', async (context) => {
  await connection.close()
})

// ❌ Connection in target script (no lifecycle management)
script: async (context) => {
  const connection = await createConnection()
  // What happens on reset? Connection stays open!
}
```

### DO: Design for Idempotency

```ts
// ✅ Idempotent setup (can run multiple times safely)
environment.on('environment-setup', async (context) => {
  if (connection && connection.isConnected) {
    await connection.close()
  }
  connection = await createConnection()
})

// ❌ Not idempotent (fails if called twice)
environment.on('environment-setup', async (context) => {
  connection = await createConnection() // What if already exists?
})
```

### DON'T: Store Instance-Specific Data in Module Scope

```ts
// ❌ Module-scope variable survives resets
let messageCount = 0

script: async (context) => {
  messageCount++ // Wrong instance's count!
  context.sendOutput(`Messages: ${messageCount}`)
}

// ✅ Use data stores (automatically scoped to instance)
script: async (context) => {
  const counter = context.localStore.use('messageCount', 0)
  counter.value++
  context.sendOutput(`Messages: ${counter.value}`)
}
```

### DON'T: Assume State Persistence

```ts
// ❌ Assumes session won't reset during operation
script: async (context) => {
  const initialState = captureState()

  await context.sleep(30000) // Session might reset here

  // initialState may be from OLD instance!
  const changes = compareState(initialState, currentState)
}

// ✅ Re-validate state after async operations
script: async (context) => {
  const initialState = captureState()

  await context.sleep(30000)

  // Re-capture state (guaranteed to be from CURRENT instance)
  const currentState = captureState()
  const changes = compareState(initialState, currentState)
}
```

### DON'T: Use External Timers

```ts
// ❌ External timer not protected
import { setTimeout } from 'timers/promises'

script: async (context) => {
  await setTimeout(5000)
  context.sendOutput('Done') // May execute on wrong instance
}

// ✅ Use context.sleep()
script: async (context) => {
  await context.sleep(5000)
  context.sendOutput('Done') // Protected automatically
}
```

## Common Scenarios

### Scenario 1: Long-Running Data Collection

**Problem:** Collecting data over 60 seconds, session resets at 30 seconds.

```ts
script: async (context) => {
  const results = []

  for (let i = 0; i < 60; i++) {
    // Collect data
    const sample = await collectSample()
    results.push(sample)

    context.sendOutput(`Sample ${i + 1}/60: ${sample}`)

    // If session resets during this sleep, operation aborts
    await context.sleep(1000)
  }

  // This only executes if session never reset
  context.sendOutput(`Final results: ${results.length} samples`)
}
```

**What happens on reset:**

1. User triggers reset at iteration 30
2. Teardown runs, cleaning up any pending sleep calls
3. Next `context.sleep()` throws `OutdatedContextError`
4. Script execution stops gracefully
5. No corrupt data sent to new session instance

### Scenario 2: Persistent WebSocket Connection

**Problem:** WebSocket connection should survive individual effect executions but reset with session.

```ts
let wsConnection: WebSocketApi | null = null

// Connection lifecycle matches session instance
environment.on('environment-setup', async (context) => {
  // Context is from NEW instance after reset
  wsConnection = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  wsConnection.addEventListener('message', (event) => {
    // ✅ This context is from setup, validated automatically
    context.sendOutput(`WebSocket: ${event.data}`)
  })

  await wsConnection.connect()
})

environment.on('environment-teardown', async (context) => {
  // Runs before instance ID changes
  if (wsConnection) {
    wsConnection.disconnect()
    wsConnection = null
  }
})

// Individual effects just use the connection
targets.operations.use(
  new TargetSchema({
    _id: 'send-message',
    name: 'Send Message',
    script: async (context) => {
      if (!wsConnection?.isConnected) {
        throw new Error('WebSocket not connected')
      }

      await wsConnection.sendMessage({
        type: 'command',
        payload: context.effect.args,
      })
    },
  }),
)
```

**What happens on reset:**

1. `environment-teardown` runs (old instance: abc123)
2. WebSocket disconnected
3. Instance ID changes (abc123 → xyz789)
4. `environment-setup` runs (new instance: xyz789)
5. New WebSocket connection established
6. Event listener uses NEW context (instance xyz789)

### Scenario 3: API Rate Limiting with Delays

**Problem:** Need to respect API rate limits with delays between requests.

```ts
script: async (context) => {
  const { endpoints } = context.effect.args
  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  const rateLimitDelay = 1000 // 1 second between requests

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i]

    try {
      const response = await api.get(endpoint)
      context.sendOutput(`✅ ${endpoint}: ${response.status}`)
    } catch (error) {
      context.sendOutput(`❌ ${endpoint}: ${error.message}`)
    }

    // Respect rate limit (safely aborts if session resets)
    if (i < endpoints.length - 1) {
      await context.sleep(rateLimitDelay)
    }
  }

  context.sendOutput('All endpoints checked')
}
```

**What happens on reset during execution:**

1. Reset triggered during `context.sleep()`
2. Sleep aborts immediately
3. Next line throws `OutdatedContextError`
4. Remaining endpoints not checked (correct behavior)
5. New session instance starts fresh

### Scenario 4: Database Connection Pool

**Problem:** Share connection pool across effects, clean up on reset.

```ts
import { createPool, type Pool } from 'generic-db-library'

let connectionPool: Pool | null = null

environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No database configuration selected.')
  }

  const dbConfig = context.config.targetEnvConfig.data

  // Create connection pool
  connectionPool = await createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    maxConnections: 10,
  })

  context.sendOutput('✅ Database pool initialized')
})

environment.on('environment-teardown', async (context) => {
  if (connectionPool) {
    // Close all connections before instance changes
    await connectionPool.close()
    connectionPool = null
    context.sendOutput('✅ Database pool closed')
  }
})

// Effects use the shared pool
targets.operations.use(
  new TargetSchema({
    _id: 'database-query',
    name: 'Execute Database Query',
    args: [
      {
        _id: 'query',
        name: 'SQL Query',
        type: 'text',
        required: true,
      },
    ],
    script: async (context) => {
      if (!connectionPool) {
        throw new Error('Database pool not initialized')
      }

      const { query } = context.effect.args
      const result = await connectionPool.query(query)

      context.sendOutput(`Query returned ${result.rows.length} rows`)
    },
  }),
)
```

**Benefits:**

- Pool created once per session instance
- Shared across all effects efficiently
- Automatically cleaned up on reset
- No connection leaks

## Troubleshooting

### Issue: "OutdatedContextError" in Logs

**Symptom:**

```
[WARN] Cannot perform target-environment callback operation.
TargetEnvContext instance ID "abc123" does not match
current session instance ID "xyz789".
```

**Causes:**

1. Session reset during asynchronous operation
2. Delayed callback execution after reset
3. Event listener from previous instance

**Solutions:**

✅ **For delayed operations:**

```ts
// Use context.sleep() instead of setTimeout
await context.sleep(5000)
```

✅ **For event listeners:**

```ts
// Recreate listeners in environment-setup hook
environment.on('environment-setup', async (context) => {
  connection = await createConnection()

  // New listener for new instance
  connection.on('data', (data) => {
    context.sendOutput(data)
  })
})
```

✅ **For background tasks:**

```ts
// Check if should continue before each context operation
for (let i = 0; i < 100; i++) {
  await context.sleep(1000)
  // If session reset, sleep throws OutdatedContextError
  // Loop stops automatically
}
```

### Issue: Data "Disappears" After Reset

**Symptom:**
Data stored in `localStore` or `globalStore` is not available after reset.

**Cause:**
Stores are scoped to session instance. New instance = new stores.

**Solution:**

```ts
// ❌ Data lost on reset
const cache = context.localStore.use('cache', [])
cache.value.push('data')

// ✅ Persist data externally
const api = RestApi.fromConfig(context.config.targetEnvConfig.data)
await api.post('/cache', { data: 'value' })
```

### Issue: Connection Stays Open After Reset

**Symptom:**
External connections (WebSocket, database, API) remain open after session reset.

**Cause:**
Connections created in target scripts don't automatically clean up.

**Solution:**

```ts
// ✅ Use environment hooks for connection lifecycle
let connection = null

environment.on('environment-setup', async (context) => {
  connection = await createConnection()
})

environment.on('environment-teardown', async (context) => {
  if (connection) {
    await connection.close()
    connection = null
  }
})
```

### Issue: Module-Scope Variables Have Wrong Values

**Symptom:**
Variables declared outside functions have values from previous instance.

**Cause:**
Module-scope variables survive session resets (they're not reset).

**Solution:**

```ts
// ❌ Module scope survives resets
let count = 0

script: async (context) => {
  count++ // May be from previous instance!
}

// ✅ Use data stores (instance-scoped)
script: async (context) => {
  const counter = context.localStore.use('count', 0)
  counter.value++
}

// ✅ Or reset in environment-setup
let count = 0

environment.on('environment-setup', async (context) => {
  count = 0 // Reset for new instance
})
```

### Issue: Cannot Use setTimeout

**Symptom:**

```
Error: setTimeout is not defined
```

**Cause:**
`setTimeout` and `setInterval` are intentionally disabled for safety.

**Solution:**

```ts
// ❌ Blocked
setTimeout(() => { ... }, 5000)

// ✅ Use context.sleep()
await context.sleep(5000)

// ✅ For polling
while (condition) {
  await context.sleep(1000)
  // Check condition
}
```

## Related Documentation

### 📋 Essential Guides

- **[Environment Hooks](environment-hooks.md)** - Lifecycle management with setup/teardown hooks
- **[Data Stores](data-stores.md)** - Caching and state management patterns
- **[External API Integration](external-api-integration.md)** - REST and WebSocket patterns

### 🔗 References

- **[Context API](../references/context-api.md)** - Complete context method reference
- **[WebSocket API](../references/websocket-api.md)** - Real-time connection management
- **[REST API](../references/rest-api.md)** - HTTP integration patterns

### 💡 Examples

- **[Complex Target Example](../examples/complex-target.md)** - Advanced patterns with lifecycle management

### 📖 Core Documentation

- **[Architecture](../architecture.md)** - System design and patterns
- **[Overview](../overview.md)** - Core concepts and terminology
