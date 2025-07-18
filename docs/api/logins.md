# Logins API

**Base URL:** `/api/v1/logins/`

METIS provides API endpoints for managing user authentication and session state through the `ServerLogin` class. These endpoints handle login/logout operations and manage user sessions across web and WebSocket connections.

## Table of Contents

- [Endpoints](#endpoints)
  - [Login](#login)
  - [Get Current Login](#get-current-login)
  - [Logout](#logout)
- [Data Types](#data-types)
  - [Login Object](#login-object)
- [Notes](#notes)

## Endpoints

### Login

Authenticates a user and creates a new login session.

**HTTP Method:** `POST`  
**Path:** `/api/v1/logins/`

**Middleware**:

- Request body validation:
  - Username validation (5-25 chars)
  - Password validation (8-50 chars)

#### Request Body

```json
{
  // Required, 5-25 chars, alphanumeric with -_., case-insensitive
  "username": "student1",
  // Required, 8-50 chars
  "password": "password"
}
```

#### Response

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
      "accessId": "student"
    },
    "sessionId": null
  }
}
```

**Status Codes**:

- 200 OK – Login successful
- 400 Bad Request – Invalid username/password or system user login attempt
- 401 Unauthorized – Incorrect username/password
- 403 Forbidden – Account in timeout
- 409 Conflict – Already logged in on another device/browser
- 500 Internal Server Error – Server error during login

### Get Current Login

Retrieves information about the current login session.

**HTTP Method:** `GET`  
**Path:** `/api/v1/logins/`

**Middleware**: None

#### Response

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
      "accessId": "student"
    },
    "sessionId": null
  }
}
```

**Status Codes**:

- 200 OK – Returns login info or null if not authenticated
- 500 Internal Server Error – Server error during retrieval

### Logout

Destroys the current login session and associated data.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/logins/`

**Middleware**: None

**Status Codes**:

- 200 OK – Logout successful (even if not logged in)
- 500 Internal Server Error – Server error during logout

## Data Types

### Login Object

| Field       | Type     | Description      | Validation                       |
| ----------- | -------- | ---------------- | -------------------------------- |
| `user`      | `object` | User information | Valid `TUserExistingJson` object |
| `sessionId` | `string` | METIS session ID | null if not in session           |

## Notes

- Session management:

  - Express session for web authentication
  - WebSocket connections tracked separately
  - Single active session per user enforced
  - Session conflicts handled via forceful logout
  - METIS sessions distinct from express sessions
  - Client connections managed per login

- Login registry:

  - In-memory storage of active logins
  - Tracks user ID to login mapping
  - Handles client connection state
  - Manages METIS session membership
  - Enforces single session policy

- Timeout handling:

  - Timeout registry tracks banned users
  - Timeouts force immediate logout
  - Express and METIS sessions cleared
  - Client connections terminated
  - Timeout duration enforcement

- Security features:

  - bcrypt password comparison
  - System user login prevention
  - Session verification
  - Client switching detection
  - Forced logout capability

- Error handling:
  - Username/password validation
  - System user restrictions
  - Session conflict resolution
  - Client connection errors
  - Database operation errors
