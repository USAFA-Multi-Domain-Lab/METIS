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
  - [Required Permissions](#required-permissions)
  - [Version Control](#version-control)
  - [Target Arguments](#target-arguments)

## Endpoints

### Get All Target Environments

Retrieves all available target environments and their associated targets.

**HTTP Method:** `GET`  
**Path:** `/api/v1/target-environments/`

**Middleware**:

- Authentication with `environments_read` permission

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

**Middleware**:

- Authentication with `environments_read` permission
- Request body validation:
  - `targetId`: Required string
  - `environmentId`: Required string
  - `effectEnvVersion`: Must be valid semantic version string
  - `effectArgs`: Required object

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

| Field         | Type     | Description             | Validation              |
| ------------- | -------- | ----------------------- | ----------------------- |
| `_id`         | `string` | Unique identifier       | Required                |
| `name`        | `string` | Display name            | Required                |
| `description` | `string` | Environment description | Required                |
| `version`     | `string` | Current version         | Semantic version        |
| `targets`     | `array`  | Available targets       | Array of Target objects |

### Target Object

| Field               | Type     | Description           | Validation                |
| ------------------- | -------- | --------------------- | ------------------------- |
| `targetEnvId`       | `string` | Parent environment ID | Must match environment ID |
| `_id`               | `string` | Unique identifier     | Required                  |
| `name`              | `string` | Display name          | Required                  |
| `description`       | `string` | Target description    | Required                  |
| `args`              | `array`  | Target arguments      | Array of argument specs   |
| `migrationVersions` | `array`  | Supported versions    | Array of version strings  |

### Target Argument Object

All target arguments share these base properties:

| Field                | Type      | Description                       | Required |
| -------------------- | --------- | --------------------------------- | -------- |
| `_id`                | `string`  | Unique identifier                 | Yes      |
| `type`               | `string`  | Argument type                     | Yes      |
| `name`               | `string`  | Display name                      | Yes      |
| `required`           | `boolean` | Whether input is required         | Yes      |
| `groupingId`         | `string`  | Groups related arguments together | No       |
| `dependencies`       | `array`   | Conditional display rules         | No       |
| `tooltipDescription` | `string`  | Hover-over help text              | No       |

When `required` is true, a `default` value must be provided.

Additional properties by type:

- `string`: Adds `pattern` and `title` (error message)
- `number`: Adds `min`, `max`, `unit`, and `integersOnly`
- `dropdown`: Adds `options` array of choices
- `boolean`: Adds optional `default` (defaults to false)
- `force`, `node`, `action`, `file`: Mission component references

For detailed implementation information, refer to the [Target Environment Integration Guide](../devs/target-environment-integration.md).

## Notes

### Required Permissions

To interact with target environments, users need:

- `environments_read`: Required to view environments and perform migrations

### Version Control

Target environments use semantic versioning (MAJOR.MINOR.PATCH):

- Version changes indicate breaking changes in target argument specifications
- Migration paths handle argument format changes between versions
- The migration endpoint provides automatic version compatibility

### Target Arguments

Target arguments specify the parameters that a target accepts. Each target defines its arguments in the `args` array of the [Target Object](#target-object). For detailed information about implementing target arguments, refer to the [Target Environment Integration Guide](../devs/target-environment-integration.md).

Each argument in the array must follow the [Target Argument Object](#target-argument-object) structure. The supported argument types are `string`, `large-string`, `number`, `boolean`, `dropdown`, `force`, `node`, `action`, and `file`.
