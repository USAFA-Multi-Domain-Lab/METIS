# configs.json Reference

The `configs.json` file is the core configuration system for target environments in METIS. It allows you to define multiple named configurations for a single target environment, enabling users to select which configuration to use when launching a session.

## Table of Contents

- [Overview](#overview)
- [File Location](#file-location)
- [Schema](#schema)
- [Creating Configurations](#creating-configurations)
- [Security & Permissions](#security--permissions)
- [Using Configurations in Target Scripts](#using-configurations-in-target-scripts)
- [Session Configuration Selection](#session-configuration-selection)
- [CLI Generation](#cli-generation)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

Each target environment can have multiple configurations (e.g., development, staging, production), and session managers select which one to use when launching a session.

**Key Features:**

- **Multiple Configurations**: Define dev, staging, and production configs in one file
- **Session-Scoped**: Each session can use a different configuration
- **Runtime Selection**: Session managers choose configuration at session launch time

- **Secure by Default**: File permissions enforced (600) to protect sensitive data
- **Type-Safe**: Schema validation ensures data integrity

## File Location

Place `configs.json` in your target environment's root directory:

```
integration/target-env/
  my-environment/
    schema.ts
    configs.json       ← Configuration file
    targets/
      ...
```

## Schema

### Configuration Object Structure

```typescript
{
  _id: string           // Unique identifier for this config
  name: string          // Display name shown to users
  targetEnvId: string   // Auto-populated by METIS (folder name)
  description?: string  // Optional description
  data: object          // Configuration data (API keys, URLs, etc.)
}
```

### Complete Example

```json
[
  {
    "_id": "my-env-production",
    "name": "Production API",
    "description": "Production environment configuration",
    "data": {
      "protocol": "https",
      "host": "api.production.example.com",
      "port": 443,
      "apiKey": "prod-api-key-xyz",
      "rejectUnauthorized": true,
      "timeout": 30000
    }
  },
  {
    "_id": "my-env-staging",
    "name": "Staging API",
    "description": "Staging environment for testing",
    "data": {
      "protocol": "https",
      "host": "api.staging.example.com",
      "port": 443,
      "apiKey": "staging-api-key-abc",
      "rejectUnauthorized": false,
      "timeout": 10000
    }
  },
  {
    "_id": "my-env-local",
    "name": "Local Development",
    "description": "Local development server",
    "data": {
      "protocol": "http",
      "host": "localhost",
      "port": 3000,
      "apiKey": "dev-key",
      "rejectUnauthorized": false
    }
  }
]
```

## Creating Configurations

### Minimum Required Fields

```json
[
  {
    "_id": "unique-config-id",
    "name": "Configuration Name",
    "data": {}
  }
]
```

### Configuration ID Guidelines

- Use kebab-case: `my-env-production`
- Include environment name for clarity
- Keep unique across all configs
- Avoid special characters

### Data Object

The `data` object is completely flexible - structure it based on your needs:

**For REST APIs:**

```json
"data": {
  "protocol": "https",
  "host": "api.example.com",
  "port": 443,
  "apiKey": "secret-key",
  "rejectUnauthorized": true
}
```

**For WebSocket APIs:**

```json
"data": {
  "protocol": "wss",
  "host": "ws.example.com",
  "port": 8443,
  "apiKey": "secret-key",
  "connectTimeout": 10000,
  "rejectUnauthorized": true
}
```

**For Database Connections:**

```json
"data": {
  "host": "db.example.com",
  "port": 5432,
  "database": "mydb",
  "username": "dbuser",
  "password": "dbpass",
  "ssl": true
}
```

**For Custom Integrations:**

```json
"data": {
  "endpoint": "https://custom-api.com",
  "credentials": {
    "username": "user",
    "password": "pass"
  },
  "options": {
    "retryAttempts": 3,
    "timeout": 5000
  }
}
```

## Security & Permissions

### File Permissions

**Critical:** `configs.json` must have proper permissions to protect sensitive data.

```bash
# Required permissions (read/write for owner only)
chmod 600 integration/target-env/my-environment/configs.json
```

**What Happens Without Proper Permissions:**

- **Server startup**: METIS will crash with `ConfigPermissionError`
- **Security risk**: Sensitive data exposed to other system users

### What Gets Exposed to Client

**Server-side:**

```typescript
// Full data available on server
context.config.targetEnvConfig.data
// { protocol: "https", host: "...", apiKey: "secret", ... }
```

**Client-side:**

```typescript
// Empty object sent to browser (security)
session.config.targetEnvConfig.data
// {}
```

### Best Practices

1. **Never commit real credentials** to version control
2. **Use different configs** for each environment
3. **Rotate API keys** regularly
4. **Set file permissions** to 600
5. **Document required fields** for your team
6. **Use descriptive names** for each config

## Using Configurations in Target Scripts

### Accessing Selected Configuration

```typescript
import { RestApi } from '@metis/api/RestApi'

export default new TargetSchema({
  _id: 'my-target',
  name: 'My Target',
  script: async (context) => {
    // Get the configuration selected for this session
    const { config } = context

    // Check if a configuration was selected
    if (!config.targetEnvConfig) {
      throw new Error(
        'No target environment configuration selected for this session.',
      )
    }

    // Access the configuration data
    const configData = config.targetEnvConfig.data

    // Use configuration with API clients
    const api = RestApi.fromConfig(configData)

    // Or access specific fields
    const apiKey = configData.apiKey
    const endpoint = `${configData.protocol}://${configData.host}:${configData.port}`
  },
})
```

### Configuration Properties

```typescript
context.config.targetEnvConfig = {
  _id: string           // Selected configuration ID
  name: string          // Configuration display name
  targetEnvId: string   // Target environment ID
  description?: string  // Optional description
  data: object          // Your configuration data
}
```

### Handling Missing Configurations

```typescript
script: async (context) => {
  const { config } = context

  // Check if ANY config was selected
  if (!config.targetEnvConfig) {
    context.sendOutput('⚠️ No configuration selected. Using default behavior.')
    // Provide fallback behavior or throw error
    return
  }

  // Check for specific required fields
  const { data } = config.targetEnvConfig
  if (!data.apiKey) {
    throw new Error('API key not found in configuration.')
  }

  // Proceed with configured operation
  const api = RestApi.fromConfig(data)
  // ...
}
```

## Session Configuration Selection

### How Users Select Configurations

When launching a session, users see a dropdown with all available configurations for each target environment used in the mission:

1. **Mission Creation**: Mission planner includes effects from various target environments
2. **Session Launch**: Session manager selects which configuration to use for each target environment
3. **Session Execution**: Selected configuration available via `context.config.targetEnvConfig`

### Configuration Availability

```typescript
// Server determines available configs for each target environment
targetEnvironment.configs // Array of all configs from configs.json
```

### Default Behavior

If no `configs.json` exists:

- `context.config.targetEnvConfig` will be `null`
- Target scripts should handle this gracefully
- Provide fallback behavior or clear error messages

## CLI Generation

METIS provides a CLI tool to generate `configs.json` files with proper permissions:

```bash
# Generate new configs.json
./cli.sh config create my-environment

# This will:
# 1. Create integration/target-env/my-environment/configs.json
# 2. Set permissions to 600 automatically
# 3. Generate template configuration
# 4. Prompt to add to .gitignore
```

### Generated Template

```json
[
  {
    "_id": "my-environment-default",
    "name": "Default Configuration",
    "description": "Default configuration for my-environment",
    "data": {
      "protocol": "https",
      "host": "api.example.com",
      "port": 443,
      "apiKey": "your-api-key-here",
      "rejectUnauthorized": true
    }
  }
]
```

## Best Practices

### Naming Conventions

```json
// Good: Clear, descriptive, environment-specific
"_id": "traffic-control-production"
"name": "Traffic Control - Production"

// Bad: Vague, no context
"_id": "config1"
"name": "Config"
```

### Configuration Organization

```json
[
  {
    "_id": "my-env-prod",
    "name": "Production",
    "description": "Production API with high availability",
    "data": {
      "primary": {
        "host": "api1.example.com",
        "port": 443
      },
      "fallback": {
        "host": "api2.example.com",
        "port": 443
      },
      "apiKey": "prod-key",
      "options": {
        "retryAttempts": 3,
        "timeout": 30000
      }
    }
  }
]
```

## Examples

### Multi-Environment Setup

```json
[
  {
    "_id": "weather-api-prod",
    "name": "Weather API - Production",
    "description": "Production weather service",
    "data": {
      "protocol": "https",
      "host": "api.weather.com",
      "port": 443,
      "apiKey": "prod-key-xyz",
      "endpoints": {
        "current": "/v1/current",
        "forecast": "/v1/forecast"
      }
    }
  },
  {
    "_id": "weather-api-dev",
    "name": "Weather API - Development",
    "description": "Development sandbox",
    "data": {
      "protocol": "http",
      "host": "localhost",
      "port": 8080,
      "apiKey": "dev-key-123",
      "endpoints": {
        "current": "/api/current",
        "forecast": "/api/forecast"
      }
    }
  }
]
```

### Database Configuration

```json
[
  {
    "_id": "postgres-prod",
    "name": "PostgreSQL - Production",
    "data": {
      "host": "db.production.com",
      "port": 5432,
      "database": "production_db",
      "username": "prod_user",
      "password": "secure-password",
      "ssl": true,
      "pool": {
        "min": 2,
        "max": 10
      }
    }
  }
]
```

## Troubleshooting

### Configuration Not Available

**Problem:** `context.config.targetEnvConfig` is `null`

**Solutions:**

1. Check if `configs.json` exists in target environment directory
2. Verify JSON is valid (no syntax errors)
3. Ensure user selected a configuration when launching session
4. Restart server to reload configurations

### Permission Errors

**Problem:** Server crashes with `ConfigPermissionError`

**Solution:**

```bash
chmod 600 integration/target-env/my-environment/configs.json
```

### Configuration Not Loading

**Problem:** Changes to `configs.json` not reflected

**Solution:**

- Restart METIS server to reload configurations
- Configuration changes apply to new sessions only
- End current session and start new one to see changes
- Check server logs for loading errors

### Validation Errors

**Problem:** Server logs configuration validation errors

**Solutions:**

1. Ensure `_id` is unique across all configs
2. Verify `name` is not empty
3. Check JSON syntax is valid
4. Confirm `data` object structure matches your needs

## Related Documentation

- **[Creating Target Environments](../guides/creating-target-environments.md)** - Setup guide
- **[REST API Reference](./rest-api.md)** - Using RestApi with configs
- **[Context API Reference](./context-api.md)** - Accessing context.config
- **[External API Integration](../guides/external-api-integration.md)** - Integration patterns
