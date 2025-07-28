# Missions API

**Base URL:** `/api/v1/missions/`

METIS provides API endpoints for managing missions. All operations require appropriate permissions and validate user authentication.

## Table of Contents

- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Create Mission](#create-mission)
  - [Get All Missions](#get-all-missions)
  - [Get Mission](#get-mission)
  - [Update Mission](#update-mission)
  - [Copy Mission](#copy-mission)
  - [Import Mission](#import-mission)
  - [Export Mission](#export-mission)
  - [Delete Mission](#delete-mission)
- [Data Types](#data-types)
  - [Mission Object](#mission-object)
- [Notes](#notes)

## Rate Limiting

All missions API endpoints are subject to METIS's standard rate limits:

- HTTP endpoints: 20 requests/second per IP address
- WebSocket events: 10 messages/second per user

Note that resource-intensive operations like mission import/export and bulk operations count toward these limits.

## Endpoints

### Create Mission

Creates a new mission with specified configuration and resources.

**HTTP Method:** `POST`  
**Path:** `/api/v1/missions/`

**Required Permission(s)**: `missions_write`

#### Request Body

```json
{
  "name": "New Mission",
  "versionNumber": 1,
  "seed": "uniqueSeedString",
  "resourceLabel": "Resources",
  "structure": {},
  "forces": [],
  "prototypes": [],
  "files": []
}
```

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "name": "New Mission",
  "versionNumber": 1,
  "seed": "uniqueSeedString",
  "resourceLabel": "Resources",
  "structure": {},
  "forces": [],
  "prototypes": [],
  "files": [],
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – Mission created successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during creation

### Get All Missions

Retrieves all missions with basic metadata.

**HTTP Method:** `GET`  
**Path:** `/api/v1/missions/`

**Required Permission(s)**: `missions_read`

#### Response

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "name": "Mission Name",
    "versionNumber": 1,
    "seed": "uniqueSeedString",
    "resourceLabel": "Resources",
    "createdAt": "2025-07-15T10:30:00.000Z",
    "updatedAt": "2025-07-15T10:30:00.000Z",
    "createdBy": "000000000000000000000001",
    "createdByUsername": "admin"
  }
]
```

**Status Codes**:

- 200 OK – Missions retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – No missions found
- 500 Internal Server Error – Server error during retrieval

### Get Mission

Retrieves a specific mission by ID with full details.

**HTTP Method:** `GET`  
**Path:** `/api/v1/missions/:_id`

**Required Permission(s)**: `missions_read`

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "name": "Mission Name",
  "versionNumber": 1,
  "seed": "uniqueSeedString",
  "resourceLabel": "Resources",
  "structure": {},
  "forces": [],
  "prototypes": [],
  "files": [],
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – Mission retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during retrieval

### Update Mission

Updates an existing mission.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/missions/`

**Required Permission(s)**: `missions_write`

#### Request Body

```json
{
  "_id": "662270879c5ca781c218123c",
  "name": "Updated Mission",
  "versionNumber": 2,
  "seed": "newSeedString",
  "resourceLabel": "Points",
  "structure": {},
  "forces": [],
  "prototypes": [],
  "files": []
}
```

**Status Codes**:

- 200 OK – Mission updated successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during update

### Copy Mission

Creates a copy of an existing mission.

**HTTP Method:** `POST`  
**Path:** `/api/v1/missions/copy/`

**Required Permission(s)**: `missions_write`

#### Request Body

```json
{
  "originalId": "662270879c5ca781c218123c",
  "copyName": "Mission Copy"
}
```

**Status Codes**:

- 200 OK – Mission copied successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Source mission not found
- 500 Internal Server Error – Server error during copy

### Import Mission

Imports a mission from a .metis file.

**HTTP Method:** `POST`  
**Path:** `/api/v1/missions/import/`

**Required Permission(s)**: `missions_write`

#### Request Body

- Form data with file(s) under key `files`
- Supports up to 12 files
- Files must be valid .metis format

**Status Codes**:

- 200 OK – Mission imported successfully
- 400 Bad Request – Invalid file format/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 413 Payload Too Large – File size exceeds limit
- 500 Internal Server Error – Server error during import

### Export Mission

Exports a mission to a .metis file.

**HTTP Method:** `GET`  
**Path:** `/api/v1/missions/:_id/export/*`

**Required Permission(s)**: `missions_read`, `missions_write`

#### Response

- Downloads .metis file containing:
  - Mission data
  - Schema version
  - Associated files

**Status Codes**:

- 200 OK – Mission exported successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during export

### Delete Mission

Soft deletes a mission (sets deleted flag).

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/missions/:_id`

**Required Permission(s)**: `missions_write`

**Status Codes**:

- 200 OK – Mission deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during deletion

---

## Data Types

### Mission Object

| Field               | Type       | Description           |
| ------------------- | ---------- | --------------------- |
| `_id`               | `objectId` | Unique identifier     |
| `name`              | `string`   | Mission name          |
| `versionNumber`     | `number`   | Version number        |
| `seed`              | `string`   | Mission seed          |
| `resourceLabel`     | `string`   | Resource display name |
| `structure`         | `object`   | Mission structure     |
| `forces`            | `array`    | Force configurations  |
| `prototypes`        | `array`    | Prototype objects     |
| `files`             | `array`    | Associated files      |
| `createdAt`         | `string`   | Creation timestamp    |
| `updatedAt`         | `string`   | Last update timestamp |
| `createdBy`         | `objectId` | Creator's ID          |
| `createdByUsername` | `string`   | Creator's username    |

---

## Notes

- Authentication is required for all operations
- All deletes are soft deletes (sets deleted=true)
- Timestamps and creator information are automatically tracked
- Export/Import features:
  - Exports include all associated files and metadata
  - Imports preserve all mission data and relationships
  - Mission files are managed through the file store
