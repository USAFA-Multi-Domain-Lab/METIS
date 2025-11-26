# Target-Effect System Quickstart

Get your first integration running in 5 minutes! This guide walks you through creating a simple target that sends alerts to an external system.

## What You'll Build

A "Send Alert" target that:

- Accepts a message and priority level
- Calls an external API
- Provides feedback to the mission

## Step 1: Create Your Target Environment

Create a new folder and schema file:

```bash
mkdir integration/target-env/my-alerts
touch integration/target-env/my-alerts/schema.ts
```

Define your environment in `schema.ts`:

```typescript
const alertEnvironment = new TargetEnvSchema({
  name: 'Alert System',
  description: 'Send alerts to external monitoring system',
  version: '1.0.0',
})

export default alertEnvironment
```

## Step 2: Create Your Target

Create the target structure:

```bash
mkdir integration/target-env/my-alerts/targets
mkdir integration/target-env/my-alerts/targets/send-alert
touch integration/target-env/my-alerts/targets/send-alert/schema.ts
```

Define your target in `targets/send-alert/schema.ts`:

```typescript
const sendAlert = new TargetSchema({
  _id: 'send-alert',
  name: 'Send Alert',
  description: 'Send an alert message to external system',
  script: async (context) => {
    const { message, priority } = context.effect.args

    // Simulate API call to external system
    const response = await fetch('https://api.example.com/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, priority }),
    })

    if (response.ok) {
      context.sendOutput(`✅ Alert sent: ${message} (Priority: ${priority})`)
    } else {
      throw new Error(`Failed to send alert: ${response.statusText}`)
    }
  },
  args: [
    {
      _id: 'message',
      name: 'Alert Message',
      type: 'string',
      required: true,
    },
    {
      _id: 'priority',
      name: 'Priority Level',
      type: 'dropdown',
      required: true,
      options: [
        { _id: 'low', name: 'Low', value: 'low' },
        { _id: 'medium', name: 'Medium', value: 'medium' },
        { _id: 'high', name: 'High', value: 'high' },
      ],
    },
  ],
})

export default sendAlert
```

## Step 3: Test Your Integration

1. **Restart METIS server** - Your new target environment will be automatically discovered
2. **Create a new mission** or open an existing one
3. **Add an action** to a node
4. **Add an effect** to the action
5. **Select your target** - "Alert System" → "Send Alert"
6. **Configure the effect** - Fill in the message and select priority
7. **Save your mission**

## Step 4: Run and Verify

1. **Start a mission session** with your configured mission
2. **Trigger the action** that contains your effect
3. **Watch for output** - You should see your alert message appear
4. **Check external system** - Verify the API call was made (check logs, monitoring, etc.)

## Next Steps

Congratulations! You've created your first target-effect integration. Here's what to explore next:

### Enhance Your Target

- Add more argument types (numbers, booleans, large text)
- Implement error handling and retries
- Add validation for required fields

### Advanced Features

- **[External API Integration](guides/external-api-integration.md)** - Authentication, error handling, and API patterns
- **[Context API](references/context-api.md)** - Modify mission state, access files, etc.
- **[Argument Types](guides/argument-types.md)** - Use all available input types
- **[Environment Integration](index.md)** - Detailed integration patterns
- **[Migrations](guides/migrations.md)** - Version management and data migrations

### Real Examples

- **[Basic Target Example](examples/basic-target.md)** - Simple target implementation
- **[Complex Target Example](examples/complex-target.md)** - Advanced patterns

## Troubleshooting

**Target not appearing in mission editor?**

- Ensure server was restarted after creating files
- Check server logs for scanning errors
- Verify file paths and exports are correct

**Effect not executing?**

- Check browser console for errors
- Verify target script syntax
- Ensure external system is reachable
