# Target Environments API

**Base URL:** `/api/v1/target-environments/`

METIS provides API endpoints for managing target environments. Target environments define collections of targets that can be integrated into METIS. Each target specifies its available operations and required arguments.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get All Target Environments](#get-all-target-environments)
  - [Migrate Effect Arguments](#migrate-effect-arguments)
- [Data Types](#data-types)
  - [Target Environment Object](#target-environment-object)
  - [Target Object](#target-object)
  - [Target Argument Object](#target-argument-object)
- [Notes](#notes)

## Endpoints

### Get All Target Environments

Retrieves all available target environments and their associated targets.

**HTTP Method:** `GET`  
**Path:** `/api/v1/target-environments/`

**Required Permission(s)**: `environments_read`

#### Response

```json
[
  {
    "_id": "metis",
    "name": "METIS",
    "description": "The METIS target environment",
    "version": "0.2.0",
    "targets": [
      {
        "targetEnvId": "metis",
        "_id": "output",
        "name": "Output",
        "description": "Sends a message to the output panel",
        "args": [],
        "migrationVersions": ["0.1.0", "0.2.0"]
      }
    ]
  }
]
```

**Status Codes**:

- 200 OK – Target environments retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during retrieval

### Migrate Effect Arguments

Migrates effect arguments through available migration versions using the target's migration registry.

**HTTP Method:** `POST`  
**Path:** `/api/v1/target-environments/migrate/effect-args`

**Required Permission(s)**: `environments_read`

#### Request Body

```json
{
  "targetId": "output",
  "environmentId": "metis",
  "effectEnvVersion": "0.1.0",
  "effectArgs": {
    "message": "Hello World"
  }
}
```

#### Response

```json
{
  "resultingVersion": "0.2.0",
  "resultingArgs": {
    "message": "Hello World",
    "type": "info"
  }
}
```

**Status Codes**:

- 200 OK – Arguments migrated successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Target/environment not found
- 500 Internal Server Error – Server error during migration

## Data Types

### Target Environment Object

| Field         | Type     | Description             |
| ------------- | -------- | ----------------------- |
| `_id`         | `string` | Unique identifier       |
| `name`        | `string` | Display name            |
| `description` | `string` | Environment description |
| `version`     | `string` | Current version         |
| `targets`     | `array`  | Available targets       |

### Target Object

| Field               | Type     | Description           |
| ------------------- | -------- | --------------------- |
| `targetEnvId`       | `string` | Parent environment ID |
| `_id`               | `string` | Unique identifier     |
| `name`              | `string` | Display name          |
| `description`       | `string` | Target description    |
| `args`              | `array`  | Target arguments      |
| `migrationVersions` | `array`  | Supported versions    |

### Target Argument Object

Base properties:

| Field                | Type      | Description                       |
| -------------------- | --------- | --------------------------------- |
| `_id`                | `string`  | Unique identifier                 |
| `type`               | `string`  | Argument type                     |
| `name`               | `string`  | Display name                      |
| `required`           | `boolean` | Whether input is required         |
| `groupingId`         | `string`  | Groups related arguments together |
| `dependencies`       | `array`   | Conditional display rules         |
| `tooltipDescription` | `string`  | Hover-over help text              |

Available argument types:

- `string`, `number`, `boolean`, `dropdown`
- `force`, `node`, `action`, `file`

For detailed implementation information, refer to the [Target Environment Integration Guide](/docs/target-env-integration/index.md).

## Notes

- Required permission `environments_read` for all operations
- Uses semantic versioning (MAJOR.MINOR.PATCH)
- Migration system handles version compatibility
- For target environment implementation details, see the [Target Environment Integration Guide](/docs/target-env-integration/index.md)
