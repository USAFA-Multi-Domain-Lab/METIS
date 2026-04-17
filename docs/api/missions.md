# Missions API

**Base URL:** `/api/v1/missions/`

METIS provides API endpoints for managing missions. All operations require appropriate permissions and validate user authentication.

## Table of Contents

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
  - [Mission Structure Requirements](#mission-structure-requirements)
- [Notes](#notes)

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
  "resources": [
    {
      "_id": "662270879c5ca781c218abc1",
      "name": "Resources",
      "icon": "resources/coins",
      "order": 1
    }
  ],
  "structure": {
    "122360879c5db791d261dca3": {}
  },
  "forces": [
    {
      "_id": "662270879c5ca781c218fed1",
      "name": "Blue Force",
      "color": "#1a73e8",
      "localKey": "1",
      "introMessage": "",
      "revealAllNodes": false,
      "resourcePools": [],
      "nodes": [
        {
          "_id": "662270879c5ca781c218fed2",
          "localKey": "1",
          "prototypeId": "662270879c5ca781c218def1",
          "name": "Target Node",
          "color": "#1a73e8",
          "description": "",
          "preExecutionText": "",
          "executable": false,
          "device": false,
          "actions": [],
          "exclude": false,
          "initiallyBlocked": false
        }
      ]
    }
  ],
  "prototypes": [
    {
      "_id": "662270879c5ca781c218def1",
      "structureKey": "122360879c5db791d261dca3",
      "depthPadding": 0
    }
  ],
  "files": []
}
```

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "name": "New Mission",
  "versionNumber": 1,
  "resources": [
    {
      "_id": "662270879c5ca781c218abc1",
      "name": "Resources",
      "icon": "resources/coins",
      "order": 1
    }
  ],
  "structure": {
    "122360879c5db791d261dca3": {}
  },
  "forces": [
    {
      "_id": "662270879c5ca781c218fed1",
      "name": "Blue Force",
      "color": "#1a73e8",
      "localKey": "1",
      "introMessage": "",
      "revealAllNodes": false,
      "resourcePools": [],
      "nodes": [
        {
          "_id": "662270879c5ca781c218fed2",
          "localKey": "1",
          "prototypeId": "662270879c5ca781c218def1",
          "name": "Target Node",
          "color": "#1a73e8",
          "description": "",
          "preExecutionText": "",
          "executable": false,
          "device": false,
          "actions": [],
          "exclude": false,
          "initiallyBlocked": false
        }
      ]
    }
  ],
  "prototypes": [
    {
      "_id": "662270879c5ca781c218def1",
      "structureKey": "122360879c5db791d261dca3",
      "depthPadding": 0
    }
  ],
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

> For full mission details, get an individual mission by ID via the [get-mission endpoint](#get-mission). Forces, resources, prototypes, files, and the structure are intentionally omitted from this endpoint for performance reasons.

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
  "resources": [
    {
      "_id": "662270879c5ca781c218abc1",
      "name": "Resources",
      "icon": "resources/coins",
      "order": 1
    }
  ],
  "structure": {
    "122360879c5db791d261dca3": {}
  },
  "forces": [
    {
      "_id": "662270879c5ca781c218fed1",
      "name": "Blue Force",
      "color": "#1a73e8",
      "localKey": "1",
      "introMessage": "",
      "revealAllNodes": false,
      "resourcePools": [],
      "nodes": [
        {
          "_id": "662270879c5ca781c218fed2",
          "localKey": "1",
          "prototypeId": "662270879c5ca781c218def1",
          "name": "Target Node",
          "color": "#1a73e8",
          "description": "",
          "preExecutionText": "",
          "executable": false,
          "device": false,
          "actions": [],
          "exclude": false,
          "initiallyBlocked": false
        }
      ]
    }
  ],
  "prototypes": [
    {
      "_id": "662270879c5ca781c218def1",
      "structureKey": "122360879c5db791d261dca3",
      "depthPadding": 0
    }
  ],
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
  "resources": [
    {
      "_id": "662270879c5ca781c218abc1",
      "name": "Points",
      "icon": "resources/trophy",
      "order": 1
    }
  ],
  "structure": {
    "122360879c5db791d261dca3": {}
  },
  "forces": [
    {
      "_id": "662270879c5ca781c218fed1",
      "name": "Blue Force",
      "color": "#1a73e8",
      "localKey": "1",
      "introMessage": "",
      "revealAllNodes": false,
      "resourcePools": [],
      "nodes": [
        {
          "_id": "662270879c5ca781c218fed2",
          "localKey": "1",
          "prototypeId": "662270879c5ca781c218def1",
          "name": "Target Node",
          "color": "#1a73e8",
          "description": "",
          "preExecutionText": "",
          "executable": false,
          "device": false,
          "actions": [],
          "exclude": false,
          "initiallyBlocked": false
        }
      ]
    }
  ],
  "prototypes": [
    {
      "_id": "662270879c5ca781c218def1",
      "structureKey": "122360879c5db791d261dca3",
      "depthPadding": 0
    }
  ],
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

| Field               | Type       | List view | Description           |
| ------------------- | ---------- | --------- | --------------------- |
| `_id`               | `objectId` | ✓         | Unique identifier     |
| `name`              | `string`   | ✓         | Mission name          |
| `versionNumber`     | `number`   | ✓         | Version number        |
| `resources`         | `array`    | —         | Resource definitions  |
| `structure`         | `object`   | —         | Mission structure     |
| `forces`            | `array`    | —         | Force configurations  |
| `prototypes`        | `array`    | —         | Prototype objects     |
| `files`             | `array`    | —         | Associated files      |
| `createdAt`         | `string`   | ✓         | Creation timestamp    |
| `updatedAt`         | `string`   | ✓         | Last update timestamp |
| `createdBy`         | `objectId` | ✓         | Creator's ID          |
| `createdByUsername` | `string`   | ✓         | Creator's username    |

> **Note:** The **List view** column indicates fields returned by `GET /api/v1/missions/`. Fields marked — are omitted from the list response for performance and are only present in the full mission response (`GET /api/v1/missions/:_id`).

---

### Mission Structure Requirements

The `structure` field defines the hierarchical organization of the prototypes. Each prototype has
a unique `structureKey` that corresponds to a key in the `structure` object. Every force must have
a corresponding prototype defined in the `prototypes` array, and each prototype must have a `structureKey`
that matches one key (no more, no less) in the `structure object. The mission also requires at least one
force and at least one resource definition, minimum.

## Notes

- Authentication is required for all operations
- All deletes are soft deletes (sets deleted=true)
- Timestamps and creator information are automatically tracked
- Export/Import features:
  - Exports include all associated files and metadata
  - Imports preserve all mission data and relationships
  - Mission files are managed through the file store
