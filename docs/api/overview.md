# API Overview

**Base URL:** `/api/v1/`

The METIS API lets you **automate training scenarios**, **integrate with external systems**, and **build custom applications** on top of METIS. It covers missions, users, sessions, files, and the registered target environments.

## Quick Start

1. **Authenticate** → `POST /api/v1/logins/` with a username and password
2. **Create a mission** → `POST /api/v1/missions/` with the mission data
3. **Launch a session** → `POST /api/v1/sessions/launch/` with the mission's ID
4. **Follow it live** → open a WebSocket connection for session events

## What You Can Do

- **Mission management** → create, copy, import, export, and update training scenarios
- **User administration** → manage accounts, access levels, and permissions
- **Session control** → launch sessions, list them, and destroy them
- **File management** → upload mission resources and serve them to participants
- **Target environments** → read the registry and migrate outdated effect arguments

Anything that happens *inside* a running session — joining, starting, executing effects, switching realms — is driven over the WebSocket connection rather than this API. See the [WebSocket Documentation](../devs/websocket.md).

## Table of Contents

- [Authentication](#authentication)
- [Common Response Codes](#common-response-codes)
- [Error Responses](#error-responses)
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
- [Request Parameter Data Types](#request-parameter-data-types)
- [Request JSON Data Types](#request-json-data-types)
- [Notes](#notes)
- [Related Documentation](#related-documentation)

## Authentication

METIS uses Express sessions, carried in a secure HTTP-only cookie and stored in MongoDB. Sign in through the [Logins API](logins.md) and send the cookie with subsequent requests.

Routes declare one of three authentication levels:

| Level           | Requirement                                          |
| --------------- | ---------------------------------------------------- |
| `login`         | Signed in. This is the default                       |
| `ws-connection` | Signed in **and** holding a live WebSocket connection |
| `in-session`    | Signed in **and** joined to a mission session         |

A route may also require permissions on top of its authentication level. Missing authentication gives a 401; failing a permission check gives a 403.

The session signing secret is regenerated every time the server starts, so cookies do not survive a restart. See [Session Cookies](logins.md#session-cookies).

## Common Response Codes

| Code | Description                                                   |
| ---- | ------------------------------------------------------------- |
| 200  | Success                                                       |
| 400  | Bad Request — invalid parameters or body                      |
| 401  | Unauthorized — missing or invalid authentication              |
| 403  | Forbidden — authenticated but not permitted                   |
| 404  | Not Found                                                     |
| 409  | Conflict — e.g. a duplicate username or an existing login     |
| 422  | Unprocessable — well-formed but rejected on its merits        |
| 429  | Too Many Requests — rate limit exceeded                       |
| 500  | Server Error                                                  |

## Error Responses

Error bodies are **not uniform across the API**, so a client should key off the status code rather than expect a parseable body.

Three conventions are in use:

1. **Status code only.** Most endpoints answer a handled error with the code and nothing useful in the body — the body is Express's default status text, such as `Bad Request`. Any message the server produced went to its logs, not to you.
2. **Reason in the status line.** When the request-validation middleware rejects a request, it returns a 400 with an empty body and the reason in the **HTTP status message**, e.g. `"username"-is-missing-in-the-body-of-the-request`.
3. **A JSON body.** Errors that reach the API error handler are returned as JSON:

```json
{
  "error": {
    "status": 401,
    "message": "Incorrect username or password."
  }
}
```

The [Logins API](logins.md) is the endpoint where this matters most — its 400, 401, 403, and 409 responses all arrive this way, with the real reason. Elsewhere it is reserved for unexpected faults.

> **Note:** A 500 never reveals its cause. The handler replaces the message with `"Something went wrong on our end. Please try again later."` before sending.

## Rate Limiting

METIS rate limits both HTTP and WebSocket traffic:

- **HTTP**: 100 requests per second per IP, applied to the whole server rather than only `/api/`
- **WebSocket**: 100 messages per second per user
- Both are [configurable via environment variables](../setup/environment.md)

Rate-limited responses carry `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`, and exceeding the limit returns a 429.

## Available Routes

### Missions API

**Route:** `/api/v1/missions/`  
**Documentation:** [Missions API](missions.md)

Create, read, update, copy, import, export, and delete missions.

**Permissions:** `missions_read` to read, `missions_write` to modify. Export requires **both**.

### Users API

**Route:** `/api/v1/users/`  
**Documentation:** [Users API](users.md)

Manage accounts, access levels, and permissions; check username availability; update your own preferences and password.

**Permissions:** `users_read` / `users_write` for all accounts, `users_read_students` / `users_write_students` for student accounts only. Updating your own preferences or password needs no permission.

### Sessions API

**Route:** `/api/v1/sessions/`  
**Documentation:** [Sessions API](sessions.md)

Launch a session, list the sessions you can see, download a mission file from inside one, and destroy a session.

**Permissions:** `sessions_write_native` and `missions_read` to launch; `sessions_write_foreign` to destroy someone else's. Listing needs only authentication. The `sessions_join_*` permissions govern joining, which happens over the WebSocket connection.

### Target Environments API

**Route:** `/api/v1/target-environments/`  
**Documentation:** [Target Environments API](target-environments.md)

List the registered target environments and migrate an effect's stored arguments.

**Permissions:** `environments_read` to list; `missions_read` **and** `environments_read` to migrate.

> **Note:** Effects are executed over the WebSocket system, not through this API.

### Files API

**Route:** `/api/v1/files/`  
**Documentation:** [Files API](files.md)

Upload files, list and read file references, download file contents, and soft-delete files. There is no endpoint for editing a file's metadata.

**Permissions:** `files_read` to read, `files_write` to upload or delete.

### Logins API

**Route:** `/api/v1/logins/`  
**Documentation:** [Logins API](logins.md)

Sign in, read the current login, and sign out.

**Permissions:** None. These endpoints are how a caller becomes authenticated.

### Info API

**Route:** `/api/v1/info/`  
**Documentation:** [Info API](info.md)

Report the project's name, description, and version, and serve the changelog and credits.

**Permissions:** `changelog_read` for the changelog. The version and credits endpoints are public.

## Request Validation

The `defineRequests` middleware validates each request against a declared shape covering the body, the query string, and URL parameters. Each key is declared as either required or optional, and its value is type-checked.

Two behaviors are worth knowing:

- **A missing required key is rejected** with a 400.
- **An unrecognized key is dropped, not rejected.** Only declared keys are copied forward, so a misspelled property produces a successful request that silently ignores your value. This is the most common way to send a request that appears to work and does not.

## Request Parameter Data Types

Types used for URL parameters and query-string values (`/api/v1/route/<parameter>` or `/api/v1/route/?key=value`):

| Type       | Description                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `string`   | Any string value                                                                                                 |
| `number`   | Any number value                                                                                                 |
| `integer`  | Integer values only                                                                                              |
| `boolean`  | `0, 1, true, false, True, False, TRUE, FALSE, t, f, T, F, yes, no, Yes, No, YES, NO, y, n, Y, N`                  |
| `objectId` | A valid MongoDB ObjectId, passed as a string                                                                     |

## Request JSON Data Types

Types used for properties in a request body:

| Type                 | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `string`             | Unrestricted string                                                    |
| `string_literal`     | A string that must be one of a fixed set of values                      |
| `string_50_char`     | String, ≤ 50 characters                                                |
| `string_128_char`    | String, ≤ 128 characters                                               |
| `string_255_char`    | String, ≤ 255 characters                                               |
| `string_256_char`    | String, ≤ 256 characters                                               |
| `string_512_char`    | String, ≤ 512 characters                                               |
| `string_1024_char`   | String, ≤ 1024 characters                                              |
| `string_medium_text` | String, ≤ 16,777,215 characters                                        |
| `number`             | Any numeric value                                                      |
| `boolean`            | Boolean value                                                          |
| `object`             | Any object value                                                       |
| `objectId`           | A valid MongoDB ObjectId, passed as a string                           |
| `array`              | Any array value                                                        |
| `username`           | 5–50 characters from `a-z A-Z 0-9 - _ .`  Compared without case         |
| `password`           | 8–50 characters, no whitespace                                         |
| `name`               | 1–50 characters — letters, apostrophes, and hyphens only                |
| `access`             | A valid access level ID                                                |
| `version`            | A semantic version string, `MAJOR.MINOR.PATCH`                          |
| `user_preferences`   | A user-preferences object matching the expected structure               |

## Notes

- Most endpoints require authentication. The exceptions are `/api/v1/logins/`, `/api/v1/info/`, and `/api/v1/info/credits/`
- HTTPS is used when the server is started with a certificate and key configured in a production environment; otherwise METIS serves over HTTP
- Request and response bodies are JSON, encoded as UTF-8
- Length and character restrictions are enforced on every request
- Access is role-based, with permissions attached to a user's access level plus any granted individually
- A request to an unrecognized `/api/v1/` path returns a rendered HTML error page rather than JSON

## Related Documentation

### Integration and Development

- **[Target Environment Integration](../target-env-integration/index.md)** - Build custom external integrations
- **[WebSocket Documentation](../devs/websocket.md)** - Real-time communication patterns
- **[Architecture Documentation](../devs/architecture.md)** - System design and components

### Getting Started

- **[Setup Instructions](../setup/index.md)** - Install and configure METIS
- **[Developer Documentation](../devs/index.md)** - Development guides and standards

### API Reference

- **[Missions API](missions.md)** - Create and manage training scenarios
- **[Sessions API](sessions.md)** - Launch and control mission sessions
- **[Users API](users.md)** - Manage participants and permissions
- **[Files API](files.md)** - Handle mission resources and uploads
- **[Logins API](logins.md)** - Authentication and login conflicts
- **[Target Environments API](target-environments.md)** - Registry and effect migration
- **[Info API](info.md)** - Version, changelog, and credits
