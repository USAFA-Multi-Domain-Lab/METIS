# METIS Environment Configuration Reference

This guide explains how to configure METIS target environments using `configs.json` files. It covers structure, session-based selection, security, and troubleshooting tips for connecting to external APIs and services.

## Table of Contents

- [Overview](#overview)
- [Configuration Structure](#configuration-structure)
- [Configuration Properties](#configuration-properties)
- [Session-Based Selection](#session-based-selection)
- [Accessing Configuration](#accessing-configuration)
- [Security & Permissions](#security--permissions)
- [Configuration Examples](#configuration-examples)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Overview

METIS uses `configs.json` files within each target environment directory for storing environment-specific connection details. Unlike traditional `.env` files, `configs.json` supports:

- **Multiple configurations** per environment (dev, staging, prod)
- **Session-based selection** - session managers choose which config to use per session
- **Client-side access** - configurations visible to users in UI (data is completely hidden)
- **Type-safe access** - configurations available via `context.config.targetEnvConfig`

**Key Features:**

- JSON-based configuration with schema validation
- Multiple authentication methods
- Flexible protocol support (HTTP/HTTPS/WebSocket)
- CLI tools for generation and permission management
- Session-scoped configuration selection

## Configuration Structure

METIS configurations are defined in a `configs.json` file located in your target environment's root directory:

```text
integration/target-env/your-environment/
├── schema.ts
├── configs.json          ← Configuration file
└── targets/
```

### File Structure

```json
[
  {
    "_id": "unique-config-id",
    "name": "Display Name",
    "description": "Configuration description",
    "data": {
      "protocol": "https",
      "host": "api.example.com",
      "port": 443,
      "apiKey": "your-api-key",
      "customProperty": "custom-value"
    }
  }
]
```

### Fields

| Field         | Required | Notes                                                     |
| ------------- | -------- | --------------------------------------------------------- |
| `_id`         | Yes      | Unique identifier. Cannot be empty                         |
| `name`        | Yes      | Display name shown to session managers. Cannot be empty    |
| `description` | No       | Defaults to an empty string                                |
| `data`        | No       | Your custom configuration data. Defaults to `{}`           |

`targetEnvId` is set by METIS from the environment's folder name — do not write it yourself.

### Data Property

The `data` property can contain any structure your environment needs. Common patterns include:

**REST API Configuration:**

```json
{
  "data": {
    "protocol": "https",
    "host": "api.example.com",
    "port": 443,
    "apiKey": "your-key-here",
    "rejectUnauthorized": true
  }
}
```

**WebSocket Configuration:**

```json
{
  "data": {
    "protocol": "wss",
    "host": "websocket.example.com",
    "port": 443,
    "apiKey": "your-key-here"
  }
}
```

**Database Configuration:**

```json
{
  "data": {
    "host": "db.example.com",
    "port": 5432,
    "database": "mydb",
    "username": "dbuser",
    "password": "dbpass"
  }
}
```

### Creating configs.json

**Using the CLI (recommended):**

```bash
metis config generate <target-env-id>
```

The command writes a template to `integration/target-env/<target-env-id>/configs.json`, asking first if the file already exists.

**Manual Creation (Linux/macOS):**

```bash
# Create file
touch integration/target-env/your-environment/configs.json

# Add your configuration data
vim integration/target-env/your-environment/configs.json

# Recommended: Set secure permissions
chmod 600 integration/target-env/your-environment/configs.json
```

**Manual Creation (Windows):**

```powershell
# Create file
New-Item -Path "integration\target-env\your-environment\configs.json" -ItemType File

# Add your configuration data
notepad integration\target-env\your-environment\configs.json

# Recommended: Set secure permissions (see Security & Permissions section)
```

> **Security Tip:** Consider setting restrictive file permissions to protect sensitive data in your configs.json file.

## Configuration Properties

The properties you include in `data` depend on your target environment's needs. Here are common patterns:

### REST API Properties

Read by `RestApi.fromConfig`.

| Property             | Type                  | Default                                  | Effect                                             |
| -------------------- | --------------------- | ---------------------------------------- | -------------------------------------------------- |
| `protocol`           | `'http'` \| `'https'` | `'http'`                                | Scheme of the base URL. Name only, no `://`         |
| `host`               | `string`              | `localhost`                              | Domain or IP. May include a port                    |
| `port`               | `number` \| numeric `string` | `80`, or `443` for `https`        | Port of the base URL                                |
| `rejectUnauthorized` | `boolean`             | `true`                                   | When `false`, accepts invalid TLS certificates      |
| `username`           | `string`              | —                                        | Exposed as `api.username`. **Not sent automatically** |
| `password`           | `string`              | —                                        | Exposed as `api.password`. **Not sent automatically** |
| `apiKey`             | `string`              | —                                        | Exposed as `api.apiKey`. **Not sent automatically**   |

> **Important:** `RestApi` reads the three credential properties and exposes them,
> but does not attach them to requests. Your script applies them. See
> [Authentication](rest-api.md#authentication) in the REST API reference.

### WebSocket Properties

Read by `WebSocketApi.fromConfig`.

| Property                 | Type                | Default                     | Range        | Effect                                                        |
| ------------------------ | ------------------- | --------------------------- | ------------ | ------------------------------------------------------------- |
| `protocol`               | `'ws'` \| `'wss'`  | `'ws'`                      | —            | Scheme, and which default port applies                         |
| `host`                   | `string`            | `localhost`                 | —            | Domain or IP. May include a port                               |
| `port`                   | `number` \| numeric `string` | `80`, or `443` for `wss` | 1–65535 | Port of the connection URL                                 |
| `rejectUnauthorized`     | `boolean`           | `true`                      | —            | When `false`, accepts invalid TLS certificates                 |
| `connectTimeout`         | `number`            | `10000`                     | 1000–60000   | How long to wait for the handshake, in milliseconds            |
| `autoReconnect`          | `boolean`           | `true`                      | —            | Reconnect after an unexpected close                            |
| `reconnectDelay`         | `number`            | `1000`                      | 250–60000    | Base delay before the first reconnect attempt, in milliseconds |
| `maxReconnectDelay`      | `number`            | `30000`                     | 1000–300000  | Ceiling for the backoff between attempts, in milliseconds      |
| `keepAliveInterval`      | `number`            | `30000`                     | 0–300000     | Ping interval in milliseconds. `0` disables keepalive          |
| `keepAliveTimeout`       | `number`            | `10000`                     | 0–60000      | Terminate if no pong arrives within this window                |
| `queueWhileDisconnected` | `boolean`           | `false`                     | —            | Hold messages sent while disconnected and flush them on reopen |
| `maxQueueSize`           | `number`            | `100`                       | 1–10000      | Queue capacity. `send()` rejects once it is full               |

### Custom Properties

You can add any properties your environment needs:

```json
{
  "data": {
    "apiBaseUrl": "https://api.example.com/v2",
    "timeout": 30000,
    "maxRetries": 3,
    "features": {
      "analytics": true,
      "debugMode": false
    },
    "endpoints": {
      "alerts": "/api/alerts",
      "devices": "/api/devices"
    }
  }
}
```

## Session-Based Selection

One of the key features of `configs.json` is that session managers select which configuration to use when creating a session.

### How It Works

1. **Session manager creates session** and chooses a configuration from the dropdown
2. **METIS records the configuration's ID** on the session
3. **All session members** use the same configuration
4. **The file is re-read** each time a script reads `context.config.targetEnvConfig`, so edits reach running sessions without a restart

Because the session stores the ID rather than a copy, changing a configuration's
`_id` in `configs.json` while a session is running leaves that session pointing at
nothing, and `context.config.targetEnvConfig` becomes `null`.

### UI Experience

```text
Create Session:
├── Mission: [Select Mission ▼]
├── Environment Config: [Production ▼]
│   ├── Development
│   ├── Staging
│   └── Production  ← Instructor selects this
└── [Create Session]
```

### Benefits

- **Multiple environments**: Support dev/staging/prod without code changes
- **Per-session isolation**: Different sessions can use different configs
- **Easy testing**: Switch between configs without restarting server
- **Clear visibility**: Session managers know which config is active

## Accessing Configuration

Configuration data is accessed through the `context` object passed to your target scripts.

### Basic Usage

```typescript
import { RestApi } from '@metis/api/RestApi'

const SendAlert = TargetSchema.create({
  _id: 'send-alert',
  name: 'Send Alert',
  description: 'Send an alert to the API.',
  script: async (context, { notify }) => {
    // Check if configuration is selected
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected for this session.')
    }

    // Access configuration data
    let config = context.config.targetEnvConfig.data

    // Use with REST API
    let api = RestApi.fromConfig(config)
    let response = await api.post('/alerts', {
      message: 'Alert message',
      severity: 'high',
    })

    context.sendOutput(`Alert sent: ${response.data.id}`, notify)
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

export default SendAlert
```

### Configuration Structure in Context

When a configuration is selected, `context.config.targetEnvConfig` carries:

| Property      | Example                          |
| ------------- | -------------------------------- |
| `_id`         | `'production-config'`            |
| `name`        | `'Production'`                   |
| `targetEnvId` | `'your-environment'`             |
| `description` | `'Production API configuration'` |
| `data`        | Your configuration properties    |

It is `null` when no configuration was selected.

### Handling Missing Configuration

Always check if a configuration is selected:

```typescript
script: async (context) => {
  let { config } = context

  if (!config.targetEnvConfig) {
    throw new Error(
      'No configuration selected. ' +
        'Please select a configuration when creating the session.',
    )
  }

  // Safe to use config now
  let api = RestApi.fromConfig(config.targetEnvConfig.data)
  void api
}
```

### Using Configuration with REST API

```typescript
script: async (context, { notify }) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No configuration selected.')
  }

  // Create API client from configuration
  let api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  // Make requests
  let users = await api.get<{ length: number }[]>('/users')
  await api.post('/devices', { name: 'Device 1' })

  context.sendOutput(`Found ${users.data.length} users`, notify)
}
```

## Security & Permissions

### File Permissions

> **Security Recommendation:** When developing target environments, secure your `configs.json` files with appropriate file permissions to protect sensitive data. Ensure the METIS server process has read access to the file.

**Setting Restrictive Permissions:**

Use your operating system's file permission tools to restrict access to the `configs.json` file:

```bash
# Example for Linux/macOS
chmod 600 integration/target-env/your-environment/configs.json
```

> **Note:** _For Windows or other operating systems, consult your OS documentation for setting file permissions that restrict read/write access to the file owner only._

**Why This Matters:**

- Prevents unauthorized users from reading sensitive credentials
- Protects API keys, passwords, and connection details
- Follows security best practices for configuration files

### Client-Side Visibility

Configurations are visible in the METIS client UI, but sensitive data is **hidden automatically**:

**Server-Side (Full Access):**

```json
{
  "_id": "prod",
  "name": "Production",
  "data": {
    "host": "api.example.com",
    "apiKey": "sk-1234567890abcdef",
    "password": "supersecret"
  }
}
```

**Client-Side (No Access):**

```json
{
  "_id": "prod",
  "name": "Production",
  "data": {}
}
```

### Best Practices

1. **Never commit sensitive data** to version control
2. **Secure file permissions**: Use restrictive permissions to protect sensitive data
3. **Ensure the METIS server process can read the file**: It never writes to it
4. **Use environment-specific configs**: Create separate configs for dev/staging/prod
5. **Rotate credentials regularly**: Update API keys and passwords periodically
6. **Document required fields**: Add comments or README explaining expected configuration structure
7. **Validate configuration**: Check for required fields in your target scripts

## Configuration Examples

### Multi-Environment Setup

```json
[
  {
    "_id": "development",
    "name": "Development",
    "description": "Local development environment",
    "data": {
      "protocol": "http",
      "host": "localhost",
      "port": 3000,
      "apiKey": "dev-key-12345",
      "rejectUnauthorized": false
    }
  },
  {
    "_id": "staging",
    "name": "Staging",
    "description": "Staging environment for testing",
    "data": {
      "protocol": "https",
      "host": "staging-api.example.com",
      "port": 443,
      "apiKey": "staging-key-67890",
      "rejectUnauthorized": true
    }
  },
  {
    "_id": "production",
    "name": "Production",
    "description": "Live production environment",
    "data": {
      "protocol": "https",
      "host": "api.example.com",
      "port": 443,
      "apiKey": "prod-key-abcdef",
      "rejectUnauthorized": true
    }
  }
]
```

### REST API Configuration

```json
[
  {
    "_id": "api-config",
    "name": "Main API",
    "description": "Primary REST API configuration",
    "data": {
      "protocol": "https",
      "host": "api.example.com",
      "port": 443,
      "apiKey": "your-api-key",
      "rejectUnauthorized": true,
      "timeout": 30000,
      "endpoints": {
        "alerts": "/api/v1/alerts",
        "devices": "/api/v1/devices",
        "users": "/api/v1/users"
      }
    }
  }
]
```

### WebSocket Configuration

```json
[
  {
    "_id": "websocket-config",
    "name": "WebSocket Server",
    "description": "Real-time WebSocket connection",
    "data": {
      "protocol": "wss",
      "host": "ws.example.com",
      "port": 443,
      "apiKey": "ws-api-key",
      "autoReconnect": true,
      "reconnectDelay": 5000,
      "keepAliveInterval": 30000
    }
  }
]
```

### Database Configuration

```json
[
  {
    "_id": "database-prod",
    "name": "Production Database",
    "description": "PostgreSQL production database",
    "data": {
      "host": "db.example.com",
      "port": 5432,
      "database": "production_db",
      "username": "db_user",
      "password": "secure_password",
      "ssl": true,
      "poolSize": 10
    }
  }
]
```

### Custom Application Configuration

```json
[
  {
    "_id": "scada-system",
    "name": "SCADA System",
    "description": "Industrial control system",
    "data": {
      "protocol": "https",
      "host": "scada.facility.com",
      "port": 8443,
      "username": "operator",
      "password": "operator-pass",
      "rejectUnauthorized": false,
      "deviceIds": ["device-1", "device-2", "device-3"],
      "updateInterval": 1000,
      "features": {
        "alarms": true,
        "trends": true,
        "logs": false
      }
    }
  }
]
```

## Troubleshooting

### Configuration Not Loading

**Problem:** `context.config.targetEnvConfig` is `null`

**Solutions:**

1. **Check session creation** - Ensure a configuration was selected when the session was created
2. **Verify configs.json exists** - The file must be in the target environment's root directory
3. **Check file permissions** - The server process needs read access; it never writes to the file
4. **Check the target-environment log** - Loading failures never throw. They log and leave the environment with no configurations at all

### Connection Failures

**Problem:** Cannot connect to external API/service

**Solutions:**

1. **Check host/port** - Verify values are correct in `data`
2. **Test connectivity** - Use `curl` or similar to test from server:
   ```bash
   curl https://api.example.com/health
   ```
3. **Check authentication** - Verify API keys/credentials are correct

### Invalid JSON

**Problem:** Server fails to parse configs.json

**Solutions:**

- **Common JSON errors:**
  - Missing commas between properties
  - Trailing commas in arrays/objects
  - Unquoted property names
  - Single quotes instead of double quotes
  - Unclosed brackets/braces

## Related Documentation

- **[configs.json Reference](./configs-json.md)** - Complete schema and technical details
- **[REST API](./rest-api.md)** - RESTful HTTP client using configurations
- **[Context API](./context-api.md)** - Complete context object reference
- **[Creating Target Environments](../guides/creating-target-environments.md)** - Step-by-step setup guide
- **[External API Integration](../guides/external-api-integration.md)** - Connecting to external systems
- **[Quickstart Guide](../quickstart.md)** - Get started in 5 minutes
