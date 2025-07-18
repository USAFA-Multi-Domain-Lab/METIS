# Missions API

**Base URL:** `/api/v1/missions/`

METIS provides API endpoints for managing missions. All operations require appropriate permissions and pass through multiple middleware checks for authentication, validation and file handling.

## Table of Contents

- [Endpoints](#endpoints)
  - [Create Mission](#create-mission)
  - [Get All Missions](#get-all-missions)
  - [Get Mission](#get-mission)
  - [Update Mission](#update-mission)
  - [Copy Mission](#copy-mission)
  - [Import Mission](#import-mission)
  - [Export Mission](#export-mission)
  - [Get Environment](#get-environment)
  - [Delete Mission](#delete-mission)
- [Data Types](#data-types)
  - [Mission Object](#mission-object)
- [Notes](#notes)

## Endpoints

### Create Mission

Creates a new mission with specified configuration and resources.

**HTTP Method:** `POST`  
**Path:** `/api/v1/missions/`

**Middleware**:

- Authentication with `missions_write` permission
- Request body validation:
  - `name`: Must be string, max 175 chars
  - `versionNumber`: Must be integer
  - `seed`: Must be string
  - `resourceLabel`: Must be string, max 16 chars
  - `structure`: Must be object
  - `forces`: Must be array, max 8 forces
  - `prototypes`: Must be array
  - `files`: Must be array (optional)

#### Request Body

```json
{
  // Required, max 175 chars
  "name": "New Mission",
  // Required, integer
  "versionNumber": 1,
  // Required, string (auto-generated if not provided)
  "seed": "uniqueSeedString",
  // Required, max 16 chars
  "resourceLabel": "Resources",
  // Required, mission structure object
  "structure": {},
  // Required, array, max 8 forces
  "forces": [],
  // Required, array of prototype objects
  "prototypes": [],
  // Optional, array of file objects
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

**Middleware**:

- Authentication with `missions_read` permission

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

**Middleware**:

- Authentication with `missions_read` permission
- Parameter validation:
  - `_id`: Must be valid ObjectId

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

**Middleware**:

- Authentication with `missions_write` permission
- Request body validation:
  - Required:
    - `_id`: Must be valid ObjectId
  - Optional:
    - `name`: Must be string, max 175 chars
    - `versionNumber`: Must be integer
    - `seed`: Must be string
    - `resourceLabel`: Must be string, max 16 chars
    - `structure`: Must be object
    - `forces`: Must be array, max 8 forces
    - `prototypes`: Must be array
    - `files`: Must be array

#### Request Body

```json
{
  // Required, valid ObjectId
  "_id": "662270879c5ca781c218123c",
  // Optional fields below
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

**Middleware**:

- Authentication with `missions_write` permission
- Request body validation:
  - `originalId`: Must be valid ObjectId
  - `copyName`: Must be string, max 175 chars

#### Request Body

```json
{
  // Required, valid ObjectId of source mission
  "originalId": "662270879c5ca781c218123c",
  // Required, max 175 chars
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

**Middleware**:

- Authentication with `missions_write` permission
- File upload handling (max 12 files)
- File store validation

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

**Middleware**:

- Authentication with both `missions_read` and `missions_write` permissions
- Parameter validation:
  - `_id`: Must be valid ObjectId
- File store access validation

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

### Get Environment

Retrieves current database environment information.

**HTTP Method:** `GET`  
**Path:** `/api/v1/missions/environment/`

**Middleware**: None (public endpoint)

#### Response

```json
{
  "NODE_ENV": "production",
  "DATABASE_URL": "mongodb://localhost:27017/metis"
}
```

**Status Codes**:

- 200 OK – Environment info retrieved successfully
- 500 Internal Server Error – Server error during retrieval

### Delete Mission

Soft deletes a mission (sets deleted flag).

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/missions/:_id`

**Middleware**:

- Authentication with `missions_write` permission
- Parameter validation:
  - `_id`: Must be valid ObjectId

**Status Codes**:

- 200 OK – Mission deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during deletion

---

## Data Types

### Mission Object

| Field               | Type       | Description           | Validation              |
| ------------------- | ---------- | --------------------- | ----------------------- |
| `_id`               | `objectId` | Unique identifier     | Valid MongoDB ObjectId  |
| `name`              | `string`   | Mission name          | Max 175 chars           |
| `versionNumber`     | `number`   | Version number        | Integer                 |
| `seed`              | `string`   | Mission seed          | String                  |
| `resourceLabel`     | `string`   | Resource display name | Max 16 chars            |
| `structure`         | `object`   | Mission structure     | Valid structure object  |
| `forces`            | `array`    | Force configurations  | Max 8 forces            |
| `prototypes`        | `array`    | Prototype objects     | Valid prototype objects |
| `files`             | `array`    | Associated files      | Optional                |
| `createdAt`         | `string`   | Creation timestamp    | ISO 8601 UTC            |
| `updatedAt`         | `string`   | Last update timestamp | ISO 8601 UTC            |
| `createdBy`         | `objectId` | Creator's ID          | Valid MongoDB ObjectId  |
| `createdByUsername` | `string`   | Creator's username    | String                  |

---

## Notes

- Authentication middleware verifies:

  - Valid session with active JWT
  - Required permissions for operations
  - WebSocket connection (if required)
  - Active session membership (if required)
  - Request origin validation

- Validation requirements:

  - Mission names limited to 175 characters
  - Resource labels limited to 16 characters
  - Forces limited to 8 per mission
  - File aliases limited to 175 characters
  - File size limits enforced
  - Schema validation for all objects
  - Force structure validation
  - Prototype structure validation
  - Duplicate ID checking

- File handling:

  - Maximum 12 files per mission
  - Files stored in MetisFileStore
  - File size limits enforced
  - Valid .metis format required
  - Creator information preserved
  - File access permissions checked

- Data operations:

  - All deletes are soft deletes (sets deleted=true)
  - Timestamps automatically managed
  - Creator information tracked
  - Full audit trails maintained
  - Schema version tracked
  - All timestamps in UTC

- Export/Import behavior:
  - Exports include all associated files
  - Schema version included in exports
  - Imports validate data integrity
  - Creator information preserved
  - File references maintained
