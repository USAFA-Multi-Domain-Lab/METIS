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
- [Related Documentation](#related-documentation)

## Overview

Each target environment can have multiple configurations (e.g., development, staging, production), and session managers select which one to use when launching a session.

**Key Features:**

- **Multiple Configurations**: Define dev, staging, and production configs in one file
- **Session-Scoped**: Each session can use a different configuration
- **Runtime Selection**: Session managers choose configuration at session launch time
- **Reloaded From Disk**: Edits take effect without restarting the server
- **Security Recommendations**: Guidance for protecting sensitive configuration data
- **Type-Safe**: Schema validation ensures data integrity

> **Note:** A session stores the **ID** of the configuration that was selected, not a
> copy of it. The file is re-read whenever a script reads
> `context.config.targetEnvConfig`, so edits reach running sessions as well as new
> ones — as long as the `_id` stays the same.

## File Location

Place `configs.json` in your target environment's root directory:

```text
integration/target-env/
  my-environment/
    schema.ts
    configs.json       ← Configuration file
    targets/
      ...
```

## Schema

### Configuration Object Structure

| Property      | Required | Notes                                                             |
| ------------- | -------- | ----------------------------------------------------------------- |
| `_id`         | Yes      | Unique identifier for this config. Cannot be empty                |
| `name`        | Yes      | Display name shown to session managers. Cannot be empty           |
| `targetEnvId` | No       | Set by METIS from the environment's folder name — do not write it |
| `description` | No       | Defaults to an empty string                                       |
| `data`        | No       | Configuration data. Defaults to `{}`                              |

The file itself must be a JSON **array** of these objects, even for a single configuration.

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

> **Note:** `RestApi` reads only the properties listed in the
> [Environment Configuration](environment-configuration.md) reference. Anything else
> in `data` is ignored by the client and left for your script to read — a per-request
> `timeout`, for instance, is passed to the request rather than set here.

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

> **Security Recommendation:** Protect your `configs.json` files with appropriate file permissions to prevent unauthorized access to sensitive data. Ensure the METIS server process has read access.

**Setting Restrictive Permissions:**

Use your operating system's file permission tools to restrict access to the `configs.json` file:

```bash
# Example for Linux/macOS
chmod 600 integration/target-env/my-environment/configs.json
```

> **Note:** _For Windows or other operating systems, consult your OS documentation for setting file permissions that restrict read/write access to the file owner only._

**Security Considerations:**

- Restrictive permissions prevent unauthorized users from reading sensitive credentials
- Protects API keys, passwords, and other confidential connection details
- METIS server process must have read access to load configurations

### What Gets Exposed to Client

| Where                          | `targetEnvConfig.data` holds                                             |
| ------------------------------ | ------------------------------------------------------------------------ |
| Server, inside a target script | The full object — `{ protocol: 'https', host: '...', apiKey: 'secret' }` |
| Client, in the browser         | `{}` — always empty, whatever the file contains                          |

Stripping happens on the way out, so a value that never leaves `data` never reaches a browser.

### Best Practices

1. **Never commit real credentials** to version control
2. **Use different configs** for each environment
3. **Rotate API keys** regularly
4. **Secure file permissions** to protect sensitive data
5. **Ensure the METIS server process can read the file** — it never writes to it
6. **Document required fields** for your team
7. **Use descriptive names** for each config

## Using Configurations in Target Scripts

### Accessing Selected Configuration

```typescript
import { RestApi } from '@metis/api/RestApi'

const MyTarget = TargetSchema.create({
  _id: 'my-target',
  name: 'My Target',
  description: 'Reads the configuration selected for the session.',
  script: async (context) => {
    // Get the configuration selected for this session
    let { config } = context

    // Check if a configuration was selected
    if (!config.targetEnvConfig) {
      throw new Error(
        'No target environment configuration selected for this session.',
      )
    }

    // Access the configuration data
    let configData = config.targetEnvConfig.data

    // Use configuration with API clients
    let api = RestApi.fromConfig(configData)
    void api

    // Or access specific fields. Values are typed `unknown`, so narrow
    // them before use.
    let apiKey = configData.apiKey
    void apiKey
  },
  parameters: [],
})

export default MyTarget
```

### Configuration Properties

| Property      | Type                      | Notes                                                       |
| ------------- | ------------------------- | ----------------------------------------------------------- |
| `_id`         | `string`                  | The selected configuration's ID                             |
| `name`        | `string`                  | Display name shown to session managers                      |
| `targetEnvId` | `string`                  | Set by METIS from the environment's folder name             |
| `description` | `string`                  | Empty string when the file omits it                         |
| `data`        | `Record<string, unknown>` | Your configuration data. Values are `unknown` — narrow them |

### Handling Missing Configurations

```typescript
script: async (context, { notify }) => {
  let { config } = context

  // Check if ANY config was selected
  if (!config.targetEnvConfig) {
    context.sendOutput(
      'No configuration selected. Using default behavior.',
      notify,
    )
    // Provide fallback behavior or throw an error
    return
  }

  // Check for specific required fields
  let { data } = config.targetEnvConfig
  if (!data.apiKey) {
    throw new Error('API key not found in configuration.')
  }

  // Proceed with configured operation
  let api = RestApi.fromConfig(data)
  void api
}
```

## Session Configuration Selection

### How Users Select Configurations

When launching a session, users see a dropdown with all available configurations for each target environment used in the mission:

1. **Mission Creation**: Mission planner includes effects from various target environments
2. **Session Launch**: Session manager selects which configuration to use for each target environment
3. **Session Execution**: Selected configuration available via `context.config.targetEnvConfig`

### Configuration Availability

The dropdown lists every configuration the environment's `configs.json` currently
contains. The file is read at that moment rather than cached at startup, so a
configuration added while the server is running shows up without a restart.

### Default Behavior

If no `configs.json` exists, or none was selected:

- `context.config.targetEnvConfig` is `null`
- Target scripts should handle this gracefully
- Provide fallback behavior or a clear error message

## CLI Generation

METIS provides a CLI tool to generate `configs.json` files:

```bash
metis config generate <target-env-id>
```

The command creates `integration/target-env/<target-env-id>/configs.json` with a template configuration. If the file already exists, it asks before overwriting.

> **Tip:** After generation, consider setting restrictive file permissions (see Security & Permissions section for guidance).

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

## Related Documentation

- **[Creating Target Environments](../guides/creating-target-environments.md)** - Setup guide
- **[REST API Reference](./rest-api.md)** - Using RestApi with configs
- **[Context API Reference](./context-api.md)** - Accessing context.config
- **[External API Integration](../guides/external-api-integration.md)** - Integration patterns
