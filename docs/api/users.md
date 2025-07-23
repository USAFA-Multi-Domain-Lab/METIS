# Users API

**Base URL:** `/api/v1/users/`

METIS provides API endpoints for managing user accounts. All endpoints require authentication and specific permissions, with middleware validation ensuring proper authorization and data integrity. The API supports role-based access control where administrators can manage all users while instructors can only manage student accounts.

## Table of Contents

- [Endpoints](#endpoints)
  - [Create User](#create-user)
  - [Get All Users](#get-all-users)
  - [Get User](#get-user)
  - [Update User](#update-user)
  - [Reset Password](#reset-password)
  - [Delete User](#delete-user)
- [Data Types](#data-types)
  - [User Object](#user-object)
- [Notes](#notes)
  - [Authentication System](#authentication-system)
  - [Access Control](#access-control)
  - [Security Features](#security-features)
  - [Data Handling](#data-handling)

## Endpoints

### Create User

Creates a new user account in the system.

**HTTP Method:** `POST`  
**Path:** `/api/v1/users/`

**Required Permission(s)**: `users_write` or `users_write_students` (students only)

#### Request Body

```json
{
  "username": "student1",
  "accessId": "student",
  "expressPermissionIds": [],
  "firstName": "student",
  "lastName": "user",
  "needsPasswordReset": false,
  "password": "password"
}
```

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "username": "student1",
  "expressPermissionIds": [],
  "firstName": "Student",
  "lastName": "User",
  "needsPasswordReset": false,
  "accessId": "student",
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – User created successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during creation

### Get All Users

Retrieves all users based on the requesting user's permissions.

**HTTP Method:** `GET`  
**Path:** `/api/v1/users/`

**Required Permission(s)**: `users_read_students`

> **_Note: Access level determines which users can be viewed:_**
>
> - **_Admins: all users_**
> - **_Instructors: student users only_**
> - **_Students: no access_**

#### Response

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
- 404 Not Found – No users found
- 500 Internal Server Error – Server error during retrieval

### Get User

Retrieves a specific user by ID.

**HTTP Method:** `GET`  
**Path:** `/api/v1/users/:_id`

**Required Permission(s)**: `users_read_students`

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "username": "student1",
  "expressPermissionIds": [],
  "firstName": "Student",
  "lastName": "User",
  "needsPasswordReset": false,
  "accessId": "student",
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – User retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during retrieval

### Update User

Updates an existing user's information.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/users/`

**Required Permission(s)**: `users_write_students`

#### Request Body

```json
{
  "_id": "662270879c5ca781c218123c",
  "username": "student1",
  "accessId": "student",
  "expressPermissionIds": [],
  "firstName": "Updated",
  "lastName": "User",
  "needsPasswordReset": false,
  "password": "newpassword"
}
```

**Status Codes**:

- 200 OK – User updated successfully
- 400 Bad Request – Invalid request body/validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during update

### Reset Password

Allows a user to reset their own password.

**HTTP Method:** `PUT`  
**Path:** `/api/v1/users/reset-password`

**Authentication**: Required (no specific permissions)

> **_Note: Users can only reset their own password._**

#### Request Body

```json
{
  "password": "new-password"
}
```

**Status Codes**:

- 200 OK – Password reset successful
- 400 Bad Request – Invalid password format or missing password
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Attempting to reset another user's password
- 500 Internal Server Error – Server error during password reset

### Delete User

Soft deletes a user account (sets deleted flag).

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/users/:_id`

**Required Permission(s)**: `users_write_students`

**Status Codes**:

- 200 OK – User deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during deletion

---

## Data Types

### User Object

| Field                  | Type       | Description            |
| ---------------------- | ---------- | ---------------------- |
| `_id`                  | `objectId` | Unique identifier      |
| `username`             | `string`   | User's login name      |
| `accessId`             | `string`   | Access level           |
| `expressPermissionIds` | `array`    | Additional permissions |
| `firstName`            | `string`   | First name             |
| `lastName`             | `string`   | Last name              |
| `needsPasswordReset`   | `boolean`  | Password reset flag    |
| `password`             | `string`   | Password (hashed)      |
| `createdAt`            | `string`   | Creation timestamp     |
| `updatedAt`            | `string`   | Last update timestamp  |
| `createdBy`            | `objectId` | Creator's ID           |
| `createdByUsername`    | `string`   | Creator's username     |

---

## Notes

### Authentication System

The METIS user authentication system uses Express sessions:

- **Session Management**

  - Express sessions with secure HTTP-only cookies
  - MongoDB-backed session store
  - Single active session per user enforced
  - Session conflicts handled via forceful logout
  - Automatic timeout on session expiration

- **Request Validation**
  - WebSocket connection validation for real-time operations
  - Session membership verification for protected routes
  - Default rate limits apply (20/sec HTTP, 10/sec WebSocket)
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

### Data Handling

- Soft deletion for user records
- Case-insensitive usernames
- UTC timestamps
- Creator tracking
