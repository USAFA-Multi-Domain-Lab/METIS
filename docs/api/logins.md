# Logins API

**Base URL:** `/api/v1/logins/`

METIS provides API endpoints for managing user authentication and session state. These endpoints handle login/logout operations and manage user sessions across both web and WebSocket connections.

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

**Required Permission(s)**: None

#### Request Body

```json
{
  "username": "student1", // Required, 5-25 characters, alphanumeric with -_.
  "password": "password" // Required, 8-50 characters
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

**Required Permission(s)**: None

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

**Required Permission(s)**: None

**Status Codes**:

- 200 OK – Logout successful (even if not logged in)
- 500 Internal Server Error – Server error during logout

## Data Types

### Login Object

| Field       | Type     | Description      |
| ----------- | -------- | ---------------- |
| `user`      | `object` | User information |
| `sessionId` | `string` | Session ID       |

## Notes

- Only one active session is allowed per user
- Sessions use secure HTTP-only cookies
- Rate limiting may temporarily restrict access on multiple failed attempts
- System accounts cannot log in through the API
