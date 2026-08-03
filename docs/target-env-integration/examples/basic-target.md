# Basic Target Example

This example demonstrates how to create a simple target environment with a single target that performs a basic operation. It covers the essential concepts needed to get started with target environment development.

## Overview

We'll create a **"Hello World" target environment** that:

- Creates a simple greeting message
- Demonstrates basic argument handling
- Shows how to output results to the METIS interface
- Uses fundamental target environment patterns

## Project Structure

```
/integration/target-env/hello-world/
├── schema.ts              # Target environment definition
└── targets/
    └── greeting/
        └── schema.ts      # Target definition
```

## Step 1: Create the Target Environment

First, create the target environment schema at `/integration/target-env/hello-world/schema.ts`:

```typescript
/**
 * A simple target environment for demonstration purposes.
 */
const HelloWorld = new TargetEnvSchema({
  name: 'Hello World',
  description:
    'A basic target environment that demonstrates fundamental concepts',
  version: '1.0.0',
})

export default HelloWorld
```

## Step 2: Create the Target

Create the target schema at `/integration/target-env/hello-world/targets/greeting/schema.ts`:

```typescript
/**
 * A target that creates a personalized greeting message.
 */
const Greeting = TargetSchema.create({
  _id: 'greeting',
  name: 'Create Greeting',
  description: 'Generates a personalized greeting message',
  script: async (context, { notify, name, language }) => {
    // Create greeting based on language selection
    let greeting: string
    switch (language) {
      case 'spanish':
        greeting = `¡Hola, ${name}! ¡Bienvenido a METIS!`
        break
      case 'french':
        greeting = `Bonjour, ${name}! Bienvenue dans METIS!`
        break
      case 'english':
      default:
        greeting = `Hello, ${name}! Welcome to METIS!`
        break
    }

    // Output the greeting to the selected force's output panel
    context.sendOutput(greeting, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Target Force',
      type: 'mission-component',
      groupingId: 'target',
      validComponentTypes: ['mission', 'force'],
      tooltipDescription: 'The force that will receive the greeting message',
    },
    {
      _id: 'name',
      name: 'Name',
      type: 'string',
      required: true,
      default: 'John D.',
      groupingId: 'greeting',
      tooltipDescription: 'The name to include in the greeting',
    },
    {
      _id: 'language',
      name: 'Language',
      type: 'dropdown',
      required: true,
      default: 'english',
      groupingId: 'greeting',
      tooltipDescription: 'Select the language for the greeting',
      options: [
        {
          _id: 'english',
          name: 'English',
          value: 'english',
        },
        {
          _id: 'spanish',
          name: 'Spanish',
          value: 'spanish',
        },
        {
          _id: 'french',
          name: 'French',
          value: 'french',
        },
      ],
    },
  ],
})

// Note: The `export default` statement is crucial for making the target available. Otherwise, the scanner will not be able to find it.
export default Greeting
```

## Understanding the Code

### Target Environment Schema

```typescript
const HelloWorld = new TargetEnvSchema({
  name: 'Hello World', // Display name in METIS UI
  description: 'A basic target environment...', // Description for users
  version: '1.0.0', // Semantic version
})
```

**Key Points:**

- **Name**: Appears in the target environment dropdown in METIS
- **Description**: Helps users understand the environment's purpose
- **Version**: Used for migration management and compatibility

---

### Target Schema

```typescript
const Greeting = TargetSchema.create({
  _id: 'greeting',                              // Unique identifier
  name: 'Create Greeting',                      // Target name in UI
  description: 'Generates a personalized greeting message',
  script: async (context, effectArguments) => { ... },  // Execution logic
  parameters: [ ... ],                          // User-configurable inputs
})
```

**Key Points:**

- **`_id`**: Required, and distinct from the folder name
- **`parameters`**: Define the form an author fills in when creating an effect
- **`script`**: Receives the context and the argument values for those parameters

### The Script Function

The script's second parameter holds the argument values, named after each parameter's `_id`:

```typescript
script: async (context, { notify, name, language }) => {
  // Perform operations
  let greeting = `Hello, ${name}!`

  // Output results to METIS
  context.sendOutput(greeting, notify)
}
```

To read a value by parameter `_id` instead of destructuring, use `context.getArguments('name')`, or pass an array to read several at once.

### Parameter Definitions

Each parameter has essential properties:

```typescript
{
  _id: 'name',                    // Unique identifier
  name: 'Name',                   // Display label
  type: 'string',                 // Input type
  required: true,                 // Validation
  default: 'John D.',             // Required whenever `required` is true
  groupingId: 'greeting',         // UI grouping
  tooltipDescription: '...',      // Help text
}
```

The `notify` parameter uses the `mission-component` type, which lets the effect's author pick what the target acts on. `validComponentTypes` limits the picker, and the resulting argument is an array of the selected components:

```typescript
{
  _id: 'notify',
  name: 'Target Force',
  type: 'mission-component',
  groupingId: 'target',
  validComponentTypes: ['mission', 'force'],
  tooltipDescription: '...',
}
```

## Testing Your Target Environment

### 1. Start METIS Server

```bash
cd /path/to/metis
npm run dev
```

Look for this message in the console:

```
Successfully integrated "Hello World" with METIS.
Started server on port <your-port>
```

### 2. Test in the UI

1. **Create or open a mission**
2. **Navigate to a force** (not "Master")
3. **Find an executable mission node** (has lightning bolt icon)
4. **Click on an action** — the Inspector tab comes forward automatically
5. **Find the effect timeline** in the Inspector
6. **Click "+"** on the timeline section for the trigger you want
7. **Click "Custom Effect"** in the menu that appears
8. **Select "Hello World"** from the target environment dropdown in the "Create Effect" view
9. **Select the "Create Greeting"** target
10. **Fill in the parameters**:
    - **Target Force**: Choose a force, or the mission to reach everyone
    - **Name**: Enter any name (e.g., "John")
    - **Language**: Choose from dropdown
11. **Save and execute** the action that the effect is tied to during a session

### Expected Results

When executed, you should see:

- The greeting message appears in the selected force's output panel
- Message language matches your selection

## Common Issues and Solutions

### "Target Environment not found"

- **Check file paths**: Ensure `schema.ts` files are in correct locations
- **Check exports**: Verify `export default` statements are present
- **Restart server**: Target environments are loaded at startup

### "Effects not working"

- **Check argument values**: Ensure the values passed to the script are correct when it executes
- **Verify the component selection**: A `mission-component` argument is an array of the components the author selected, and is empty if they selected nothing
- **Check async/await**: Script function should handle promises properly

## Next Steps

Now that you have a basic target environment working:

1. **Explore Complex Patterns** → See [Complex Target Example](complex-target.md)
2. **Learn About Migrations** → See [Migration Guide](../guides/migrations.md)
3. **Study Tips & Conventions** → See [Tips & Conventions](../guides/tips-and-conventions.md)
4. **Advanced Arguments** → See [Parameter and Argument Types](../guides/parameter-and-argument-types.md)
5. **Explore the METIS Target Environment Implementation** → See [METIS Target Environment](../../../integration/target-env/metis/schema.ts)

## Related Documentation

- **[Creating Target Environments](../guides/creating-target-environments.md)** - Detailed setup guide
- **[Defining Targets](../guides/defining-targets.md)** - Target development patterns
- **[Context API](../references/context-api.md)** - Complete context reference
