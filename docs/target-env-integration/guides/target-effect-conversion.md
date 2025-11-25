# Target-Effect Conversion

This guide explains how target arguments are converted to effect arguments and how to properly extract and use them in your target scripts.

## Table of Contents

- [Overview](#overview)
- [🔄 The Conversion Process](#-the-conversion-process)
- [📝 Argument Extraction Patterns](#-argument-extraction-patterns)
- [🏷️ Naming Conventions](#️-naming-conventions)
- [📊 Type Handling](#-type-handling)
- [🔗 Dependency Arguments](#-dependency-arguments)
- [⚙️ Mission Component Arguments](#️-mission-component-arguments)
- [🧪 Testing Argument Access](#-testing-argument-access)
- [⚠️ Common Pitfalls](#️-common-pitfalls)
- [📖 Related Documentation](#-related-documentation)

## Overview

When a user fills out a target form and executes it, METIS converts the target schema and user inputs into an **effect**. This effect contains the processed arguments that your target script receives through the context object.

Understanding this conversion process is crucial for properly accessing and using arguments in your target scripts.

## 🔄 The Conversion Process

### Target Schema → Effect Arguments

```ts
// Target Schema Definition
export default new TargetSchema({
  name: 'Deploy Service',
  args: [
    {
      _id: 'serviceName',
      name: 'Service Name',
      type: 'string',
      required: true,
    },
    {
      _id: 'environment',
      name: 'Target Environment',
      type: 'dropdown',
      required: true,
      options: [
        { _id: 'dev', name: 'Development', value: 'development' },
        { _id: 'prod', name: 'Production', value: 'production' },
      ],
    },
    {
      _id: 'enableMonitoring',
      name: 'Enable Monitoring',
      type: 'boolean',
      required: false,
    },
  ],
  script: async (ctx) => {
    // Effect arguments are available here
    console.log(ctx.effect.args)
    // {
    //   serviceName: 'my api service',
    //   environment: 'production',
    //   enableMonitoring: true
    // }
  },
})
```

### What Happens During Conversion

1. **User Input Collection** - Form values are gathered from the UI
2. **Validation** - Required fields and type constraints are checked
3. **Type Processing** - Values are converted to appropriate JavaScript types
4. **Default Application** - Required arguments get default values if not provided
5. **Effect Creation** - Final effect object is created with processed arguments

## 📝 Argument Extraction Patterns

### Basic Destructuring

```ts
script: async (ctx) => {
  // Extract specific arguments (camelCase - direct access)
  const { serviceName, environment, enableMonitoring } = ctx.effect.args

  ctx.sendOutput(`Deploying ${serviceName} to ${environment}`)

  if (enableMonitoring) {
    ctx.sendOutput('Monitoring will be enabled')
  }
}
```

### Alternative Access Patterns

```ts
script: async (ctx) => {
  // Direct property access (camelCase)
  const environment = ctx.effect.args.environment
  const serviceName = ctx.effect.args.serviceName

  // Bracket notation (any casing style)
  const serviceName = ctx.effect.args['serviceName'] // camelCase
  const apiKey = ctx.effect.args['api-key'] // kebab-case
  const dbHost = ctx.effect.args['DB_HOST'] // UPPER_SNAKE_CASE

  // Store full args object
  const args = ctx.effect.args
  const serviceName = args.serviceName

  // Destructure with renaming (if needed)
  const {
    serviceName: service,
    targetPort: port,
    sslEnabled: useSSL,
  } = ctx.effect.args
}
```

## 🏷️ Naming Conventions

### Argument ID Casing

Argument IDs can use any casing but must be unique. **We recommend camelCase** for easier JavaScript access:

```ts
// Target Schema - Recommended (camelCase)
{
  _id: 'apiEndpoint',     // camelCase ID (recommended)
  _id: 'retryCount',      // camelCase ID (recommended)
  _id: 'sslVerify',       // camelCase ID (recommended)
}

// Script Access - Simple and clean
script: async (ctx) => {
  const {
    apiEndpoint,        // ✅ Direct access - no brackets needed
    retryCount,         // ✅ Direct access - no brackets needed
    sslVerify,          // ✅ Direct access - no brackets needed
  } = ctx.effect.args
}
```

### Alternative Casing (Requires Bracket Notation)

```ts
// Target Schema - Other casing styles
{
  _id: 'api-endpoint',     // kebab-case
  _id: 'API_KEY',          // UPPER_SNAKE_CASE
  _id: 'ssl.verify',       // dot notation
}

// Script Access - Requires bracket notation
script: async (ctx) => {
  const {
    ['api-endpoint']: apiEndpoint,       // Bracket notation required
    ['API_KEY']: apiKey,                 // Bracket notation required
    ['ssl.verify']: sslVerify,           // Bracket notation required
  } = ctx.effect.args
}
```

### Recommended Patterns

```ts
// Group related arguments using camelCase
const {
  // Connection settings
  apiEndpoint,
  apiKey,
  timeoutSeconds,

  // Request settings
  retryCount,
  sslVerify,

  // Feature flags
  enableLogging,
  debugMode,
} = ctx.effect.args
```

## 📊 Type Handling

### Required vs Optional Behavior

Understanding how METIS handles required and optional arguments is crucial for proper script implementation:

```ts
// Required arguments (required: true)
{
  _id: 'serviceName',
  type: 'string',
  required: true,
  default: 'my service',  // ✅ Allowed - provides fallback value
}
// Result: Always present in ctx.effect.args

// Optional arguments (required: false)
{
  _id: 'description',
  type: 'string',
  required: false,
  // default: 'No description',  // ❌ Not allowed for optional arguments
}
// Result: Only present in ctx.effect.args if user provided a value
```

**Key Rules:**

- **Required arguments** (`required: true`) can have `default` values
- **Optional arguments** (`required: false`) cannot have `default` values
- **Boolean exception**: Boolean arguments don't use `required` (always implicitly true) and can have `default: true`
- **Optional arguments** are excluded from `ctx.effect.args` if no value is provided
- **Required arguments** are always present in `ctx.effect.args`

### String Arguments

```ts
// Target Schema - Required
{
  _id: 'hostname',
  type: 'string',
  required: true,
}

// Script Access
const { hostname } = ctx.effect.args
// hostname: string (always present if required: true)

// Target Schema - Required with default
{
  _id: 'protocol',
  type: 'string',
  required: true,
  default: 'https',
}

// Script Access
const { protocol } = ctx.effect.args
// protocol: string (always present, uses default if not provided)

// Target Schema - Optional
{
  _id: 'description',
  type: 'string',
  required: false,
  // default: 'No description',  // ❌ Not allowed for optional arguments
}

// Script Access
const { description } = ctx.effect.args
// description: string | undefined (only present if user provided a value)

const displayDescription = description || 'No description provided'
```

### Number Arguments

```ts
// Target Schema - Required with default
{
  _id: 'port',
  type: 'number',
  required: true,
  default: 8080,
}

// Script Access
const { port } = ctx.effect.args
// port: number (always present, uses default if not provided)

// Target Schema - Optional (no default allowed)
{
  _id: 'maxRetries',
  type: 'number',
  required: false,
  // default: 3,  // ❌ Not allowed for optional arguments
}

// Script Access
const { maxRetries } = ctx.effect.args
// maxRetries: number | undefined (only present if user provided a value)

if (maxRetries !== undefined) {
  ctx.sendOutput(`Using ${maxRetries} max retries`)
} else {
  ctx.sendOutput('No retry limit specified')
}
```

### Boolean Arguments

**Simple Rules**:

- Don't use `required` property (ignored)
- Always present in `ctx.effect.args` (never undefined)
- `default` can only be `true` (omit for false default)

```ts
// Target Schema Examples
{
  _id: 'sslEnabled',
  type: 'boolean',
  default: true,  // ✅ Will be checked by default
}

{
  _id: 'debugMode',
  type: 'boolean',
  // No default = false by default
}

// Script Access - always safe to use directly
const { sslEnabled, debugMode } = ctx.effect.args

if (sslEnabled) {
  ctx.sendOutput('SSL is enabled')
}

if (debugMode) {
  ctx.sendOutput('Debug mode is on')
}
```

### Dropdown Arguments

```ts
// Target Schema - Required with default
{
  _id: 'environment',
  type: 'dropdown',
  required: true,
  default: { _id: 'dev', name: 'Development', value: 'development' },
  options: [
    { _id: 'dev', name: 'Development', value: 'development' },
    { _id: 'prod', name: 'Production', value: 'production' },
  ],
}

// Script Access
const { environment } = ctx.effect.args
// environment: string (always present, uses default value if not selected)
// In this case: 'development' or 'production'

// Target Schema - Optional
{
  _id: 'region',
  type: 'dropdown',
  required: false,
  // default: { _id: 'us-east', name: 'US East', value: 'us-east-1' },  // ❌ Not allowed
  options: [
    { _id: 'us-east', name: 'US East', value: 'us-east-1' },
    { _id: 'eu-west', name: 'EU West', value: 'eu-west-1' },
  ],
}

// Script Access
const { region } = ctx.effect.args
// region: string | undefined (only present if user selected a value)

if (region) {
  ctx.sendOutput(`Deploying to region: ${region}`)
} else {
  ctx.sendOutput('No specific region selected')
}
```

### Large String Arguments

```ts
// Target Schema
{
  _id: 'configYaml',
  type: 'large-string',
  required: true,
}

// Script Access
const { configYaml } = ctx.effect.args
// configYaml: string (multi-line text content)

// Common pattern: parse structured content
try {
  const config = JSON.parse(configYaml)
  // Use parsed config
} catch (error) {
  ctx.sendOutput(`Invalid JSON in config: ${error.message}`)
  return
}
```

## 🔗 Dependency Arguments

Arguments with dependencies follow the same required/optional rules and are only included in the effect when their conditions are met:

```ts
// Target Schema
{
  _id: 'authMethod',
  type: 'dropdown',
  required: true,
  default: { _id: 'none', name: 'None', value: 'none' },
  options: [
    { _id: 'none', name: 'None', value: 'none' },
    { _id: 'token', name: 'Token', value: 'token' },
  ],
},
{
  _id: 'apiToken',
  type: 'string',
  required: true,  // Required when dependency condition is met
  dependencies: [TargetDependency.EQUALS('authMethod', 'token')],
},
{
  _id: 'tokenExpiry',
  type: 'number',
  required: false,  // Optional when dependency condition is met
  dependencies: [TargetDependency.EQUALS('authMethod', 'token')],
}

// Script Access
const {
  authMethod,
  apiToken,
  tokenExpiry,
} = ctx.effect.args

if (authMethod === 'token') {
  // apiToken will always be present here (required dependency)
  headers['Authorization'] = `Bearer ${apiToken}`

  // tokenExpiry may or may not be present (optional dependency)
  if (tokenExpiry !== undefined) {
    ctx.sendOutput(`Token expires in ${tokenExpiry} seconds`)
  }
} else {
  // Both apiToken and tokenExpiry will be undefined
  ctx.sendOutput('No authentication required')
}

// Safe access pattern for any dependency argument
const apiToken = ctx.effect.args.apiToken
if (apiToken) {
  headers['Authorization'] = `Bearer ${apiToken}`
}
```

## ⚙️ Mission Component Arguments

Mission component arguments allow targeting forces, nodes, actions, and files within a mission. Each type provides different metadata structures in the effect arguments.

### Force Arguments

```ts
// Target Schema
{
  _id: 'targetForce',
  type: 'force',
  required: true,
}

// Script Access
const args = ctx.effect.args
const { forceKey, forceName } = args.targetForce as TForceMetadata
// TForceMetadata: { forceKey: '...', forceName: '...' }

ctx.sendOutput(`Targeting force: ${forceName}`)
// Access force properties like forceKey, etc.
```

### Node Arguments

```ts
// Target Schema
{
  _id: 'targetNode',
  type: 'node',
  required: true,
}

// Script Access
const args = ctx.effect.args
const { forceKey, forceName, nodeKey, nodeName } = args.targetNode as TNodeMetadata
// TNodeMetadata: {
// forceKey: '...',
// forceName: '...',
// nodeKey: '...',
// nodeName: '...'
// }

ctx.sendOutput(`Targeting node: ${nodeName}`)
ctx.blockNode({ forceKey, nodeKey })
```

### Action Arguments

```ts
// Target Schema
{
  _id: 'sourceAction',
  type: 'action',
  required: true,
}

// Script Access
const args = ctx.effect.args
const { forceKey, forceName, nodeKey, nodeName, actionKey, actionName } = args.sourceAction as TActionMetadata
// TActionMetadata: {
// forceKey: '...',
// forceName: '...',
// nodeKey: '...',
// nodeName: '...',
// actionKey: '...',
// actionName: '...'
// }

ctx.sendOutput(`Modifying action: ${actionName}`)
ctx.modifySuccessChance(25, { forceKey, nodeKey, actionKey })
```

### File Arguments

```ts
// Target Schema
{
  _id: 'configFile',
  type: 'file',
  required: true,
}

// Script Access
const args = ctx.effect.args
const { fileId, fileName } = args.configFile as TFileMetadata
// TFileMetadata: { fileId: '...', fileName: '...' }

ctx.sendOutput(`Processing file: ${fileName}`)
```

## ⚠️ Common Pitfalls

### Optional Argument Assumptions

```ts
// ❌ Wrong - assuming optional argument is always present
{
  _id: 'maxRetries',
  type: 'number',
  required: false,  // Optional argument
}

const { maxRetries } = ctx.effect.args
const retries = maxRetries * 2  // ❌ Could be undefined!

// ✅ Correct - check if optional argument exists
const maxRetries = ctx.effect.args.maxRetries
if (maxRetries !== undefined) {
  const retries = maxRetries * 2
} else {
  const retries = 0  // Provide fallback behavior
}
```

### Default Value Misunderstanding

```ts
// ❌ Wrong - trying to set default on optional non-boolean argument
{
  _id: 'description',
  type: 'string',
  required: false,
  default: 'No description',  // ❌ Not allowed for non-boolean types!
}

// ✅ Correct - default only on required arguments (except boolean)
{
  _id: 'description',
  type: 'string',
  required: true,
  default: 'No description',  // ✅ Allowed
}

// ✅ Exception - boolean doesn't use required property, can have default: true
{
  _id: 'enableFeature',
  type: 'boolean',
  // required: false,  // ❌ Not used for boolean arguments
  default: true,  // ✅ Boolean can have default: true (only allowed value)
}

// ✅ Alternative - handle undefined in script for non-boolean types
{
  _id: 'description',
  type: 'string',
  required: false,  // No default property
}
// Script:
const description = ctx.effect.args.description || 'No description'
```

### Non-CamelCase Access Issues

```ts
// ❌ Wrong - syntax error for kebab-case
const serviceName = ctx.effect.args.service - name

// ❌ Wrong - undefined (property doesn't exist for kebab-case)
const serviceName = ctx.effect.args.serviceName // when _id is 'service-name'

// ✅ Correct - bracket notation for non-camelCase
const serviceName = ctx.effect.args['service-name']

// ✅ Best - use camelCase IDs for direct access
// _id: 'serviceName' allows: const { serviceName } = ctx.effect.args
```

### Dependency Argument Assumptions

```ts
// ❌ Wrong - assuming dependent argument always exists
const { apiToken } = ctx.effect.args
headers['Authorization'] = `Bearer ${apiToken}` // Could be undefined!

// ✅ Correct - check if argument exists
const apiToken = ctx.effect.args.apiToken
if (apiToken) {
  headers['Authorization'] = `Bearer ${apiToken}`
}
```

### Type Assumptions

```ts
// ❌ Wrong - assuming number is always valid
const { port } = ctx.effect.args
const url = `http://localhost:${port}` // Could fail if port is 0 or negative

// ✅ Correct - validate before use
const { port } = ctx.effect.args
if (!port || port < 1 || port > 65535) {
  ctx.sendOutput(`❌ Invalid port number: ${port}`)
  return
}
const url = `http://localhost:${port}`
```

## 📖 Related Documentation

### 📋 Essential Guides

- **[Defining Targets](defining-targets.md)** - Target schema creation and structure
- **[Argument Types](argument-types.md)** - Complete argument type reference
- **[Tips & Conventions](tips-and-conventions.md)** - Best practices for naming and structure

### 💡 Examples

- **[Basic Target](../examples/basic-target.md)** - Simple argument usage patterns
- **[Complex Target](../examples/complex-target.md)** - Advanced argument handling

### 🔗 References

- **[Context API Reference](../references/context-api.md)** - Complete context object documentation
- **[Schema Documentation](../references/schemas.md)** - Target and effect type definitions
