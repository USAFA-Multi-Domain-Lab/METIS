# Target-Effect Conversion

A target declares parameters; an effect stores the arguments a user filled in against them; your script receives resolved values. This guide covers that pipeline — what gets stored, what your script actually receives, and how METIS reconciles the two when a target changes underneath an existing effect.

For the properties each parameter type accepts, see the [Parameter and Argument Types](parameter-and-argument-types.md) guide.

## Table of Contents

- [Overview](#overview)
- [The Conversion Pipeline](#the-conversion-pipeline)
- [Reading Arguments](#reading-arguments)
  - [Destructuring](#destructuring)
  - [Reading by ID](#reading-by-id)
  - [Non-CamelCase Parameter IDs](#non-camelcase-parameter-ids)
- [What an Unset Argument Holds](#what-an-unset-argument-holds)
- [Dependency-Gated Arguments](#dependency-gated-arguments)
- [Mission Component Arguments](#mission-component-arguments)
- [Reconciliation and Stale Arguments](#reconciliation-and-stale-arguments)
- [Common Pitfalls](#common-pitfalls)
- [Related Documentation](#related-documentation)

## Overview

Three separate shapes are involved, and confusing them is the source of most argument bugs.

| Stage         | What it is                                                    | Where it lives                         |
| ------------- | ------------------------------------------------------------- | -------------------------------------- |
| **Parameter** | Your declaration — an `_id`, a `type`, and its options         | The `parameters` array of your target  |
| **Argument**  | One stored value bound to one parameter, saved with the effect | The mission's saved data               |
| **Value**     | The resolved argument handed to your script                    | The script's second parameter          |

An effect holds exactly one argument per parameter. There is no filtering step that drops arguments a user left alone — every parameter produces one, and an untouched one carries the value described under [What an Unset Argument Holds](#what-an-unset-argument-holds).

## The Conversion Pipeline

```typescript
const DeployService = TargetSchema.create({
  _id: 'deploy-service',
  name: 'Deploy Service',
  description: 'Deploy a service to the selected environment.',
  script: async (context, { notify, serviceName, environment, enableMonitoring }) => {
    context.sendOutput(`Deploying ${serviceName} to ${environment}`, notify)

    if (enableMonitoring) {
      context.sendOutput('Monitoring will be enabled', notify)
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'deployment',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'serviceName',
      name: 'Service Name',
      type: 'string',
      required: true,
      groupingId: 'deployment',
      default: 'api-service',
    },
    {
      _id: 'environment',
      name: 'Target Environment',
      type: 'dropdown',
      required: true,
      groupingId: 'deployment',
      default: 'dev',
      options: [
        { _id: 'dev', name: 'Development', value: 'development' },
        { _id: 'prod', name: 'Production', value: 'production' },
      ],
    },
    {
      _id: 'enableMonitoring',
      name: 'Enable Monitoring',
      type: 'boolean',
      groupingId: 'deployment',
      default: false,
    },
  ],
})

export default DeployService
```

When the effect runs, the values reaching that script are these:

| Value              | Holds                                            |
| ------------------ | ------------------------------------------------ |
| `notify`           | An array of the selected mission or forces        |
| `serviceName`      | `'api-service'`                                   |
| `environment`      | `'production'` — the option's `value`, not its `_id` |
| `enableMonitoring` | `true`                                            |

Each step of the way:

1. **Declaration** — your `parameters` array is registered with the target at server startup.
2. **Authoring** — a mission author adds the effect and fills in the interface. Each input writes to its own argument.
3. **Reconciliation** — whenever the effect loads, its stored arguments are matched against the target's current parameters, and any parameter without one gets a fresh argument at its default.
4. **Resolution** — when the effect runs, each argument is resolved to a value. A parameter whose dependencies are unmet resolves to `undefined`; a `mission-component` resolves to live mission objects.
5. **Execution** — the resolved values are passed to your script as its second parameter.

Note where defaults are applied: at step 3, on load, not at step 5. A required parameter's default is written into the stored argument, so it is a real saved value rather than a fallback computed at run time.

## Reading Arguments

### Destructuring

The script's second parameter is an object keyed by parameter `_id`. Destructure what you need.

```typescript
script: async (context, { serviceName, environment, notify }) => {
  context.sendOutput(`Deploying ${serviceName} to ${environment}`, notify)
}
```

Each value's type is inferred from the parameter that produced it, so there is nothing to cast and no need to assert.

Rename while destructuring when a parameter `_id` collides with something already in scope:

```typescript
script: async (context, { serviceName: service, targetPort: port }) => {
  context.sleep(port)
  void service
}
```

### Reading by ID

`context.getArguments` reads the same values, which is what to use in a helper that receives the context but not the argument object. Pass one `_id` for one value, or an array for an object of them.

```typescript
let serviceName = context.getArguments('serviceName')
let { environment, notify } = context.getArguments(['environment', 'notify'])
```

Both forms are typed against the same parameter list, so an `_id` that does not exist on the target is a compile error.

### Non-CamelCase Parameter IDs

A parameter `_id` may use any casing. Prefer camelCase, since it destructures without ceremony:

```typescript
script: async (context, { apiEndpoint, retryCount, sslVerify }) => {
  void apiEndpoint
  void retryCount
  void sslVerify
}
```

Other casings still work — quote the key and bind it to a name:

```typescript
script: async (
  context,
  { 'api-endpoint': apiEndpoint, 'API_KEY': apiKey },
) => {
  void apiEndpoint
  void apiKey
}
```

`context.getArguments('api-endpoint')` accepts the same keys.

## What an Unset Argument Holds

An argument the user never touched is still present. What it holds depends on the type and on whether the parameter is required.

| `type`              | Required                    | Optional, left untouched |
| ------------------- | --------------------------- | ------------------------ |
| `string`            | The parameter's `default`    | `''`                     |
| `large-string`      | The parameter's `default`    | `''`                     |
| `number`            | The parameter's `default`    | `null`                   |
| `dropdown`          | The default option's `value` | `null`                   |
| `boolean`           | n/a                         | `default`, or `false`    |
| `mission-component` | n/a                         | `[]`                     |

Three consequences worth internalizing:

- **An untouched optional value is not `undefined`.** Checking `!== undefined` on an optional number passes even when the user left it blank, because the value is `null`. Check the type's own empty value instead — `null` for a number, `''` for a string, `[]` for a selection.
- **`undefined` means one thing only:** the parameter's dependencies are not met. See the next section.
- **Defaults apply to required parameters only.** Declaring `default` on an optional parameter compiles and is then ignored, so the argument still arrives as that type's empty value. If you want a fallback on an optional parameter, apply it in the script with `??`.

> **Note:** An optional `dropdown` is the one place where the declared type understates what can arrive. Its argument type is the union of the declared option values, but an unselected optional dropdown holds `null`. Guard for it, or make the dropdown `required` with an explicit "None" option so the empty state is one of your values.

```typescript
script: async (context, { region, maxRetries, notify }) => {
  // An optional dropdown can be null despite its declared type.
  if (region) {
    context.sendOutput(`Deploying to region: ${region}`, notify)
  }

  // An optional number is null when blank, not undefined.
  let retries = maxRetries ?? 0
  void retries
}
```

## Dependency-Gated Arguments

A parameter that declares `dependencies` is hidden while those dependencies are unmet, and its argument resolves to `undefined`. Its type widens to include `undefined` to match, so the compiler requires a guard.

```typescript
const Authenticate = TargetSchema.create({
  _id: 'authenticate',
  name: 'Authenticate',
  description: 'Attach credentials to an outbound request.',
  script: async (context, { notify, authMethod, apiToken, tokenExpiry }) => {
    if (authMethod === 'none') {
      context.sendOutput('No authentication required', notify)
      return
    }

    // Reachable only when the dependency is met, but still guarded — the
    // compiler treats a dependent argument as possibly undefined.
    if (!apiToken) throw new Error('An API token is required for token auth.')

    let headers: Record<string, string> = {
      Authorization: `Bearer ${apiToken}`,
    }
    void headers

    if (tokenExpiry !== undefined && tokenExpiry !== null) {
      context.sendOutput(`Token expires in ${tokenExpiry} seconds`, notify)
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'auth',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'authMethod',
      name: 'Authentication Method',
      type: 'dropdown',
      required: true,
      groupingId: 'auth',
      default: 'none',
      options: [
        { _id: 'none', name: 'None', value: 'none' },
        { _id: 'token', name: 'Token', value: 'token' },
      ],
    },
    {
      _id: 'apiToken',
      name: 'API Token',
      type: 'string',
      required: true,
      groupingId: 'token',
      default: '',
      dependencies: [TargetDependency.EQUALS('authMethod', 'token')],
    },
    {
      _id: 'tokenExpiry',
      name: 'Token Expiry',
      type: 'number',
      required: false,
      groupingId: 'token',
      dependencies: [TargetDependency.EQUALS('authMethod', 'token')],
    },
  ],
})

export default Authenticate
```

`required: true` on a dependent parameter means "the user must fill this in while it is visible." It does not stop the argument from resolving to `undefined` when the parameter is hidden.

A parameter that is both optional and dependent carries **both** empty states, and needs a guard for each. `tokenExpiry` above resolves to `number | null | undefined`: `undefined` while the parameter is hidden, and `null` while it is visible but blank. Checking only for `undefined` leaves `null` behind, and because a template literal accepts `null` the mistake compiles and prints `"Token expires in null seconds"` at run time.

## Mission Component Arguments

A `mission-component` argument resolves to an array of live mission objects, not to metadata. Each entry carries a `componentType` discriminant you can narrow on, and the objects are what the context methods accept directly.

```typescript
const InspectSelection = TargetSchema.create({
  _id: 'inspect-selection',
  name: 'Inspect Selection',
  description: 'Report on whatever the author selected.',
  script: async (context, { notify, selection }) => {
    for (let component of selection) {
      switch (component.componentType) {
        case 'force':
          context.sendOutput(`Force: ${component.name}`, notify)
          break
        case 'node':
          context.sendOutput(`Node: ${component.name}`, notify)
          break
        case 'action':
          context.sendOutput(`Action: ${component.name}`, notify)
          break
      }
    }
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      groupingId: 'inspect',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'selection',
      name: 'Selection',
      type: 'mission-component',
      groupingId: 'inspect',
      validComponentTypes: ['force', 'node', 'action'],
    },
  ],
})

export default InspectSelection
```

Two things follow from the array being live objects:

- **Pass the array straight to a context method.** Most of them fan out, so handing `modifyProcessTime` a force reaches every action inside it. See the [Context API Reference](../references/context-api.md).
- **A deleted component silently drops out.** Selections are stored as an ID path plus the component's last known name; if the component no longer exists when the effect loads, it is filtered out rather than resolving to a broken object. An array shorter than the author's selection is the expected outcome, not an error.

## Reconciliation and Stale Arguments

Stored arguments and declared parameters drift apart as a target environment evolves. METIS reconciles them every time an effect loads, on both the client and the server, so the two agree on what the script will receive.

| Situation                                                     | What happens                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A parameter has no stored argument — you added it              | A fresh argument is created at the parameter's default                                            |
| A stored argument's `type` no longer matches its parameter     | The argument is marked **stale** and hidden from the script; a fresh one is created alongside it   |
| A stored argument's `parameterId` matches no current parameter | It is ignored and not rendered, but stays in storage                                              |
| The effect predates the target's newest migration             | Reconciliation is skipped entirely — the migration runs first and supplies the correct arguments   |

Reconciliation also re-sorts an effect's arguments into your `parameters` declaration order, so reordering that array reorders the interface for existing effects, not only new ones.

Stale and orphaned arguments are deliberately kept rather than deleted. Reverting a parameter's type restores the original value instead of discarding it, and that safety is why a long-lived effect can accumulate arguments no current parameter claims.

The one change reconciliation cannot absorb is a **renamed `_id`**, which reads as one parameter removed and another added: the old argument is orphaned and the new parameter starts at its default, losing what the user entered. That is what migrations are for.

```typescript
migrations.register('2.0.0', (effect) => {
  MigrationToolbox.updateParameterId(effect, 'user', 'username')
})
```

See the [Migrations Guide](migrations.md) for how versions and the registry fit together.

## Common Pitfalls

| Pitfall                                                          | What actually happens                                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Checking an optional argument with `!== undefined`                | Passes even when blank. An optional number is `null`, an optional string is `''`, a selection is `[]`.                   |
| Declaring `default` on an optional parameter                      | Compiles and is ignored. Apply the fallback in the script with `??` instead.                                             |
| Treating an optional number as a number                          | It is `number \| null`. Use `?? fallback`.                                                                              |
| Assuming an unselected optional dropdown matches an option value | It holds `null`, which the declared type does not show. Guard, or make it required with a "None" option.                 |
| Using a dependent argument without a guard                       | A compile error, because the type includes `undefined`. The guard is not optional even when the logic implies it is set. |
| Expecting a `mission-component` array to match the author's selection | Deleted components are filtered out on load, so it can be shorter — or empty.                                       |
| Renaming a parameter `_id` without a migration                   | Every existing effect silently loses that value and falls back to the default.                                          |
| Reading a value in a helper that has the context but not the arguments | Use `context.getArguments(...)` rather than threading the object through.                                           |

Validate what the interface cannot. Range checks that span two parameters, or values saved before you tightened a constraint, only get caught in the script:

```typescript
script: async (context, { port, notify }) => {
  if (port === null || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${port}`)
  }

  context.sendOutput(`Connecting on port ${port}`, notify)
}
```

A thrown error stops the effect and surfaces the message, so say what needs to change.

## Related Documentation

- **[Parameter and Argument Types](parameter-and-argument-types.md)** - Every parameter type and the properties it accepts
- **[Defining Targets](defining-targets.md)** - Target schema structure and requirements
- **[Context API Reference](../references/context-api.md)** - Acting on resolved components
- **[Migrations Guide](migrations.md)** - Carrying stored arguments across a parameter rename
- **[Schemas Reference](../references/schemas.md)** - `TargetSchema` and `TargetEnvSchema` properties
- **[Basic Target Example](../examples/basic-target.md)** - Arguments in a working target
- **[Complex Target Example](../examples/complex-target.md)** - Dependencies and grouping at scale
