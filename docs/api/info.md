# Info API

**Base URL:** `/api/v1/info/`

METIS provides API endpoints for reading the project's identity and version, and for retrieving the changelog and credits. None of them touch the database — the version comes from the project manifest and the other two are read from files on disk.

## Table of Contents

- [Endpoints](#endpoints)
  - [Get System Info](#get-system-info)
  - [Get Changelog](#get-changelog)
  - [Get Credits](#get-credits)
- [Data Types](#data-types)
  - [Info Object](#info-object)
- [Related Documentation](#related-documentation)

## Endpoints

### Get System Info

Returns the project's name, description, and version.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/`

**Required Permission(s)**: None — this endpoint is public.

**Response**

```json
{
  "name": "metis",
  "description": "METIS uses an ambiguous node-topography and hierarchy structure to build a framework relayed effects from across all war-fighting domains...",
  "version": "2.5.0"
}
```

All three values are read straight from the project's `package.json`, so `name` is the package name in lower case rather than a display name, and `description` is the full package description — abbreviated above, but returned in full.

**Status Codes**:

- 200 OK – Info retrieved successfully

### Get Changelog

Returns the contents of the project changelog.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/changelog/`

**Required Permission(s)**: `changelog_read`

**Response**

The changelog is Markdown, but it is sent as a **JSON string**, not as a Markdown document. The response's content type is `application/json` and the body is a single quoted, escaped string:

```json
"# changelog\n\n# version-2.5.0 | 7-30-2025\n..."
```

Parse the response as JSON and render the resulting string as Markdown; do not treat the body as Markdown directly.

**Status Codes**:

- 200 OK – Changelog retrieved successfully
- 401 Unauthorized – Missing authentication
- 403 Forbidden – Missing the `changelog_read` permission
- 500 Internal Server Error – The changelog file could not be read

### Get Credits

Returns the contents of the project credits.

**HTTP Method:** `GET`  
**Path:** `/api/v1/info/credits/`

**Required Permission(s)**: None — this endpoint is public.

**Response**

Markdown sent as a JSON string, exactly as [Get Changelog](#get-changelog) does.

**Status Codes**:

- 200 OK – Credits retrieved successfully
- 500 Internal Server Error – The credits file could not be read

## Data Types

### Info Object

| Field         | Type     | Description                                |
| ------------- | -------- | ------------------------------------------ |
| `name`        | `string` | Project name                               |
| `description` | `string` | Full project description                   |
| `version`     | `string` | Current METIS version, `MAJOR.MINOR.PATCH` |

All three are read-only.

## Related Documentation

- **[API Overview](overview.md)** - Conventions, authentication, and error handling shared by every endpoint
- **[Changelog](../changelog.md)** - The release notes this endpoint returns
- **[Credits](../credits.md)** - The acknowledgements this endpoint returns
