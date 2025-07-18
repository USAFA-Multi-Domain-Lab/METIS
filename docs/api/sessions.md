# Sessions API

**Base URL:** `/api/v1/sessions/`

METIS provides API endpoints for managing mission sessions through the `SessionServer` class. All operations require appropriate permissions and pass through middleware checks for authentication, validation and session state management.

## Table of Contents

- [Endpoints](#endpoints)
  - [Launch Session](#launch-session)
  - [Get All Sessions](#get-all-sessions)
  - [Download Mission File](#download-mission-file)
  - [Delete Session](#delete-session)
- [Data Types](#data-types)
  - [Session Object](#session-object)
  - [Session Configuration Object](#session-configuration-object)
- [Notes](#notes)

## Endpoints

### Launch Session

Creates and launches a new mission session.

**HTTP Method:** `POST`  
**Path:** `/api/v1/sessions/launch/`

**Middleware**:

- Authentication with appropriate [permissions](#required-permissions):
  - Requires `sessions_write_native` or `sessions_write_foreign`
  - Requires `missions_read` to access the mission
- Request body validation:
  - Required `missionId`: Valid ObjectId
  - Optional configuration parameters

#### Request Body

```json
{
  // Required, valid mission ObjectId
  "missionId": "662270879c5ca781c218123c",
  // Optional session configuration
  "name": "Custom Session Name",
  // See Session Access Levels in Notes
  "accessibility": "public",
  "autoAssign": true,
  "infiniteResources": false,
  "effectsEnabled": true
}
```

#### Response

```json
{
  "sessionId": "662270879c5ca781c218123c"
}
```

**Status Codes**:

- 200 OK – Session launched successfully
- 400 Bad Request – Invalid request body
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during launch

### Get All Sessions

Retrieves all accessible sessions based on user permissions.

**HTTP Method:** `GET`  
**Path:** `/api/v1/sessions/`

**Middleware**:

- Basic authentication (no specific permissions required)

#### Response

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "missionId": "662270879c5ca781c218123d",
    "state": "unstarted",
    "name": "Session Name",
    "ownerId": "662270879c5ca781c218123e",
    "ownerUsername": "instructor1",
    "ownerFirstName": "Instructor",
    "ownerLastName": "User",
    "launchedAt": "2025-07-15T10:30:00.000Z",
    "config": {
      "accessibility": "public",
      "autoAssign": true,
      "infiniteResources": false,
      "effectsEnabled": true
    },
    "participantIds": [],
    "banList": [],
    "observerIds": [],
    "managerIds": []
  }
]
```

**Status Codes**:

- 200 OK – Sessions retrieved successfully
- 401 Unauthorized – Missing authentication
- 500 Internal Server Error – Server error during retrieval

### Download Mission File

Downloads a file associated with the mission in the session.

**HTTP Method:** `GET`  
**Path:** `/api/v1/sessions/files/:_id/download`

**Middleware**:

- Authentication with `in-session` requirement
- Parameter validation:
  - `_id`: Valid file ID
- File access permission check

**Status Codes**:

- 200 OK – File downloaded successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – File not found
- 500 Internal Server Error – Server error during download

### Delete Session

Destroys a session.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/sessions/:_id`

**Middleware**:

- Basic authentication
- [Permission check](#required-permissions):
  - Owner must have `sessions_write_native`
  - Non-owner must have `sessions_write_foreign`

**Status Codes**:

- 200 OK – Session deleted successfully
- 401 Unauthorized – Missing authentication/permissions
- 404 Not Found – Session not found
- 500 Internal Server Error – Server error during deletion

## Data Types

### Session Object

| Field            | Type       | Description                                           | Validation              |
| ---------------- | ---------- | ----------------------------------------------------- | ----------------------- |
| `_id`            | `objectId` | Unique identifier                                     | Valid MongoDB ObjectId  |
| `missionId`      | `objectId` | Associated mission                                    | Valid mission ObjectId  |
| `state`          | `string`   | Session state (see [Session States](#session-states)) | string                  |
| `name`           | `string`   | Session display name                                  | Max 175 chars, optional |
| `ownerId`        | `objectId` | Owner's user ID                                       | Valid user ObjectId     |
| `ownerUsername`  | `string`   | Owner's username                                      | 5-25 chars              |
| `ownerFirstName` | `string`   | Owner's first name                                    | 1-50 chars              |
| `ownerLastName`  | `string`   | Owner's last name                                     | 1-50 chars              |
| `launchedAt`     | `string`   | Launch timestamp                                      | ISO 8601 UTC            |
| `config`         | `object`   | Session configuration                                 | Valid config object     |
| `participantIds` | `array`    | Participant user IDs                                  | Array of ObjectIds      |
| `banList`        | `array`    | Banned user IDs                                       | Array of ObjectIds      |
| `observerIds`    | `array`    | Observer user IDs                                     | Array of ObjectIds      |
| `managerIds`     | `array`    | Manager user IDs                                      | Array of ObjectIds      |

### Session Configuration Object

| Field               | Type      | Description                                                                | Default      |
| ------------------- | --------- | -------------------------------------------------------------------------- | ------------ |
| `accessibility`     | `string`  | Session access level (see [Session Access Levels](#session-access-levels)) | "public"     |
| `autoAssign`        | `boolean` | Auto-assign users to forces                                                | true         |
| `infiniteResources` | `boolean` | Unlimited resources                                                        | false        |
| `effectsEnabled`    | `boolean` | Enable effects                                                             | true         |
| `name`              | `string`  | Custom session name                                                        | Mission name |

## Notes

### Session States

Sessions can be in one of three states:

- `unstarted`: Initial state after creation, configuration can be modified
- `started`: Session is active and running, participants can join and interact
- `ended`: Session is complete and cannot be restarted

### Required Permissions

To interact with sessions, users need specific permissions:

- `sessions_write_native`: Create and manage your own sessions
- `sessions_write_foreign`: Create and manage any session (admin level)
- `sessions_join_participant`: Join sessions as a participant
- `sessions_join_observer`: Join sessions as an observer
- `sessions_join_manager`: Join any session as a manager
- `sessions_join_manager_native`: Join only your own sessions as manager

### Session Access Levels

The `accessibility` field in session configuration determines who can join:

- `public`: Anyone with appropriate join permissions can access
- `id-required`: Must know session ID to join
- `invite-only`: Must be explicitly invited
- `testing`: Special mode for testing purposes
