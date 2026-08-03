# Files API

**Base URL:** `/api/v1/files/`

METIS provides API endpoints for uploading files, reading their metadata, downloading their contents, and removing them.

Uploading stores the file on the server under a generated name and creates a **file reference** in the database holding its metadata. Every endpoint here works with references; the reference's `_id` is what you use to download or delete. Deleting marks the reference as deleted and leaves the stored file in place.

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
  - [Names and Collisions](#names-and-collisions)
  - [Error Responses](#error-responses)
- [Related Documentation](#related-documentation)

## Endpoints

### Upload Files

Uploads one or more files.

**HTTP Method:** `POST`  
**Path:** `/api/v1/files/`

**Required Permission(s)**: `files_write`

**Request Body**

Multipart form data with the files under the key `files`. Several may be sent in one request.

Each file must satisfy two checks, both enforced when its reference is saved:

- Its MIME type, derived from the extension, has to be one METIS recognizes
- Its original filename has to be 175 characters or fewer

**Response**

An array of the created references, one per uploaded file.

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "name": "example.txt",
    "path": "9f86d081884c7d659a2feaa0c55ad015_.txt",
    "mimetype": "text/plain",
    "size": 1024,
    "deleted": false,
    "createdAt": "2025-07-15T10:30:00.000Z",
    "updatedAt": "2025-07-15T10:30:00.000Z",
    "createdBy": "000000000000000000000001",
    "createdByUsername": "admin"
  }
]
```

> **Read `name` back from the response.** It may not be the name you sent — see [Names and Collisions](#names-and-collisions).

**Status Codes**:

- 200 OK – Files uploaded successfully
- 400 Bad Request – No files in the request, or a file failed validation
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during upload

### Get All Files

Retrieves every file reference that has not been deleted. Metadata only — this does not return file contents.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/`

**Required Permission(s)**: `files_read`

**Response**

```json
[
  {
    "_id": "662270879c5ca781c218123c",
    "name": "example.txt",
    "path": "9f86d081884c7d659a2feaa0c55ad015_.txt",
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

- 200 OK – References retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 500 Internal Server Error – Server error during retrieval

### Get File

Retrieves the metadata for one file reference.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/:_id`

**Required Permission(s)**: `files_read`

The response is a single [File Reference Object](#file-reference-object), shaped like an entry from [Get All Files](#get-all-files).

**Status Codes**:

- 200 OK – Reference retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – No such reference, or it has been deleted
- 500 Internal Server Error – Server error during retrieval

### Download File

Downloads the file's contents.

**HTTP Method:** `GET`  
**Path:** `/api/v1/files/:_id/download`

**Required Permission(s)**: `files_read`

The file is served as an attachment under the reference's `name`, so the recipient sees the original filename rather than the generated one it is stored under.

**Status Codes**:

- 200 OK – File downloaded successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Reference not found
- 500 Internal Server Error – Server error during download

> **Note:** To download a file from inside a running session, use [the session's own download endpoint](sessions.md#download-mission-file) instead. That one is governed by the caller's force and realm rather than by `files_read`.

### Delete File

Marks the reference as deleted. The stored file is kept so it can be recovered.

**HTTP Method:** `DELETE`  
**Path:** `/api/v1/files/:_id`

**Required Permission(s)**: `files_write`

**Status Codes**:

- 200 OK – Reference deleted
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Insufficient permissions
- 404 Not Found – Reference not found
- 500 Internal Server Error – Server error during deletion

A deleted reference stops appearing in [Get All Files](#get-all-files) and returns 404 from [Get File](#get-file). Its name becomes available for reuse.

## Data Types

### File Reference Object

| Field               | Type      | Description                                                          |
| ------------------- | --------- | -------------------------------------------------------------------- |
| `_id`               | `string`  | Unique identifier, used by the download and delete endpoints          |
| `name`              | `string`  | Display filename, unique among files that are not deleted             |
| `path`              | `string`  | Generated name the file is stored under                               |
| `mimetype`          | `string`  | MIME type, derived from the original extension                        |
| `size`              | `number`  | File size in bytes                                                    |
| `createdAt`         | `string`  | Creation timestamp, ISO 8601                                          |
| `updatedAt`         | `string`  | Last update timestamp, ISO 8601                                       |
| `createdBy`         | `string`  | ID of the uploading user                                              |
| `createdByUsername` | `string`  | Username of the uploading user                                        |
| `deleted`           | `boolean` | Deletion flag — **only present on the upload response**, see below    |

`path` is the file's name on disk: 32 hexadecimal characters, then an underscore, then the original extension including its dot. It is not something you request by; it exists so that two files sharing a name never collide in storage.

> **`deleted` is not returned by the read endpoints.** [Get All Files](#get-all-files) and [Get File](#get-file) both project it out, along with other internal fields, so it appears only in the response to an upload. Since those endpoints never return deleted references anyway, its absence carries no information — do not branch on it.

## Notes

### Names and Collisions

A file's `name` is kept unique among references that have not been deleted, and the server enforces that by **renaming rather than rejecting**. Uploading a second `report.pdf` stores it as `report (1).pdf`, a third as `report (2).pdf`, and so on.

Two things follow:

- **Uploading never fails because of a name collision.** There is no 409 on this route.
- **The name you get back may not be the name you sent.** Read `name` from the response rather than assuming it.

Deleting a reference frees its name, so a later upload can take it back without a suffix.

### Error Responses

Errors from these endpoints are returned as a status code with no useful body — the message the server produced goes to its logs. Branch on the status code rather than trying to parse the response.

This differs from the [Logins API](logins.md), which returns a JSON error body. See [Error Responses](overview.md#error-responses) for why the API is inconsistent here.

Other things worth knowing:

- Files are preserved on disk after deletion, for recovery
- The original filename and extension are preserved on the reference and used when downloading
- Bulk upload is supported through the single `files` key
- No file-size limit is configured, so uploads are bounded only by the server's own constraints

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Missions API](missions.md)** - Files belong to a mission and are referenced by its components
- **[Sessions API](sessions.md)** - Downloading a file from inside a running session
- **[Users API](users.md)** - Permissions that govern file access
