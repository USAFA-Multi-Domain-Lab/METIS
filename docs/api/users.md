# Users API

**Base URL:** `/api/v1/users/`

METIS provides API endpoints for managing user accounts. Access is role-based: administrators manage every account, instructors manage student accounts only, and students manage nothing but their own preferences and password.

## Table of Contents

- [Endpoints](#endpoints)
  - [Create User](#create-user)
  - [Get All Users](#get-all-users)
  - [Check Username Availability](#check-username-availability)
  - [Get User](#get-user)
  - [Update User](#update-user)
  - [Update User Preferences](#update-user-preferences)
  - [Reset Password](#reset-password)
  - [Delete User](#delete-user)
- [Data Types](#data-types)
  - [User Object](#user-object)
  - [User Preferences Object](#user-preferences-object)
- [Notes](#notes)
  - [Access Levels](#access-levels)
  - [Access Control](#access-control)
  - [Security Features](#security-features)
- [Related Documentation](#related-documentation)

## Endpoints

### Create User

Creates a new user account.

**HTTP Method:** `POST`  
**Path:** `/api/v1/users/`

**Required Permission(s)**: `users_write_students`, which limits the caller to creating students. `users_write` allows any access level except `system`.

**Request Body**

Every property below is required.

```json
{
  "username": "student1",
  "accessId": "student",
  "expressPermissionIds": [],
  "firstName": "Student",
  "lastName": "User",
  "needsPasswordReset": false,
  "password": "password1"
}
```

**Response**

The created user. Passwords are never included in a response.

```json
{
  "_id": "662270879c5ca781c218123c",
  "username": "student1",
  "expressPermissionIds": [],
  "firstName": "Student",
  "lastName": "User",
  "needsPasswordReset": false,
  "accessId": "student",
  "preferences": {
    "_id": "662270879c5ca781c21812ab",
    "missionMap": {
      "_id": "662270879c5ca781c21812ac",
      "panOnIssueSelection": true
    }
  },
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – User created successfully
- 400 Bad Request – Missing or invalid property
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions, or an attempt to assign `system` access
- 409 Conflict – The username is already taken
- 500 Internal Server Error – Server error during creation

### Get All Users

Retrieves the users the caller is allowed to read.

**HTTP Method:** `GET`  
**Path:** `/api/v1/users/`

**Required Permission(s)**: `users_read_students`

Which accounts come back depends on the caller: `users_read` returns every access level except `system`, while `users_read_students` returns students only.

**Response**

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "username": "student1",
    "expressPermissionIds": [],
    "firstName": "Student",
    "lastName": "User",
    "needsPasswordReset": false,
    "accessId": "student",
    "preferences": {
      "_id": "662270879c5ca781c21812ab",
      "missionMap": {
        "_id": "662270879c5ca781c21812ac",
        "panOnIssueSelection": true
      }
    },
    "createdAt": "2025-07-15T10:30:00.000Z",
    "updatedAt": "2025-07-15T10:30:00.000Z",
    "createdBy": "000000000000000000000001",
    "createdByUsername": "admin"
  }
]
```

**Status Codes**:

- 200 OK – Users retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – No users matched the caller's access level
- 500 Internal Server Error – Server error during retrieval

### Check Username Availability

Reports whether a username can be taken, without attempting to create anything.

**HTTP Method:** `GET`  
**Path:** `/api/v1/users/check-username/`

**Required Permission(s)**: `users_write_students`

**Query Parameters**

| Parameter  | Type     | Description             |
| ---------- | -------- | ----------------------- |
| `username` | `string` | The username to check   |

**Response**

```json
{
  "status": "available"
}
```

| `status`    | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `available` | No account holds this username                                |
| `active`    | A current account holds it                                    |
| `archived`  | A deleted account holds it, so it is still unavailable         |

`archived` is reported separately because a soft-deleted account keeps its username. The name is taken, but by an account that no longer appears in any listing — which is otherwise a confusing thing to hit.

**Status Codes**:

- 200 OK – Returned for all three outcomes, including a username that is taken
- 400 Bad Request – No `username` in the query string, or an empty one
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during the check

> **Note:** The response is sent with `Cache-Control: no-store`, and the server ignores any entity tag the caller sends back. Who holds a username can change at any moment, so every check is answered with a fresh body rather than a 304.

**Usernames are compared without regard to case.** Every user query runs under a case-insensitive collation, and the uniqueness constraint uses the same one, so `Student1` and `student1` are the same username. A check for either reports the other as taken.

### Get User

Retrieves a specific user by ID.

**HTTP Method:** `GET`  
**Path:** `/api/v1/users/:_id/`

**Required Permission(s)**: `users_read_students`

The response is a single [User Object](#user-object), shaped exactly like an entry from [Get All Users](#get-all-users).

**Status Codes**:

- 200 OK – User retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – The caller may not read an account at this access level
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during retrieval

### Update User

Updates an existing user.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/users/:_id/`

**Required Permission(s)**: `users_write_students`

**Request Body**

Every property is optional — send only what is changing. An `_id` in the body is discarded; the user updated is the one named in the path.

```json
{
  "firstName": "Updated",
  "lastName": "User",
  "needsPasswordReset": true
}
```

**Response**

The updated user, in the same shape as [Create User](#create-user).

**Status Codes**:

- 200 OK – User updated successfully
- 400 Bad Request – Invalid property value
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions, or an attempt to modify a `system` user or grant `system` access
- 404 Not Found – User not found
- 409 Conflict – The new username is already taken
- 500 Internal Server Error – Server error during update

> **Changing a security-sensitive field logs the user out.** If `username`, `accessId`, `password`, `needsPasswordReset`, `firstName`, or `lastName` actually changes and that user is logged in, their login is destroyed and their client is notified. They will need to sign in again.

### Update User Preferences

Updates the preferences of the currently logged-in user. There is no way to change someone else's preferences.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/users/preferences/`

**Authentication**: Required. No permission needed.

**Request Body**

```json
{
  "preferences": {
    "_id": "662270879c5ca781c21812ab",
    "missionMap": {
      "_id": "662270879c5ca781c21812ac",
      "panOnIssueSelection": true
    }
  }
}
```

**Response**

The updated preferences.

```json
{
  "_id": "662270879c5ca781c21812ab",
  "missionMap": {
    "_id": "662270879c5ca781c21812ac",
    "panOnIssueSelection": true
  }
}
```

**Status Codes**:

- 200 OK – Preferences updated successfully
- 400 Bad Request – Preferences did not match the expected structure
- 401 Unauthorized – Missing authentication
- 403 Forbidden – The logged-in account is a `system` user
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during update

### Reset Password

Sets a new password for the currently logged-in user. Like preferences, this endpoint only ever acts on the caller's own account — there is no path parameter and no way to name another user.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/users/reset-password/`

**Authentication**: Required. No permission needed.

**Request Body**

```json
{
  "password": "new-password"
}
```

**Status Codes**:

- 200 OK – Password reset successful
- 400 Bad Request – Missing password, or one that fails the format rules
- 401 Unauthorized – Missing authentication
- 403 Forbidden – The logged-in account is a `system` user
- 404 Not Found – User not found
- 422 Unprocessable Entity – The new password is the same as the current one
- 500 Internal Server Error – Server error during reset

To set a password for *another* user, an administrator or instructor uses [Update User](#update-user) instead.

### Delete User

Soft deletes a user account. The record is flagged rather than removed, which is why the account keeps its username — see [Check Username Availability](#check-username-availability).

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/users/:_id/`

**Required Permission(s)**: `users_write_students`

**Status Codes**:

- 200 OK – User deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions, or the target is a `system` user
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during deletion

## Data Types

### User Object

| Field                  | Type     | Description                                     |
| ---------------------- | -------- | ----------------------------------------------- |
| `_id`                  | `string` | Unique identifier                               |
| `username`             | `string` | Login name, 5–50 characters from `a-z A-Z 0-9 - _ .` |
| `accessId`             | `string` | Access level (see [Access Levels](#access-levels)) |
| `expressPermissionIds` | `array`  | Permissions granted on top of the access level   |
| `firstName`            | `string` | First name, 1–50 letters, apostrophes, or hyphens |
| `lastName`             | `string` | Last name, same rules as `firstName`             |
| `needsPasswordReset`   | `boolean` | Whether the user must set a new password at next sign-in |
| `preferences`          | `object` | [User preferences](#user-preferences-object)     |
| `createdAt`            | `string` | Creation timestamp, ISO 8601                     |
| `updatedAt`            | `string` | Last update timestamp, ISO 8601                  |
| `createdBy`            | `string` | Creator's user ID                                |
| `createdByUsername`    | `string` | Creator's username                               |

> **`password` is never in a response.** It is accepted when creating or updating a user, stored as a bcrypt hash, and excluded from every read. The same applies to the failed-login bookkeeping fields.

### User Preferences Object

| Field                         | Type      | Description                                                   |
| ----------------------------- | --------- | ------------------------------------------------------------- |
| `_id`                         | `string`  | Unique identifier                                             |
| `missionMap`                  | `object`  | Mission-map settings                                          |
| `missionMap._id`              | `string`  | Unique identifier                                             |
| `missionMap.panOnIssueSelection` | `boolean` | Whether selecting an issue pans the map to the relevant node |

## Notes

### Access Levels

| `accessId`      | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `default`       | The starting access level, with no elevated permissions          |
| `student`       | Restricted access, aimed at session participants                 |
| `instructor`    | Can read and write student accounts, and run sessions            |
| `admin`         | Full access                                                     |
| `revokedAccess` | Retained account with access withdrawn                           |
| `system`        | Internal. Cannot be created, modified, or assigned over the API  |

An account's effective permissions are the ones its access level carries, plus anything in `expressPermissionIds`.

### Access Control

- A caller with `users_write_students` may only create, update, or delete accounts whose `accessId` is `student`. Reaching for any other account returns 403.
- A caller with `users_write` may act on any account except a `system` one.
- `system` accounts are protected against **writes** in both directions: they cannot be created, updated, or deleted through the API, and no account can be given `system` access through it.
- Reads are less uniform. [Get All Users](#get-all-users) never includes a `system` account, but [Get User](#get-user) will return one to a caller holding `users_read`. Sensitive fields are stripped either way, so what comes back is ordinary account metadata.
- Preferences and password resets always act on the caller's own account, so there is no cross-user path through either.

### Security Features

- Passwords are hashed with bcrypt before storage and are never returned
- Failed sign-in attempts are counted, and an account locks after too many within the configured window — see the [Logins API](logins.md)
- Changing a security-sensitive field ends that user's active login immediately
- Deletes are soft, so an account's history and username are preserved
- Creator identity and timestamps are recorded automatically on every account

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Logins API](logins.md)** - Authenticating as one of these accounts
- **[Sessions API](sessions.md)** - How permissions apply inside a session
- **[Setup Instructions](../setup/index.md)** - Creating the first administrator
