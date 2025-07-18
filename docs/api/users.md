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
- [Implementation Notes](#implementation-notes)
  - [Authentication System](#authentication-system)
  - [Access Control](#access-control)
  - [Password Security](#password-security)
  - [Data Handling](#data-handling)
  - [Session Management](#session-management)

## Endpoints

### Create User

Creates a new user account in the system.

**HTTP Method:** `POST`  
**Path:** `/api/v1/users/`

**Middleware**:

- Authentication requiring `users_write_students` permission
- User management restriction validation:
  - Admins can create any user type
  - Instructors can only create student users
  - Students cannot create users
- Request body validation
- System user protection check (prevents creation of system users)

#### Request Body

```json
{
  // Required, 5-25 chars, alphanumeric with -_., case-insensitive unique
  "username": "student1",
  // Required, must match valid access level ID
  "accessId": "student",
  // Required, array of valid permission IDs
  "expressPermissionIds": [],
  // Required, 1-50 chars, letters and apostrophes only
  "firstName": "student",
  // Required, 1-50 chars, letters and apostrophes only
  "lastName": "user",
  // Required, boolean
  "needsPasswordReset": false,
  // Required for non-system users, 8-50 chars
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

**Middleware**:

- Authentication with `users_read_students` permission
- Access level filtering:
  - Admins can view all users
  - Instructors can only view student users
  - Students cannot view any users

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

**Middleware**:

- Authentication with `users_read_students` permission
- User management restriction check
- Parameter validation:
  - `_id`: Must be valid ObjectId

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

**Middleware**:

- Authentication with `users_write_students` permission
- User management restriction check
- Request body validation
- System user protection check

#### Request Body

```json
{
  // Required
  "_id": "662270879c5ca781c218123c",
  // Optional, 5-25 chars, alphanumeric with -_.
  "username": "student1",
  // Optional, must match valid access level ID
  "accessId": "student",
  // Optional, array of valid permission IDs
  "expressPermissionIds": [],
  // Optional, 1-50 chars, letters and apostrophes
  "firstName": "Updated",
  // Optional, 1-50 chars, letters and apostrophes
  "lastName": "User",
  // Optional, boolean
  "needsPasswordReset": false,
  // Optional, 8-50 chars
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

**Middleware**:

- Basic authentication (no specific permissions required)
- Password reset restriction (can only reset own password)
- Request body validation:
  - Password format validation
  - Password complexity requirements

#### Request Body

```json
{
  // Required, 8-50 chars
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

**Middleware**:

- Authentication with `users_write_students` permission
- User management restriction check
- Parameter validation:
  - `_id`: Must be valid ObjectId
- System user protection check

**Status Codes**:

- 200 OK – User deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – User not found
- 500 Internal Server Error – Server error during deletion

---

## Data Types

### User Object

| Field                  | Type       | Description            | Validation                                                  |
| ---------------------- | ---------- | ---------------------- | ----------------------------------------------------------- |
| `_id`                  | `objectId` | Unique identifier      | Valid MongoDB ObjectId                                      |
| `username`             | `string`   | User's login name      | 5-25 chars, alphanumeric with -\_., case-insensitive unique |
| `accessId`             | `string`   | Access level           | Must match valid access level ID                            |
| `expressPermissionIds` | `array`    | Additional permissions | Array of valid permission IDs                               |
| `firstName`            | `string`   | First name             | 1-50 chars, letters and apostrophes                         |
| `lastName`             | `string`   | Last name              | 1-50 chars, letters and apostrophes                         |
| `needsPasswordReset`   | `boolean`  | Password reset flag    | Boolean                                                     |
| `password`             | `string`   | Password               | 8-50 chars, bcrypt hashed                                   |
| `createdAt`            | `string`   | Creation timestamp     | ISO 8601 UTC                                                |
| `updatedAt`            | `string`   | Last update timestamp  | ISO 8601 UTC                                                |
| `createdBy`            | `objectId` | Creator's ID           | Valid MongoDB ObjectId                                      |
| `createdByUsername`    | `string`   | Creator's username     | 5-25 chars                                                  |

---

## Implementation Notes

### Authentication System

The METIS user authentication system uses a multi-layered approach:

- **Session Management**

  - Express session with JWT for web authentication
  - Single active session per user enforced
  - Session conflicts handled via forceful logout
  - Automatic timeout on session expiration

- **Request Validation**
  - WebSocket connection validation for real-time operations
  - Session membership verification for protected routes
  - Rate limiting on authentication attempts
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

### Password Security

Comprehensive password security measures include:

- **Storage and Validation**

  - bcrypt hashing with work factor 10
  - Password length: 8-50 characters
  - System users cannot have passwords
  - Password complexity requirements enforced

- **Security Measures**
  - Immediate session termination on password change
  - Password reset workflow with flag system
  - Failed login attempt tracking
  - Automatic account timeout after repeated failures
  - Secure update procedures with verification

### Data Handling

METIS ensures data integrity through:

- **Data Protection**

  - Soft deletion for user records
  - Response filtering of sensitive data
  - Complete audit trail maintenance
  - Creator/modifier tracking

- **Data Normalization**
  - Case-insensitive username handling
  - Automatic name capitalization
  - UTC timestamps for all operations
  - Strict validation of all user properties

### Session Management

Session operations are handled with attention to security:

- **Session Operations**

  - Atomic transaction handling
  - Proper cleanup on logout/timeout
  - Client switching detection
  - Rate limiting on all operations

- **Security Triggers**
  Auto-logout is enforced on sensitive changes:
  - Username modifications
  - Access level updates
  - Permission changes
  - Account deletion
