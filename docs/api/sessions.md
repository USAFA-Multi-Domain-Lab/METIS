# Sessions API

**Base URL:** `/api/v1/sessions/`

METIS provides API endpoints for launching mission sessions, listing the sessions a caller can see, downloading a mission's files from inside a session, and destroying a session.

Only these four operations are available over REST. Everything that happens *during* a session — joining, starting, running effects, switching realms — goes through the [WebSocket API](../devs/websocket.md).

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
  - [Session States](#session-states)
  - [Member Roles](#member-roles)
  - [Play Modes and Realms](#play-modes-and-realms)
  - [Session Access Levels](#session-access-levels)
  - [Required Permissions](#required-permissions)
- [Related Documentation](#related-documentation)

## Endpoints

### Launch Session

Creates and launches a new mission session.

**HTTP Method:** `POST`  
**Path:** `/api/v1/sessions/launch/`

**Required Permission(s)**: `sessions_write_native` **and** `missions_read`

**Request Body**

`missionId` is the only required property. Everything else falls back to the default in the [Session Configuration Object](#session-configuration-object).

```json
{
  "missionId": "662270879c5ca781c218123c",
  "name": "Custom Session Name",
  "accessibility": "public",
  "mode": "multiplayer",
  "infiniteResources": false,
  "explicitlyDisabledEnvironments": ["metis-test-env"],
  "targetEnvConfigs": {
    "metis": "metis-config-main"
  }
}
```

A standalone launch also names the force every participant plays:

```json
{
  "missionId": "662270879c5ca781c218123c",
  "mode": "standalone",
  "standaloneForceId": "662270879c5ca781c218fed1"
}
```

> **Note:** Properties that are not part of the request body are dropped silently rather than rejected. A misspelled property name produces a successful launch that ignores your setting, not a 400.

**Response**

```json
{
  "sessionId": "3f2a1b9c"
}
```

> **A session ID is not an ObjectId.** It is eight lowercase hex characters, generated at launch and held in memory rather than persisted. The `missionId` and `ownerId` reported on a [Session Object](#session-object) *are* ObjectIds, so the two kinds of identifier need different validation.

**Status Codes**:

- 200 OK – Session launched successfully
- 400 Bad Request – Invalid request body, unknown target environment or configuration ID, invalid configuration (such as a standalone launch whose `standaloneForceId` is missing or names a force the mission does not have), or `isTest: true`
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Mission not found
- 500 Internal Server Error – Server error during launch

> **Play-tests are rejected here.** Sending `isTest: true` returns a 400. A play-test is a throwaway session bound to the owner's connection, so it has to be launched through the `request-play-test` method on the [WebSocket API](../devs/websocket.md) — that binding is what destroys the session when the owner quits.

### Get All Sessions

Retrieves the sessions the caller is allowed to see.

**HTTP Method:** `GET`  
**Path:** `/api/v1/sessions/`

**Required Permission(s)**: None beyond authentication — the caller's permissions decide what the list contains rather than whether the call succeeds.

> **Note:** There is a `sessions_read` permission, and the METIS interface checks it before offering the session list. The endpoint itself does not require it, so a caller without it still gets a filtered response rather than a 403.

A session appears in the response when any of the following is true:

- its `accessibility` is `public`
- the caller has `sessions_write`
- the caller has `sessions_write_native` and owns the session

Play-test sessions are never listed.

**Response**

```json
[
  {
    "_id": "3f2a1b9c",
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
      "mode": "multiplayer",
      "isTest": false,
      "infiniteResources": false,
      "explicitlyDisabledEnvironments": [],
      "targetEnvConfigs": {}
    },
    "participantIds": [],
    "limitedObserverIds": [],
    "observerIds": [],
    "managerIds": [],
    "joinedMemberCount": 0,
    "setupFailed": false,
    "teardownFailed": false
  }
]
```

**Status Codes**:

- 200 OK – Sessions retrieved successfully
- 401 Unauthorized – Missing authentication
- 500 Internal Server Error – Server error during retrieval

### Download Mission File

Downloads a file belonging to the mission being played. `:_id` is the ID of a file within the mission, not a file-store reference ID.

**HTTP Method:** `GET`  
**Path:** `/api/v1/sessions/files/:_id/download`

**Authentication:** `in-session` — the caller has to be joined to a session. None of the `files_*` permissions apply, because access here is decided by the caller's place in the session rather than by the file store.

Two things are checked in turn:

1. **The file has to exist in the caller's own realm.** The lookup runs against the mission in the realm that member is subscribed to, not the session's authoring template. In a standalone session, that is the participant's private copy — so a file another participant can download may legitimately 404 here.
2. **The caller has to be able to see it.** The member's assigned force must have access to the file, unless the member has complete visibility (a manager or full observer), in which case every file is available.

**Status Codes**:

- 200 OK – File downloaded successfully
- 401 Unauthorized – Not authenticated, or not joined to a session
- 403 Forbidden – The caller's force does not have access to the file
- 404 Not Found – No such file in the caller's realm
- 500 Internal Server Error – Server error during download

### Delete Session

Destroys a session.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/sessions/:_id/`

**Required Permission(s)**: `sessions_write_native` to destroy a session you own, `sessions_write_foreign` to destroy anyone else's.

**Status Codes**:

- 200 OK – Session deleted successfully
- 401 Unauthorized – Missing authentication, or the caller lacks the permission for this session
- 404 Not Found – Session not found
- 500 Internal Server Error – Server error during deletion

> **Note:** An authenticated caller without the right permission gets a 401 here rather than a 403.

## Data Types

### Session Object

Returned by [Get All Sessions](#get-all-sessions). This is the summary form — the full session, including the mission and its realms, is delivered over the WebSocket connection after joining.

| Field                | Type      | Description                                                       |
| -------------------- | --------- | ----------------------------------------------------------------- |
| `_id`                | `string`  | Unique identifier — eight hex characters, not an ObjectId          |
| `missionId`          | `objectId` | Associated mission                                                |
| `state`              | `string`  | Session state (see [Session States](#session-states))              |
| `name`               | `string`  | Session display name; the mission's name when none was given       |
| `ownerId`            | `objectId` | Owner's user ID                                                   |
| `ownerUsername`      | `string`  | Owner's username                                                   |
| `ownerFirstName`     | `string`  | Owner's first name                                                 |
| `ownerLastName`      | `string`  | Owner's last name                                                  |
| `launchedAt`         | `string`  | Launch timestamp, ISO 8601                                         |
| `config`             | `object`  | [Session configuration](#session-configuration-object)             |
| `participantIds`     | `array`   | Participant user IDs                                               |
| `limitedObserverIds` | `array`   | User IDs of limited observers (see [Member Roles](#member-roles))  |
| `observerIds`        | `array`   | Observer user IDs                                                  |
| `managerIds`         | `array`   | Manager user IDs                                                   |
| `joinedMemberCount`  | `number`  | How many members are currently online in the session               |
| `setupFailed`        | `boolean` | Whether target-environment setup failed                            |
| `teardownFailed`     | `boolean` | Whether target-environment teardown failed                         |

> **Note:** `setupFailed` and `teardownFailed` are reported as `false` unless the caller has `sessions_write_native`.

### Session Configuration Object

| Field                            | Type      | Description                                                                                  | Default        |
| -------------------------------- | --------- | -------------------------------------------------------------------------------------------- | -------------- |
| `accessibility`                  | `string`  | Who may join (see [Session Access Levels](#session-access-levels))                            | `"public"`     |
| `mode`                           | `string`  | `"multiplayer"` or `"standalone"` (see [Play Modes and Realms](#play-modes-and-realms))       | `"multiplayer"` |
| `standaloneForceId`              | `string`  | The force every participant plays in standalone mode. Required for standalone, ignored otherwise | —          |
| `isTest`                         | `boolean` | Whether the session is a throwaway play-test. Cannot be set through this API                  | `false`        |
| `infiniteResources`              | `boolean` | Whether resources are unlimited                                                               | `false`        |
| `explicitlyDisabledEnvironments` | `array`   | Target environment IDs the manager turned off by hand                                         | `[]`           |
| `targetEnvConfigs`               | `object`  | Map of target environment ID to the selected configuration ID                                 | `{}`           |
| `name`                           | `string`  | Session name                                                                                  | Mission name   |

Two normalizations are applied to the configuration on the way in, so what comes back may differ from what was sent:

- An `owner-only` session is forced to `multiplayer`, and `standaloneForceId` is cleared.
- `isTest` is always stored as `false`, since this route rejects play-tests outright.

`explicitlyDisabledEnvironments` holds only the manager's explicit choices. It is not the full set of environments whose effects will not run — in standalone mode, every environment that has not declared `multiRealmSupport` is disabled implicitly as well.

## Notes

### Session States

| State       | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `unstarted` | Launched and waiting in the lobby; configuration can still change |
| `starting`  | Running target-environment setup                              |
| `started`   | Active; participants can interact                             |
| `ending`    | Running target-environment teardown                           |
| `ended`     | Complete                                                      |
| `resetting` | Returning to `unstarted` so the mission can be played again   |

### Member Roles

The session object reports its members in four lists, one per role. The distinction between the two observer roles is what each one can see, not which realm they are in:

| Role                | Reported in          | What the member can do                                                     |
| ------------------- | -------------------- | -------------------------------------------------------------------------- |
| Participant         | `participantIds`     | Assigned to a force, and manipulates nodes within it                        |
| Limited Observer    | `limitedObserverIds` | Assigned to a force, and watches — seeing only that force                   |
| Observer            | `observerIds`        | Watches with a complete view of every force                                 |
| Manager             | `managerIds`         | Runs the session                                                            |

Managers may only assign the first two of these. In a standalone session every limited observer is promoted to participant, so `limitedObserverIds` is empty there.

### Play Modes and Realms

A **realm** is a live copy of the launched mission — the mission plus everything that changes as it is played. The session itself holds the authoring template; realms hold gameplay.

- **`multiplayer`** — one realm, shared by everyone. Participants play different forces in the same world.
- **`standalone`** — one realm per participant, each containing only the force named by `standaloneForceId`. Participants cannot affect each other.

Standalone has a consequence for integrations: a target environment that has not declared `multiRealmSupport` is disabled for the session, because it cannot tell concurrent realms apart. See [Creating Target Environments](../target-env-integration/guides/creating-target-environments.md).

### Session Access Levels

| Value         | Who can join                                                     |
| ------------- | ---------------------------------------------------------------- |
| `public`      | Anyone with the appropriate join permission; listed for everyone  |
| `id-required` | Anyone who knows the session ID                                   |
| `invite-only` | Only users who were invited                                       |
| `owner-only`  | Only the owner. This is the mechanism behind play-tests           |

### Required Permissions

| Permission                     | Grants                                        |
| ------------------------------ | --------------------------------------------- |
| `sessions_write_native`        | Launch and destroy your own sessions          |
| `sessions_write_foreign`       | Destroy sessions owned by someone else        |
| `sessions_write`               | Both of the above                             |
| `sessions_join_participant`    | Join a session as a participant               |
| `sessions_join_observer`       | Join a session as an observer                 |
| `sessions_join_manager`        | Join any session as a manager                 |
| `sessions_join_manager_native` | Join your own sessions as a manager           |

Permissions are hierarchical: holding `sessions_write` satisfies a requirement for `sessions_write_native`. Holding a sibling does not — `sessions_write_foreign` alone will not launch a session.

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Missions API](missions.md)** - Authoring the mission a session runs
- **[WebSocket System](../devs/websocket.md)** - Everything that happens inside a running session
- **[Architecture](../devs/architecture.md)** - Realms, and why gameplay state lives there
- **[Users API](users.md)** - Permissions that govern session access
