# REST API Reference

The `RestApi` class is the primary tool for making HTTP requests from your target environment plugins to external services and APIs. This class handles authentication, connection configuration, and provides a simple interface for all standard HTTP methods.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [HTTP Methods](#http-methods)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The `RestApi` class automatically reads your [environment configuration](./environment-configuration.md) and sets up authenticated HTTP connections to target systems. It's designed to simplify API interactions while handling the complexities of authentication, SSL/TLS configuration, and connection management.

**Key Features:**

- Automatic environment configuration loading
- Built-in authentication (Basic Auth, API Key)
- SSL/TLS certificate handling
- Support for all standard HTTP methods
- Axios-based implementation for reliability

## Getting Started

### Import and Initialize

The `RestApi` class is used within your target scripts. You create instances using the configuration selected for the session:

```typescript
import { RestApi } from '@metis/api/RestApi'

script: async (context) => {
  // Get the selected configuration from the session
  const { config } = context
  if (!config.targetEnvConfig) {
    throw new Error('No target environment configuration selected.')
  }

  // Create REST API client with the selected config
  const api = RestApi.fromConfig(config.targetEnvConfig.data)

  // Use the API client
  await api.get('/endpoint')
}
```

Configuration is managed through `configs.json` files. See the [configs.json Reference](./configs-json.md) for complete configuration details.

### Basic Usage

```typescript
// Make a simple GET request
await api.get('https://api.example.com/data')

// POST data to an endpoint
await api.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com',
})
```

## Configuration

The `RestApi` class is configured using data from your target environment's `configs.json` file. During a session, users select which configuration to use, and that configuration is available via `context.config.targetEnvConfig.data`.

See the [configs.json Reference](./configs-json.md) for complete configuration details.

### Configuration Properties Used

- **`protocol`** - HTTP or HTTPS
- **`host`** - Server host or domain
- **`port`** - Connection port
- **`username`/`password`** - Basic authentication
- **`apiKey`** - API key authentication
- **`rejectUnauthorized`** - SSL certificate validation

### Accessing Configuration

```typescript
script: async (context) => {
  // Get config from session context
  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  // Access the computed base URL
  console.log(api.baseUrl) // e.g., "https://api.example.com:443"

  // Access the request configuration
  console.log(api.config) // Axios configuration object
}
```

## HTTP Methods

The `RestApi` class supports all standard HTTP methods with consistent interfaces:

### GET Requests

```typescript
// Basic GET
await api.get('/api/users')

// GET with custom headers
await api.get('/api/users', {
  headers: { 'Custom-Header': 'value' },
})
```

### POST Requests

```typescript
// POST with JSON data
await api.post('/api/users', {
  name: 'Jane Doe',
  role: 'admin',
})

// POST with custom configuration
await api.post('/api/users', userData, {
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})
```

### PUT Requests

```typescript
// Update a resource
await api.put('/api/users/123', {
  name: 'Updated Name',
  status: 'active',
})
```

### PATCH Requests

```typescript
// Partial update
await api.patch('/api/users/123', {
  status: 'inactive',
})
```

### DELETE Requests

```typescript
// Delete a resource
await api.delete('/api/users/123')

// Delete with confirmation headers
await api.delete('/api/users/123', {
  headers: { 'X-Confirm': 'true' },
})
```

## Authentication

Authentication is configured automatically based on your environment settings:

### Basic Authentication

When `username` and `password` are provided in configuration:

```typescript
// Automatically adds Authorization header
await api.get('/protected-endpoint')
```

### API Key Authentication

When `apiKey` is provided in configuration:

```typescript
// Automatically adds api-key header
await api.get('/protected-endpoint')
```

### Custom Authentication

For custom authentication needs, add headers to individual requests:

```typescript
await api.get('/endpoint', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'X-API-Version': '2.0',
  },
})
```

## Best Practices

### Configuration Management

- Store sensitive data (API keys, passwords) in `configs.json` files
- Use multiple configs for environments that run in parallel
- Protect `configs.json` with proper file permissions (chmod 600)
- Never commit `configs.json` files with real credentials to version control
- Access configuration via `context.config.targetEnvConfig.data` in target scripts

### Error Handling

- Always use try-catch blocks for API calls
- Log errors appropriately for debugging
- Implement retry logic for transient failures
- Validate responses before processing

### Performance

- Reuse the same `RestApi` instance when possible
- Set appropriate timeouts for long-running requests

## Examples

### Complete Target Example

```typescript
import { RestApi } from '@metis/api/RestApi'

export default new TargetSchema({
  _id: 'manage-user',
  name: 'Manage User',
  description: 'Create or update user in external system',
  script: async (context) => {
    const { action, userId, userData } = context.effect.args

    try {
      // Get configuration from session
      if (!context.config.targetEnvConfig) {
        throw new Error('No configuration selected for this session.')
      }

      // Initialize API client with selected configuration
      const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

      context.sendOutput(
        `${action === 'create' ? 'Creating' : 'Updating'} user...`,
      )

      // Perform API operation based on action
      let response
      if (action === 'create') {
        response = await api.post('/users', userData)
        context.sendOutput(`✓ User created: ${response.data.username}`)
      } else {
        response = await api.put(`/users/${userId}`, userData)
        context.sendOutput(`✓ User updated: ${response.data.username}`)
      }

      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || error.message
      context.sendOutput(`✗ Operation failed: ${message}`)
      throw error
    }
  },
  args: [
    {
      _id: 'action',
      name: 'Action',
      type: 'dropdown',
      required: true,
      options: [
        { _id: 'create', name: 'Create User', value: 'create' },
        { _id: 'update', name: 'Update User', value: 'update' },
      ],
    },
    {
      _id: 'userId',
      name: 'User ID',
      type: 'string',
      required: false,
      dependencies: [{ type: 'equals', argId: 'action', value: 'update' }],
    },
    {
      _id: 'userData',
      name: 'User Data (JSON)',
      type: 'largeString',
      required: true,
    },
  ],
})
```

### Error Handling Example

```typescript
script: async (context) => {
  const api = RestApi.fromConfig(context.config.targetEnvConfig.data)

  try {
    const response = await api.get('/api/data')
    context.sendOutput('✓ Data retrieved successfully')
    return response.data
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          context.sendOutput('✗ Authentication failed')
          break
        case 404:
          context.sendOutput('✗ Resource not found')
          break
        case 500:
          context.sendOutput('✗ Server error')
          break
        default:
          context.sendOutput(`✗ Request failed: ${error.response.status}`)
      }
    } else if (error.request) {
      // Request made but no response received
      context.sendOutput('✗ No response from server (network error)')
    } else {
      // Error setting up the request
      context.sendOutput(`✗ Request setup error: ${error.message}`)
    }
    throw error
  }
}
```

## Related Documentation

- **[configs.json Reference](./configs-json.md)** - Configuration file structure and management
- **[Context API Reference](./context-api.md)** - Complete context properties and methods
- **[External API Integration Guide](../guides/external-api-integration.md)** - Best practices for API integration
- **[Creating Target Environments](../guides/creating-target-environments.md)** - Setup guide for new integrations
