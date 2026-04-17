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

### Authentication System

The METIS user authentication system uses Express sessions:

- **Session Management**
  - Express sessions with secure HTTP-only cookies
  - MongoDB-backed session store
  - Single active session per user enforced
  - Session conflicts handled via forceful logout
  - Automatic timeout on session expiration
  - Automatic timeout for failed login attempts

- **Request Validation**
  - WebSocket connection validation for real-time operations
  - Session membership verification for protected routes
  - Default rate limits apply (100/sec HTTP, 100/sec WebSocket)
  - Request origin validation

### Access Control

METIS implements a robust role-based access control system:

- **Role Hierarchy**
  - Administrator: Full system access
  - Instructor: Student management only
  - Student: Limited self-management capabilities

- **Access Restrictions**
  - System user (ID: 000000000000000000000000) is protected from modifications
  - Admin user (ID: 000000000000000000000001) cannot be deleted
  - Users cannot modify their own access level
  - Permission escalation is prevented
  - Cross-user password resets are blocked

### Security Features

- Secure password handling with bcrypt hashing
- Password reset workflow
- Failed login attempt tracking
- Session security with auto-logout
- Complete audit trail of changes
