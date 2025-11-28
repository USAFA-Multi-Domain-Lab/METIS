# Argument Types Guide

This guide covers all available argument types in METIS target environments, their properties, use cases, and implementation patterns. Use this as a reference when designing arguments for your targets.

## Table of Contents

- [Overview](#overview)
- [Target Type Considerations](#target-type-considerations)
- [Basic Argument Structure](#basic-argument-structure)
- [String Types](#string-types)
- [Selection Types](#selection-types)
- [Numeric Types](#numeric-types)
- [Boolean Types](#boolean-types)
- [Mission Component Types](#mission-component-types)
- [File Types](#file-types)
- [Argument Dependencies](#argument-dependencies)
- [Grouping and Organization](#grouping-and-organization)
- [Validation and Error Handling](#validation-and-error-handling)
- [Real-World Usage Examples](#real-world-usage-examples)
- [Testing Your Arguments](#testing-your-arguments)
- [Migration Considerations](#migration-considerations)
- [Quick Reference](#quick-reference)
- [Related Documentation](#related-documentation)

## Overview

Target arguments define the user interface for your targets in METIS. Each argument type provides different input methods and validation patterns, allowing you to create intuitive and powerful target configurations.

### Available Argument Types

- **String Types**: `string`, `large-string`
- **Selection Types**: `dropdown`
- **Numeric Types**: `number`
- **Boolean Types**: `boolean`
- **Mission Component Types**: `force`, `node`, `action`, `file` _(only needed for internal METIS operations)_

## Basic Argument Structure

Every argument follows this base structure:

```typescript
{
  _id: 'argumentId',           // Unique identifier
  name: 'Display Name',        // User-visible name
  type: 'string',             // Argument type (see types below)
  required: true,             // Whether the argument is required
  groupingId: 'groupName',    // Visual grouping in UI
  default: 'defaultValue',    // Default value (optional)
  tooltipDescription: 'Help text for users',  // Optional tooltip
  dependencies: [],           // Conditional display rules (optional)
}
```

## Target Type Considerations

**External System Targets**: Most targets that integrate with external systems (databases, APIs, file systems) only need basic argument types (string, number, boolean, dropdown, file) to configure their external operations.

> 🔗 **Building external integrations?** See the **[External API Integration Guide](external-api-integration.md)** for complete patterns and examples.

**Internal METIS Targets**: Targets that need to perform actions within METIS itself (modify missions, send output to forces, control nodes) require mission component types (force, node, action) in addition to basic types.

> 📘 **Working with mission components?** The **[Context API Reference](../references/context-api.md)** documents all available methods for mission manipulation.

## String Types

### **string**

Basic text input for short strings.

```typescript
{
  _id: 'hostname',
  name: 'Server Hostname',
  type: 'string',
  required: true,
  groupingId: 'connection',
  default: 'localhost',
  tooltipDescription: 'IP address or hostname of the target server',
}
```

**Best Practices:**

- Provide meaningful default values
- Use validation in your script for format checking
- Keep descriptions concise but helpful

### **large-string**

Multi-line text input for longer content.

```typescript
{
  _id: 'message',
  name: 'Message Content',
  type: 'large-string',
  required: true,
  groupingId: 'communication',
  default: 'Enter your message here...',
  tooltipDescription: 'The message content to send',
}
```

**Best Practices:**

- Use for content longer than a single line
- Provide example content in defaults
- Consider line length limitations in your processing

## Selection Types

### **dropdown**

Single selection from predefined options.

```typescript
{
  _id: 'priority',
  name: 'Priority Level',
  type: 'dropdown',
  required: true,
  groupingId: 'settings',
  default: { _id: 'normal', name: 'Normal Priority', value: 'normal' },
  options: [
    { _id: 'low', name: 'Low Priority', value: 'low' },
    { _id: 'normal', name: 'Normal Priority', value: 'normal' },
    { _id: 'high', name: 'High Priority', value: 'high' },
    { _id: 'urgent', name: 'Urgent', value: 'urgent' },
  ],
}
```

**Option Structure:**

- `_id`: Internal identifier for the option
- `name`: Display name shown to users
- `value`: The actual value passed to your script

**Best Practices:**

- Always provide a sensible default
- Use clear, descriptive names
- Keep option lists manageable (< 10 options typically)
- Consider using dependencies to filter options dynamically

## Numeric Types

### **number**

Numeric input with optional validation.

```typescript
{
  _id: 'timeout',
  name: 'Timeout',
  type: 'number',
  required: false,
  groupingId: 'advanced',
  default: 30,
  tooltipDescription: 'Request timeout in seconds (1-300)',
  min: 1,
  max: 300,
  unit: 'seconds',
  integersOnly: true
}
```

**Best Practices:**

- Provide reasonable defaults
- Document valid ranges in tooltips
- Validate ranges in your script logic

## Boolean Types

### **boolean**

Checkbox for true/false options.

```typescript
{
  _id: 'encryptionEnabled',
  name: 'Enable Encryption',
  type: 'boolean',
  required: true,  // optional
  groupingId: 'security',
  tooltipDescription: 'Encrypt data during transmission',
}
```

**Important Notes:**

- No `default` property needed: unchecked = false, checked = true
- Use positive phrasing ("Enable X" not "Disable X")

**Best Practices:**

- Use clear, positive language
- Group related boolean options together
- Consider dependencies to show/hide related options

## Mission Component Types

These special types are used **only when your target needs to perform actions within METIS itself** (such as modifying forces, nodes, or actions). If your target only affects external systems, you don't need these types.

### **force**

Used when your target needs to send output or perform actions within a specific METIS force.

```typescript
{
  _id: 'forceMetadata',
  name: 'Target Force',
  type: 'force',
  required: true,
  groupingId: 'target',
}
```

Most targets that interact with users need this for `context.sendOutput()` to display messages in the correct force's interface.

### **node**

Used when your target needs to manipulate METIS nodes (opening, closing, status changes).

```typescript
{
  _id: 'nodeMetadata',
  name: 'Target Node',
  type: 'node',
  required: true,
  groupingId: 'target',
}
```

### **action**

Used when your target needs to manipulate specific actions within METIS nodes (process time, success chance, etc.).

```typescript
{
  _id: 'actionMetadata',
  name: 'Target Action',
  type: 'action',
  required: true,
  groupingId: 'target',
}
```

**When to use these types:**

- ✅ Internal METIS operations (node control, process time modification, output messages)
- ❌ External system integrations (database updates, API calls, etc.)

## File Types

### **file**

File picker for file uploads.

```typescript
{
  _id: 'configFile',
  name: 'Configuration File',
  type: 'file',
  required: false,
  groupingId: 'configuration',
  tooltipDescription: 'Optional configuration file to upload',
}
```

**Best Practices:**

- Consider file size limitations
- Validate file types in your script
- Provide clear guidance on expected formats

## Argument Dependencies

Dependencies control when arguments are visible based on other argument values.

### **Basic Dependency Types**

```typescript
// Show when another argument equals a specific value
dependencies: [TargetDependency.EQUALS('operation', 'upload')]

// Show when argument equals one of several values
dependencies: [TargetDependency.EQUALS_SOME('priority', ['high', 'urgent'])]

// Show when boolean argument is checked
dependencies: [TargetDependency.TRUTHY('encryptionEnabled')]

// Show when argument does NOT equal a value
dependencies: [TargetDependency.NOT_EQUALS('environment', 'development')]
```

### **Dependency Best Practices**

1. **Keep chains simple** - Avoid deeply nested dependencies
2. **Use positive logic** - Prefer EQUALS over NOT_EQUALS when possible
3. **Group dependent arguments** - Put related args in the same grouping
4. **Test thoroughly** - Verify all dependency combinations work correctly

## Grouping and Organization

### **Grouping Strategy**

Use `groupingId` to organize related arguments:

```typescript
// Basic groupings
groupingId: 'target' // Force selection
groupingId: 'connection' // Host, port, credentials
groupingId: 'operation' // What action to perform
groupingId: 'security' // Encryption, authentication
groupingId: 'advanced' // Optional/expert settings
```

### **Argument Order Best Practices**

1. **Force first** - Always start with forceMetadata
2. **Required next** - Required arguments before optional ones
3. **Logical flow** - Follow the user's mental model
4. **Dependencies last** - Dependent arguments after their parents

```typescript
args: [
  // 1. Always first
  { _id: 'forceMetadata', type: 'force', required: true },

  // 2. Core required arguments
  { _id: 'operation', type: 'dropdown', required: true },
  { _id: 'targetPath', type: 'string', required: true },

  // 3. Optional arguments
  { _id: 'timeout', type: 'number', required: false },

  // 4. Dependent arguments
  { _id: 'encryptionLevel', dependencies: [...], required: false },
]
```

## Validation and Error Handling

### **Client-Side Validation**

METIS provides basic validation (required fields, type checking), but custom validation should be done in your script.

### **Script-Side Validation**

```typescript
script: async (context) => {
  const { timeout, priority } = context.effect.args

  // Validate ranges
  if (timeout && (timeout < 1 || timeout > 300)) {
    throw new Error('Timeout must be between 1 and 300 seconds')
  }

  // Validate combinations
  if (priority === 'urgent' && !context.effect.args.encryptionLevel) {
    throw new Error('Urgent messages require encryption level selection')
  }

  // Continue with script logic...
}
```

## Real-World Usage Examples

### **Multi-Level Targeting Example**

```typescript
// Process Time Modifier target (from METIS core)
args: [
  {
    _id: 'actionMetadata',
    name: 'Target Action',
    type: 'action',
    required: true,
    groupingId: 'target',
  },
  {
    _id: 'processTimeHours',
    name: 'Hours',
    type: 'number',
    required: false,
    groupingId: 'processTime',
    min: 0,
    max: 23,
    integersOnly: true,
    default: 0,
    dependencies: [TargetDependency.ACTION('actionMetadata')],
  },
  {
    _id: 'processTimeMinutes',
    name: 'Minutes',
    type: 'number',
    required: false,
    groupingId: 'processTime',
    min: 0,
    max: 59,
    integersOnly: true,
    default: 0,
    dependencies: [TargetDependency.ACTION('actionMetadata')],
  },
]
```

## Testing Your Arguments

### **Manual Testing Checklist**

1. **Dependency behavior** - Verify arguments show/hide correctly
2. **Default values** - Check all defaults are sensible
3. **Required validation** - Test required field enforcement
4. **Edge cases** - Try empty values, special characters
5. **User experience** - Is the flow intuitive?

### **Common Issues**

- **Circular dependencies** - Argument A depends on B which depends on A
- **Too many dependencies** - Overly complex conditional logic
- **Poor grouping** - Related arguments in different groups
- **Unclear names** - Ambiguous or technical argument names

## Migration Considerations

Argument updates that require migration:

- Changing the argument's ID
- Changing the argument's type
- Changing the argument's default value
- Changing the argument's required status

See the [Migrations Guide](migrations.md) for detailed migration patterns.

## Quick Reference

### **Common Argument Templates**

```typescript
// Basic string input
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'string',
  required: true,
  groupingId: 'group',
  default: 'defaultValue',
  tooltipDescription: 'Help text',
}

// Dropdown with options
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'dropdown',
  required: true,
  groupingId: 'group',
  default: { _id: 'id', name: 'Name', value: 'value' },
  options: [/* array of options */],
}

// Number with constraints
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'number',
  required: false,
  groupingId: 'group',
  default: 30,
  min: 1,
  max: 300,
  unit: 'seconds',
  integersOnly: true,
  tooltipDescription: 'Help text',
}

// Optional boolean
{
  _id: 'fieldName',
  name: 'Enable Feature',
  type: 'boolean',
  groupingId: 'group',
  tooltipDescription: 'Help text',
}

// Force targeting
{
  _id: 'forceMetadata',
  name: 'Target Force',
  type: 'force',
  required: true,
  groupingId: 'target',
}

// Node targeting
{
  _id: 'nodeMetadata',
  name: 'Target Node',
  type: 'node',
  required: true,
  groupingId: 'target',
}

// Action targeting
{
  _id: 'actionMetadata',
  name: 'Target Action',
  type: 'action',
  required: true,
  groupingId: 'target',
}

// Dependent argument
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'string',
  required: false,
  groupingId: 'group',
  dependencies: [TargetDependency.EQUALS('parentField', 'value')],
  tooltipDescription: 'Help text',
}
```

## Related Documentation

- **[Basic Target Example](../examples/basic-target.md)** - See arguments in action
- **[Complex Target Example](../examples/complex-target.md)** - Advanced dependency patterns
- **[Defining Targets Guide](defining-targets.md)** - Target development best practices
