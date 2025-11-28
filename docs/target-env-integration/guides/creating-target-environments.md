# Creating Target Environments

This guide walks you through creating a new METIS target environment from scratch. The server auto-discovers environments by scanning for specific folder structures and schema files.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Planning Your Environment](#planning-your-environment)
- [Basic Environment Setup](#basic-environment-setup)
- [External System Integration](#external-system-integration-optional)
- [Adding Your First Target](#adding-your-first-target)
- [Recommended Project Structure](#recommended-project-structure)
- [Testing Your Environment](#testing-your-environment)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Prerequisites

- Familiarity with [Tips & Conventions](tips-and-conventions.md) for naming and structure rules
- Access to schema classes under `integration/library/target-env-classes`

## Planning Your Environment

Before creating files, decide on:

1. **Environment ID** - Pick a kebab-case folder name (becomes the permanent environment ID)
2. **External integrations** - Whether you'll call external APIs/services
3. **Initial targets** - What functionality you want to implement first

> ⚠️ **Important**: Folder names become permanent IDs. Renaming requires [migrations](migrations.md).

## Basic Environment Setup

### Step 1: Create the environment schema

Create your environment folder and main schema file:

```ts
// integration/target-env/acme-cloud/schema.ts

export default new TargetEnvSchema({
  name: 'ACME Cloud',
  description: 'Targets for managing ACME Cloud resources',
  version: '1.0.0',
})
```

Key points:

- The folder name (`acme-cloud`) becomes the environment ID
- Use semantic versioning for the `version` field
- The server sets the `_id` automatically from the folder name

### Step 2: Add the targets directory

Create the required `targets/` folder (even if empty initially):

```
integration/target-env/
  acme-cloud/
    schema.ts
    targets/           # Required for scanner recognition
```

## External System Integration (Optional)

If your targets need to communicate with external systems, METIS provides client libraries for various protocols. Currently supported:

- **REST APIs (HTTP/HTTPS)** - For RESTful web services

### REST API Integration

For HTTP/HTTPS REST API calls, you'll create a REST client within your target scripts using the session's selected configuration. Configuration is managed through `configs.json` (see [configs.json Reference](../references/configs-json.md)).

```ts
// integration/target-env/acme-cloud/schema.ts

export default new TargetEnvSchema({
  name: 'ACME Cloud',
  description: 'Targets for managing ACME Cloud resources',
  version: '1.0.0',
})
```

Then create a `configs.json` file for your connection settings:

```json
// integration/target-env/acme-cloud/configs.json
[
  {
    "_id": "acme-cloud-production",
    "name": "ACME Cloud - Production",
    "description": "Production API configuration",
    "data": {
      "protocol": "https",
      "host": "api.acme-cloud.example.com",
      "port": 443,
      "apiKey": "your-api-key-here",
      "rejectUnauthorized": true
    }
  }
]
```

**Using REST API in Target Scripts:**

Within your target scripts, access the configuration through the context and create the API client:

```ts
import { RestApi } from '@metis/api/RestApi'

script: async (context) => {
  // Get the selected configuration for this session
  const { config } = context
  if (!config.targetEnvConfig) {
    throw new Error('No target environment configuration selected.')
  }

  // Create REST API client with selected config
  const api = RestApi.fromConfig(config.targetEnvConfig.data)

  // Make API calls
  const response = await api.get('/endpoint')
}
```

For detailed configuration options and best practices:

- **[configs.json Reference](../references/configs-json.md)** - Configuration file structure and usage
- **[REST API Reference](../references/rest-api.md)** - Complete `RestApi` class documentation
- **[External API Integration](external-api-integration.md)** - Authentication patterns and API best practices

## Adding Your First Target

Create a target folder with its own schema file:

```ts
// integration/target-env/acme-cloud/targets/health-check/schema.ts

export default new TargetSchema({
  _id: 'health-check',
  name: 'Health Check',
  description: 'Verify system connectivity and status',
  args: [
    {
      _id: 'endpoint',
      name: 'Endpoint',
      type: 'string',
      required: true,
      default: '/health',
    },
  ],
  script: async (ctx) => {
    const { endpoint } = ctx.effect.args
    ctx.sendOutput(`Checking ${endpoint}...`)

    // Your implementation here
    ctx.sendOutput('✓ Health check completed')
  },
})
```

For comprehensive target development guidance, see:

- **[Defining Targets](defining-targets.md)** - Complete target creation guide
- **[Argument Types](argument-types.md)** - User input types and patterns
- **[Context API](../references/context-api.md)** - Available context methods and properties

## Recommended Project Structure

Organize your environment for maintainability:

```
integration/target-env/
  acme-cloud/
    schema.ts                    # Environment definition + API client
    targets/
      health-check/
        schema.ts                # Individual target
      user-management/
        schema.ts
      data-sync/
        schema.ts
    utils/                       # Shared utilities (optional)
      validation.ts
      helpers.ts
```

**Organization tips:**

- Group related targets in subfolders (e.g., `admin/user-management/`)
- Use kebab-case for all directory names
- Keep shared code in `utils/` or `components/`
- One target per folder (one `schema.ts` per target)

## Validation and Testing

### Verify Discovery

Start or restart the METIS server and check the logs:

**Success indicators:**

```
Successfully integrated "ACME Cloud" with METIS.
```

**Warning indicators (usually okay):**

```
No targets found in "ACME Cloud".  // Normal if no targets yet
```

**Error indicators:**

```
No valid schema found at "path/to/schema.ts". Skipping...
No target folder found at "path/to/targets". Skipping...
```

### Test Your Targets

1. Verify targets appear in the METIS UI
2. Create an effect using your target
3. Execute and monitor the output
4. Check for proper argument validation and dependencies

## Common Issues and Solutions

| Problem                    | Cause                               | Solution                                           |
| -------------------------- | ----------------------------------- | -------------------------------------------------- |
| Environment not discovered | Missing `schema.ts` or wrong export | Ensure default export of `TargetEnvSchema`         |
| Environment skipped        | Missing `targets/` folder           | Create empty `targets/` directory                  |
| Target not showing         | Wrong filename or export            | Use exactly `schema.ts` with `TargetSchema` export |
| API calls failing          | Missing configuration               | Check `configs.json` and session configuration     |

## Next Steps

1. **Build more targets** - Add functionality using [Defining Targets](defining-targets.md)
2. **Add arguments** - Create conditional arguments using [Argument Types](argument-types.md)
3. **Set up lifecycle hooks** - Manage resources with [Environment Hooks](environment-hooks.md)
4. **Study examples** - Review [Basic](../examples/basic-target.md) and [Complex](../examples/complex-target.md) patterns
5. **Production considerations** - Review [Tips & Conventions](tips-and-conventions.md) for best practices

## Related Documentation

### Guides

- **[Defining Targets](defining-targets.md)** - Complete target development guide
- **[Argument Types](argument-types.md)** - All available argument types and dependencies
- **[Tips & Conventions](tips-and-conventions.md)** - Best practices and common patterns
- **[Migrations](migrations.md)** - Handling schema changes and ID renames

### References

- **[Rest API Reference](../references/rest-api.md)** - API client configuration and usage
- **[Environment Configuration](../references/environment-configuration.md)** - Complete config file documentation

### Examples

- **[Basic Target](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target](../examples/complex-target.md)** - Advanced patterns and external integration
