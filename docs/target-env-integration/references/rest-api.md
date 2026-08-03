# REST API Reference

The `RestApi` class makes HTTP requests from a target environment to external services. It builds a base URL from the configuration selected for the session, applies TLS settings, and wraps axios for the standard HTTP methods.

## Table of Contents

- [Overview](#overview)
- [Creating a Client](#creating-a-client)
- [Configuration Properties](#configuration-properties)
  - [How the Base URL Is Built](#how-the-base-url-is-built)
- [HTTP Methods](#http-methods)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)
- [Related Documentation](#related-documentation)

## Overview

`RestApi` reads the configuration a session manager selected for the session and turns it into a ready-to-use HTTP client. It handles:

- Base URL construction from `protocol`, `host`, and `port`
- TLS certificate validation through `rejectUnauthorized`
- All five standard HTTP methods, each returning an axios response

> **Important:** `RestApi` does **not** handle authentication. There is no one way to authenticate against a REST service, so the class takes no credentials at all — you set whatever your service expects on `api.config` and it is sent with every request. See [Authentication](#authentication).

## Creating a Client

Build the client from the configuration selected for the session. `context.config.targetEnvConfig` is `null` when no configuration was selected, so check it first.

```typescript
import { RestApi } from '@metis/api/RestApi'

const FetchUsers = TargetSchema.create({
  _id: 'fetch-users',
  name: 'Fetch Users',
  description: 'Read the user list from the external system.',
  script: async (context, { notify }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No target environment configuration selected.')
    }

    let api = RestApi.fromConfig(context.config.targetEnvConfig.data)
    let response = await api.get<{ users: string[] }>('/users')

    context.sendOutput(`Found ${response.data.users.length} users.`, notify)
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

export default FetchUsers
```

`fromConfig` validates the configuration and throws `Invalid REST API configuration: <reason>` if it does not fit. Properties it does not recognize are ignored rather than rejected, so a `data` object holding your own settings alongside the connection ones is fine.

Configuration comes from `configs.json`. See the [configs.json Reference](configs-json.md).

## Configuration Properties

These are the properties `RestApi` reads out of `data`. Everything else in `data` is left for your script to use.

| Property             | Type                  | Default  | Effect                                                        |
| -------------------- | --------------------- | -------- | ------------------------------------------------------------- |
| `protocol`           | `'http'` \| `'https'` | `'http'` | Scheme of the base URL, and which default port applies         |
| `host`               | `string`              | `localhost` | Domain or IP. May include a port                            |
| `port`               | `number` \| numeric `string` | `80`, or `443` when `protocol` is `https` | Port of the base URL      |
| `rejectUnauthorized` | `boolean`             | `true`   | When `false`, accepts invalid TLS certificates                 |

`rejectUnauthorized` only takes effect when it is present in the configuration; leaving it out uses Node's default of `true`.

Credentials are not among these. Keep them wherever you prefer — another key in `data`, or an environment variable — and apply them yourself as shown under [Authentication](#authentication). Values read from `data` are typed `unknown`, so narrow them before use.

### How the Base URL Is Built

The resulting base URL is available as `api.baseUrl`, and axios applies it to every relative path you request.

| Configuration                              | `api.baseUrl`                |
| ------------------------------------------ | ---------------------------- |
| `protocol: 'https'`, `host: 'api.test.com'` | `https://api.test.com:443`   |
| `protocol: 'http'`, `host: 'api.test.com'`  | `http://api.test.com:80`     |
| `host: 'api.test.com'`, `port: 8080`        | `http://api.test.com:8080`   |
| `host: 'api.test.com:9000'`, `port: 8080`   | `http://api.test.com:9000` — a port in `host` wins |
| `port: 3000` with no `host`                 | `http://localhost:3000`      |
| Neither `host` nor `port`                   | `http://localhost:80`        |

Passing an absolute URL to a request method bypasses the base URL entirely, which is occasionally useful for a one-off call to a different service.

## HTTP Methods

Every method returns an axios response, so the body is on `.data` and the status on `.status`. The optional final argument is an axios request configuration merged over the client's own.

| Method                        | Signature                                     |
| ----------------------------- | --------------------------------------------- |
| `get(uri, config?)`           | Read a resource                               |
| `post(uri, data?, config?)`   | Create a resource                             |
| `put(uri, data?, config?)`    | Replace a resource                            |
| `patch(uri, data?, config?)`  | Partially update a resource                   |
| `delete(uri, config?)`        | Remove a resource                             |

```typescript
// Read, with a typed response body.
let response = await api.get<{ users: string[] }>('/users')

// Create.
await api.post('/users', { name: 'Jane Doe', role: 'admin' })

// Replace, with a per-request timeout.
await api.put('/users/123', { name: 'Updated Name' }, { timeout: 5000 })

// Partially update.
await api.patch('/users/123', { status: 'inactive' })

// Remove, with a custom header.
await api.delete('/users/123', { headers: { 'X-Confirm': 'true' } })
```

## Authentication

`RestApi` takes no credentials and applies no scheme. Set what your service expects on `api.config` once, and it goes out with every request.

**An API key** is a header, and the header name is whatever the service expects:

```typescript
let api = RestApi.fromConfig(context.config.targetEnvConfig.data)

let { apiKey } = context.config.targetEnvConfig.data
if (typeof apiKey !== 'string') {
  throw new Error('API key missing from the selected configuration.')
}

api.config.headers.common['X-API-Key'] = apiKey

// Both requests carry the header.
await api.get('/users')
await api.post('/users', { name: 'Jane Doe' })
```

**Basic authentication** uses axios's `auth` option, which builds the header for you:

```typescript
api.config.auth = { username: 'reporting', password: secret }
```

Credentials do not have to come from the configuration. A target environment that wants one set of credentials for every session can read them from the server's environment instead, which keeps them out of `configs.json` entirely:

```typescript
api.config.headers.common.Authorization = `Bearer ${process.env.WEATHER_API_TOKEN}`
```

> **Note:** Settings passed to an individual request are merged over the defaults rather than replacing them, so `api.get('/x', { headers: { Accept: 'text/csv' } })` keeps the headers set above.

**A scheme that changes per request** — a signature over the body, a token that has to be refreshed — belongs in an interceptor on `api.client`:

```typescript
api.client.interceptors.request.use((request) => {
  request.headers.set('X-Signature', sign(request.data))
  return request
})
```

## Error Handling

Axios rejects on any non-2xx status, so a failed request throws. The thrown value is typed `unknown`, and the useful shape depends on how far the request got.

| Situation                        | What the error carries                     |
| -------------------------------- | ------------------------------------------ |
| The server responded with an error | `error.response.status` and `error.response.data` |
| The request was sent, no response | `error.request`, and no `error.response`   |
| The request was never sent       | `error.message` only                       |

Use axios's own type guard rather than casting, so the narrowing is checked:

```typescript
import { RestApi } from '@metis/api/RestApi'
import axios from 'axios'

const FetchData = TargetSchema.create({
  _id: 'fetch-data',
  name: 'Fetch Data',
  description: 'Read data from the external system.',
  script: async (context, { notify }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No target environment configuration selected.')
    }

    let api = RestApi.fromConfig(context.config.targetEnvConfig.data)

    try {
      let response = await api.get('/data')
      context.sendOutput(`Retrieved ${response.status}.`, notify)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Request failed with status ${error.response.status}.`)
      }
      if (axios.isAxiosError(error) && error.request) {
        throw new Error('No response from the server.')
      }
      throw error
    }
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

export default FetchData
```

Throwing stops the effect and surfaces the message, which is usually what you want. Catching only to send output and continue leaves the effect looking successful.

## Complete Example

```typescript
import { RestApi } from '@metis/api/RestApi'
import axios from 'axios'

const ManageUser = TargetSchema.create({
  _id: 'manage-user',
  name: 'Manage User',
  description: 'Create or update a user in the external system.',
  script: async (context, { notify, action, userId, userData }) => {
    if (!context.config.targetEnvConfig) {
      throw new Error('No target environment configuration selected.')
    }

    let api = RestApi.fromConfig(context.config.targetEnvConfig.data)
    let { apiKey } = context.config.targetEnvConfig.data
    if (typeof apiKey !== 'string') {
      throw new Error('API key missing from the selected configuration.')
    }
    api.config.headers.common['api-key'] = apiKey

    let parsed: unknown

    try {
      parsed = JSON.parse(userData)
    } catch {
      throw new Error('User Data must be valid JSON.')
    }

    try {
      if (action === 'create') {
        let response = await api.post('/users', parsed)
        context.sendOutput(`Created user ${response.data.username}.`, notify)
      } else {
        if (!userId) throw new Error('A user ID is required to update a user.')
        let response = await api.put(`/users/${userId}`, parsed)
        context.sendOutput(`Updated user ${response.data.username}.`, notify)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `The external system rejected the request with status ${error.response.status}.`,
        )
      }
      throw error
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'user',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'action',
      name: 'Action',
      type: 'dropdown',
      required: true,
      groupingId: 'user',
      default: 'create',
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
      groupingId: 'user',
      dependencies: [TargetDependency.EQUALS('action', 'update')],
    },
    {
      _id: 'userData',
      name: 'User Data (JSON)',
      type: 'large-string',
      required: true,
      groupingId: 'user',
      default: '{}',
    },
  ],
})

export default ManageUser
```

## Related Documentation

- **[configs.json Reference](configs-json.md)** - Configuration file structure and loading
- **[Environment Configuration](environment-configuration.md)** - Every property a configuration can carry
- **[WebSocket API Reference](websocket-api.md)** - Persistent connections instead of request/response
- **[Context API Reference](context-api.md)** - Complete context properties and methods
- **[External API Integration Guide](../guides/external-api-integration.md)** - Patterns for talking to external systems
