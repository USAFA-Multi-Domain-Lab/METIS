# Complex Target Example

This example demonstrates advanced target environment patterns including multiple targets, complex argument types, error handling, file operations, and external API integration. It builds upon the concepts from the [Basic Target Example](basic-target.md).

## Overview

We'll create a **"Mission Control System"** that:

- Manages communication and file transfer operations
- Demonstrates complex argument validation and dependencies
- Shows error handling and retry logic
- Integrates with external APIs using REST client
- Uses advanced context features with focused examples

## Project Structure

```
/integration/target-env/mission-control/
├── schema.ts                   # Target environment definition with API client
└── targets/
    ├── communication/
    │   └── schema.ts           # Send secure messages
    └── file-transfer/
        └── schema.ts           # Upload/download files
```

## Step 1: Target Environment Setup

Create `/integration/target-env/mission-control/schema.ts`:

```typescript
import { RestApi } from '@metis/api/RestApi'

/**
 * Advanced target environment for mission control operations.
 */
const MissionControl = TargetEnvSchema.create({
  name: 'Mission Control System',
  description:
    'Advanced target environment for secure communications, file management, and system monitoring',
  version: '2.1.0',
})

/**
 * The key under which each realm keeps its REST API client.
 */
export const API_CLIENT_KEY = 'apiClient'

/**
 * Initialize the API client when the session starts.
 */
MissionControl.on('environment-setup', async (context) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No Mission Control configuration selected.')
  }

  // The local store is scoped to this environment within a single realm,
  // so each realm holds its own client.
  const client = context.localStore.use<RestApi | null>(API_CLIENT_KEY, null)
  client.value = RestApi.fromConfig(context.config.targetEnvConfig.data)
})

/**
 * Clean up the API client when the session ends or resets.
 */
MissionControl.on('environment-teardown', async (context) => {
  const client = context.localStore.use<RestApi | null>(API_CLIENT_KEY, null)
  client.value = null
})

export default MissionControl
```

Setup and teardown hooks run once per realm, so a client held in a module-level variable would be shared by every realm in the session and torn down by whichever finished first. Keeping it in `context.localStore` gives each realm its own.

Hooks receive the same context as target scripts minus the mission-manipulation methods, so they can read `config`, `session`, and `mission`, and use the data stores. They cannot send output.

## Step 2: Environment Configuration

Configure connection details in `/integration/target-env/mission-control/configs.json`:

```json
[
  {
    "_id": "mission-control-production",
    "name": "Production Mission Control",
    "data": {
      "protocol": "https",
      "host": "api.mission-control.example.com",
      "port": 443,
      "apiKey": "your-production-api-key",
      "rejectUnauthorized": true
    }
  },
  {
    "_id": "mission-control-development",
    "name": "Development Mission Control",
    "data": {
      "protocol": "http",
      "host": "localhost",
      "port": 8080,
      "apiKey": "dev-api-key",
      "rejectUnauthorized": false
    }
  }
]
```

**Configuration Selection:**

- Managers select configurations in the session UI before starting
- Different configurations for production, staging, and development
- See [configs.json Reference](../references/configs-json.md) for details

## Step 3: Communication Target

Create `/integration/target-env/mission-control/targets/communication/schema.ts`:

```typescript
import { RestApi } from '@metis/api/RestApi'
import { API_CLIENT_KEY } from '../../schema'

/**
 * Secure communication target demonstrating API calls and dependency patterns.
 */
const SecureCommunication = TargetSchema.create({
  _id: 'communication',
  name: 'Secure Communication',
  description: 'Send encrypted messages with delivery confirmation',
  script: async (
    context,
    { notify, recipientId, message, priority, encryptionLevel },
  ) => {
    // Verify API client is initialized
    const { value: api } = context.localStore.use<RestApi | null>(
      API_CLIENT_KEY,
      null,
    )
    if (!api) {
      throw new Error(
        'Mission Control API not initialized. Check environment setup.',
      )
    }

    try {
      // Prepare message payload
      const encryptionInfo = encryptionLevel
        ? `(${encryptionLevel} encryption)`
        : ''

      context.sendOutput(
        `Sending ${priority} priority message ${encryptionInfo}...`,
        notify,
      )

      const payload = {
        to: recipientId,
        message: message,
        priority: priority,
        encryption: encryptionLevel || 'none',
        timestamp: new Date().toISOString(),
      }

      // Send message using configured REST API client.
      // A non-2xx response rejects, so it is handled by the catch below.
      const response = await api.post('/v1/communications', payload)

      context.sendOutput(
        `✓ Message delivered! ID: ${response.data.messageId}`,
        notify,
      )
    } catch (error: any) {
      context.sendOutput(`✗ Communication failed: ${error.message}`, notify)
      throw error
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Target Force',
      type: 'mission-component',
      groupingId: 'target',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'recipientId',
      name: 'Recipient ID',
      type: 'string',
      required: true,
      default: '1',
      groupingId: 'communication',
      tooltipDescription: 'Secure identifier for the message recipient',
    },
    {
      _id: 'message',
      name: 'Message Content',
      type: 'large-string',
      required: true,
      default: 'Hello, this is a secure message.',
      groupingId: 'communication',
      tooltipDescription: 'The message content',
    },
    {
      _id: 'priority',
      name: 'Priority Level',
      type: 'dropdown',
      required: true,
      groupingId: 'security',
      default: 'normal',
      options: [
        { _id: 'low', name: 'Low Priority', value: 'low' },
        { _id: 'normal', name: 'Normal Priority', value: 'normal' },
        { _id: 'high', name: 'High Priority', value: 'high' },
        { _id: 'urgent', name: 'Urgent', value: 'urgent' },
      ],
    },
    {
      _id: 'encryptionLevel',
      name: 'Encryption Level',
      type: 'dropdown',
      required: false,
      groupingId: 'security',
      dependencies: [
        TargetDependency.EQUALS_SOME('priority', ['high', 'urgent']),
      ],
      options: [
        { _id: 'basic', name: 'Basic (AES-128)', value: 'aes128' },
        { _id: 'standard', name: 'Standard (AES-256)', value: 'aes256' },
        { _id: 'military', name: 'Military Grade', value: 'military' },
      ],
      tooltipDescription: 'Available only for high/urgent priority messages',
    },
  ],
})

export default SecureCommunication
```

Because `encryptionLevel` declares a dependency, its value is `undefined` whenever that dependency is unmet, so the script checks it before use.

## Step 4: File Transfer Target

Create `/integration/target-env/mission-control/targets/file-transfer/schema.ts`:

```typescript
import { RestApi } from '@metis/api/RestApi'
import { API_CLIENT_KEY } from '../../schema'

/**
 * File transfer target demonstrating file operations and boolean dependencies.
 */
const FileTransfer = TargetSchema.create({
  _id: 'file-transfer',
  name: 'Secure File Transfer',
  description:
    'Upload or download files with encryption and compression options',
  script: async (
    context,
    { notify, operation, filePath, encryptionEnabled, compressionLevel },
  ) => {
    // Verify API client is initialized
    const { value: api } = context.localStore.use<RestApi | null>(
      API_CLIENT_KEY,
      null,
    )
    if (!api) {
      throw new Error(
        'Mission Control API not initialized. Check environment setup.',
      )
    }

    try {
      if (operation === 'upload') {
        const encryptionInfo = encryptionEnabled ? '(encrypted)' : ''
        const compressionInfo =
          compressionLevel && compressionLevel !== 'none'
            ? `(${compressionLevel} compression)`
            : ''

        context.sendOutput(
          `Uploading file: ${filePath} ${encryptionInfo} ${compressionInfo}`,
          notify,
        )

        // Upload file using configured REST API client
        const response = await api.post('/v1/files', {
          filePath: filePath,
          operation: 'upload',
          encrypted: encryptionEnabled || false,
          compressionLevel: compressionLevel || 'none',
          uploadedBy: 'METIS-System',
        })

        context.sendOutput(
          `✓ File uploaded! ID: ${response.data.fileId}`,
          notify,
        )
      } else {
        // Download operation
        context.sendOutput(`Downloading file: ${filePath}`, notify)

        await api.get(`/v1/files/${filePath}`)

        context.sendOutput(`✓ File downloaded successfully!`, notify)
      }
    } catch (error: any) {
      context.sendOutput(`✗ File transfer failed: ${error.message}`, notify)
      throw error
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Target Force',
      type: 'mission-component',
      groupingId: 'target',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'operation',
      name: 'Operation Type',
      type: 'dropdown',
      required: true,
      groupingId: 'operation',
      default: 'upload',
      options: [
        { _id: 'upload', name: 'Upload File', value: 'upload' },
        { _id: 'download', name: 'Download File', value: 'download' },
      ],
    },
    {
      _id: 'filePath',
      name: 'File Path',
      type: 'string',
      required: true,
      groupingId: 'operation',
      default: '/path/to/file.txt',
      tooltipDescription: 'Path to the file for upload/download',
    },
    {
      _id: 'encryptionEnabled',
      name: 'Enable Encryption',
      type: 'boolean',
      groupingId: 'operation',
      dependencies: [TargetDependency.EQUALS('operation', 'upload')],
      tooltipDescription: 'Encrypt file during upload',
    },
    {
      _id: 'compressionLevel',
      name: 'Compression Level',
      type: 'dropdown',
      required: false,
      groupingId: 'operation',
      dependencies: [TargetDependency.TRUTHY('encryptionEnabled')],
      options: [
        { _id: 'none', name: 'No Compression', value: 'none' },
        { _id: 'low', name: 'Low Compression', value: 'low' },
        { _id: 'high', name: 'High Compression', value: 'high' },
      ],
      tooltipDescription: 'Compression level (only when encryption is enabled)',
    },
  ],
})

export default FileTransfer
```

A `boolean` parameter has no `required` property. It is unchecked until the user turns it on, and takes an optional `default`.

## Step 5: Testing Your Implementation

Now that you've built both targets, let's test them to see the dependency patterns in action.

### **Communication Target Testing**

1. **Basic Priority Test**

   - Set priority to "low" or "normal" → Notice encryption level doesn't appear
   - Change priority to "high" or "urgent" → Encryption level dropdown appears
   - Select different encryption levels and see how the output message changes

2. **Message Flow Test**
   - Send a low priority message: `"System status: normal"`
   - Send an urgent message with military encryption: `"Security breach detected"`
   - Observe how the script output reflects the priority and encryption settings

### **File Transfer Target Testing**

1. **Operation Type Test**

   - Set operation to "download" → Notice encryption option disappears
   - Change to "upload" → Encryption option appears
   - Toggle encryption on/off to see compression level dependency

2. **Dependency Chain Test**
   - Start with upload + no encryption → Only basic options visible
   - Enable encryption → Compression level dropdown appears
   - Try different compression levels and see the output change

### **Key Observations**

- **Parameters only appear when their dependencies are satisfied**
- **An argument whose dependencies are unmet resolves to `undefined` in the script**
- **Dependencies create a logical flow that guides users through configuration**

## Understanding the Dependency System

### **Three Essential Patterns**

This example demonstrates the most commonly used dependency types:

```typescript
// Pattern 1: Multiple value matching
dependencies: [TargetDependency.EQUALS_SOME('priority', ['high', 'urgent'])]

// Pattern 2: Simple equality check
dependencies: [TargetDependency.EQUALS('operation', 'upload')]

// Pattern 3: Boolean state check
dependencies: [TargetDependency.TRUTHY('encryptionEnabled')]
```

### **How Dependencies Work**

1. **UI Control** - Parameters only show when dependencies are met
2. **Value Resolution** - An argument whose dependencies are unmet resolves to `undefined`, and its type includes `undefined` so the compiler requires a check
3. **User Experience** - Creates a guided, progressive disclosure interface

## Production Considerations

When implementing similar patterns in production:

### **API Configuration**

- Store configurations in `configs.json`, and ensure the file is readable by the account the server runs as
- Use proper SSL/TLS certificate validation (`rejectUnauthorized: true`)
- Use environment hooks for API client initialization and cleanup
- Implement retry logic for network failures
- Add request timeout handling

**Learn more:** See **[configs.json Reference](../references/configs-json.md)** and **[Environment Hooks Guide](../guides/environment-hooks.md)**

### **Error Handling**

- Provide specific error messages for different failure scenarios
- Log errors for debugging while keeping user messages simple
- Consider graceful degradation when optional features fail

### **Argument Design**

- Keep dependency chains simple (avoid deep nesting)
- Provide meaningful default values
- Use tooltips to explain when/why arguments appear
- Group related arguments with consistent `groupingId` values

### **Security Considerations**

- Validate all user inputs in your scripts
- Sanitize file paths and names
- Use encryption for sensitive data transmission
- Implement proper authentication for API calls

### **State Management with Data Stores**

For production scenarios requiring state persistence or cross-target coordination, utilize **data stores**:

```typescript
script: async (context) => {
  // Retrieve a stored value, supplying the value to start from
  // if nothing has been stored yet
  const lastMessage = context.localStore.use<string | null>('lastMessageId', null)

  // Read it
  const previousId = lastMessage.value

  // Update it
  lastMessage.value = messageId

  // Share data across every realm and environment in the session
  const status = context.globalStore.use('systemStatus', 'idle')
  status.value = 'active'
}
```

Stores are accessed through `use(key, initialValue)`, which returns a holder whose `value` can be read and written. The call is synchronous. Three scopes are available: `localStore` for one environment within one realm, `realmStore` for every environment within one realm, and `globalStore` for the whole session.

**Learn more:** See the **[Data Stores Guide](../guides/data-stores.md)** and **[Context API Reference](../references/context-api.md)** for complete usage patterns, caching strategies, and cross-target coordination examples.

## Extending This Example

### **Add More Dependency Types**

```typescript
// Show argument only when another is NOT set
dependencies: [TargetDependency.NOT_EQUALS('mode', 'simple')]

// Multiple conditions (AND logic)
dependencies: [
  TargetDependency.EQUALS('operation', 'upload'),
  TargetDependency.TRUTHY('advancedMode'),
]
```

## Next Steps

### **Immediate Actions**

1. **Test the examples** - Copy the code and test the dependency behaviors
2. **Modify arguments** - Try adding your own arguments with dependencies
3. **Experiment with API calls** - Replace with your own API endpoints

### **Learn More**

- **[Migration Guide](../guides/migrations.md)** - Schema changes
- **[Tips & Conventions](../guides/tips-and-conventions.md)** - Practical patterns and conventions
- **[Context API Reference](../references/context-api.md)** - Full context capabilities
- **[Parameter and Argument Types](../guides/parameter-and-argument-types.md)** - All available argument types

### **Build Your Own**

Start with this structure and customize:

1. Replace the API endpoints with your own
2. Modify the arguments to match your use case
3. Update the grouping and dependencies as needed
4. Add proper error handling for your specific scenarios

## Quick Reference

### **Essential Imports**

```typescript
import { RestApi } from '@metis/api/RestApi'
```

### **Common Dependency Patterns**

```typescript
// Show when value equals one of several options
TargetDependency.EQUALS_SOME('field', ['option1', 'option2'])

// Show when value equals specific option
TargetDependency.EQUALS('field', 'value')

// Show when boolean field is checked
TargetDependency.TRUTHY('booleanField')
```

### **Script Structure**

```typescript
script: async (context, { notify, arg1, arg2 }) => {
  try {
    // Your logic here
    context.sendOutput('Success message', notify)
  } catch (error: any) {
    context.sendOutput(`Error: ${error.message}`, notify)
    throw error
  }
}
```

## Related Documentation

- **[Basic Target Example](basic-target.md)** - Start here for foundation concepts
- **[Data Stores Guide](../guides/data-stores.md)** - Session state management and caching
- **[Defining Targets Guide](../guides/defining-targets.md)** - Target development patterns
- **[Schema Documentation](../references/schemas.md)** - TypeScript interfaces and types
