# Info API

**Base URL:** `/api/v1/info/`

METIS provides API endpoints for retrieving system information and metadata through its `MetisServer` class. The core system information (name, description, version) is exposed through a public endpoint, while the changelog requires appropriate authentication permissions.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get System Info](#get-system-info)
  - [Get Changelog](#get-changelog)
- [Data Types](#data-types)
  - [Info Object](#info-object)
- [Notes](#notes)

## Endpoints

### Get System Info

Retrieves basic system information including the project name, description, and version from the `MetisServer` class constants.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/`

**Middleware**: None (public endpoint)

#### Response

```json
{
  "name": "METIS",
  "description": "Modular Effects-Based Transmitter for Integrated Simulations",
  "version": "2.1.1"
}
```

**Status Codes**:

- 200 OK – System info retrieved successfully
- 500 Internal Server Error – Server error during retrieval

Notes:

- Name, description, and version values are pulled directly from package.json via MetisServer constants
- Values are fixed at build time and cannot be modified at runtime

### Get Changelog

Retrieves the system changelog by reading the contents of the project's docs/changelog.md file.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/changelog/`

**Middleware**:

- Authentication with `changelog_read` permission required

#### Response

Plain text response containing the Markdown-formatted changelog content:

```
# changelog

# version-2.1.1 | 7-9-2025
...
# version-2.1.0 | 7-3-2025
...
```

**Status Codes**:

- 200 OK – Changelog retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Changelog file not found
- 500 Internal Server Error – Server error during retrieval

Notes:

- Returns raw Markdown content from changelog.md
- Content is read directly from filesystem on each request
- File encoding is UTF-8

## Data Types

### Info Object

| Field         | Type     | Description         | Source                                             |
| ------------- | -------- | ------------------- | -------------------------------------------------- |
| `name`        | `string` | Project name        | package.json via `MetisServer.PROJECT_NAME`        |
| `description` | `string` | Project description | package.json via `MetisServer.PROJECT_DESCRIPTION` |
| `version`     | `string` | Project version     | package.json via `MetisServer.PROJECT_VERSION`     |

Notes:

- All fields are read-only and sourced from package.json at build time
- Schema build number (currently 45) is tracked internally by MetisServer but not exposed via the API

## Notes

- Server Implementation:

  - Routes defined in `/server/api/v1/routes/info.ts`
  - Controllers in `/server/api/v1/controllers/info/`
  - Project metadata constants in MetisServer class
  - Changelog file accessed directly from filesystem
  - No database interaction required

- Security Considerations:

  - `/info` endpoint is public with no authentication required
  - `/info/changelog` requires `changelog_read` permission
  - Response data is static/read-only
  - File paths are fixed to prevent traversal
  - No sensitive data exposed

- Error Handling:

  - Filesystem errors when reading changelog
  - Authentication/permission validation
  - Standard HTTP status codes
  - JSON error response format
  - Stack traces logged but not returned

- Content Delivery:
  - Info endpoint returns JSON
  - Changelog endpoint returns raw Markdown
  - UTF-8 encoding enforced
  - No caching headers (always fresh reads)
  - Content-Type headers set automatically
