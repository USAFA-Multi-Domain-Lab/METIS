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
import TargetEnvSchema from '../../library/target-env-classes'
import RestApi from '../../library/rest-api'

/**
 * Configured REST API client for the Mission Control environment.
 * Uses the 'mission-control' configuration from environment.json
 */
export const MissionControlApi = new RestApi('mission-control')

/**
 * Advanced target environment for mission control operations.
 */
const MissionControl = new TargetEnvSchema({
  name: 'Mission Control System',
  description:
    'Advanced target environment for secure communications, file management, and system monitoring',
  version: '2.1.0',
})

export default MissionControl
```

## Step 2: Environment Configuration

Add to your `environment.json` file (or upcoming `.env` file):

```json
{
  "mission-control": {
    "protocol": "https",
    "address": "api.mission-control.example.com",
    "port": 443,
    "apiKey": "your-api-key-here",
    "rejectUnauthorized": true
  }
}
```

## Step 3: Communication Target

Create `/integration/target-env/mission-control/targets/communication/schema.ts`:

```typescript
import TargetSchema from '../../../../library/target-env-classes/targets'
import { MissionControlApi } from '../../schema'
import Dependency from 'metis/target-environments/dependencies'

/**
 * Secure communication target demonstrating API calls and dependency patterns.
 */
const SecureCommunication = new TargetSchema({
  name: 'Secure Communication',
  description: 'Send encrypted messages with delivery confirmation',
  script: async (context) => {
    const { forceMetadata, recipientId, message, priority, encryptionLevel } =
      context.effect.args

    try {
      // Prepare message payload
      const encryptionInfo = encryptionLevel
        ? `(${encryptionLevel} encryption)`
        : ''

      context.sendOutput(
        `Sending ${priority} priority message ${encryptionInfo}...`,
        {
          forceKey: forceMetadata.forceKey,
        },
      )

      const payload = {
        to: recipientId,
        message: message,
        priority: priority,
        encryption: encryptionLevel || 'none',
        timestamp: new Date().toISOString(),
      }

      // Send message using configured REST API client
      const result = await MissionControlApi.post(
        `${MissionControlApi.baseUrl}/v1/communications`,
        payload,
      )

      if (!result.success) {
        throw new Error(`Failed to send message: ${result.error}`)
      }

      context.sendOutput(`✓ Message delivered! ID: ${result.data.messageId}`, {
        forceKey: forceMetadata.forceKey,
      })
    } catch (error: any) {
      context.sendOutput(`✗ Communication failed: ${error.message}`, {
        forceKey: forceMetadata.forceKey,
      })
      throw error
    }
  },
  args: [
    {
      _id: 'forceMetadata',
      name: 'Target Force',
      type: 'force',
      required: true,
      groupingId: 'target',
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
      default: { _id: 'normal', name: 'Normal Priority', value: 'normal' },
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
      dependencies: [Dependency.EQUALS_SOME('priority', ['high', 'urgent'])],
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

## Step 4: File Transfer Target

Create `/integration/target-env/mission-control/targets/file-transfer/schema.ts`:

```typescript
import TargetSchema from '../../../../library/target-env-classes/targets'
import { MissionControlApi } from '../../schema'
import Dependency from 'metis/target-environments/dependencies'

/**
 * File transfer target demonstrating file operations and boolean dependencies.
 */
const FileTransfer = new TargetSchema({
  name: 'Secure File Transfer',
  description:
    'Upload or download files with encryption and compression options',
  script: async (context) => {
    const {
      forceMetadata,
      operation,
      filePath,
      encryptionEnabled,
      compressionLevel,
    } = context.effect.args

    try {
      if (operation === 'upload') {
        const encryptionInfo = encryptionEnabled ? '(encrypted)' : ''
        const compressionInfo =
          compressionLevel && compressionLevel !== 'none'
            ? `(${compressionLevel} compression)`
            : ''

        context.sendOutput(
          `Uploading file: ${filePath} ${encryptionInfo} ${compressionInfo}`,
          { forceKey: forceMetadata.forceKey },
        )

        // Upload file using configured REST API client
        const result = await MissionControlApi.post(
          `${MissionControlApi.baseUrl}/v1/files`,
          {
            filePath: filePath,
            operation: 'upload',
            encrypted: encryptionEnabled || false,
            compressionLevel: compressionLevel || 'none',
            uploadedBy: 'METIS-System',
          },
        )

        if (!result.success) throw new Error(`Upload failed: ${result.error}`)

        context.sendOutput(`✓ File uploaded! ID: ${result.data.fileId}`, {
          forceKey: forceMetadata.forceKey,
        })
      } else {
        // Download operation
        context.sendOutput(`Downloading file: ${filePath}`, {
          forceKey: forceMetadata.forceKey,
        })

        const result = await MissionControlApi.get(
          `${MissionControlApi.baseUrl}/v1/files/${filePath}`,
        )

        if (!result.success) throw new Error(`Download failed: ${result.error}`)

        context.sendOutput(`✓ File downloaded successfully!`, {
          forceKey: forceMetadata.forceKey,
        })
      }
    } catch (error: any) {
      context.sendOutput(`✗ File transfer failed: ${error.message}`, {
        forceKey: forceMetadata.forceKey,
      })
      throw error
    }
  },
  args: [
    {
      _id: 'forceMetadata',
      name: 'Target Force',
      type: 'force',
      required: true,
      groupingId: 'target',
    },
    {
      _id: 'operation',
      name: 'Operation Type',
      type: 'dropdown',
      required: true,
      groupingId: 'operation',
      default: { _id: 'upload', name: 'Upload File', value: 'upload' },
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
      required: false,
      groupingId: 'operation',
      dependencies: [Dependency.EQUALS('operation', 'upload')],
      tooltipDescription: 'Encrypt file during upload',
    },
    {
      _id: 'compressionLevel',
      name: 'Compression Level',
      type: 'dropdown',
      required: false,
      groupingId: 'operation',
      dependencies: [Dependency.TRUTHY('encryptionEnabled')],
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

- **Arguments only appear when their dependencies are satisfied**
- **The script receives only the visible arguments in `context.effect.args`**
- **Dependencies create a logical flow that guides users through configuration**

## Understanding the Dependency System

### **Three Essential Patterns**

This example demonstrates the most commonly used dependency types:

```typescript
// Pattern 1: Multiple value matching
dependencies: [Dependency.EQUALS_SOME('priority', ['high', 'urgent'])]

// Pattern 2: Simple equality check
dependencies: [Dependency.EQUALS('operation', 'upload')]

// Pattern 3: Boolean state check
dependencies: [Dependency.TRUTHY('encryptionEnabled')]
```

### **How Dependencies Work**

1. **UI Control** - Arguments only show when dependencies are met
2. **Effect Validation** - Only visible arguments get added to `effect.args`
3. **User Experience** - Creates a guided, progressive disclosure interface

## Production Considerations

When implementing similar patterns in production:

### **API Configuration**

- Store sensitive credentials in environment variables, not `environment.json`
- Use proper SSL/TLS certificate validation
- Implement retry logic for network failures
- Add request timeout handling

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

## Extending This Example

### **Add More Dependency Types**

```typescript
// Show argument only when another is NOT set
dependencies: [Dependency.NOT_EQUALS('mode', 'simple')]

// Multiple conditions (AND logic)
dependencies: [
  Dependency.EQUALS('operation', 'upload'),
  Dependency.TRUTHY('advancedMode'),
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
- **[Argument Types Guide](../guides/argument-types.md)** - All available argument types

### **Build Your Own**

Start with this structure and customize:

1. Replace the API endpoints with your own
2. Modify the arguments to match your use case
3. Update the grouping and dependencies as needed
4. Add proper error handling for your specific scenarios

## Quick Reference

### **Essential Imports**

```typescript
import TargetSchema from '../../../../library/target-env-classes/targets'
import { MissionControlApi } from '../../schema'
import Dependency from 'metis/target-environments/dependencies'
```

### **Common Dependency Patterns**

```typescript
// Show when value equals one of several options
Dependency.EQUALS_SOME('field', ['option1', 'option2'])

// Show when value equals specific option
Dependency.EQUALS('field', 'value')

// Show when boolean field is checked
Dependency.TRUTHY('booleanField')
```

### **Script Structure**

```typescript
script: async (context) => {
  const { forceMetadata, arg1, arg2 } = context.effect.args

  try {
    // Your logic here
    context.sendOutput('Success message', {
      forceKey: forceMetadata.forceKey,
    })
  } catch (error: any) {
    context.sendOutput(`Error: ${error.message}`, {
      forceKey: forceMetadata.forceKey,
    })
    throw error
  }
}
```

## Related Documentation

- **[Basic Target Example](basic-target.md)** - Start here for foundation concepts
- **[Defining Targets Guide](../guides/defining-targets.md)** - Target development patterns
- **[Schema Documentation](../references/schemas.md)** - TypeScript interfaces and types
