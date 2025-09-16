# METIS Environment Configuration Reference

This guide explains how to configure environment variables for METIS target environments using `.env` files. It covers naming conventions, usage patterns, and troubleshooting tips for connecting to external APIs and services.

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

METIS uses `.env` files (in `/config/*.env`) for all environment-specific connection details. Each target environment loads its config from environment variables using a prefix based on its folder name (e.g., `test-env` → `TEST_ENV_`). Hyphens are replaced with underscores and the prefix is uppercased. For example, `TEST_ENV_HOST` in `.env` becomes `host` in the config object.

Config is loaded using the `loadConfig()` function, which automatically maps variables for the current target environment. You can pass this config to the `RestApi` class using either the constructor or the `.fromConfig()` static method. The `.fromConfig()` method is designed to work seamlessly with `loadConfig()` for clean variable conversion.

**Key Features:**

- Flexible protocol support (HTTP/HTTPS)
- Multiple authentication methods
- Automatic port resolution
- TLS certificate validation control

## Configuration Structure

### Example `.env` for a Target Environment

```bash
# For a target environment named "test-env"
TEST_ENV_PROTOCOL="https"
TEST_ENV_HOST="httpbin.org"
TEST_ENV_PORT=8443
TEST_ENV_USERNAME="prod-user"
TEST_ENV_PASSWORD="prod-password"
TEST_ENV_API_KEY="prod-api-key-xyz123"
TEST_ENV_REJECT_UNAUTHORIZED=true
```

**Naming Convention:**

- Prefix: Uppercased folder name, hyphens replaced with underscores (e.g., `test-env` → `TEST_ENV_`)
- Suffix: Config property name in uppercase (e.g., `HOST`, `PORT`)

**Usage in Code:**

```typescript
import { RestApi } from 'integration/library/api/rest-api'
import { loadConfig } from 'integration/library/config'

// Recommended: ensures .env variables are mapped correctly
const api = RestApi.fromConfig(loadConfig())

// Or, you can use the constructor directly
const api2 = new RestApi(loadConfig())
```

## Core Connection Properties

**protocol** (optional)

- Type: `http | https`
- Default: `http`
- Format: Protocol name only (no `://`)

**host** (optional)

- Type: `string` (domain or IP)
- Example: `api.example.com`, `192.168.1.100`

**port** (optional)

- Type: `number | string`
- Default: `80` for HTTP, `443` for HTTPS
- Example: `3000`, `"8080"`

**username/password** (optional)

- Type: `string`
- Default: `undefined`
- For HTTP Basic Authentication

**apiKey** (optional)

- Type: `string`
- Default: `undefined`
- For token-based authentication

**rejectUnauthorized** (optional)

- Type: `boolean`
- Default: `true`
- Controls TLS certificate validation

**Authentication Methods**

**Basic Authentication:**
Set `<PREFIX>_USERNAME` and `<PREFIX>_PASSWORD` in your `.env` for HTTP Basic Auth.

**API Key Authentication:**
Set `<PREFIX>_API_KEY` in your `.env` for token-based authentication.

**No Authentication:**
Omit authentication properties for public APIs.

## TLS/SSL Configuration

**rejectUnauthorized** (optional)

- Type: `boolean`
- Default: `true`

```bash
# Production (recommended)
TEST_ENV_REJECT_UNAUTHORIZED=true   # Validates certificates

# Development/Testing only
TEST_ENV_REJECT_UNAUTHORIZED=false  # Accepts invalid certificates
```

> ⚠️ **Security Warning:** Setting `REJECT_UNAUTHORIZED=false` in production environments creates security vulnerabilities.

## Port Resolution

METIS resolves ports in this order:

1. Port in host string (e.g., `'api.example.com:3000'`)
2. Explicit port property (e.g., `TEST_ENV_PORT='8080'`)
3. Protocol default (`'80'` for HTTP, `'443'` for HTTPS)

**Examples:**

```bash
# Port in host string takes precedence
TEST_ENV_HOST="api.example.com:3000"
TEST_ENV_PORT="8080"   # Ignored
# → api.example.com:3000

# Explicit port property
TEST_ENV_HOST="api.example.com"
TEST_ENV_PORT=8080
# → api.example.com:8080

# Protocol default
TEST_ENV_HOST="api.example.com"
TEST_ENV_PROTOCOL="https"
# → api.example.com:443

TEST_ENV_HOST="api.example.com"
TEST_ENV_PROTOCOL="http"
# → api.example.com:80
```

## Configuration Examples

**Production HTTPS API:**

```bash
TEST_ENV_PROTOCOL="https"
TEST_ENV_HOST="api.production.com"
TEST_ENV_API_KEY="prod-api-key-xyz123"
TEST_ENV_REJECT_UNAUTHORIZED=true
```

**Development Environment:**

```bash
TEST_ENV_PROTOCOL="http"
TEST_ENV_HOST="localhost:3000"
TEST_ENV_USERNAME="dev-user"
TEST_ENV_PASSWORD="dev-password"
TEST_ENV_REJECT_UNAUTHORIZED=false
```

**Custom Port Configuration:**

```bash
TEST_ENV_PROTOCOL="https"
TEST_ENV_HOST="internal.company.com"
TEST_ENV_PORT="8443"
TEST_ENV_API_KEY="internal-service-key"
```

## Troubleshooting

**Connection Refused:**

- Check `host` and `port` values
- Ensure target service is running
- Confirm network connectivity

**SSL Certificate Errors:**

- Update certificates on target server
- For development only: set `REJECT_UNAUTHORIZED=false`
- Verify certificate chain is complete

**Authentication Failures:**

- Check `<PREFIX>_USERNAME`/`<PREFIX>_PASSWORD` or `<PREFIX>_API_KEY`
- Confirm correct authentication method
- Ensure account has necessary permissions

## Related Documentation

- [REST API](./rest-api.md): RESTful HTTP client for environment config
- [Context API](./context-api.md): Context API for target environments
- [Quickstart Guide](../quickstart.md): Get started with target environment setup
- [Creating Target Environments](../guides/creating-target-environments.md): Step-by-step guide
- [References](./index.md): Complete API reference
- [Schemas](./schemas.md): Data structure and schema definitions
