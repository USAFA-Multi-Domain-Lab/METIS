# Logins API

**Base URL:** `/api/v1/logins/`

METIS provides API endpoints for signing in, reading the current login, and signing out. A login is the server-side record of who a browser session belongs to; it is created on sign-in and destroyed on sign-out, on takeover, or when the account is changed underneath it.

## Table of Contents

- [Endpoints](#endpoints)
  - [Login](#login)
  - [Get Current Login](#get-current-login)
  - [Logout](#logout)
- [Data Types](#data-types)
  - [Login Object](#login-object)
- [Notes](#notes)
  - [One Login Per Account](#one-login-per-account)
  - [Taking Over a Login](#taking-over-a-login)
  - [Failed Attempts and Lockout](#failed-attempts-and-lockout)
  - [Session Cookies](#session-cookies)
- [Related Documentation](#related-documentation)

## Endpoints

### Login

Authenticates a user and creates a login.

**HTTP Method:** `POST`  
**Path:** `/api/v1/logins/`

**Required Permission(s)**: None — this is how a caller becomes authenticated in the first place.

**Request Body**

```json
{
  "username": "student1",
  "password": "password1"
}
```

| Property   | Rules                                                            |
| ---------- | ---------------------------------------------------------------- |
| `username` | 5–50 characters from `a-z A-Z 0-9 - _ .`  Case-insensitive        |
| `password` | 8–50 characters, no whitespace                                    |

**Optional Headers**

| Header     | Value    | Effect                                                          |
| ---------- | -------- | --------------------------------------------------------------- |
| `forceful` | `"true"` | Take over an existing login instead of being refused with a 409 |

**Response**

```json
{
  "login": {
    "user": {
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
    },
    "sessionId": null
  }
}
```

> **Note:** This is the only endpoint on this page that wraps its result in a `login` property. [Get Current Login](#get-current-login) returns the same object unwrapped.

**Status Codes**:

- 200 OK – Login successful
- 400 Bad Request – Username or password missing or malformed, or the account is a `system` user, which cannot sign in
- 401 Unauthorized – No such account, or the password is wrong. The two are deliberately not distinguished
- 403 Forbidden – The account is locked out (see [Failed Attempts and Lockout](#failed-attempts-and-lockout)). The message carries the minutes remaining
- 409 Conflict – A conflicting login already exists (see [One Login Per Account](#one-login-per-account))
- 500 Internal Server Error – Server error during login, including an account stored with no password

### Get Current Login

Returns the login for the caller's session.

**HTTP Method:** `GET`  
**Path:** `/api/v1/logins/`

**Required Permission(s)**: None. Unauthenticated callers get a successful response rather than a 401.

**Response**

The [Login Object](#login-object) itself, **not** wrapped in a `login` property:

```json
{
  "user": {
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
  },
  "sessionId": null
}
```

When no one is signed in, the body is the bare literal `null` with a 200. Check for `null` rather than relying on the status code.

**Status Codes**:

- 200 OK – Returns the login object, or `null` when not signed in
- 500 Internal Server Error – Server error during retrieval

### Logout

Destroys the caller's login.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/logins/`

**Required Permission(s)**: None.

**Optional Headers**

| Header     | Value    | Effect                                                                                  |
| ---------- | -------- | ---------------------------------------------------------------------------------------- |
| `forceful` | `"true"` | Notify the connected client that it is being disconnected before the login is destroyed  |

**Status Codes**:

- 200 OK – Logged out
- 400 Bad Request – Nobody is signed in
- 500 Internal Server Error – Server error during logout

> **Logging out when not signed in is an error, not a no-op.** It returns 400. A client that calls this defensively on startup should expect that.

## Data Types

### Login Object

| Field       | Type            | Description                                                                    |
| ----------- | --------------- | ------------------------------------------------------------------------------ |
| `user`      | `object`        | The signed-in [user](users.md#user-object). Never includes `password`           |
| `sessionId` | `string \| null` | The METIS session the user has joined, or `null` when they are not in one       |

`sessionId` refers to a *mission session*, not the browser session — see the [Sessions API](sessions.md). It is `null` immediately after signing in and is filled in once the user joins a session.

## Notes

### One Login Per Account

An account may hold only one login at a time. A second attempt is refused with a 409 unless it asks to take over.

Two different situations both count as a conflict:

- **The account is already signed in**, anywhere — another browser, another machine.
- **The caller's own browser session already holds a login**, even for a different account. Signing in as someone else without signing out first is refused for this reason.

The check runs *before* a login is constructed, so a refused attempt leaves no trace and does not disturb the existing login.

### Taking Over a Login

Sending `forceful: true` on [Login](#login) replaces the conflicting login instead of being refused. The displaced login is destroyed and, if it had a live connection, that client is notified first so it can explain the disconnection rather than appearing to fail.

Two details of the takeover are worth knowing:

- If the conflict is on the **same browser session**, that session carries over rather than being torn down — otherwise the request signing in would be left without one.
- If the **same user** signs back in on that session and is still part of a mission session that is still running, they keep their place in it. A session that has since ended is not reclaimed.

### Failed Attempts and Lockout

Failed sign-ins are counted per account, within a rolling window. Reaching the limit locks the account for a fixed period, and the counter resets so the next lockout starts fresh. A successful sign-in clears the count, and an expired lock clears itself on the next attempt.

| Setting                  | Default    | Meaning                                          |
| ------------------------ | ---------- | ------------------------------------------------ |
| `MAX_LOGIN_ATTEMPTS`     | 5          | Failures needed to trigger a lock                |
| `LOGIN_ATTEMPT_WINDOW`   | 300 (5 min)  | Window the failures must fall within             |
| `LOGIN_LOCKOUT_DURATION` | 900 (15 min) | How long the account stays locked                |

The two durations are configured in seconds; `MAX_LOGIN_ATTEMPTS` is a count. See [Environment Configuration](../setup/environment.md). While locked, an otherwise correct password still returns 403.

### Session Cookies

Authentication rides on an Express session in an HTTP-only cookie, backed by MongoDB. The cookie's `secure` flag follows the protocol the server actually started on, so it is set when METIS is running over HTTPS.

The signing secret is generated fresh each time the server starts. Two consequences follow: **cookies from a previous run stop working after a restart**, and METIS cannot be run as multiple processes behind a load balancer, since each would mint its own secret and reject the others' cookies.

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Users API](users.md)** - The accounts a login authenticates against
- **[Sessions API](sessions.md)** - What a signed-in caller can do next
- **[WebSocket System](../devs/websocket.md)** - The connection a login is required for
