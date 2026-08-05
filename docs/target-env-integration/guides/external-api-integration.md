# External API Integration

Most target environments exist to talk to something outside METIS. This guide covers connecting to an HTTP API with the `RestApi` client — authenticating, making requests, handling failures, and pacing calls so a session is not held up.

## Table of Contents

- [Overview](#overview)
- [Setting Up](#setting-up)
- [Authentication](#authentication)
- [Common Request Patterns](#common-request-patterns)
- [Error Handling](#error-handling)
- [Rate Limiting and Retries](#rate-limiting-and-retries)
- [Security Considerations](#security-considerations)
- [Complete Example](#complete-example)
- [Related Documentation](#related-documentation)

## Overview

Connection details live in `configs.json` and a session manager picks which configuration a session uses. Your script reads the selected configuration, builds a client from it, and makes requests.

- **`RestApi`** builds a base URL and applies TLS settings from the configuration
- **`context.config.targetEnvConfig`** is the selected configuration, or `null` when none was chosen
- **Credentials are yours to attach** — the client takes none and applies no scheme

## Setting Up

The environment schema, in `integration/target-env/my-service/schema.ts`:

```typescript
const MyService = new TargetEnvSchema({
  name: 'My Service Integration',
  description: 'Integration with My Service API',
  version: '1.0.0',
})

export default MyService
```

Connection details, in `integration/target-env/my-service/configs.json`:

```json
[
  {
    "_id": "my-service-production",
    "name": "Production API",
    "description": "Production environment configuration",
    "data": {
      "protocol": "https",
      "host": "api.myservice.com",
      "port": 443,
      "apiKey": "your-api-key-here",
      "rejectUnauthorized": true
    }
  }
]
```

> **Tip:** Keep `configs.json` readable only by the server's owner, and never commit real credentials. See the [configs.json Reference](../references/configs-json.md).

## Authentication

> **Important:** `RestApi` takes no credentials. It does not know your service's scheme and will not invent one, so a call to `api.get('/protected')` on a fresh client is unauthenticated and will be rejected.

Set what the service expects on `api.config` once, after building the client. Values in `data` are typed `unknown`, so narrow before use:

```typescript
let api = RestApi.fromConfig(context.config.targetEnvConfig.data)

let { apiKey } = context.config.targetEnvConfig.data
if (typeof apiKey !== 'string') {
  throw new Error('The selected configuration has no API key.')
}

// Whichever one the service expects.
api.config.headers.common['X-API-Key'] = apiKey
api.config.headers.common.Authorization = `Bearer ${apiKey}`
api.config.auth = { username: 'reporting', password: apiKey }

// Every request from here on carries it.
await api.get('/users')
await api.post('/users', { name: 'Jane Doe' })
```

Credentials do not have to live in `configs.json`. Reading them from the server's environment keeps them out of the file altogether, at the cost of the per-session switching a config gives you:

```typescript
api.config.headers.common.Authorization = `Bearer ${process.env.MY_SERVICE_TOKEN}`
```

A scheme that has to run per request — signing the body, refreshing an expired token — goes in an interceptor instead:

```typescript
api.client.interceptors.request.use((request) => {
  request.headers.set('X-Signature', sign(request.data))
  return request
})
```

## Common Request Patterns

Every method returns an axios response, so the body is on `.data`. Pass the argument values your parameters produced straight into the path or body.

```typescript
import { RestApi } from '@metis/api/RestApi'

const ManageUsers = TargetSchema.create({
  _id: 'manage-users',
  name: 'Manage Users',
  description: 'Read, create, update, and remove users in the external service.',
  script: async (context, { notify, operation, userId, name }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected for this session.')
    }

    let api = RestApi.fromConfig(context.config.targetEnvConfig.data)
    let { apiKey } = context.config.targetEnvConfig.data
    if (typeof apiKey !== 'string') {
      throw new Error('The selected configuration has no API key.')
    }
    api.config.headers.common['X-API-Key'] = apiKey

    switch (operation) {
      case 'read': {
        let response = await api.get(`/users/${userId}`)
        context.sendOutput(`Found user: ${response.data.name}`, notify)
        break
      }
      case 'create': {
        let response = await api.post('/users', { name })
        context.sendOutput(`Created user ${response.data.id}`, notify)
        break
      }
      case 'update': {
        await api.patch(`/users/${userId}`, { name })
        context.sendOutput(`Updated user ${userId}`, notify)
        break
      }
      case 'remove': {
        await api.delete(`/users/${userId}`)
        context.sendOutput(`Removed user ${userId}`, notify)
        break
      }
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'users',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'operation',
      name: 'Operation',
      type: 'dropdown',
      required: true,
      groupingId: 'users',
      default: 'read',
      options: [
        { _id: 'read', name: 'Read', value: 'read' },
        { _id: 'create', name: 'Create', value: 'create' },
        { _id: 'update', name: 'Update', value: 'update' },
        { _id: 'remove', name: 'Remove', value: 'remove' },
      ],
    },
    {
      _id: 'userId',
      name: 'User ID',
      type: 'string',
      required: true,
      groupingId: 'users',
      default: '',
      dependencies: [TargetDependency.EQUALS_SOME('operation', ['read', 'update', 'remove'])],
    },
    {
      _id: 'name',
      name: 'Full Name',
      type: 'string',
      required: true,
      groupingId: 'users',
      default: 'Jane Doe',
      dependencies: [TargetDependency.EQUALS_SOME('operation', ['create', 'update'])],
    },
  ],
})

export default ManageUsers
```

Note that `userId` and `name` declare dependencies, so both arrive as possibly `undefined` — the `switch` reaches each only on the branch where it is shown.

## Error Handling

Axios rejects on any non-2xx status. The thrown value is typed `unknown`, so use axios's own type guard rather than casting:

```typescript
import axios from 'axios'

try {
  let response = await api.get(`/users/${userId}`)
  context.sendOutput(`Retrieved ${response.data.name}`, notify)
} catch (error) {
  if (!axios.isAxiosError(error) || !error.response) {
    throw new Error('Could not reach the user service.')
  }

  switch (error.response.status) {
    case 401:
      throw new Error('The configured credentials were rejected.')
    case 403:
      throw new Error('The configured credentials lack permission for this call.')
    case 404:
      throw new Error(`No user exists with ID "${userId}".`)
    case 429:
      throw new Error('The user service is rate limiting this integration.')
    default:
      throw new Error(`The user service returned ${error.response.status}.`)
  }
}
```

Throwing stops the effect and surfaces the message. Catching an error only to send output and continue leaves the effect looking successful when it was not.

## Rate Limiting and Retries

Timers are blocked inside target-environment code — calling `setTimeout` or `setInterval` throws, pointing you at `context.sleep` instead. Use it to pace calls or to back off after a rejection:

```typescript
// Space out a batch so a rate-limited service is not overwhelmed.
// `userList` here is a large-string parameter holding one ID per line.
let userIds = userList.split('\n').filter((line) => line.trim().length > 0)

for (let userId of userIds) {
  await api.get(`/users/${userId}`)
  await context.sleep(200)
}
```

```typescript
// Back off and retry once when the service reports a rate limit.
let response
try {
  response = await api.get('/users')
} catch (error) {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) throw error
  await context.sleep(2000)
  response = await api.get('/users')
}
```

`context.sleep` is aware of the session around it: if the session is cleaned up while a script is sleeping, the sleep resolves early rather than holding teardown open for the full duration. That is the reason to use it over any timer of your own, beyond the fact that timers are blocked.

Keep total run time in mind. An effect's script runs as part of a session, so a long chain of paced requests delays whatever triggered it.

## Security Considerations

Validate anything a mission author typed before putting it into a request path or body:

```typescript
let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailPattern.test(email)) {
  throw new Error('Enter a valid email address.')
}

await api.post('/users', { email: email.toLowerCase().trim() })
```

A `pattern` and `title` on the parameter itself catches most of this in the interface before the script ever runs — see [string validation](parameter-and-argument-types.md#string). Keep the script-side check anyway for values saved before you added the pattern.

Other things worth holding to:

- **Never log a credential.** `sendOutput` goes to session participants.
- **Keep secrets in `configs.json`**, not in the target's source, so they are never in version control and never reach the browser.
- **Leave `rejectUnauthorized` at its default** except against a development server with a self-signed certificate.

## Complete Example

```typescript
import { RestApi } from '@metis/api/RestApi'
import axios from 'axios'

const CreateUser = TargetSchema.create({
  _id: 'create-user',
  name: 'Create User',
  description: 'Creates a new user account in the user service.',
  script: async (context, { notify, name, email, role }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No configuration selected for this session.')
    }

    let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      throw new Error('Enter a valid email address.')
    }

    let api = RestApi.fromConfig(context.config.targetEnvConfig.data)
    let { apiKey } = context.config.targetEnvConfig.data
    if (typeof apiKey !== 'string') {
      throw new Error('The selected configuration has no API key.')
    }
    api.config.headers.common['X-API-Key'] = apiKey
    api.config.headers.common['X-Request-Source'] = 'METIS'

    context.sendOutput(`Creating user account for ${name}...`, notify)

    let newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      createdAt: new Date().toISOString(),
      createdBy: context.triggeredBy?.username ?? 'session',
    }

    try {
      let response = await api.post('/users', newUser)
      context.sendOutput(`User created with ID ${response.data.id}`, notify)
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        throw new Error('Could not reach the user service.')
      }

      switch (error.response.status) {
        case 400:
          throw new Error('The user service rejected the account details.')
        case 409:
          throw new Error(`A user already exists with the email "${email}".`)
        case 429:
          throw new Error('The user service is rate limiting this integration.')
        default:
          throw new Error(`The user service returned ${error.response.status}.`)
      }
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'account',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'name',
      name: 'Full Name',
      type: 'string',
      required: true,
      groupingId: 'account',
      default: 'Jane Doe',
      tooltipDescription: "The user's full name.",
    },
    {
      _id: 'email',
      name: 'Email Address',
      type: 'string',
      required: true,
      groupingId: 'account',
      default: 'jane.doe@example.com',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      title: 'Enter a valid email address.',
      tooltipDescription: 'Valid email address for the user.',
    },
    {
      _id: 'role',
      name: 'User Role',
      type: 'dropdown',
      required: true,
      groupingId: 'account',
      default: 'user',
      options: [
        { _id: 'admin', name: 'Administrator', value: 'admin' },
        { _id: 'user', name: 'Standard User', value: 'user' },
        { _id: 'viewer', name: 'Read Only', value: 'viewer' },
      ],
    },
  ],
})

export default CreateUser
```

`context.triggeredBy` is the session member whose action ran the effect. It is `null` for an effect on a session lifecycle trigger, since nobody triggered it directly — hence the fallback.

## Related Documentation

- **[REST API Reference](../references/rest-api.md)** - Every `RestApi` method and configuration property
- **[WebSocket API Reference](../references/websocket-api.md)** - Persistent connections instead of request/response
- **[Environment Configuration](../references/environment-configuration.md)** - Every property a configuration can carry
- **[configs.json Reference](../references/configs-json.md)** - The configuration file and how it loads
- **[Context API](../references/context-api.md)** - `sleep`, `sendOutput`, and the rest of the runtime
- **[Parameter and Argument Types](parameter-and-argument-types.md)** - Declaring the inputs a script receives
