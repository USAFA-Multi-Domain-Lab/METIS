# External API Integration

This guide covers common patterns and best practices for integrating METIS target environments with external APIs and services. Learn how to make HTTP requests, handle authentication, manage errors, and implement robust external integrations.

## Table of Contents

- [Overview](#overview)
- [Setting Up REST API Clients](#setting-up-rest-api-clients)
- [Authentication Patterns](#authentication-patterns)
- [Common API Patterns](#common-api-patterns)
- [Error Handling](#error-handling)
- [Rate Limiting & Performance](#rate-limiting--performance)
- [Security Considerations](#security-considerations)
- [Complete Example](#complete-example)
- [Related Documentation](#related-documentation)

## Overview

Most target environments need to interact with external systems through APIs. METIS provides built-in support for REST APIs through the `RestApi` class, which handles connection management, authentication, and common HTTP operations.

### What You'll Learn

- How to configure REST API clients
- Common authentication methods
- Request/response patterns
- Error handling strategies
- Security best practices

## Setting Up REST API Clients

### Basic REST Client Setup

First, configure your REST client in your target environment schema:

```typescript
// integration/target-env/my-service/schema.ts
import TargetEnvSchema from '../../library/target-env-classes'
import { RestApi } from '../../library/api/rest-api'
import { loadConfig } from '../../library/config'

// Create a REST client for your service
export const MyServiceApi = RestApi.fromConfig(loadConfig())

export default new TargetEnvSchema({
  name: 'My Service Integration',
  description: 'Integration with My Service API',
  version: '1.0.0',
})
```

### Environment Configuration

Configure the connection details in your `.env` file:

```bash
# For target environment "my-service"
MY_SERVICE_PROTOCOL="https"
MY_SERVICE_HOST="api.myservice.com"
MY_SERVICE_PORT="443"
MY_SERVICE_API_KEY="your-api-key-here"
MY_SERVICE_REJECT_UNAUTHORIZED=true
```

> 💡 **Tip**: Use `.env` files for sensitive data like API keys and keep them out of version control.

## Authentication Patterns

### API Key Authentication

Most common pattern for service-to-service communication:

```typescript
// In your target script
script: async (context) => {
  try {
    const response = await MyServiceApi.get('/users')

    context.sendOutput(`Found ${response.data.length} users`)
    return response.data
  } catch (error) {
    context.sendOutput(`Error: ${error.message}`, 'error')
    throw error
  }
}
```

### Custom Headers

For services requiring custom authentication:

```typescript
script: async (context) => {
  const response = await MyServiceApi.get('/endpoint', {
    headers: {
      'X-API-Key': MyServiceApi.config.apiKey,
      'X-Client-Version': '1.0.0',
      'User-Agent': 'METIS/1.0',
    },
  })

  return response.data
}
```

## Common API Patterns

### GET Requests (Data Retrieval)

```typescript
script: async (context) => {
  const { userId } = context.effect.args

  context.sendOutput(`Fetching user data for ID: ${userId}`)

  const response = await MyServiceApi.get(`/users/${userId}`)

  context.sendOutput(`User found: ${response.data.name}`)

  return {
    success: true,
    user: response.data,
  }
}
```

### POST Requests (Data Creation)

```typescript
script: async (context) => {
  const { name, email, role } = context.effect.args

  context.sendOutput(`Creating new user: ${name}`)

  const newUser = {
    name,
    email,
    role,
    created_at: new Date().toISOString(),
  }

  const response = await MyServiceApi.post('/users', newUser)

  context.sendOutput(`User created with ID: ${response.data.id}`)
}
```

### PUT/PATCH Requests (Data Updates)

```typescript
script: async (context) => {
  const { userId, updates } = context.effect.args

  context.sendOutput(`Updating user ${userId}`)

  const response = await MyServiceApi.patch(`/users/${userId}`, updates)

  context.sendOutput('User updated successfully')
}
```

### DELETE Requests (Data Removal)

```typescript
script: async (context) => {
  const { userId } = context.effect.args

  context.sendOutput(`Deleting user ${userId}`)

  await MyServiceApi.delete(`/users/${userId}`)

  context.sendOutput('User deleted successfully')
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
script: async (context) => {
  const { userId } = context.effect.args

  try {
    context.sendOutput(`Fetching user ${userId}...`)

    const response = await MyServiceApi.get(`/users/${userId}`)

    context.sendOutput(`Successfully retrieved user: ${response.data.name}`)
  } catch (error) {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.message || error.message

      switch (status) {
        case 404:
          throw new Error('User not found')
        case 401:
          throw new Error('Invalid API credentials')
        case 403:
          throw new Error('Insufficient permissions')
        case 429:
          throw new Error('Rate limit exceeded')
        case 500:
          throw new Error(`Server error: ${message}`)
        default:
          throw new Error(`API error: ${message}`)
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network connection failed')
    } else {
      // Other error
      throw error
    }
  }
}
```

## Security Considerations

### Input Validation

```typescript
script: async (context) => {
  const { email } = context.effect.args

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }

  // Sanitize input for API
  const sanitizedEmail = email.toLowerCase().trim()

  const response = await MyServiceApi.post('/users', {
    email: sanitizedEmail,
  })

  return response.data
}
```

## Complete Example

Here's a complete example showing a user management target with proper error handling and patterns:

```typescript
// integration/target-env/user-service/targets/create-user/schema.ts
import TargetSchema from '../../../../library/target-env-classes/targets'
import { UserServiceApi } from '../../schema' // Import the API client

export default new TargetSchema({
  name: 'Create User',
  description: 'Creates a new user account in the user service',
  args: [
    {
      _id: 'name',
      name: 'Full Name',
      type: 'string',
      required: true,
      tooltipDescription: "The user's full name",
      default: 'Jane Doe',
    },
    {
      _id: 'email',
      name: 'Email Address',
      type: 'string',
      required: true,
      tooltipDescription: 'Valid email address for the user',
      default: 'jane.doe@example.com',
    },
    {
      _id: 'role',
      name: 'User Role',
      type: 'dropdown',
      required: true,
      default: { _id: 'user', name: 'Standard User', value: 'user' },
      dropdownItems: [
        { _id: 'admin', name: 'Administrator', value: 'admin' },
        { _id: 'user', name: 'Standard User', value: 'user' },
        { _id: 'viewer', name: 'Read Only', value: 'viewer' },
      ],
    },
  ],
  script: async (context) => {
    const { name, email, role } = context.effect.args
    const baseUrl = UserServiceApi.baseUrl

    try {
      // Validate input
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }

      context.sendOutput(`Creating user account for ${name}...`)

      try {
        // Check if user already exists
        context.sendOutput('Checking for existing user...')
        let user = await UserServiceApi.get(`${baseUrl}/users/${email}`)
        if (user) {
          throw new Error('User with this email already exists')
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error // Re-throw if not a "not found" error
        }
      }

      // User doesn't exist, continue with creation...

      // Create the user
      context.sendOutput('Creating new user account...')

      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role.value || role,
        created_at: new Date().toISOString(),
        created_by: context.user.username,
      }

      const response = await UserServiceApi.post(`${baseUrl}/users`, newUser, {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'METIS',
        },
      })

      const createdUser = response.data

      context.sendOutput(
        `✅ User created successfully with ID: ${createdUser.id}`,
      )
    } catch (error) {
      if (error.response) {
        const status = error.response.status
        const apiMessage = error.response.data?.message || 'Unknown API error'

        switch (status) {
          case 400:
            throw new Error(`Invalid user data: ${apiMessage}`)

          case 409:
            throw new Error('A user with this email already exists')

          case 429:
            throw new Error(
              'Too many requests - please wait before trying again',
            )

          default:
            throw new Error(`User service error: ${apiMessage}`)
        }
      } else {
        throw error
      }
    }
  },
})
```

## Related Documentation

- **[REST API Reference](../references/rest-api.md)** - Complete RestApi class documentation
- **[Environment Configuration](../references/environment-configuration.md)** - Configuration file reference
- **[Context API](../references/context-api.md)** - Complete context object reference
- **[Defining Targets](defining-targets.md)** - Target creation fundamentals
- **[Argument Types](argument-types.md)** - User input argument types
- **[Error Handling Best Practices](/docs/devs/error-handling.md)** - System-wide error handling
