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

```typescript
import { RestApi } from '../../library/api/rest-api'
import { loadConfig } from '../../library/config'

// Recommended: Initialize with loadConfig()
const api = RestApi.fromConfig(loadConfig())
```

Environment variables are automatically loaded based on your target environment folder name. See the [Environment Configuration Reference](./environment-configuration.md#configuration-structure) for complete configuration details.

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

The `RestApi` class automatically loads configuration from your `.env` files using the `loadConfig()` function. See the [Environment Configuration Reference](./environment-configuration.md) for complete configuration details.

### Configuration Properties Used

- **`protocol`** - HTTP or HTTPS
- **`address`** - Server address or domain
- **`port`** - Connection port
- **`username`/`password`** - Basic authentication
- **`apiKey`** - API key authentication
- **`rejectUnauthorized`** - SSL certificate validation

### Accessing Configuration

```typescript
const api = RestApi.fromConfig(loadConfig())

// Access the computed base URL
console.log(api.baseUrl) // e.g., "https://api.example.com:443"

// Access the request configuration
console.log(api.config) // Axios configuration object
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

### Environment Configuration

- Store sensitive data (API keys, passwords) in `.env` files
- Use environment-specific configurations for dev/staging/production
- Never commit `.env` files to version control
- Use the `loadConfig()` function for automatic variable mapping

### Error Handling

- Always use try-catch blocks for API calls
- Log errors appropriately for debugging
- Implement retry logic for transient failures
- Validate responses before processing

### Performance

- Reuse the same `RestApi` instance when possible
- Set appropriate timeouts for long-running requests

## Examples

### Complete Plugin Example

```typescript
import { RestApi } from '../../library/api/rest-api'
import { loadConfig } from '../../library/config'

export class MyTargetEnvironment {
  private api: RestApi

  constructor() {
    // Initialize with environment configuration
    this.api = RestApi.fromConfig(loadConfig())
  }

  async fetchUserData(userId: string) {
    try {
      const response = await this.api.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch user data:', error.message)
      throw error
    }
  }

  async createUser(userData: any) {
    try {
      const response = await this.api.post('/users', userData)
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error('User already exists')
      }
      throw error
    }
  }

  async updateUserStatus(userId: string, status: string) {
    try {
      await this.api.patch(`/users/${userId}`, { status })
      return true
    } catch (error) {
      console.error('Failed to update user status:', error.message)
      return false
    }
  }
}
```

### Environment Configuration Example

```bash
# For target environment "my-target"
MY_TARGET_PROTOCOL="https"
MY_TARGET_HOST="api.myservice.com"
MY_TARGET_PORT="443"
MY_TARGET_API_KEY="your-secret-api-key"
MY_TARGET_REJECT_UNAUTHORIZED=true
```

## Related Documentation

- **[Environment Configuration](./environment-configuration.md)** - Complete configuration reference
- **[Context API](./context-api.md)** - Target environment context and metadata
- **[Creating Target Environments](../guides/creating-target-environments.md)** - Step-by-step plugin development guide
