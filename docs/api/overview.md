# API Overview

**Base URL:** `/api/v1/`

METIS provides a RESTful API for all system operations. The API is versioned to ensure backwards compatibility, with v1 being the current stable version. All operations in METIS, whether through the web interface or programmatic access, are performed via these API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Common Response Codes](#common-response-codes)
- [Rate Limiting](#rate-limiting)
- [Available Routes](#available-routes)
- [Request Parameters](#request-parameter-data-types)
- [Request Body Types](#request-json-data-types)
- [Additional Notes](#notes)

## Authentication

All API requests require authentication through one of these methods:

- Session cookie (for web browser access)
- JWT token (for programmatic access)

See the [Logins API](/api/logins.md) documentation for authentication details.

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

- Default rate limit: 100 requests per minute per user
- Authentication endpoints: 10 requests per minute per IP
- Bulk operations: 10 requests per minute per user
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Available Routes

The METIS API provides the following main routes. Each route has its own detailed documentation with specific endpoints and operations.

### Missions API

**Route:** `/api/v1/missions/`  
**Documentation:** [Missions API](/api/missions.md)  
**Description:** Manages training mission lifecycle  
**Key Operations:**

- Create and configure missions
- Retrieve mission details and status
- Update mission parameters
- Delete missions

**Permissions:** `missions_read`, `missions_write`

### Users API

**Route:** `/api/v1/users/`  
**Documentation:** [Users API](/api/users.md)  
**Description:** Handles user account management  
**Key Operations:**

- User creation and profile management
- Permission and access level control
- Password management
- Account deactivation

**Permissions:** `users_read_students`, `users_write_students`

### Sessions API

**Route:** `/api/v1/sessions/`  
**Documentation:** [Sessions API](/api/sessions.md)  
**Description:** Manages active mission sessions  
**Key Operations:**

- Session creation and configuration
- Participant management
- Real-time session state
- Session termination

**Permissions:** `sessions_read`, `sessions_write`

### Target Environments API

**Route:** `/api/v1/target-environments/`  
**Documentation:** [Target Environments API](/api/target-environments.md)  
**Description:** Provides target environment configurations  
**Key Operations:**

- Environment discovery
- Configuration retrieval
- Effect validation

**Permissions:** `environments_read`

### Files API

**Route:** `/api/v1/files/`  
**Documentation:** [Files API](/api/files.md)  
**Description:** Manages file operations  
**Key Operations:**

- File upload and download
- File metadata management
- File deletion

**Permissions:** `files_read`, `files_write`

### Logins API

**Route:** `/api/v1/logins/`  
**Documentation:** [Logins API](/api/logins.md)  
**Description:** Handles authentication flows  
**Key Operations:**

- User authentication
- Session management
- Login status verification

**Permissions:** None required for basic auth

### Info API

**Route:** `/api/v1/info/`  
**Documentation:** [Info API](/api/info.md)  
**Description:** Provides system information  
**Key Operations:**

- Version information
- Changelog access
- System status

**Permissions:** Various, endpoint-specific

---

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

- All endpoints require authentication unless specifically noted
- Use HTTPS for all API requests
- Request bodies should be JSON encoded
- Response bodies are always JSON encoded
- UTF-8 character encoding is used for all requests/responses

### Data Validation

- Character length restrictions are strictly enforced
- Data types are validated before processing
- Rich text content is sanitized to prevent XSS attacks
- Invalid data results in a 400 Bad Request response

### Database Considerations

- MongoDB is used as the backend database
- ObjectId values follow MongoDB's format
- Timestamps are in ISO 8601 UTC format
- Soft deletion is used (deleted flag instead of removal)

### Security Notes

- All endpoints enforce permission checks
- Rate limiting is applied to prevent abuse
- Session tokens expire after 24 hours of inactivity
- Failed authentication attempts are logged and limited
