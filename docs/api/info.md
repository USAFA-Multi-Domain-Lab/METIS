# Info API

**Base URL:** `/api/v1/info/`

METIS provides API endpoints for retrieving system information and metadata. Basic system information (name, description, version) is publicly available, while the changelog requires authentication.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get System Info](#get-system-info)
  - [Get Changelog](#get-changelog)
- [Data Types](#data-types)
  - [Info Object](#info-object)
- [Notes](#notes)
  - [Server Implementation](#server-implementation)
  - [Security Considerations](#security-considerations)
  - [Error Handling](#error-handling)
  - [Content Delivery](#content-delivery)

## Endpoints

### Get System Info

Retrieves basic system information about the METIS system.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/`

**Required Permission(s)**: None required (public endpoint)

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

### Get Changelog

Retrieves the system changelog containing version history and updates.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/changelog/`

**Required Permission(s)**: `changelog_read`

#### Response

Returns the changelog in Markdown format:

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
- 404 Not Found – Changelog not found
- 500 Internal Server Error – Server error during retrieval

## Data Types

### Info Object

| Field         | Type     | Description         |
| ------------- | -------- | ------------------- |
| `name`        | `string` | Project name        |
| `description` | `string` | Project description |
| `version`     | `string` | Project version     |

> _All fields are read-only_

## Notes

- #### Server Implementation:

  - Routes defined in `/server/api/v1/routes/info.ts`
  - Controllers in `/server/api/v1/controllers/info/`
  - Project metadata constants in MetisServer class
  - Changelog file accessed directly from filesystem
  - No database interaction required

- #### Security Considerations:

  - `/info` endpoint is public with no authentication required
  - `/info/changelog` requires `changelog_read` permission
  - Response data is static/read-only
  - File paths are fixed to prevent traversal
  - No sensitive data exposed

- #### Error Handling:

  - Filesystem errors when reading changelog
  - Authentication/permission validation
  - Standard HTTP status codes
  - JSON error response format
  - Stack traces logged but not returned

- #### Content Delivery:
  - Info endpoint returns JSON
  - Changelog endpoint returns raw Markdown
  - UTF-8 encoding enforced
  - No caching headers (always fresh reads)
  - Content-Type headers set automatically
