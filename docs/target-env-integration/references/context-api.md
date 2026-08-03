# Context API Reference

This reference documents the complete Context API available to target-environment code, covering the properties it exposes and the methods it provides for reading a mission and changing it during a session.

## Table of Contents

- [Overview](#overview)
- [Script Context vs Hook Context](#script-context-vs-hook-context)
- [Effect Types](#effect-types)
- [Reading Arguments](#reading-arguments)
- [Targeting Components](#targeting-components)
- [Context Properties](#context-properties)
- [Output and Timing](#output-and-timing)
- [Data Stores](#data-stores)
- [Node Control Methods](#node-control-methods)
- [Action Modification Methods](#action-modification-methods)
- [Resource Management Methods](#resource-management-methods)
- [File Access Methods](#file-access-methods)
- [Session Resets](#session-resets)
- [Type Definitions](#type-definitions)
- [Related Documentation](#related-documentation)

## Overview

Target scripts receive a `context` object as their first parameter. It exposes the session, its configuration, and the mission, and provides methods for sending output and changing mission state.

```typescript
script: async (context, { notify, hostname }) => {
  // Read from the mission and session
  const missionName = context.mission.name
  const sessionState = context.session.state
  const configData = context.config.targetEnvConfig?.data

  // Identify the effect and who triggered it
  const effectName = context.effect.name
  const executor = context.triggeredBy // null for session-triggered effects

  // Change mission state
  context.sendOutput(`Connecting to ${hostname}...`, notify)
}
```

A script returns nothing. To report a result, send output or leave the value in a data store for another target to read — a returned value is discarded.

## Script Context vs Hook Context

Two kinds of target-environment code receive a context, and they do not receive the same one.

| Available in | Target scripts | Environment hooks |
| ------------ | :------------: | :---------------: |
| `session`, `config`, `mission` | ✓ | ✓ |
| `localStore`, `realmStore`, `globalStore` | ✓ | ✓ |
| `sleep()` | ✓ | ✓ |
| `type`, `effect`, `triggeredBy` | ✓ | — |
| `getArguments()` | ✓ | — |
| `sendOutput()` and all mission-changing methods | ✓ | — |

An `environment-setup` or `environment-teardown` hook cannot send output or modify the mission. It exists to acquire and release resources, and it can read configuration and use the data stores to hand something to the scripts that run later.

> **Note:** Hooks run once per realm per target environment. In a standalone session, where each participant has their own realm, setup and teardown run once for each of them.

## Effect Types

Every target script runs on behalf of an effect, and the effect's type determines what triggered it.

### Session-Triggered Effects

Run during session lifecycle events:

- **session-setup** — while the session is starting, before the mission begins
- **session-start** — when the mission begins
- **session-teardown** — while the session is ending

`context.type` is `'sessionTriggeredEffect'` and `context.triggeredBy` is `null`.

### Execution-Triggered Effects

Run during the lifecycle of an action execution:

- **execution-initiation** — when an execution begins
- **execution-success** — when an execution succeeds
- **execution-failure** — when an execution fails

`context.type` is `'executionTriggeredEffect'` and `context.triggeredBy` is the member who executed the action.

```typescript
script: async (context, { notify }) => {
  if (context.type === 'executionTriggeredEffect') {
    context.sendOutput(
      `${context.triggeredBy.username} executed this action`,
      notify,
    )
  } else {
    context.sendOutput('Automated session lifecycle effect', notify)
  }
}
```

## Reading Arguments

Argument values are supplied to the script as its second parameter, named after each parameter's `_id`:

```typescript
script: async (context, { hostname, port, sslEnabled }) => {
  context.sendOutput(`Connecting to ${hostname}:${port}`, notify)
}
```

The same values are also reachable through `getArguments`, which is useful in a helper that receives the context without the destructured argument object.

```typescript
getArguments(id: string): unknown
getArguments(ids: string[]): Record<string, unknown>
```

```typescript
// A single parameter's value
const hostname = context.getArguments('hostname')

// Several at once
const { hostname, port } = context.getArguments(['hostname', 'port'])
```

Both forms are typed from the target's `parameters`, so only declared `_id`s are accepted and each value carries the type implied by its parameter.

An argument whose parameter declares dependencies resolves to `undefined` whenever those dependencies are unmet, and its type includes `undefined` so a check is required before use.

```typescript
script: async (context, { priority, encryptionLevel }) => {
  // `encryptionLevel` depends on `priority`, so it may be undefined
  if (encryptionLevel) {
    context.sendOutput(`Using ${encryptionLevel}`, notify)
  }
}
```

## Targeting Components

Every method that changes the mission takes the component or components to act on as its first argument. Those components come from a `mission-component` parameter, or from the mission on the context.

```typescript
// From a mission-component parameter
script: async (context, { applyTo }) => {
  context.blockNodes(applyTo)
}

// From the mission on the context
context.sendOutput('Broadcast to everyone', context.mission)
```

Passing a broader component fans the operation out to everything beneath it. A single component or an array of them is accepted anywhere.

| Passed | `blockNodes` affects | `modifySuccessChance` affects |
| ------ | -------------------- | ----------------------------- |
| an action | — | that action |
| a node | that node | every action on it |
| a force | every node in it | every action in it |
| the mission | every node in it | every action in it |

Which component types a method accepts is listed with each method below. A `mission-component` parameter should declare `validComponentTypes` that match, so the picker cannot offer a selection the script has no use for.

## Context Properties

### context.type

```typescript
readonly type: 'sessionTriggeredEffect' | 'executionTriggeredEffect'
```

Discriminates the effect type, and narrows `triggeredBy` when checked.

### context.triggeredBy

```typescript
readonly triggeredBy: TTargetEnvExposedMember | null
```

The member who triggered the execution, or `null` for a session-triggered effect.

```typescript
script: async (context, { notify }) => {
  if (context.triggeredBy) {
    const { username, firstName, lastName } = context.triggeredBy
    context.sendOutput(`Executed by ${firstName} ${lastName}`, notify)
  }
}
```

### context.effect

```typescript
readonly effect: TTargetEnvExposedEffect
```

The effect this script is running for, including where it lives in the mission and which target it uses.

```typescript
script: async (context) => {
  const effectName = context.effect.name
  const trigger = context.effect.trigger
  const targetName = context.effect.target?.name

  // Where the effect lives
  const hostingAction = context.effect.sourceAction // null for mission-level effects
  const hostingForce = context.effect.sourceForce
}
```

### context.session

```typescript
readonly session: TTargetEnvExposedSession
```

The session that invoked the script, including its membership.

```typescript
script: async (context, { notify }) => {
  context.sendOutput(
    `${context.session.name} is ${context.session.state} with ` +
      `${context.session.joinedMembers.length} member(s) online`,
    notify,
  )
}
```

### context.config

```typescript
readonly config: TTargetEnvExposedSessionConfig
```

The session's configuration, plus the configuration selected for this target environment.

```typescript
import { RestApi } from '@metis/api/RestApi'

script: async (context, { notify }) => {
  if (!context.config.targetEnvConfig) {
    throw new Error('No configuration selected for this session.')
  }

  const { name, data } = context.config.targetEnvConfig
  const api = RestApi.fromConfig(data)

  context.sendOutput(`Using config: ${name}`, notify)
}
```

`targetEnvConfig` is `null` when no configuration has been selected, so check it before use. Its `data` is whatever the environment's `configs.json` defines.

### context.mission

```typescript
readonly mission: TTargetEnvExposedMission
```

The mission as it currently stands in this realm, including live gameplay state.

```typescript
script: async (context, { notify }) => {
  const { name, forces, allNodes, allActions, resources, files } =
    context.mission

  context.sendOutput(
    `${name}: ${forces.length} force(s), ${allNodes.length} node(s)`,
    notify,
  )

  const openNodes = allNodes.filter((node) => node.opened)
}
```

> **Note:** The collections are `forces`, `allNodes`, `allActions`, `allEffects`, `resources`, and `files`. There is no `nodes` property on the mission — `allNodes` spans every force, while an individual force has its own `nodes`.

## Output and Timing

### context.sendOutput()

```typescript
sendOutput(
  message: string,
  to: TTargetEnvExposedForce | TTargetEnvExposedMission | Array<...>,
): void
```

Sends a message to an output panel. `to` is required.

- Passing a **force** sends to that force's output panel.
- Passing the **mission** sends a global message that every force sees.

```typescript
script: async (context, { notify }) => {
  // To whichever force the effect's author selected
  context.sendOutput('Operation starting...', notify)

  // To everyone
  context.sendOutput('Mission-wide announcement', context.mission)

  // To several specific forces
  const redAndBlue = context.mission.forces.filter((force) =>
    ['Red Team', 'Blue Team'].includes(force.name),
  )
  context.sendOutput('Coordinated update', redAndBlue)
}
```

### context.sleep()

```typescript
sleep(duration: number): Promise<void>
```

Pauses for the given number of milliseconds. Always use this instead of `setTimeout`, which is blocked inside target-environment code.

```typescript
script: async (context, { notify }) => {
  context.sendOutput('Starting operation...', notify)
  await context.sleep(5000)
  context.sendOutput('Operation complete', notify)
}
```

It aborts early if the session ends, so it never leaves a timer running past the session it belongs to.

```typescript
// ❌ Blocked — throws, directing you to context.sleep
setTimeout(() => {}, 5000)

// ✅ Correct
await context.sleep(5000)
```

## Data Stores

Three stores are available, differing only in how far their data reaches:

| Store | Scope |
| ----- | ----- |
| `localStore` | one target environment within one realm |
| `realmStore` | every target environment within one realm |
| `globalStore` | every target environment in every realm of the session |

Each exposes a single method:

```typescript
use<T>(key: string, initialValue: T): StoreState<T>
```

It returns a holder whose `value` can be read and written. The call is synchronous, and the holder stays valid for the rest of the session.

```typescript
script: async (context, { notify }) => {
  const counter = context.localStore.use('requestCount', 0)
  counter.value += 1
  context.sendOutput(`Request #${counter.value}`, notify)
}
```

Supply an explicit type argument for anything read by more than one target, otherwise the type is inferred from `initialValue` and an empty initial value will not permit the properties you intend to set.

```typescript
interface ScenarioState {
  phase: 'planning' | 'execution'
  objectivesMet: number
}

const state = context.globalStore.use<ScenarioState>('scenario', {
  phase: 'planning',
  objectivesMet: 0,
})
state.value.phase = 'execution'
```

> **See also:** [Data Stores Guide](../guides/data-stores.md) for caching strategies and multi-target coordination.

## Node Control Methods

All three accept a **node**, **force**, or **mission**.

```typescript
blockNodes(nodes): void
unblockNodes(nodes): void
updateNodeBlockStatus(nodes, blocked: boolean): void

openNode(nodes): void
closeNode(nodes): void
updateNodeOpenState(nodes, opened: boolean): void

addNodeAlert(applyTo, message: string, severityLevel): void
```

Blocking prevents further interaction with a node. Opening reveals the next level of the mission structure beneath it.

```typescript
script: async (context, { applyTo }) => {
  context.blockNodes(applyTo)
  context.openNode(applyTo)

  // Or set the state from a value you computed
  context.updateNodeBlockStatus(applyTo, shouldBlock)
}
```

`addNodeAlert` attaches a message to a node for its operators to read. `severityLevel` is one of `'info'`, `'suspicious'`, `'warning'`, or `'danger'`.

```typescript
script: async (context, { applyTo, message, severityLevel }) => {
  context.addNodeAlert(applyTo, message, severityLevel)
}
```

## Action Modification Methods

All accept an **action**, **node**, **force**, or **mission**.

```typescript
modifySuccessChance(applyTo, operand: number): void
modifyProcessTime(applyTo, operand: number): void
modifyResourceCost(applyTo, resources, operand: number): void
```

The operand may be positive or negative.

| Method | Unit | Clamped to |
| ------ | ---- | ---------- |
| `modifySuccessChance` | percentage points | 0–100% |
| `modifyProcessTime` | milliseconds | 0 – 3,600,000 (1 hour) |
| `modifyResourceCost` | resource amount | minimum 0 |

```typescript
script: async (context, { applyTo, resources }) => {
  // Every action beneath whatever was selected
  context.modifySuccessChance(applyTo, 25)
  context.modifyProcessTime(applyTo, -30000)

  // Resource costs need the resources whose cost to change
  context.modifyResourceCost(applyTo, resources, -10)
}
```

## Resource Management Methods

```typescript
modifyResourcePool(applyTo, operand: number): void
```

Accepts a **resource pool**, **force**, or **mission**. Passing a force affects every pool it holds; passing the mission affects every pool in the mission.

```typescript
script: async (context, { applyTo }) => {
  context.modifyResourcePool(applyTo, 50) // award
  context.modifyResourcePool(applyTo, -25) // deduct
}
```

A pool stops at zero unless the mission allows negative balances, which is readable as `allowNegative` on the pool.

## File Access Methods

```typescript
grantFileAccess(applyTo, files): void
revokeFileAccess(applyTo, files): void
updateFileAccess(applyTo, files, granted: boolean): void
```

`applyTo` accepts a **force** or the **mission**; `files` accepts one or more mission files. Both usually come from `mission-component` parameters.

```typescript
script: async (context, { forces, files, notify }) => {
  context.grantFileAccess(forces, files)
  context.sendOutput(`Granted access to ${files.length} file(s)`, notify)

  // Or set it from a value you computed
  context.updateFileAccess(forces, files, shouldGrant)
}
```

## Session Resets

A session can be reset, which discards gameplay state and starts the mission over. Work begun before a reset must not be allowed to alter the session afterwards.

Each context belongs to one run of the session. If a script tries to change mission state through a context that a reset has superseded, the call raises an `OutdatedContextError` rather than applying to the new run. `context.sleep()` also aborts early, so a script waiting when the session ends resumes instead of hanging.

```typescript
script: async (context, { notify }) => {
  await context.sleep(60000)

  // If the session reset while sleeping, this raises OutdatedContextError
  context.sendOutput('Still here', notify)
}
```

Data stores are keyed to the run as well, so a reset starts from empty initial values.

> **See also:** [Session Lifecycle Guide](../guides/session-lifecycle.md) for the full reset model and how to handle `OutdatedContextError`.

## Type Definitions

Every exposed component carries a `componentType` discriminant, so a value from a `mission-component` argument can be narrowed without being told its type in advance.

```typescript
script: async (context, { applyTo }) => {
  for (const component of applyTo) {
    switch (component.componentType) {
      case 'force':
        context.sendOutput(`Force: ${component.name}`, component)
        break
      case 'node':
        context.blockNodes(component)
        break
    }
  }
}
```

### Component Types

| Type | `componentType` | Notable properties |
| ---- | --------------- | ------------------ |
| `TTargetEnvExposedMission` | `'mission'` | `forces`, `allNodes`, `allActions`, `allEffects`, `resources`, `files`, `effects` |
| `TTargetEnvExposedForce` | `'force'` | `nodes`, `resourcePools`, `localKey`, `color`, `mission` |
| `TTargetEnvExposedNode` | `'node'` | `actions`, `parent`, `children`, `siblings`, `opened`, `blocked`, `revealed`, `executing`, `force` |
| `TTargetEnvExposedAction` | `'action'` | `successChance`, `processTime`, `resourceCosts`, `effects`, `type`, `executionCount`, `node` |
| `TTargetEnvExposedPool` | `'resourcePool'` | `balance`, `initialBalance`, `allowNegative`, `excluded`, `resource`, `force` |
| `TTargetEnvExposedResource` | `'resource'` | `icon`, `order`, `mission` |
| `TTargetEnvExposedFile` | `'missionFile'` | `originalName`, `alias`, `extension`, `mimetype`, `size`, `initialAccess` |

> **Note:** A file's `componentType` is `'missionFile'`, and that is also the name used in `validComponentTypes`.

### Supporting Types

```typescript
interface TTargetEnvExposedMember {
  readonly _id: string
  readonly name: string
  readonly username: string
  readonly firstName: string
  readonly lastName: string
}

interface TTargetEnvExposedSessionConfig {
  readonly name?: string
  readonly accessibility: 'public' | 'id-required' | 'invite-only' | 'owner-only'
  readonly infiniteResources: boolean
  readonly targetEnvConfig: TTargetEnvConfig | null
}

type TSessionState =
  | 'unstarted'
  | 'starting'
  | 'started'
  | 'ending'
  | 'ended'
  | 'resetting'

type TNodeAlertSeverityLevel = 'info' | 'suspicious' | 'warning' | 'danger'
```

The session exposes `_id`, `name`, `state`, `launchedAt`, `config`, and the membership collections `members`, `joinedMembers`, `participants`, `observers`, and `managers`.

An effect exposes `_id`, `localKey`, `name`, `type`, `description`, `trigger`, `order`, its `host`, its `sourceForce` / `sourceNode` / `sourceAction`, its `target` and `environment`, and its `arguments`.

## Related Documentation

### Essential Guides

- **[Defining Targets](../guides/defining-targets.md)** - Target schema and script creation
- **[Session Lifecycle](../guides/session-lifecycle.md)** - Session resets and `OutdatedContextError`
- **[Environment Hooks](../guides/environment-hooks.md)** - Setup and teardown for persistent connections
- **[Data Stores](../guides/data-stores.md)** - Caching and sharing data between script executions
- **[Parameter and Argument Types](../guides/parameter-and-argument-types.md)** - Every parameter type, including `mission-component`

### Examples

- **[Basic Target](../examples/basic-target.md)** - Simple context API usage
- **[Complex Target](../examples/complex-target.md)** - Advanced context patterns

### References

- **[Schema Documentation](schemas.md)** - TypeScript types, interfaces, and target schema structure
