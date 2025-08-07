# Files API

**Base URL:** `/api/v1/files/`

METIS provides API endpoints for managing files and their metadata. All endpoints require appropriate permissions for file operations.

> **Important: File Management**  
> When you upload a file to METIS:
>
> 1. The file is stored securely on the server with a unique identifier.
> 2. A file reference is created amd stored in the database containing metadata (name, size, type).
>
> All API operations work with these file references. When you delete a file, it is marked as deleted but may be preserved in the system for archival purposes.

## Table of Contents

- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Upload Files](#upload-files)
  - [Get All Files](#get-all-files)
  - [Get File](#get-file)
  - [Download File](#download-file)
  - [Delete File](#delete-file)
- [Data Types](#data-types)
  - [File Reference Object](#file-reference-object)
- [Notes](#notes)

## Rate Limiting

Files API endpoints use METIS's standard rate limits. For large file operations:

- Consider breaking uploads into smaller chunks
- Each chunk counts as a separate request
- Plan transfers to stay within rate limits

## Endpoints

### Upload Files

Upload one or more files to the system.

**HTTP Method:** `POST`  
**Path:** `/api/v1/files/`

**Required Permission(s)**: `files_write`

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

**Required Permission(s)**: `files_read`

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

**Required Permission(s)**: `files_read`

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

**Required Permission(s)**: `files_read`

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

**Required Permission(s)**: `files_write`

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

| Field               | Type      | Description           |
| ------------------- | --------- | --------------------- |
| `_id`               | `string`  | Unique identifier     |
| `name`              | `string`  | Original filename     |
| `path`              | `string`  | Internal file path    |
| `mimetype`          | `string`  | MIME type of the file |
| `size`              | `number`  | File size in bytes    |
| `createdAt`         | `string`  | Creation timestamp    |
| `updatedAt`         | `string`  | Last update time      |
| `createdBy`         | `string`  | ID of creating user   |
| `createdByUsername` | `string`  | Username of creator   |
| `deleted`           | `boolean` | Deletion status       |

## Notes

- Files are preserved even after deletion for archival purposes
- Original filenames and file types are preserved
- Bulk file upload is supported
- Files can be downloaded using their original names
- No explicit file size limits beyond system constraints
- All file operations require appropriate permissions
