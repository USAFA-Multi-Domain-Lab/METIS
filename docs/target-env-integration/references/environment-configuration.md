# Environment Configuration Reference

This reference documents the environment configuration structure required for METIS target environments to connect to external APIs and services.

## Table of Contents

- [Overview](#overview)
- [Configuration Structure](#configuration-structure)
- [Configuration Properties](#configuration-properties)
- [Authentication Methods](#authentication-methods)
- [TLS/SSL Configuration](#tlsssl-configuration)
- [Port Resolution](#port-resolution)
- [Configuration Examples](#configuration-examples)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Overview

The environment configuration file (`environment.json`) contains sensitive connection information needed for METIS target environments to interact with external systems. This file is located in the root directory of the METIS project and is environment-specific, requiring secure storage.

**Key Features:**

- Flexible protocol support (HTTP/HTTPS)
- Multiple authentication methods
- Automatic port resolution
- TLS certificate validation control

## Configuration Structure

The configuration file must contain a variable named after your target environment (e.g., `"metis"`) with the following structure:

```typescript
{
  "<environment-name>": {
    "protocol": 'http' | 'https' | undefined,
    "address": string | undefined,
    "port": number | string | undefined,
    "username": string | undefined,
    "password": string | undefined,
    "apiKey": string | undefined,
    "rejectUnauthorized": boolean | undefined
  }
}
```

## Configuration Properties

### Core Connection Properties

#### `protocol` (optional)

The protocol scheme for API requests.

- **Type:** `string`
- **Supported Values:** `"http"` | `"https"`
- **Default:** `"http"`
- **Format:** Protocol name only (no delimiters like `://`)

```typescript
"protocol": "https"  // ✅ Correct
"protocol": "https://"  // ❌ Incorrect
```

#### `address` (optional)

The server address for API requests.

- **Type:** `string`
- **Format:** Domain name or IP address
- **Port Inclusion:** Optional (see [Port Resolution](#port-resolution))
- **Default:** `"localhost"`

```typescript
"address": "api.example.com"           // ✅ Domain only
"address": "api.example.com:3000"      // ✅ Domain with port
"address": "192.168.1.100"             // ✅ IP address
"address": "192.168.1.100:8080"        // ✅ IP with port
```

#### `port` (optional)

Explicit port number for the connection.

- **Type:** `number | string`
- **Priority:** If not specified in `address`, this port will be used.
- **Default:** Protocol-based (`80` for HTTP, `443` for HTTPS)

```typescript
"port": 3000        // ✅ Numeric port
"port": "3000"      // ✅ String port (also supported)
```

## Authentication Methods

### Basic Authentication

Use username and password for HTTP Basic Authentication:

```ts
{
  "protocol": "https",
  "address": "api.example.com",
  "username": "admin",
  "password": "secure-password"
}
```

**Headers Generated:**

```ts
config = {
  auth: {
    username: 'admin',
    password: 'secure-password',
  },
}
```

### API Key Authentication

Use API key for token-based authentication:

```ts
{
  "protocol": "https",
  "address": "api.example.com",
  "apiKey": "your-secret-api-key"
}
```

**Headers Generated:**

```ts
config = {
  headers: {
    'api-key': 'your-secret-api-key',
  },
}
```

### No Authentication

Omit authentication properties for public APIs:

```ts
{
  "protocol": "http",
  "address": "public-api.example.com"
}
```

## TLS/SSL Configuration

### `rejectUnauthorized` (optional)

Controls TLS certificate validation for HTTPS connections.

- **Type:** `boolean`
- **Default:** `true`
- **Security Note:** Only set to `false` for development/testing

```typescript
// Production (recommended)
"rejectUnauthorized": true   // Validates certificates

// Development/Testing only
"rejectUnauthorized": false  // Accepts invalid certificates
```

**⚠️ Security Warning:** Setting `rejectUnauthorized: false` in production environments creates security vulnerabilities.

## Port Resolution

METIS resolves ports using the following priority order:

1. **Port in address** (highest priority)
2. **Explicit port property**
3. **Protocol defaults** (lowest priority)

### Resolution Examples

```typescript
// Case 1: Port in address (takes precedence)
{
  "address": "api.example.com:3000",
  "port": 8080,     // Ignored
  "protocol": "http"
}
// Result: api.example.com:3000

// Case 2: Explicit port property
{
  "address": "api.example.com",
  "port": 8080,
  "protocol": "http"
}
// Result: api.example.com:8080

// Case 3: Protocol defaults
{
  "address": "api.example.com",
  "protocol": "https"
}
// Result: api.example.com:443 (HTTPS default)

{
  "address": "api.example.com",
  "protocol": "http"
}
// Result: api.example.com:80 (HTTP default)
```

## Configuration Examples

### Production HTTPS API

```typescript
{
  "productionAPI": {
    "protocol": "https",
    "address": "api.production.com",
    "apiKey": "prod-api-key-xyz123",
    "rejectUnauthorized": true
  }
}
```

### Development Environment

```typescript
{
  "devEnvironment": {
    "protocol": "http",
    "address": "localhost:3000",
    "username": "dev-user",
    "password": "dev-password",
    "rejectUnauthorized": false
  }
}
```

### Custom Port Configuration

```typescript
{
  "customService": {
    "protocol": "https",
    "address": "internal.company.com",
    "port": 8443,
    "apiKey": "internal-service-key"
  }
}
```

### Multiple Environments

```typescript
{
  "staging": {
    "protocol": "https",
    "address": "staging-api.example.com",
    "apiKey": "staging-key"
  },
  "production": {
    "protocol": "https",
    "address": "api.example.com",
    "apiKey": "production-key"
  }
}
```

## Troubleshooting

### Common Issues

#### Connection Refused

```
Error: ECONNREFUSED
```

**Solutions:**

- Verify `address` and `port` are correct
- Check if target service is running
- Confirm network connectivity

#### SSL Certificate Errors

```
Error: CERT_HAS_EXPIRED
Error: SELF_SIGNED_CERT_IN_CHAIN
```

**Solutions:**

- Update certificates on target server
- For development only: `"rejectUnauthorized": false`
- Verify certificate chain is complete

#### Authentication Failures

```
Error: 401 Unauthorized
Error: 403 Forbidden
```

**Solutions:**

- Verify `username`/`password` or `apiKey` are correct
- Check authentication method required by API
- Confirm account has necessary permissions

## Related Documentation

### API Implementation

- **[REST API](./rest-api.md)** - RESTful HTTP client that uses environment configuration
- **[Context API](./context-api.md)** - Context API for target environment interaction

### Setup and Configuration

- **[Quickstart Guide](../quickstart.md)** - Get started with target environment setup
- **[Creating Target Environments](../guides/creating-target-environments.md)** - Step-by-step environment creation

### Reference Documentation

- **[References](./index.md)** - Complete API references overview
- **[Schemas](./schemas.md)** - Data structure and schema definitions
