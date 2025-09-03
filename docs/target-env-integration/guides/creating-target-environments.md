# Creating Target Environments

This guide walks you through creating a new METIS target environment from scratch. The server auto-discovers environments by scanning for specific folder structures and schema files.

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
import TargetEnvSchema from 'integration/library/target-env-classes'

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
- **WebSockets** _(coming soon)_ - For real-time communication
- **Additional protocols** _(planned)_ - More communication methods in development

### REST API Integration

For HTTP/HTTPS REST API calls, add a REST client to your environment schema:

```ts
// integration/target-env/acme-cloud/schema.ts
import TargetEnvSchema from 'integration/library/target-env-classes'
import RestApi from '../../library/rest-api'

// REST client using environment configuration
export const AcmeCloudApi = new RestApi('acme-cloud')

export default new TargetEnvSchema({
  name: 'ACME Cloud',
  description: 'Targets for managing ACME Cloud resources',
  version: '1.0.0',
})
```

Then configure the REST API connection in your root `environment.json`:

```json
{
  "acme-cloud": {
    "protocol": "https",
    "address": "api.acme-cloud.example.com",
    "port": 443,
    "apiKey": "${ACME_CLOUD_API_KEY}",
    "rejectUnauthorized": true
  }
}
```

### Other Protocol Support

As additional protocol support is added to METIS, you'll be able to configure other types of connections (WebSockets, message queues, etc.) using similar patterns with their respective client libraries.

For detailed configuration options and best practices:

- **[Rest API Reference](../references/rest-api.md)** - Complete REST API client documentation
- **[Environment Configuration](../references/environment-config.md)** - Full config file reference

## Adding Your First Target

Create a target folder with its own schema file:

```ts
// integration/target-env/acme-cloud/targets/health-check/schema.ts
import TargetSchema from 'integration/library/target-env-classes/targets'

export default new TargetSchema({
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

For comprehensive target development guidance, see [Defining Targets](defining-targets.md).

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
| API calls failing          | Missing configuration               | Check `environment.json` and environment variables |

## Next Steps

1. **Build more targets** - Add functionality using [Defining Targets](defining-targets.md)
2. **Add arguments** - Create conditional arguments using [Argument Types](argument-types.md)
3. **Study examples** - Review [Basic](../examples/basic-target.md) and [Complex](../examples/complex-target.md) patterns
4. **Production considerations** - Review [Tips & Conventions](tips-and-conventions.md) for best practices

## Related Documentation

### Guides

- **[Defining Targets](defining-targets.md)** - Complete target development guide
- **[Argument Types](argument-types.md)** - All available argument types and dependencies
- **[Tips & Conventions](tips-and-conventions.md)** - Best practices and common patterns
- **[Migrations](migrations.md)** - Handling schema changes and ID renames

### References

- **[Rest API Reference](../references/rest-api.md)** - API client configuration and usage
- **[Environment Configuration](../references/environment-config.md)** - Complete config file documentation

### Examples

- **[Basic Target](../examples/basic-target.md)** - Simple implementation walkthrough
- **[Complex Target](../examples/complex-target.md)** - Advanced patterns and external integration
