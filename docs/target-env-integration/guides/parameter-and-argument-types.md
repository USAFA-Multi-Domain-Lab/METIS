# Parameter and Argument Types

A target declares **parameters**, and METIS renders an input for each one in the target-effect interface. The values a user enters are the **arguments**, and they are what your script receives. This page documents every parameter type, the properties it accepts, and the argument value it produces.

## Table of Contents

- [Overview](#overview)
  - [Shared Properties](#shared-properties)
  - [Required Parameters and Defaults](#required-parameters-and-defaults)
  - [Mistyped Properties Are Ignored](#mistyped-properties-are-ignored)
- [Reading Arguments in a Script](#reading-arguments-in-a-script)
- [string](#string)
- [large-string](#large-string)
- [number](#number)
- [boolean](#boolean)
- [dropdown](#dropdown)
- [mission-component](#mission-component)
  - [Component Types](#component-types)
  - [Selection Behavior](#selection-behavior)
- [Parameter Dependencies](#parameter-dependencies)
  - [Dependency Conditions](#dependency-conditions)
  - [What a Dependency Compares](#what-a-dependency-compares)
  - [Dependencies Are Not Checked at Compile Time](#dependencies-are-not-checked-at-compile-time)
- [Grouping and Display Order](#grouping-and-display-order)
- [Validation](#validation)
- [Example: Process Time Modifier](#example-process-time-modifier)
- [Migration Considerations](#migration-considerations)
- [Quick Reference](#quick-reference)
- [Related Documentation](#related-documentation)

## Overview

There are six parameter types. Every one of them is declared in the `parameters` array of `TargetSchema.create`.

| `type`              | Renders as                            | Argument value your script receives                   |
| ------------------- | ------------------------------------- | ----------------------------------------------------- |
| `string`            | Single-line text input                | `string`                                              |
| `large-string`      | Multi-line text area                  | `string`                                              |
| `number`            | Numeric input                         | `number`, or `number \| null` when optional           |
| `boolean`           | Toggle switch                         | `boolean`                                             |
| `dropdown`          | Dropdown of predefined options        | The selected option's `value`                         |
| `mission-component` | Multi-select over the mission outline | An array of the selected mission components           |

> **Note:** `mission-component` replaces the separate `force`, `node`, `action`, and `file` types. One parameter now covers all of them through its `validComponentTypes` list.

### Shared Properties

Every parameter type accepts these properties.

| Property             | Type                 | Required | Description                                                           |
| -------------------- | -------------------- | -------- | --------------------------------------------------------------------- |
| `_id`                | `string`             | Yes      | Identifies the parameter. Your script reads its argument by this key.  |
| `name`               | `string`             | Yes      | The label shown above the input.                                      |
| `type`               | see table above      | Yes      | Which input to render.                                                |
| `groupingId`         | `string`             | No       | Renders the parameter in a group with others sharing the same value.   |
| `tooltipDescription` | `string`             | No       | Help text shown in a hover tooltip beside the label.                   |
| `dependencies`       | `TargetDependency[]` | No       | Conditions that must pass for the parameter to be shown.              |

Help text is `tooltipDescription`. There is no `description` property on a parameter — see [Mistyped Properties Are Ignored](#mistyped-properties-are-ignored).

### Required Parameters and Defaults

`required` marks an input the user must fill in. Where it applies, marking a parameter required also makes `default` mandatory, because METIS falls back to the default whenever the stored value is still empty.

| `type`              | Uses `required`? | `default`                                                |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `string`            | Yes              | Required when `required: true` — a `string`               |
| `large-string`      | Yes              | Required when `required: true` — a `string`               |
| `number`            | Yes              | Required when `required: true` — a `number`               |
| `dropdown`          | Yes              | Required when `required: true` — an option's `_id`        |
| `boolean`           | No               | Optional — a `boolean`, and `false` when omitted          |
| `mission-component` | No               | Not used — an unfilled selection is an empty array         |

Omitting a `default` on a required `string`, `large-string`, `number`, or `dropdown` is a compile error.

The reverse is not. **A `default` on an optional parameter compiles and is then ignored**, so an optional string declaring `default: 'No description'` still arrives as `''`. Defaults are only applied to required parameters. The same goes for the properties marked "No" and "Not used" above — writing them is accepted and has no effect, for the reason in the next section.

### Mistyped Properties Are Ignored

TypeScript infers the `parameters` array before checking it against a constraint, and a constraint check does not report excess properties. A misspelled or invented property therefore **compiles without complaint** and is then dropped when the parameter is serialized.

```typescript
{
  _id: 'message',
  name: 'Message',
  type: 'string',
  required: true,
  default: '',
  description: 'Help text for the user.', // Compiles, but silently discarded.
}
```

The ones that come up most often:

| Written                                    | What happens                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `description` instead of `tooltipDescription` | No tooltip appears                                                 |
| `required` on a `boolean`                  | Ignored — a toggle always holds a value                             |
| `required` or `default` on a `mission-component` | Ignored — the selection starts empty either way                |
| `default` on any optional parameter        | Ignored — defaults are only applied to required parameters          |
| A misspelled `groupingId`                  | The parameter renders in a group of its own                        |

In every case the parameter renders without the behavior you asked for and nothing reports an error, so check the spelling against the tables on this page when a property appears to have no effect.

There is one way a misspelling does surface. An extra property is never itself the error, but **omitting a required one is** — and the message often names the extra property rather than the missing one. Writing `dropdownItems` in place of `options` on a dropdown reports:

```text
Object literal may only specify known properties, and 'dropdownItems' does not
exist in type 'TBaseTargetParameterJson & TDropdownTargetParameterRequiredJson ...'
```

The real complaint is the absent `options`. Read an error naming a property you just wrote as a hint that a required one is missing.

## Reading Arguments in a Script

The script's second parameter is an object holding one entry per declared parameter, keyed by `_id`. Destructure the arguments you need.

```typescript
const SendMessage = TargetSchema.create({
  _id: 'send-message',
  name: 'Send Message',
  description: 'Send a message to the selected forces.',
  script: async (context, { recipients, message, priority }) => {
    context.sendOutput(`[${priority}] ${message}`, recipients)
  },
  parameters: [
    {
      _id: 'recipients',
      name: 'Recipients',
      type: 'mission-component',
      groupingId: 'message',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'message',
      name: 'Message',
      type: 'large-string',
      required: true,
      groupingId: 'message',
      default: 'Enter your message.',
    },
    {
      _id: 'priority',
      name: 'Priority',
      type: 'dropdown',
      required: true,
      groupingId: 'message',
      default: 'normal',
      options: [
        { _id: 'normal', name: 'Normal', value: 'normal' },
        { _id: 'high', name: 'High', value: 'high' },
      ],
    },
  ],
})

export default SendMessage
```

Each argument's type is inferred from the parameter that produced it, so `message` is a `string`, `priority` is `'normal' | 'high'`, and `recipients` is an array of missions and forces.

`context.getArguments` reads the same values by `_id`, which is useful in a helper that receives the context but not the argument object.

```typescript
let message = context.getArguments('message')
let { recipients, priority } = context.getArguments(['recipients', 'priority'])
```

> **Note:** A parameter that declares `dependencies` receives `undefined` whenever those dependencies are not met, and its argument type includes `undefined` to match. See [Parameter Dependencies](#parameter-dependencies).

## string

A single-line text input.

```typescript
{
  _id: 'hostname',
  name: 'Server Hostname',
  type: 'string',
  required: true,
  groupingId: 'connection',
  default: 'localhost',
  tooltipDescription: 'IP address or hostname of the target server.',
}
```

| Property  | Type     | Description                                                              |
| --------- | -------- | ------------------------------------------------------------------------ |
| `pattern` | `RegExp` | A regular expression the entered value must match.                       |
| `title`   | `string` | The warning shown when the value fails `pattern`.                        |

METIS validates a required string against `pattern` and `title` as the user types. A `—` means that condition is not relevant to the outcome.

| `pattern` set | Value passes `pattern` | `title` set | `default` is empty | Field is empty | Result                                                              |
| :-----------: | :--------------------: | :---------: | :----------------: | :------------: | ------------------------------------------------------------------- |
|       ✓       |           ✓            |      —      |         —          |       —        | No warning                                                          |
|       ✓       |           ✗            |      ✓      |         —          |       —        | Warning: your `title` string                                        |
|       ✓       |           ✗            |      ✗      |         —          |       —        | Warning: `"The value does not match the required format."`          |
|       ✗       |           —            |      —      |         ✗          |       ✓        | No warning — the field repopulates to `default` when the user leaves it |
|       ✗       |           —            |      —      |         ✓          |       ✓        | Warning: `"This field cannot be left empty. Please enter a value."` |

A value of only whitespace counts as empty. Optional strings are not validated when left blank.

> **Important:** If you set `required: true` with an empty `default` and no `pattern`, the user gets the generic fallback warning. Add a `pattern` that rejects empty input together with a `title` to explain the requirement.

```typescript
// Produces the generic fallback warning when left empty.
{
  _id: 'targetHost',
  name: 'Target Host',
  type: 'string',
  required: true,
  default: '',
}

// Produces a descriptive warning when left empty.
{
  _id: 'targetHost',
  name: 'Target Host',
  type: 'string',
  required: true,
  default: '',
  pattern: /\S+/,
  title: 'Target Host is required and cannot be blank.',
}
```

A `pattern` mismatch also raises an issue on the effect, so the mission author sees it outside the input as well.

## large-string

A multi-line text area, for content that runs longer than a single line. It takes the same properties as `string` apart from `pattern` and `title`, which it does not support.

```typescript
{
  _id: 'briefing',
  name: 'Briefing Text',
  type: 'large-string',
  required: true,
  groupingId: 'communication',
  default: 'Enter the briefing.',
  tooltipDescription: 'Shown to the force when the effect runs.',
}
```

## number

A numeric input.

```typescript
{
  _id: 'timeout',
  name: 'Timeout',
  type: 'number',
  required: false,
  groupingId: 'advanced',
  min: 1,
  max: 300,
  unit: 'seconds',
  integersOnly: true,
  tooltipDescription: 'How long to wait for a response.',
}
```

| Property       | Type      | Description                                                     |
| -------------- | --------- | --------------------------------------------------------------- |
| `min`          | `number`  | Lowest accepted value. The field clamps up to it when the user leaves the input. |
| `max`          | `number`  | Highest accepted value. The field clamps down to it the same way. |
| `unit`         | `string`  | A unit displayed alongside the input.                            |
| `integersOnly` | `boolean` | Rejects decimal input as it is typed.                            |

A required number always reaches your script as a `number`. An optional number reaches it as `number | null`, since the user can leave the field blank.

```typescript
script: async (context, { timeout }) => {
  let seconds = timeout ?? 30
}
```

## boolean

A toggle switch. It has no `required` property, because a toggle always holds a value.

```typescript
{
  _id: 'encryptionEnabled',
  name: 'Enable Encryption',
  type: 'boolean',
  default: false,
  groupingId: 'security',
  tooltipDescription: 'Encrypt data during transmission.',
}
```

`default` sets the toggle's starting position and is optional; leaving it out starts the toggle off. Phrase the `name` positively — "Enable Encryption" rather than "Disable Encryption" — so that the toggle being on matches the label being true.

## dropdown

A single selection from a fixed list. `options` is required whether or not the parameter is.

```typescript
{
  _id: 'priority',
  name: 'Priority Level',
  type: 'dropdown',
  required: true,
  groupingId: 'settings',
  default: 'normal',
  options: [
    { _id: 'low', name: 'Low Priority', value: 'low' },
    { _id: 'normal', name: 'Normal Priority', value: 'normal' },
    { _id: 'high', name: 'High Priority', value: 'high' },
    {
      _id: 'urgent',
      name: 'Urgent',
      value: 'urgent',
      tooltipDescription: 'Bypasses the delivery queue.',
    },
  ],
}
```

Each option holds:

| Property             | Type     | Required | Description                                        |
| -------------------- | -------- | -------- | -------------------------------------------------- |
| `_id`                | `string` | Yes      | Identifies the option within the parameter.        |
| `name`               | `string` | Yes      | The text shown in the list.                        |
| `value`              | varies   | Yes      | What your script receives when the option is chosen. |
| `tooltipDescription` | `string` | No       | Help text for that one option.                     |

An option's `value` may be a `string`, `number`, `boolean`, or object. An optional dropdown may also use `null` or `undefined`.

**`default` names an option's `_id`, not its value.** This one is checked at compile time: a `default` that matches no declared option's `_id` fails to compile. A dependency, by contrast, compares the option's `value`, so the two properties refer to different halves of the same option.

```typescript
default: 'normal',                                  // The option's `_id`.
dependencies: [TargetDependency.EQUALS('priority', 'high')],  // The option's `value`.
```

The argument your script receives is the union of the declared option values, so a `switch` over it is exhaustively checked.

```typescript
script: async (context, { priority }) => {
  switch (priority) {
    case 'low':
    case 'normal':
      break
    case 'high':
    case 'urgent':
      break
  }
}
```

## mission-component

A multi-select over the mission outline, used whenever a target acts on something inside the mission — a force to send output to, the actions to retime, the files to grant access to.

```typescript
{
  _id: 'applyTo',
  name: 'Apply To',
  type: 'mission-component',
  groupingId: 'target',
  validComponentTypes: ['mission', 'force', 'node', 'action'],
  tooltipDescription: 'The components this effect will be applied to.',
}
```

### Component Types

`validComponentTypes` lists what the user may select.

| Value          | Selects                            |
| -------------- | ---------------------------------- |
| `mission`      | The mission itself                 |
| `force`        | A force                            |
| `node`         | A node                             |
| `action`       | An action on a node                |
| `missionFile`  | A mission file                     |
| `resource`     | A mission resource                 |
| `resourcePool` | A force's resource pool            |
| `any`          | Every type above                   |

The default is `['any']`. Listing specific types narrows the argument to match, so a parameter declaring `['node', 'action']` hands your script an array of nodes and actions rather than the full union, and `componentType` on each entry narrows it further.

### Selection Behavior

- The value is always an array, and it is empty until the user selects something. Guard for the empty case.
- Components that cannot be selected are still shown when they contain something that can. A parameter limited to `['action']` therefore displays forces and nodes so the user can navigate to the actions inside them.
- A selection is stored as an ID path plus the component's last known name. If the component is deleted from the mission, it drops out of the selection the next time the effect loads.
- Most context methods fan out across a selection, so passing a force to a method that acts on nodes reaches every node in that force. See the [Context API Reference](../references/context-api.md) for what each method accepts.

## Parameter Dependencies

A dependency hides a parameter until another parameter's argument satisfies a condition. Build them with the `TargetDependency` factories.

```typescript
{
  _id: 'encryptionLevel',
  name: 'Encryption Level',
  type: 'dropdown',
  required: true,
  groupingId: 'security',
  default: 'aes256',
  dependencies: [TargetDependency.TRUTHY('encryptionEnabled')],
  options: [
    { _id: 'aes128', name: 'AES-128', value: 'aes128' },
    { _id: 'aes256', name: 'AES-256', value: 'aes256' },
  ],
}
```

A parameter with dependencies reaches your script as `undefined` whenever they are not met, and its argument type includes `undefined` to force you to handle it.

```typescript
script: async (context, { encryptionEnabled, encryptionLevel }) => {
  if (encryptionEnabled && encryptionLevel) {
    // Only reachable when the dependency is met.
  }
}
```

### Dependency Conditions

| Factory                            | Shows the parameter when the other argument is                          |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `TRUTHY(id)`                       | Truthy — any non-empty string, non-zero number, or `true`                |
| `FALSEY(id)`                       | Falsy — `''`, `0`, `false`, `null`, or `undefined`                       |
| `EQUALS(id, expected)`             | Strictly equal to `expected`                                            |
| `EQUALS_SOME(id, [...expected])`   | Strictly equal to one of the listed values                              |
| `NOT_EQUALS(id, unexpected)`       | Not strictly equal to `unexpected`                                      |
| `NOT_EMPTY(id)`                    | A non-empty array, or a string holding at least one non-whitespace character |
| `REGEX(id, /pattern/)`             | A string matching the regular expression                                |

An expected value may be a `string`, `number`, `boolean`, or `RegExp`.

### What a Dependency Compares

- It compares the **argument's stored value**. For a dropdown that is the selected option's `value`; for a `mission-component` it is the array of selections, which is what makes `NOT_EMPTY` the condition to use when a parameter should appear only once something is selected.
- Listing several dependencies requires **all** of them to pass.
- Dependencies chain. A parameter whose dependency points at a parameter that is itself hidden stays hidden too.
- A circular chain is detected rather than followed: METIS logs a warning naming the parameter and treats the dependencies as unmet.

### Dependencies Are Not Checked at Compile Time

Neither the parameter `_id` a dependency names nor the value it compares against is verified against your parameter list. Both of these compile without complaint:

```typescript
TargetDependency.EQUALS('noSuchParameter', 'token')
TargetDependency.EQUALS_SOME('priority', ['high', 'nonexistent-value'])
```

The result is a parameter that silently never appears. When a dependent parameter fails to show up, check the spelling of the `_id` and confirm that the value you are comparing is an option's `value`.

## Grouping and Display Order

Parameters sharing a `groupingId` render together as one block, separated from the next block by a divider. A parameter without a `groupingId` renders on its own.

```typescript
groupingId: 'target' // Component selection
groupingId: 'connection' // Host, port, credentials
groupingId: 'operation' // What to perform
groupingId: 'security' // Encryption, authentication
groupingId: 'advanced' // Optional or expert settings
```

- **Declaration order sets display order.** The inputs follow the order of your `parameters` array, and reordering that array reorders the interface for existing effects as well as new ones.
- **A group appears where its first parameter is declared.** Parameters that share a `groupingId` but are declared apart are still pulled into that one group, so keeping them adjacent in the array keeps the array readable.
- **A group disappears when every parameter in it is hidden.** Putting a dependent parameter in a group of its own therefore removes the whole block when its dependency is unmet, rather than leaving an empty divider behind.

A workable order is the component selection first, then the required inputs, then optional ones, with dependent parameters after the parameter they react to.

## Validation

METIS validates what it can from the parameter declaration:

- A required `string` is checked against `pattern`, and an empty required field warns as described under [string](#string).
- A `number` clamps to `min` and `max` when the user leaves the field, and rejects decimals when `integersOnly` is set.
- A required `string`, `large-string`, `number`, or `dropdown` left unset falls back to its `default` when the effect loads.
- A stored dropdown value matching none of the current options raises an issue on the effect naming the parameter.

None of that covers a rule that spans two parameters, and a value saved before you tightened a constraint is not re-checked, so validate in the script as well.

```typescript
script: async (context, { timeout, priority, encryptionLevel }) => {
  if (timeout !== null && (timeout < 1 || timeout > 300)) {
    throw new Error('Timeout must be between 1 and 300 seconds.')
  }

  if (priority === 'urgent' && !encryptionLevel) {
    throw new Error('Urgent messages require an encryption level.')
  }
}
```

A thrown error stops the effect and surfaces the message, so state what the user needs to change.

## Example: Process Time Modifier

The Process Time Modifier in the METIS target environment shows the pieces working together — one `mission-component` parameter fanning out across whatever the user selected, and three grouped numbers that combine into a single offset.

```typescript
const ProcessTimeMod = TargetSchema.create({
  _id: 'process-time-mod',
  name: 'Process Time Modifier',
  description: 'Offset the process time of the selected actions.',
  script: async (
    context,
    { applyTo, processTimeHours, processTimeMinutes, processTimeSeconds },
  ) => {
    let processTime: number = 0

    processTime += processTimeHours * 3600 * 1000
    processTime += processTimeMinutes * 60 * 1000
    processTime += processTimeSeconds * 1000

    if (Math.abs(processTime) > 0) {
      context.modifyProcessTime(applyTo, processTime)
    }
  },
  parameters: [
    {
      _id: 'applyTo',
      name: 'Apply To',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force', 'node', 'action'],
      tooltipDescription:
        'Selecting an action applies the modifier to that action. ' +
        'Selecting a mission, force, or node applies it to every action within.',
    },
    {
      _id: 'processTimeHours',
      name: 'Hour(s)',
      type: 'number',
      required: true,
      groupingId: 'processTime',
      default: 0,
      min: -1,
      max: 1,
      integersOnly: true,
    },
    {
      _id: 'processTimeMinutes',
      name: 'Minute(s)',
      type: 'number',
      required: true,
      groupingId: 'processTime',
      default: 0,
      min: -59,
      max: 59,
      integersOnly: true,
    },
    {
      _id: 'processTimeSeconds',
      name: 'Second(s)',
      type: 'number',
      required: true,
      groupingId: 'processTime',
      default: 0,
      min: -59,
      max: 59,
      integersOnly: true,
    },
  ],
})

export default ProcessTimeMod
```

Selecting a node applies the offset to every action inside it, which is what the four component types buy: the user decides how broadly the modifier lands, and the script does not change.

## Migration Considerations

METIS reconciles an effect's stored arguments against the target's current parameters every time the effect loads. A parameter you add, retype, or give a new `default` picks up a fresh argument at that default with no migration involved.

**Renaming a parameter's `_id` is the change that needs a migration.** Without one, the old argument is orphaned and the renamed parameter starts empty, discarding whatever the user had entered.

```typescript
migrations.register('2.0.0', (effect) => {
  MigrationToolbox.updateParameterId(effect, 'user', 'username')
})
```

Removing a parameter needs no migration; its stored argument stays in the effect and is ignored. See the [Migrations Guide](migrations.md) for how versions and the registry fit together.

## Quick Reference

```typescript
// Text input
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'string',
  required: true,
  groupingId: 'group',
  default: 'defaultValue',
  tooltipDescription: 'Help text.',
}

// Multi-line text
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'large-string',
  required: true,
  groupingId: 'group',
  default: 'Enter a value.',
}

// Number with constraints
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'number',
  required: false,
  groupingId: 'group',
  min: 1,
  max: 300,
  unit: 'seconds',
  integersOnly: true,
}

// Toggle
{
  _id: 'fieldName',
  name: 'Enable Feature',
  type: 'boolean',
  default: false,
  groupingId: 'group',
}

// Dropdown — `default` is an option's `_id`
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'dropdown',
  required: true,
  groupingId: 'group',
  default: 'first',
  options: [
    { _id: 'first', name: 'First', value: 'first' },
    { _id: 'second', name: 'Second', value: 'second' },
  ],
}

// Component selection
{
  _id: 'applyTo',
  name: 'Apply To',
  type: 'mission-component',
  groupingId: 'target',
  validComponentTypes: ['mission', 'force'],
}

// Dependent parameter
{
  _id: 'fieldName',
  name: 'Display Name',
  type: 'string',
  required: false,
  groupingId: 'group',
  dependencies: [TargetDependency.EQUALS('parentField', 'value')],
}
```

## Related Documentation

- **[Defining Targets](defining-targets.md)** - How parameters fit into a complete target
- **[Context API Reference](../references/context-api.md)** - Reading arguments and acting on selected components
- **[Schemas Reference](../references/schemas.md)** - Every property on `TargetSchema` and `TargetEnvSchema`
- **[Migrations Guide](migrations.md)** - Carrying stored arguments across a parameter rename
- **[Basic Target Example](../examples/basic-target.md)** - Parameters in a working target
- **[Complex Target Example](../examples/complex-target.md)** - Dependencies and grouping at scale
