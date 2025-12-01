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

```
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

### Required Fields

- **\_id** (string): Unique identifier for this configuration
- **name** (string): Display name shown to users in the UI
- **description** (string): Description of this configuration's purpose
- **data** (object): Your custom configuration data

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
    "wsProtocol": "wss",
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

**Using CLI (Recommended):**

```bash
# Linux/macOS/WSL
./cli.sh config generate your-environment

# Then edit the generated file
vim integration/target-env/your-environment/configs.json
```

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

> 🔒 **Security Tip:** Consider setting restrictive file permissions to protect sensitive data in your configs.json file.

## Configuration Properties

The properties you include in `data` depend on your target environment's needs. Here are common patterns:

### REST API Properties

**protocol**

- Type: `'http' | 'https'`
- Default: `'http'`
- Format: Protocol name only (no `://`)

**host**

- Type: `string` (domain or IP)
- Example: `'api.example.com'`, `'192.168.1.100'`

**port**

- Type: `number`
- Default: `80` for HTTP, `443` for HTTPS
- Example: `3000`, `8080`

**username/password**

- Type: `string`
- For HTTP Basic Authentication
- Example: `"username": "admin"`, `"password": "secret"`

**apiKey**

- Type: `string`
- For token-based authentication
- Example: `"apiKey": "sk-1234567890abcdef"`

**rejectUnauthorized**

- Type: `boolean`
- Default: `true`
- Controls TLS certificate validation

### WebSocket Properties

**protocol**

- Type: `'ws' | 'wss'`
- Default: `'ws'`
- WebSocket protocol

**host**

- Type: `string` (domain or IP)
- Example: `'api.example.com'`, `'192.168.1.100'`

**port**

- Type: `number`
- Default: `80` for ws, `443` for wss
- Example: `3000`, `8080`

**rejectUnauthorized**

- Type: `boolean`
- Default: `true`
- Controls TLS certificate validation

**connectTimeout**

- Type: `number`
- Default: `5000` (milliseconds)
- Timeout for establishing connections

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
2. **METIS loads the selected config** and makes it available via context
3. **All session members** use the same configuration
4. **Configuration persists** for the session's lifetime

### UI Experience

```
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
export default new TargetSchema({
  _id: 'send-alert',
  name: 'Send Alert',
  description: 'Send an alert to the API',
  script: async (context) => {
    // Check if configuration is selected
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected for this session.')
    }

    // Access configuration data
    const config = context.config.targetEnvConfig.data

    // Use with REST API
    const api = RestApi.fromConfig(config)
    const response = await api.post('/alerts', {
      message: 'Alert message',
      severity: 'high',
    })

    context.sendOutput(`Alert sent: ${response.data.id}`)
  },
})
```

### Configuration Structure in Context

```typescript
context.config.targetEnvConfig = {
  _id: 'production-config',
  name: 'Production',
  description: 'Production API configuration',
  data: {
    protocol: 'https',
    host: 'api.example.com',
    apiKey: 'your-key-here',
    // ... your configuration properties
  },
}
```

### Handling Missing Configuration

Always check if a configuration is selected:

```typescript
script: async (context) => {
  const { config } = context

  if (!config.targetEnvConfig) {
    throw new Error(
      'No configuration selected. ' +
        'Please select a configuration when creating the session.',
    )
  }

  // Safe to use config now
  const api = RestApi.fromConfig(config.targetEnvConfig.data)
  // ...
}
```

### Using Configuration with REST API

```typescript
import { RestApi } from '@metis/api/RestApi'

script: async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No configuration selected.')
  }

  // Create API client from configuration
  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  // Make requests
  const users = await api.get('/users')
  const device = await api.post('/devices', { name: 'Device 1' })

  context.sendOutput(`Found ${users.data.length} users`)
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

> _For Windows or other operating systems, consult your OS documentation for setting file permissions that restrict read/write access to the file owner only._

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
3. **Ensure METIS can read and write to the file**: Verify the server process has appropriate access
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
      "wsProtocol": "wss",
      "host": "ws.example.com",
      "port": 443,
      "apiKey": "ws-api-key",
      "reconnect": true,
      "reconnectInterval": 5000,
      "heartbeatInterval": 30000
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

**Problem:** `context.config.targetEnvConfig` is `undefined`

**Solutions:**

1. **Check session creation** - Ensure instructor selected a configuration when creating the session
2. **Verify configs.json exists** - File must be in target environment root directory
3. **Check file permissions** - Should be `-rw-------` or similar to allow METIS server read/write access

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
- **[Quickstart Guide](../quickstart.md)** - Get started in 10 minutes
