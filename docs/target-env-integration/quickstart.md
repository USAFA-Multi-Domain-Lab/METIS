# Target-Effect System Quickstart

Get your first integration running in 5 minutes! This guide walks you through creating a simple target that sends alerts to an external system.

## Table of Contents

- [What You'll Build](#what-youll-build)
- [Step 1: Create Your Target Environment](#step-1-create-your-target-environment)
- [Step 2: Create Your Target](#step-2-create-your-target)
- [Step 3: Test Your Integration](#step-3-test-your-integration)
- [Step 4: Run and Verify](#step-4-run-and-verify)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## What You'll Build

An "Alert System" target that:

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
  description: 'Send alerts to external monitoring system.',
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
const sendAlert = TargetSchema.create({
  _id: 'send-alert',
  name: 'Send Alert',
  description: 'Send an alert message to an external system.',
  script: async (context, { notify, message, priority }) => {
    // Call the external system.
    const response = await fetch('https://api.example.com/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, priority }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send alert: ${response.statusText}`)
    }

    // Report back to whoever the effect's author chose.
    context.sendOutput(`Alert sent: ${message} (Priority: ${priority})`, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'alert',
      validComponentTypes: ['mission', 'force'],
      tooltipDescription:
        'The force that sees the confirmation. Select the mission to send it to everyone.',
    },
    {
      _id: 'message',
      name: 'Alert Message',
      type: 'string',
      required: true,
      groupingId: 'alert',
      default: 'Enter your alert message.',
    },
    {
      _id: 'priority',
      name: 'Priority Level',
      type: 'dropdown',
      required: true,
      groupingId: 'alert',
      default: 'medium',
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

1. **Play-test the mission** - From the mission list, choose **Play Test**. This launches, joins, and starts a disposable session in one step and takes you straight into it.
2. **Trigger the action** that contains your effect
3. **Watch for output** - Your alert message appears in the output panel of the force selected in the **Notify** field
4. **Check external system** - Verify the API call was made (check logs, monitoring, etc.)

> **Note:** A play-test session is disposable and is destroyed once you leave it. To run a session with other participants, choose **Launch** instead and start it from the lobby.

## Next Steps

Congratulations! You've created your first target-effect integration. Here's what to explore next:

### Enhance Your Target

- Add more argument types (numbers, booleans, large text)
- Implement error handling and retries
- Add validation for required fields

### Advanced Features

- **[External API Integration](guides/external-api-integration.md)** - Authentication, error handling, and API patterns
- **[Context API](references/context-api.md)** - Modify mission state, access files, etc.
- **[Parameter and Argument Types](guides/parameter-and-argument-types.md)** - Use all available input types
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
- If the server log reports `does not export a valid TargetSchema instance`, the schema file's default export is not a `TargetSchema`. Confirm it is built with `TargetSchema.create(...)` and exported with `export default`. A target that fails to load is skipped, so it simply will not appear.

**Effect not executing?**

- Check server logs for runtime errors
- Verify target script syntax
- Ensure external system is reachable

## Related Documentation

- **[Creating Target Environments](guides/creating-target-environments.md)** - The full walkthrough this quickstart condenses
- **[Defining Targets](guides/defining-targets.md)** - Complete target creation guide
- **[Parameter and Argument Types](guides/parameter-and-argument-types.md)** - Every parameter type and its options
- **[Context API](references/context-api.md)** - Everything a target script's context exposes
