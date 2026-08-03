# Target Environments API

**Base URL:** `/api/v1/target-environments/`

METIS provides API endpoints for reading the registered target environments and for bringing an effect's stored arguments up to date with a target whose parameters have changed.

A **target environment** is a registered integration; a **target** is one operation it exposes; a **parameter** is an input the target declares; an **argument** is the value an effect supplies for that parameter.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get All Target Environments](#get-all-target-environments)
  - [Migrate Effect Arguments](#migrate-effect-arguments)
- [Data Types](#data-types)
  - [Target Environment Object](#target-environment-object)
  - [Target Object](#target-object)
  - [Target Parameter Object](#target-parameter-object)
  - [Target Environment Configuration Object](#target-environment-configuration-object)
- [Notes](#notes)
- [Related Documentation](#related-documentation)

## Endpoints

### Get All Target Environments

Retrieves every registered target environment, with its targets and its available configurations.

**HTTP Method:** `GET`  
**Path:** `/api/v1/target-environments/`

**Required Permission(s)**: `environments_read`

**Response**

```json
[
  {
    "_id": "metis",
    "name": "METIS",
    "description": "The METIS target environment",
    "version": "0.2.0",
    "multiRealmSupport": true,
    "targets": [
      {
        "targetEnvId": "metis",
        "_id": "output",
        "name": "Output",
        "description": "Sends a message to the output panel",
        "migrationVersions": ["0.1.0", "0.2.0"],
        "parameters": [
          {
            "_id": "message",
            "name": "Message",
            "type": "string",
            "required": true,
            "default": "",
            "groupingId": "output",
            "tooltipDescription": "The message to send."
          }
        ]
      }
    ],
    "configs": [
      {
        "_id": "metis-config-main",
        "name": "Main",
        "targetEnvId": "metis",
        "description": "The primary configuration.",
        "data": {}
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

Runs a target's migration scripts against one effect's stored arguments and returns the result. The server changes nothing: it reads the mission, transforms the arguments in memory, and hands them back for the caller to persist.

**HTTP Method:** `POST`  
**Path:** `/api/v1/target-environments/migrate/effect-args`

**Required Permission(s)**: `missions_read` **and** `environments_read`

Both are required because the call touches two subsystems: it loads a mission document, so `missions_read` governs the data leaving the server, and it runs target-environment scripts, so `environments_read` governs use of that subsystem. Requiring both deliberately excludes students, who hold `environments_read` but not `missions_read`.

**Request Body**

```json
{
  "effectId": "662270879c5ca781c218ef01",
  "missionId": "662270879c5ca781c218123c"
}
```

The effect is located inside the mission, and the target and its migration registry are resolved from the effect. Nothing else needs to be sent.

**Response**

`data` is the migrated argument array, and `version` is the target-environment version the effect now sits at.

```json
{
  "result": {
    "version": "2.0.0",
    "data": [
      {
        "_id": "662270879c5ca781c218aa01",
        "parameterId": "hostname",
        "type": "string",
        "value": "localhost"
      }
    ]
  }
}
```

**Status Codes**:

- 200 OK – Arguments migrated successfully
- 400 Bad Request – `effectId` or `missionId` missing from the request body
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission, effect, or target not found
- 500 Internal Server Error – A migration script threw, or produced arguments that failed validation

> **A failing migration reports 500, not a 4xx.** Arguments are schema-checked after every run, and a migration that leaves an argument's `value` disagreeing with its `type` throws. That error is not translated into a client error, so it arrives as a generic server error. When this endpoint returns 500 for one particular effect while working for others, suspect the migration rather than the server. The effect is left untouched either way. See [Target Migrations](../target-env-integration/guides/migrations.md).

## Data Types

### Target Environment Object

| Field               | Type      | Description                                                                       |
| ------------------- | --------- | --------------------------------------------------------------------------------- |
| `_id`               | `string`  | Unique identifier                                                                 |
| `name`              | `string`  | Display name                                                                      |
| `description`       | `string`  | Environment description                                                           |
| `version`           | `string`  | Current version                                                                   |
| `multiRealmSupport` | `boolean` | Whether the environment tolerates a session running several realms against it. Absent means `false` |
| `targets`           | `array`   | [Target objects](#target-object)                                                  |
| `configs`           | `array`   | [Configuration objects](#target-environment-configuration-object)                 |

### Target Object

| Field               | Type     | Description                                            |
| ------------------- | -------- | ------------------------------------------------------ |
| `targetEnvId`       | `string` | ID of the environment the target belongs to             |
| `_id`               | `string` | Unique identifier                                      |
| `name`              | `string` | Display name                                           |
| `description`       | `string` | Target description                                     |
| `migrationVersions` | `array`  | Versions that have a registered migration              |
| `parameters`        | `array`  | [Parameter objects](#target-parameter-object)          |

### Target Parameter Object

Properties every parameter carries, whatever its type:

| Field                | Type     | Description                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------- |
| `_id`                | `string` | Unique identifier, and the key an argument references as `parameterId`              |
| `type`               | `string` | Parameter type, from the list below                                                 |
| `name`               | `string` | Display name                                                                        |
| `groupingId`         | `string` | Groups related parameters together in the interface. Optional                       |
| `dependencies`       | `array`  | Encoded strings, each a condition on another parameter's value. Optional            |
| `tooltipDescription` | `string` | Hover help text. Optional                                                           |

Available parameter types:

- `string`, `large-string`, `number`, `boolean`, `dropdown`, `mission-component`

`required` is **not** universal. It appears on `string`, `large-string`, `number`, and `dropdown`, and is absent from `boolean` and `mission-component` — neither of those has an empty state that a value could be missing from. Do not assume the property is present before reading it.

`default` follows from that: `boolean` always carries one, the four types above carry one only when `required` is `true`, and `mission-component` never does.

Each type adds its own properties on top — `options` for a dropdown, `min`/`max`/`unit`/`integersOnly` for a number, `pattern` and `title` for a string, `validComponentTypes` for a mission component. Two are re-encoded so they survive JSON: `dependencies` becomes an array of strings, and a string parameter's `pattern` becomes an object of the form `{ "source": "...", "flags": "..." }` rather than a regular expression literal. See [Parameter and Argument Types](../target-env-integration/guides/parameter-and-argument-types.md) for the full set.

### Target Environment Configuration Object

| Field         | Type     | Description                                                     |
| ------------- | -------- | --------------------------------------------------------------- |
| `_id`         | `string` | Unique identifier, referenced by a session's `targetEnvConfigs`  |
| `name`        | `string` | Display name                                                    |
| `targetEnvId` | `string` | ID of the environment the configuration belongs to               |
| `description` | `string` | What the configuration is for. Optional                          |
| `data`        | `object` | **Always empty in a response** — see below                       |

> **`data` never leaves the server.** A configuration's `data` holds the connection details a target environment uses, including credentials, so it is replaced with an empty object before the response is sent. This endpoint tells you which configurations exist and what to call them; it is not a way to read their contents.

Configurations come from the environment's `configs.json` file, which the server re-reads from disk each time it is asked. See the [configs.json Reference](../target-env-integration/references/configs-json.md).

## Notes

- Reading environments requires `environments_read`; migrating arguments requires `missions_read` as well
- Target environments use semantic versioning (MAJOR.MINOR.PATCH)
- Effects are executed over the [WebSocket API](../devs/websocket.md), not through this API
- For implementation details, see the [Target Environment Integration Guide](../target-env-integration/index.md)

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Target Environment Integration](../target-env-integration/index.md)** - Building and registering an environment
- **[Parameter and Argument Types](../target-env-integration/guides/parameter-and-argument-types.md)** - The parameter shapes this API returns
- **[Missions API](missions.md)** - The effects that supply arguments to these targets
