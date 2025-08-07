# API Overview

**Base URL:** `/api/v1/`

METIS provides a RESTful API for all system operations. The API is versioned to ensure backwards compatibility, with v1 being the current stable version. All operations in METIS, whether through the web interface or programmatic access, are performed via these API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Common Response Codes](#common-response-codes)
- [Rate Limiting](#rate-limiting)
- [Available Routes](#available-routes)
  - [Missions API](#missions-api)
  - [Users API](#users-api)
  - [Sessions API](#sessions-api)
  - [Target Environments API](#target-environments-api)
  - [Files API](#files-api)
  - [Logins API](#logins-api)
  - [Info API](#info-api)
- [Request Validation](#request-validation)
- [Request Parameters](#request-parameter-data-types)
- [Request Body Types](#request-json-data-types)
- [Additional Notes](#notes)
  - [General Guidelines](#general-guidelines)
  - [Data Validation](#data-validation)
  - [Security and Access Control](#security-and-access-control)
- [Additional Resources](#additional-resources)

## Authentication

METIS uses Express sessions for authentication, managed via secure HTTP-only cookies and stored in MongoDB. There are three authentication levels:

1. `login` - Basic authentication (default)
2. `ws-connection` - Requires WebSocket connection
3. `in-session` - Requires active METIS session

Each endpoint may require specific permissions in addition to authentication. For WebSocket authentication details, see the [WebSocket Documentation](/docs/devs/websocket.md#authentication--security).

## Common Response Codes

| Code | Description                                                   |
| ---- | ------------------------------------------------------------- |
| 200  | Success - Request completed successfully                      |
| 400  | Bad Request - Invalid parameters or data                      |
| 401  | Unauthorized - Missing or invalid authentication              |
| 403  | Forbidden - Valid auth but insufficient permissions           |
| 404  | Not Found - Resource doesn't exist                            |
| 409  | Conflict - Resource state conflict (e.g., duplicate username) |
| 429  | Too Many Requests - Rate limit exceeded                       |
| 500  | Server Error - Internal server error                          |

## Rate Limiting

METIS implements rate limiting for both HTTP and WebSocket connections:

- `HTTP API`: 20 requests/second per IP (default)
- `WebSocket`: 10 messages/second per user (default)
- [Configurable via environment variables](/docs/setup/debian.md#step-5---configure-environment)
- Rate limit headers in HTTP responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

> _For WebSocket-specific details, see [WebSocket Documentation](/docs/devs/websocket.md#authentication--security)._

## Available Routes

The METIS API provides the following main routes. Each route has its own detailed documentation with specific endpoints and operations.

### Missions API

**Route:** `/api/v1/missions/`  
**Documentation:** [Missions API](/docs/api/missions.md)  
**Description:** Manages mission lifecycle and configurations

**Key Operations:**

- Mission Management:
  - Create new missions
  - Copy existing missions
  - Import mission configurations
  - List available missions
  - Get mission details
  - Update mission parameters
  - Delete missions
- Environment Operations:
  - Get environment configuration
  - Validate mission environment
  - Apply environment effects

**Permissions:**

- Read operations: `missions_read`
- Write operations: `missions_write`
- Environment operations: `environments_read`

### Users API

**Route:** `/api/v1/users/`  
**Documentation:** [Users API](/docs/api/users.md)  
**Description:** Handles user account management

**Key Operations:**

- User creation and profile management
- Permission and access level control
- Password management
- Account deactivation

**Permissions:**

- Full access: `users_read`, `users_write`
- Student-only access: `users_read_students`, `users_write_students`

### Sessions API

**Route:** `/api/v1/sessions/`  
**Documentation:** [Sessions API](/docs/api/sessions.md)  
**Description:** Manages METIS mission sessions

**Key Operations:**

- Session creation and configuration
- Participant management
- Retrieve real-time session state (via [WebSocket events](/docs/devs/websocket.md#session-events))
- Session termination

**Permissions:**

- Reading: `sessions_read`
- Writing (all sessions): `sessions_write`
- Writing (own sessions): `sessions_write_native`
- Writing (others' sessions): `sessions_write_foreign`
- Joining as participant: `sessions_join_participant`
- Joining as manager (all sessions): `sessions_join_manager`
- Joining as manager (own sessions): `sessions_join_manager_native`
- Joining as observer: `sessions_join_observer`

### Target Environments API

**Route:** `/api/v1/target-environments/`  
**Documentation:** [Target Environments API](/docs/api/target-environments.md)  
**Description:** Provides access to registered target environments and effect migration

**Key Operations:**

- List all registered target environments
- Migrate outdated effect configurations

**Permissions:**

- Basic access: `environments_read`

> _Note: Effects are executed through the WebSocket system, not through this API endpoint. These effects are used to affect targets within their respective target environments._

### Files API

**Route:** `/api/v1/files/`  
**Documentation:** [Files API](/docs/api/files.md)  
**Description:** Manages file operations

**Key Operations:**

- File Management:
  - Upload new files
  - Download existing files
  - Delete stored files
- Metadata Operations:
  - Get file information
  - Update file metadata
  - List available files

**Permissions:**

- Read operations: `files_read`
- Write operations: `files_write`

### Logins API

**Route:** `/api/v1/logins/`  
**Documentation:** [Logins API](/docs/api/logins.md)  
**Description:** Handles authentication flows

**Key Operations:**

- Authentication:
  - Login/logout management
  - Authentication level control (login, ws-connection, in-session)
  - Session verification
- Status Operations:
  - Check authentication status
  - Verify session validity
  - Get current permissions

**Permissions:** None required for basic auth

### Info API

**Route:** `/api/v1/info/`  
**Documentation:** [Info API](/docs/api/info.md)  
**Description:** Provides system information

**Key Operations:**

- Version information
- Changelog access
- System status

**Permissions:**

- Changelog access: `changelog_read`
- Other endpoints: No specific permissions required

---

## Request Validation

The `defineRequests` middleware ensures data integrity for all API requests by validating:

1. **Request Body**

   - JSON payload data validation
   - Type checking for all fields
   - Removal of unexpected fields

2. **Query Parameters**

   - URL query string validation (e.g., ?key=value)
   - Type conversion and verification
   - Required parameter enforcement

3. **URL Parameters**
   - Route parameter validation (e.g., /users/:id)
   - Type checking for IDs and other values

> _Invalid requests receive a 400 Bad Request response with an error message. Routes may implement additional validation as needed._

## Request Parameter Data Types

Request parameters and values passed straight through the search bar (`/api/v1/route/?id=7` or `/api/v1/route/<parameter>`), are documented with data types to indicate what type of data should be passed to the API:

| Type       | Description                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `string`   | Any string value. There are no restrictions for this data type                                                    |
| `number`   | Any number value                                                                                                  |
| `integer`  | Integer values only                                                                                               |
| `boolean`  | Boolean values (`0, 1, true, false, True, False, TRUE, FALSE, t, f, T, F, yes, no, Yes, No, YES, NO, y, n, Y, N`) |
| `objectId` | Valid MongoDB ObjectId passed as a string                                                                         |

---

## Request JSON Data Types

Request JSON, which is data passed in the `body` of a request, is documented with data types to indicate what type of data should be passed to the API:

| Type                 | Description                                   |
| -------------------- | --------------------------------------------- |
| `string`             | Unrestricted string                           |
| `string_literal`     | Generic string used as a type identifier      |
| `string_50_char`     | String, ≤ 50 characters                       |
| `string_128_char`    | String, ≤ 128 characters                      |
| `string_255_char`    | String, ≤ 255 characters                      |
| `string_256_char`    | String, ≤ 256 characters                      |
| `string_512_char`    | String, ≤ 512 characters                      |
| `string_1024_char`   | String, ≤ 1024 characters                     |
| `string_medium_text` | String, ≤ 16,777,215 characters               |
| `number`             | Any numeric value                             |
| `boolean`            | Boolean value                                 |
| `object`             | Any object value                              |
| `objectId`           | Valid MongoDB ObjectId passed as a string     |
| `array`              | Any array value                               |
| `username`           | String (5–25 chars, restricted character set) |
| `password`           | String (8–50 chars)                           |
| `name`               | String (1–50 chars, restricted character set) |
| `access`             | Valid access ID passed as a string            |

---

## Notes

### General Guidelines

- Most endpoints require authentication with specific exceptions:
  - `/api/v1/info/` - Public access for basic system info
  - `/api/v1/logins/` - Public access for authentication endpoints
- All API requests require HTTPS
- Request/response bodies are JSON encoded with UTF-8 character encoding
- See [architecture documentation](/docs/devs/architecture.md) for implementation details

### Data Validation

- All requests are validated against the documented data types
- Character length restrictions are strictly enforced
- Invalid data results in a 400 Bad Request response
- See [Request Parameter Data Types](#request-parameter-data-types) and [Request JSON Data Types](#request-json-data-types) for specifics

### Security and Access Control

- Authentication required for most endpoints
- Role-based access control system
- Rate limiting on all connections
- Permission-based endpoint restrictions

## Additional Resources

- [WebSocket Documentation](/docs/devs/websocket.md)
- [Architecture Documentation](/docs/devs/architecture.md)
