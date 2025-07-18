# Files API

**Base URL:** `/api/v1/files/`

METIS provides API endpoints for managing both file references and their associated physical files through a `MetisFileStore` instance. All endpoints require appropriate permissions and pass through middleware checks for authentication, validation and storage management.

> **Important: File System Architecture**  
> METIS uses a two-part file management system:
>
> 1. **Physical Files**: Actual file content stored on disk in the configured `FILE_STORE_DIR` directory. Files are renamed to secure hash values while preserving their extensions.
> 2. **File References**: MongoDB documents that track metadata about each file (original name, size, type, etc.) and maintain the mapping between original filenames and their secure storage locations.
>
> When you interact with this API, you're primarily working with file references. Operations like upload create both a physical file and its reference, while operations like delete only mark the reference as deleted while preserving the physical file.

## Table of Contents

- [Endpoints](#endpoints)
  - [Upload Files](#upload-files)
  - [Get All Files](#get-all-files)
  - [Get File](#get-file)
  - [Download File](#download-file)
  - [Delete File](#delete-file)
- [Data Types](#data-types)
  - [File Reference Object](#file-reference-object)
- [Notes](#notes)

## Endpoints

### Upload Files

Creates both a physical file in the file store and its corresponding database reference.

**HTTP Method:** `POST`  
**Path:** `/api/v1/files/`

**Middleware**:

- Authentication with `files_write` permission
- File upload handling through Multer
  - Physical files stored in configured directory (`FILE_STORE_DIR` env variable, default: `'./files/store'`)
  - Physical filenames are hashed using 16 bytes random hex for security
  - Original file extensions preserved in both physical files and references
  - MIME types detected from extensions and stored in file references

#### Request Body

- Multipart form data with file(s) under key `files`
- Files must pass validation checks:
  - Valid MIME type (automatically detected from extension)
  - Non-zero file size
  - Original filename ≤ 175 characters
  - Unique filename when not deleted

#### Response

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "name": "example.txt",
    "path": "a1b2c3d4e5f6g7h8_txt",
    "mimetype": "text/plain",
    "size": 1024,
    "createdAt": "2025-07-15T10:30:00.000Z",
    "updatedAt": "2025-07-15T10:30:00.000Z",
    "createdBy": "000000000000000000000001",
    "createdByUsername": "admin"
  }
]
```

**Status Codes**:

- 200 OK – Files uploaded successfully
- 400 Bad Request – No files found in request or validation failed
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during upload

#### Error Response Examples

```json
{
  "error": {
    "status": 400,
    "message": "No files were found in the request."
  }
}
```

```json
{
  "error": {
    "status": 400,
    "message": "Error in file-reference: Mimetype \"invalid/type\" is not valid."
  }
}
```

### Get All Files

Retrieves all non-deleted file references from the database. Does not return the actual file contents.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/`

**Middleware**:

- Authentication with `files_read` permission
- Request validation

**Query Parameters**:

None currently implemented in the code. The API returns metadata for all non-deleted files.

#### Response

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "name": "example.txt",
    "path": "a1b2c3d4e5f6g7h8_txt",
    "mimetype": "text/plain",
    "size": 1024,
    "createdAt": "2025-07-15T10:30:00.000Z",
    "updatedAt": "2025-07-15T10:30:00.000Z",
    "createdBy": "000000000000000000000001",
    "createdByUsername": "admin"
  }
]
```

**Status Codes**:

- 200 OK – File references retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during retrieval

### Get File

Retrieves metadata for a specific file reference from the database. Use this to get file information without downloading the actual file content.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/:_id`

**Middleware**:

- Authentication with `files_read` permission
- Parameter validation:
  - `_id`: Must be valid ObjectId (references the database entry, not the physical file)

#### Response

```json
{
  "_id": "662270879c5ca781c218123c",
  "name": "example.txt",
  "path": "a1b2c3d4e5f6g7h8_txt",
  "mimetype": "text/plain",
  "size": 1024,
  "createdAt": "2025-07-15T10:30:00.000Z",
  "updatedAt": "2025-07-15T10:30:00.000Z",
  "createdBy": "000000000000000000000001",
  "createdByUsername": "admin"
}
```

**Status Codes**:

- 200 OK – File reference retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – File reference not found
- 500 Internal Server Error – Server error during retrieval

### Download File

Downloads the actual physical file content from the file store. Uses the file reference to locate and serve the physical file.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/:_id/download`

**Middleware**:

- Authentication with `files_read` permission
- Parameter validation:
  - `_id`: Must be valid ObjectId (of the file reference)
- File store access validation (verifies physical file exists)

**Response**:

- File download response with original filename

**Status Codes**:

- 200 OK – File downloaded successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – File not found
- 500 Internal Server Error – Server error during download

### Delete File

Performs a soft delete by marking the database file reference as deleted. The physical file is preserved in the file store for archival purposes.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/files/:_id`

**Middleware**:

- Authentication with `files_write` permission
- Parameter validation:
  - `_id`: Must be valid MongoDB ObjectId (of the file reference to mark as deleted)

#### Response

Empty response on success.

**Status Codes**:

- 200 OK – File reference deleted successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – File reference not found
- 500 Internal Server Error – Server error during deletion

## Data Types

### File Reference Object

The following describes the MongoDB document structure used to track files in the database. This metadata links to the actual file content stored in the file system.

| Field               | Type       | Description                          | Validation                             |
| ------------------- | ---------- | ------------------------------------ | -------------------------------------- |
| `_id`               | `objectId` | Database reference identifier        | Valid MongoDB ObjectId                 |
| `name`              | `string`   | Original filename (for user display) | Max 175 chars, unique when not deleted |
| `path`              | `string`   | Hashed name of physical file         | Required, generated by system          |
| `mimetype`          | `string`   | MIME type                            | Must be valid MIME type                |
| `size`              | `number`   | File size in bytes                   | Required, > 0                          |
| `createdAt`         | `string`   | Creation timestamp                   | ISO 8601 UTC                           |
| `updatedAt`         | `string`   | Last update time                     | ISO 8601 UTC                           |
| `createdBy`         | `objectId` | Creator's ID                         | Valid MongoDB ObjectId                 |
| `createdByUsername` | `string`   | Creator's username                   | Required                               |
| `deleted`           | `boolean`  | Soft delete flag                     | Defaults to false                      |

## Notes

- Physical File Storage:

  - Managed by `MetisFileStore` class
  - Physical files stored in `FILE_STORE_DIR` directory (default: `'./files/store'`)
  - Files stored with secure hash names (16 bytes random hex)
  - Extensions preserved for MIME type detection
  - No explicit size limits (bounded by Node.js/system limits)
  - No file type restrictions beyond MIME format validation
  - Files remain on disk even after reference deletion

- File Reference Storage:

  - MongoDB documents track all file metadata
  - References map original names to physical files
  - MIME types detected and stored during upload
  - Database handles validation and constraints
  - Soft deletion only affects references

- Database handling:

  - References stored in MongoDB
  - Unique filename constraints
  - Soft delete implementation
  - Creator tracking
  - Full audit trails with timestamps
  - Automatic MIME type validation

- Security features:

  - Permission-based access control
  - File reference validation
  - MIME type validation
  - Path traversal prevention
  - Original files preserved after deletion

- Query behavior:

  - Deleted files excluded by default
  - Creator information populated automatically
  - Missing creators handled gracefully
  - Case-sensitive path handling
  - Timestamp conversion to UTC

- File operations:
  - Bulk upload support
  - Original filenames preserved
  - Download with original names
  - Reference counting
  - Import/Export support
