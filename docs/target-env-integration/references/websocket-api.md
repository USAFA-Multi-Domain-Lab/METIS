# WebSocket API Reference

The WebSocket API provides real-time, bidirectional communication between your target environment and external systems. Unlike REST APIs that use request-response patterns, WebSocket connections maintain persistent connections for continuous data flow.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Connection Management](#connection-management)
- [Event System](#event-system)
- [Sending Messages](#sending-messages)
- [Connection State](#connection-state)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

## Overview

The `WebSocketApi` class is built on the `ws` library and provides:

- **Automatic configuration** from `configs.json`
- **Event-driven architecture** for handling WebSocket events
- **Type-safe event handlers** with TypeScript support
- **Connection state management** with automatic cleanup
- **Flexible protocol support** (WS/WSS)
- **Built-in JSON parsing** for structured messages

**When to use WebSocket vs REST:**

| Use WebSocket When...         | Use REST When...            |
| ----------------------------- | --------------------------- |
| Real-time data updates needed | One-time data requests      |
| Bidirectional communication   | Simple command execution    |
| Continuous event streams      | Request-response patterns   |
| Low latency requirements      | Standard CRUD operations    |
| Server-initiated updates      | Client-initiated operations |

## Getting Started

### Basic Setup

```ts
import { WebSocketApi } from '@metis/api/WebSocketApi'
import type { TargetScriptContext } from '@metis/target-environments/context/TargetScriptContext'

export default new TargetSchema({
  _id: 'websocket-example',
  name: 'WebSocket Example',
  script: async (context: TargetScriptContext) => {
    // Verify configuration is selected
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected.')
    }

    // Create WebSocket instance from config
    const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

    // Add event listeners
    ws.addEventListener('open', () => {
      context.sendOutput('✅ Connected to WebSocket')
    })

    ws.addEventListener('message', (event) => {
      context.sendOutput(`Received: ${JSON.stringify(event.data)}`)
    })

    // Connect
    await ws.connect()

    // Send a message
    await ws.sendMessage({ type: 'hello', data: 'Hello from METIS!' })

    // Cleanup
    ws.disconnect()
  },
})
```

### Using fromConfig()

The `fromConfig()` static method automatically parses your environment configuration:

```ts
// Automatically reads: protocol, host, port, rejectUnauthorized, connectTimeout
const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)
```

**Configuration properties** (from `configs.json`):

```json
{
  "protocol": "wss",
  "host": "api.example.com",
  "port": 443,
  "rejectUnauthorized": true,
  "connectTimeout": 10000
}
```

## Configuration

### Connection Options

```ts
interface TWebSocketApiOptions {
  protocol?: 'ws' | 'wss' // Default: 'ws'
  host?: string // Default: 'localhost'
  port?: number // Default: 80 (ws) or 443 (wss)
  rejectUnauthorized?: boolean // Default: true
  connectTimeout?: number // Default: 10000ms (10s), min: 1000ms, max: 60000ms
}
```

### Protocol Selection

**WS (WebSocket):**

- Unencrypted connections
- Default port: 80
- Use for local development or internal networks

```json
{
  "protocol": "ws",
  "host": "localhost",
  "port": 8080
}
```

**WSS (WebSocket Secure):**

- TLS-encrypted connections
- Default port: 443
- Required for production and external systems

```json
{
  "protocol": "wss",
  "host": "secure.example.com",
  "port": 443,
  "rejectUnauthorized": true
}
```

### TLS Certificate Validation

Control whether the client verifies the server's TLS certificate:

```json
{
  "protocol": "wss",
  "host": "api.example.com",
  "rejectUnauthorized": true // Verify certificate (recommended)
}
```

**Security considerations:**

- `rejectUnauthorized: true` (default) - **Recommended for production**

  - Validates server certificate against trusted CAs
  - Prevents man-in-the-middle attacks
  - Rejects self-signed certificates

- `rejectUnauthorized: false` - **Only for development**
  - Accepts any certificate (including self-signed)
  - Use only with trusted local networks
  - Never use in production

### Connection Timeout

Configure how long to wait for the WebSocket handshake:

```json
{
  "connectTimeout": 10000 // 10 seconds (default)
}
```

**Constraints:**

- Minimum: 1000ms (1 second)
- Maximum: 60000ms (60 seconds)
- Default: 10000ms (10 seconds)

**Guidelines:**

- Local networks: 5000-10000ms
- Internet connections: 10000-15000ms
- Unreliable networks: 15000-30000ms

### URL Building

The WebSocket API automatically constructs connection URLs:

| Configuration                                       | Resulting URL               |
| --------------------------------------------------- | --------------------------- |
| `{ protocol: 'ws', host: 'localhost', port: 8080 }` | `ws://localhost:8080`       |
| `{ protocol: 'wss', host: 'api.example.com' }`      | `wss://api.example.com:443` |
| `{ host: 'example.com:9000' }`                      | `ws://example.com:9000`     |
| `{ port: 3000 }`                                    | `ws://localhost:3000`       |
| `{}` (empty)                                        | `ws://localhost:80`         |

**Port precedence:**

1. Port in host string (e.g., `example.com:9000`)
2. Explicit `port` property
3. Protocol default (80 for ws, 443 for wss)

## Connection Management

### Establishing Connections

```ts
const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

try {
  await ws.connect()
  context.sendOutput('Connected successfully')
} catch (error) {
  context.sendOutput(`Connection failed: ${error.message}`)
  throw error
}
```

**Connection behavior:**

- Returns immediately if already connected
- Closes existing connection before reconnecting
- Throws error if connection fails
- Resolves when handshake completes

### Checking Connection State

```ts
// Check if currently connected
if (ws.isConnected) {
  await ws.send('Hello!')
}

// Check raw state
switch (ws.state) {
  case WebSocket.CONNECTING:
    context.sendOutput('Connecting...')
    break
  case WebSocket.OPEN:
    context.sendOutput('Connected')
    break
  case WebSocket.CLOSING:
    context.sendOutput('Closing...')
    break
  case WebSocket.CLOSED:
    context.sendOutput('Disconnected')
    break
}
```

**State values:**

- `WebSocket.CONNECTING` (0) - Connection in progress
- `WebSocket.OPEN` (1) - Connection established
- `WebSocket.CLOSING` (2) - Connection closing
- `WebSocket.CLOSED` (3) - Connection closed

### Disconnecting

```ts
// Graceful disconnect
ws.disconnect()

// Disconnect with close code and reason
ws.disconnect(1000, 'Normal closure')

// Common close codes
ws.disconnect(1001, 'Going away') // Client navigating away
ws.disconnect(1002, 'Protocol error') // Protocol violation
ws.disconnect(1003, 'Invalid data') // Unsupported data received
```

**Close code ranges:**

- 1000-1015: Standard WebSocket close codes
- 3000-3999: Reserved for libraries and frameworks
- 4000-4999: Available for application use

### Connection Properties

```ts
// Access connection URL
context.sendOutput(`Connecting to: ${ws.url}`)

// Access connection options
context.sendOutput(`Timeout: ${ws.connectTimeout}ms`)
context.sendOutput(`TLS Verification: ${ws.rejectUnauthorized}`)

// Access raw WebSocket connection (advanced)
if (ws.connection) {
  // Direct access to ws library connection
  const rawWs = ws.connection
}
```

## Event System

### Event Types

The WebSocket API provides six event types:

| Event               | When It Fires            | Event Data       |
| ------------------- | ------------------------ | ---------------- |
| `open`              | Connection established   | None             |
| `close`             | Connection closed        | `code`, `reason` |
| `error`             | Error occurred           | `error`          |
| `message`           | Message received         | `data`, `raw`    |
| `connection-change` | Connection state changed | `isConnected`    |
| `activity`          | Any event occurred       | `eventType`      |

### Adding Event Listeners

```ts
// Single event type
ws.addEventListener('message', (event) => {
  context.sendOutput(`Received: ${JSON.stringify(event.data)}`)
})

// Multiple event types with same handler
ws.addEventListener(['open', 'close'], (event) => {
  if (event.method === 'open') {
    context.sendOutput('Connected')
  } else if (event.method === 'close') {
    context.sendOutput(`Disconnected: ${event.reason}`)
  }
})

// Type-safe event handlers
ws.addEventListener('error', (event) => {
  // event.error is typed as Error
  context.sendOutput(`Error: ${event.error.message}`)
})
```

### Event Handler Examples

#### Open Event

Fired when connection is successfully established:

```ts
ws.addEventListener('open', (event) => {
  context.sendOutput('✅ WebSocket connection established')

  // Safe to send messages now
  ws.sendMessage({ type: 'authenticate', token: 'abc123' })
})
```

#### Message Event

Fired when a message is received:

```ts
ws.addEventListener('message', (event) => {
  // event.data is automatically parsed from JSON if possible
  const { type, payload } = event.data

  switch (type) {
    case 'status-update':
      context.sendOutput(`Status: ${payload.status}`)
      break
    case 'alert':
      context.sendOutput(`⚠️ Alert: ${payload.message}`)
      break
    default:
      context.sendOutput(`Unknown message type: ${type}`)
  }

  // Access raw message data if needed
  context.sendOutput(`Raw: ${event.raw}`)
})
```

**Message parsing:**

- Automatically attempts JSON parsing for string/buffer messages
- Falls back to raw string if JSON parsing fails
- Access original data via `event.raw`

#### Close Event

Fired when connection closes:

```ts
ws.addEventListener('close', (event) => {
  context.sendOutput(`Connection closed: ${event.reason}`)
  context.sendOutput(`Close code: ${event.code}`)

  // Check close code for specific handling
  if (event.code === 1006) {
    context.sendOutput('⚠️ Abnormal closure - connection lost')
  } else if (event.code === 1000) {
    context.sendOutput('✅ Normal closure')
  }
})
```

**Common close codes:**

- 1000: Normal closure
- 1001: Going away
- 1006: Abnormal closure (no close frame received)
- 1011: Internal server error

#### Error Event

Fired when an error occurs:

```ts
ws.addEventListener('error', (event) => {
  context.sendOutput(`❌ WebSocket error: ${event.error.message}`)

  // Log full error for debugging
  console.error('WebSocket error details:', event.error)

  // Clean up resources
  ws.disconnect()
})
```

#### Connection-Change Event

Fired when connection state changes (open or close):

```ts
ws.addEventListener('connection-change', (event) => {
  if (event.isConnected) {
    context.sendOutput('🟢 Connected')
    // Start sending periodic updates
  } else {
    context.sendOutput('🔴 Disconnected')
    // Stop operations
  }
})
```

#### Activity Event

Fired after any other event (useful for logging/monitoring):

```ts
ws.addEventListener('activity', (event) => {
  // Log all WebSocket activity
  const timestamp = new Date().toISOString()
  context.sendOutput(`[${timestamp}] Activity: ${event.eventType}`)
})
```

### Removing Event Listeners

```ts
// Define handler function
const messageHandler = (event) => {
  context.sendOutput(event.data)
}

// Add listener
ws.addEventListener('message', messageHandler)

// Remove specific listener
ws.removeEventListener('message', messageHandler)

// Clear all listeners
ws.clearEventListeners()

// Clear specific event types
ws.clearEventListeners(['message', 'error'])
```

## Sending Messages

### Basic Sending

```ts
// Send string
await ws.send('Hello, WebSocket!')

// Send JSON object (automatically stringified)
await ws.send({ type: 'command', action: 'execute' })

// Equivalent using sendMessage() (recommended for objects)
await ws.sendMessage({ type: 'command', action: 'execute' })
```

### Message Patterns

#### Request-Response Pattern

```ts
script: async (context) => {
  const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  let responseReceived = false
  let response: any = null

  // Set up response listener
  ws.addEventListener('message', (event) => {
    if (event.data.type === 'response') {
      response = event.data
      responseReceived = true
    }
  })

  await ws.connect()

  // Send request
  await ws.sendMessage({
    type: 'request',
    requestId: '123',
    data: { action: 'getData' },
  })

  // Wait for response (with timeout)
  const timeout = 5000
  const startTime = Date.now()

  while (!responseReceived && Date.now() - startTime < timeout) {
    await context.sleep(100)
  }

  if (responseReceived) {
    context.sendOutput(`Received: ${JSON.stringify(response)}`)
  } else {
    context.sendOutput('⚠️ Response timeout')
  }

  ws.disconnect()
}
```

#### Streaming Data Pattern

```ts
script: async (context) => {
  const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  let receivedCount = 0

  ws.addEventListener('message', (event) => {
    if (event.data.type === 'stream-data') {
      receivedCount++
      context.sendOutput(`Stream update #${receivedCount}: ${event.data.value}`)
    } else if (event.data.type === 'stream-end') {
      context.sendOutput(
        `✅ Stream complete. Received ${receivedCount} updates`,
      )
    }
  })

  await ws.connect()

  // Request streaming data
  await ws.sendMessage({
    type: 'subscribe',
    channel: 'sensor-data',
    interval: 1000,
  })

  // Keep connection open for streaming
  await context.sleep(30000) // 30 seconds

  // Unsubscribe
  await ws.sendMessage({
    type: 'unsubscribe',
    channel: 'sensor-data',
  })

  ws.disconnect()
}
```

#### Heartbeat/Keep-Alive Pattern

```ts
script: async (context) => {
  const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  await ws.connect()

  // Send periodic heartbeat
  const heartbeatInterval = 30000 // 30 seconds
  let keepRunning = true

  // Heartbeat loop
  const sendHeartbeat = async () => {
    while (keepRunning && ws.isConnected) {
      await ws.sendMessage({ type: 'heartbeat', timestamp: Date.now() })
      context.sendOutput('💓 Heartbeat sent')
      await context.sleep(heartbeatInterval)
    }
  }

  // Start heartbeat
  sendHeartbeat()

  // Do other operations...
  await context.sleep(120000) // 2 minutes

  // Stop heartbeat and disconnect
  keepRunning = false
  ws.disconnect()
}
```

## Connection State

### State Properties

```ts
// Connection object (null if not connected)
const connection: WebSocket | null = ws.connection

// Current state (CONNECTING, OPEN, CLOSING, CLOSED)
const state: number = ws.state

// Boolean connection check
const connected: boolean = ws.isConnected

// Connection configuration
const url: string = ws.url
const options: ClientOptions = ws.options
```

### State Checking Patterns

```ts
// Before sending
if (!ws.isConnected) {
  context.sendOutput('⚠️ Not connected, attempting reconnection...')
  await ws.connect()
}
await ws.send('Hello!')

// State-based logic
switch (ws.state) {
  case WebSocket.CONNECTING:
    context.sendOutput('Waiting for connection...')
    break
  case WebSocket.OPEN:
    await ws.send('Ready to communicate')
    break
  case WebSocket.CLOSING:
    context.sendOutput('Connection closing, operations halted')
    break
  case WebSocket.CLOSED:
    context.sendOutput('Connection closed, reconnecting...')
    await ws.connect()
    break
}

// Connection monitoring
ws.addEventListener('connection-change', (event) => {
  if (event.isConnected) {
    // Resume operations
    resumeDataSync()
  } else {
    // Pause operations
    pauseDataSync()
  }
})
```

## Error Handling

### Connection Errors

```ts
script: async (context) => {
  const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

  try {
    context.sendOutput('Attempting connection...')
    await ws.connect()
    context.sendOutput('✅ Connected successfully')
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      context.sendOutput('❌ Connection refused - server not running')
    } else if (error.message.includes('ETIMEDOUT')) {
      context.sendOutput('❌ Connection timeout - check network')
    } else if (error.message.includes('certificate')) {
      context.sendOutput('❌ TLS certificate error - check rejectUnauthorized')
    } else {
      context.sendOutput(`❌ Connection error: ${error.message}`)
    }
    throw error
  }
}
```

### Runtime Errors

```ts
// Add error listener for runtime errors
ws.addEventListener('error', (event) => {
  const error = event.error

  context.sendOutput(`❌ WebSocket error: ${error.message}`)

  // Log detailed error information
  if (error.stack) {
    console.error('Error stack:', error.stack)
  }

  // Attempt recovery
  if (ws.isConnected) {
    context.sendOutput('Connection still active, continuing...')
  } else {
    context.sendOutput('Connection lost, attempting reconnection...')
    ws.connect().catch((err) => {
      context.sendOutput(`Reconnection failed: ${err.message}`)
    })
  }
})
```

### Send Errors

```ts
try {
  await ws.sendMessage({ type: 'command', data: 'execute' })
} catch (error) {
  if (error.message === 'WebSocket is not connected') {
    context.sendOutput('⚠️ Cannot send - not connected')
    await ws.connect()
    await ws.sendMessage({ type: 'command', data: 'execute' })
  } else {
    context.sendOutput(`Send error: ${error.message}`)
    throw error
  }
}
```

### Configuration Errors

```ts
try {
  const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)
} catch (error) {
  if (error.message.includes('Invalid WebSocket API configuration')) {
    context.sendOutput('❌ Configuration error - check configs.json')
    context.sendOutput('Required: protocol, host, port')
    throw new Error('WebSocket configuration invalid')
  }
}
```

## Type Definitions

### WebSocketApiOptions

```ts
interface TWebSocketApiOptions {
  protocol?: 'ws' | 'wss'
  host?: string
  port?: number
  rejectUnauthorized?: boolean
  connectTimeout?: number // 1000-60000ms
}
```

### WebSocket Event Types

```ts
type TWebSocketEventType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'connection-change'
  | 'activity'
```

### WebSocket Events

```ts
type TWebSocketEvents = {
  'open': {
    method: 'open'
  }
  'close': {
    method: 'close'
    code: number
    reason: string
  }
  'error': {
    method: 'error'
    error: Error
  }
  'message': {
    method: 'message'
    data: any // Parsed JSON or string
    raw: WebSocket.Data // Original message data
  }
  'connection-change': {
    method: 'connection-change'
    isConnected: boolean
  }
  'activity': {
    method: 'activity'
    eventType: TWebSocketEventType
  }
}
```

### Event Handler Type

```ts
type TWebSocketEventHandler<T extends TWebSocketEventType> = (
  event: TWebSocketEvents[T],
) => void
```

## Complete Examples

### Environment Hook Integration

Using WebSocket with environment lifecycle hooks:

```ts
import { WebSocketApi } from '@metis/api/WebSocketApi'

let wsConnection: WebSocketApi | null = null

const environment = new TargetEnvSchema({
  name: 'WebSocket Environment',
  // ... other properties
})

// Establish connection during setup
environment.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No WebSocket configuration selected.')
  }

  context.sendOutput('Establishing WebSocket connection...')

  try {
    wsConnection = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

    // Configure event listeners
    wsConnection.addEventListener('open', () => {
      context.sendOutput('✅ WebSocket connected')
    })

    wsConnection.addEventListener('close', (event) => {
      context.sendOutput(`⚠️ WebSocket disconnected: ${event.reason}`)
    })

    wsConnection.addEventListener('error', (event) => {
      context.sendOutput(`❌ WebSocket error: ${event.error.message}`)
    })

    // Connect
    await wsConnection.connect()
    context.sendOutput('WebSocket ready for use')
  } catch (error) {
    wsConnection = null
    context.sendOutput(`❌ WebSocket setup failed: ${error.message}`)
    throw error
  }
})

// Clean up during teardown
environment.on('environment-teardown', async (context) => {
  if (wsConnection) {
    context.sendOutput('Closing WebSocket connection...')
    try {
      wsConnection.disconnect(1000, 'Environment teardown')
      wsConnection = null
      context.sendOutput('✅ WebSocket disconnected')
    } catch (error) {
      context.sendOutput(`⚠️ WebSocket disconnect error: ${error.message}`)
    }
  }
})

// Use connection in target scripts
targets.operations.use(
  new TargetSchema({
    _id: 'send-websocket-message',
    name: 'Send WebSocket Message',
    script: async (context) => {
      if (!wsConnection || !wsConnection.isConnected) {
        throw new Error('WebSocket not connected')
      }

      await wsConnection.sendMessage({
        type: 'command',
        payload: context.effect.args,
      })

      context.sendOutput('✅ Message sent via WebSocket')
    },
  }),
)
```

### Real-Time Monitoring System

```ts
export default new TargetSchema({
  _id: 'monitor-system',
  name: 'Monitor System Status',
  args: [
    {
      _id: 'duration',
      name: 'Monitor Duration (seconds)',
      type: 'number',
      required: true,
      default: 60,
    },
  ],
  script: async (context) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected.')
    }

    const { duration } = context.effect.args
    const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

    // Track metrics
    const metrics = {
      messagesReceived: 0,
      errorsEncountered: 0,
      alerts: [],
    }

    // Set up listeners
    ws.addEventListener('open', () => {
      context.sendOutput('🟢 Monitoring started')
    })

    ws.addEventListener('message', (event) => {
      metrics.messagesReceived++

      const { type, data } = event.data

      switch (type) {
        case 'status-update':
          context.sendOutput(`Status: ${data.status}`)
          break
        case 'metric':
          context.sendOutput(`Metric ${data.name}: ${data.value}`)
          break
        case 'alert':
          metrics.alerts.push(data.message)
          context.sendOutput(`⚠️ ALERT: ${data.message}`)
          break
      }
    })

    ws.addEventListener('error', (event) => {
      metrics.errorsEncountered++
      context.sendOutput(`❌ Error: ${event.error.message}`)
    })

    ws.addEventListener('close', () => {
      context.sendOutput('🔴 Monitoring stopped')
    })

    try {
      // Connect and start monitoring
      await ws.connect()

      // Subscribe to monitoring feed
      await ws.sendMessage({
        type: 'subscribe',
        channels: ['status', 'metrics', 'alerts'],
      })

      // Monitor for specified duration
      await context.sleep(duration * 1000)

      // Unsubscribe
      await ws.sendMessage({
        type: 'unsubscribe',
      })

      // Report summary
      context.sendOutput('\n📊 Monitoring Summary:')
      context.sendOutput(`Messages received: ${metrics.messagesReceived}`)
      context.sendOutput(`Errors encountered: ${metrics.errorsEncountered}`)
      context.sendOutput(`Alerts triggered: ${metrics.alerts.length}`)

      if (metrics.alerts.length > 0) {
        context.sendOutput('\nAlerts:')
        metrics.alerts.forEach((alert, i) => {
          context.sendOutput(`  ${i + 1}. ${alert}`)
        })
      }
    } finally {
      ws.disconnect()
    }
  },
})
```

### Bidirectional Command System

```ts
export default new TargetSchema({
  _id: 'interactive-command',
  name: 'Interactive Command Session',
  args: [
    {
      _id: 'command',
      name: 'Command',
      type: 'text',
      required: true,
    },
    {
      _id: 'waitForResponse',
      name: 'Wait for Response',
      type: 'boolean',
      default: true,
    },
  ],
  script: async (context) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected.')
    }

    const { command, waitForResponse } = context.effect.args
    const ws = WebSocketApi.fromConfig(context.config.targetEnvConfig.data)

    let commandResponse: any = null
    const commandId = `cmd_${Date.now()}`

    // Response handler
    ws.addEventListener('message', (event) => {
      if (
        event.data.type === 'command-response' &&
        event.data.id === commandId
      ) {
        commandResponse = event.data
      }
    })

    try {
      await ws.connect()

      // Send command
      await ws.sendMessage({
        type: 'command',
        id: commandId,
        command: command,
        timestamp: Date.now(),
      })

      context.sendOutput(`📤 Command sent: ${command}`)

      if (waitForResponse) {
        // Wait for response (30 second timeout)
        const timeout = 30000
        const startTime = Date.now()

        while (!commandResponse && Date.now() - startTime < timeout) {
          await context.sleep(100)
        }

        if (commandResponse) {
          context.sendOutput('📥 Response received:')
          context.sendOutput(JSON.stringify(commandResponse.data, null, 2))

          if (commandResponse.success) {
            context.sendOutput('✅ Command executed successfully')
          } else {
            context.sendOutput(`❌ Command failed: ${commandResponse.error}`)
          }
        } else {
          context.sendOutput('⚠️ Response timeout (30s)')
        }
      } else {
        context.sendOutput('✅ Command sent (no response expected)')
      }
    } finally {
      ws.disconnect()
    }
  },
})
```

## Best Practices

### Connection Management

✅ **DO:**

- Use `fromConfig()` for automatic configuration
- Check `isConnected` before sending messages
- Use environment hooks for persistent connections
- Handle connection errors gracefully
- Close connections when done (`disconnect()`)

❌ **DON'T:**

- Hardcode connection URLs
- Ignore connection state checks
- Leave connections open indefinitely
- Forget error handling
- Create multiple connections to same server

### Event Handling

✅ **DO:**

- Add event listeners before connecting
- Use type-safe event handlers
- Handle all event types (open, message, error, close)
- Clean up listeners when appropriate
- Use `activity` event for centralized logging

❌ **DON'T:**

- Add listeners after connection established
- Ignore error events
- Create memory leaks with listeners
- Use inline anonymous functions if you need to remove listeners

### Message Sending

✅ **DO:**

- Use `sendMessage()` for objects
- Check connection state before sending
- Use structured message formats (include type field)
- Handle send errors
- Use async/await with `send()`

❌ **DON'T:**

- Send messages without checking connection
- Use inconsistent message formats
- Ignore send failures
- Send circular JSON structures

### Security

✅ **DO:**

- Use WSS (WebSocket Secure) for production
- Set `rejectUnauthorized: true` for production
- Validate received messages
- Sanitize user input before sending
- Use authentication mechanisms

❌ **DON'T:**

- Use WS protocol over internet
- Disable certificate verification in production
- Trust all incoming messages
- Send sensitive data unencrypted
- Hardcode credentials in code

### Performance

✅ **DO:**

- Reuse WebSocket connections
- Use environment hooks for long-lived connections
- Implement heartbeat/keep-alive for idle connections
- Parse messages efficiently
- Use binary formats for large data

❌ **DON'T:**

- Create new connections for each message
- Keep connections open unnecessarily
- Send excessive messages
- Parse large JSON repeatedly
- Block execution while waiting for messages

### Error Recovery

✅ **DO:**

- Implement reconnection logic
- Log errors for debugging
- Use appropriate close codes
- Handle network interruptions
- Provide user feedback

❌ **DON'T:**

- Crash on first error
- Silently fail
- Reconnect infinitely without backoff
- Ignore close codes
- Leave users uninformed

## Related Documentation

### 📋 Essential Guides

- **[Environment Hooks](../guides/environment-hooks.md)** - Lifecycle management for persistent connections
- **[Environment Configuration](environment-configuration.md)** - Configuration system and `configs.json`
- **[External API Integration](../guides/external-api-integration.md)** - REST API patterns and best practices
- **[Context API](context-api.md)** - Complete runtime context reference

### 🔗 References

- **[REST API](rest-api.md)** - HTTP-based integration patterns
- **[Configs.json](configs-json.md)** - Configuration file reference
- **[Schemas](schemas.md)** - Type definitions and validation

### 📖 Core Documentation

- **[Target Environment Architecture](/docs/target-env-integration/architecture.md)** - System design and patterns
- **[WebSocket System](/docs/devs/websocket.md)** - METIS internal WebSocket implementation
