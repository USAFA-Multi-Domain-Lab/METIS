# Context API Reference

This reference documents the complete Context API available to target scripts, providing detailed information about all properties, methods, and parameters.

## Table of Contents

- [Overview](#overview)
- [🏗️ Context Structure](#️-context-structure)
- [📋 Context Properties](#-context-properties)
- [📤 Output Methods](#-output-methods)
- [📦 Data Store Methods](#-data-store-methods)
- [🎯 Node Control Methods](#-node-control-methods)
- [⚡ Action Modification Methods](#-action-modification-methods)
- [💰 Resource Management Methods](#-resource-management-methods)
- [📁 File Access Methods](#-file-access-methods)
- [🔑 Method Options](#-method-options)
- [📊 Type Definitions](#-type-definitions)
- [💡 Usage Examples](#-usage-examples)
- [📖 Related Documentation](#-related-documentation)

## Overview

The Context API provides target scripts with access to the METIS mission environment through the `context` parameter. It includes properties for accessing effect data and methods for manipulating mission state.

```ts
script: async (context) => {
  // context: TTargetEnvExposedContext

  // Access properties
  const { arg1, arg2 } = context.effect.args
  const missionName = context.mission.name
  const username = context.user.username

  // Call methods
  context.sendOutput('Operation starting...')
  context.modifySuccessChance(25)
  context.blockNode({ nodeKey: '<node-key>' })
}
```

## 🏗️ Context Structure

The context object exposes three main property categories and multiple method categories:

```ts
interface TTargetEnvExposedContext {
  // Properties
  readonly effect: TTargetEnvExposedEffect
  readonly mission: TTargetEnvExposedMission
  readonly user: TTargetEnvExposedUser
  readonly localStore: TTargetEnvStore
  readonly globalStore: TTargetEnvStore

  // Methods
  sendOutput: Function
  blockNode: Function
  unblockNode: Function
  openNode: Function
  modifySuccessChance: Function
  modifyProcessTime: Function
  modifyResourceCost: Function
  modifyResourcePool: Function
  grantFileAccess: Function
  revokeFileAccess: Function
}
```

## 📋 Context Properties

### ctx.effect

Provides access to the current effect and its arguments.

```ts
interface TTargetEnvExposedEffect {
  readonly _id: string // Effect ID
  readonly name: string // Effect name
  readonly forceName: string // Name of force where effect belongs
  readonly args: AnyObject // Effect arguments from target schema
}
```

**Usage Examples:**

```ts
script: async (ctx) => {
  // Access effect metadata
  const effectId = ctx.effect._id
  const effectName = ctx.effect.name
  const forceName = ctx.effect.forceName

  // Access arguments
  const { hostname, port, sslEnabled } = ctx.effect.args

  ctx.sendOutput(`Executing ${effectName} on ${forceName}`)
  ctx.sendOutput(`Connecting to ${hostname}:${port}`)
}
```

### ctx.mission

Provides access to mission-wide information and structure.

```ts
interface TTargetEnvExposedMission {
  readonly _id: string // Mission ID
  readonly name: string // Mission name
  readonly forces: TTargetEnvExposedForce[] // All forces in mission
  readonly nodes: TTargetEnvExposedNode[] // All nodes in mission
}
```

**Usage Examples:**

```ts
script: async (ctx) => {
  // Access mission metadata
  const missionId = ctx.mission._id
  const missionName = ctx.mission.name

  // Access mission structure
  const allForces = ctx.mission.forces
  const allNodes = ctx.mission.nodes

  ctx.sendOutput(`Mission: ${missionName} (${allForces.length} forces)`)

  // Find specific forces or nodes
  const redForce = allForces.find((f) => f.name === 'Red Team')
  const criticalNodes = allNodes.filter((n) => n.name.includes('Critical'))
}
```

### ctx.user

Provides access to user information for the person who triggered the effect.

```ts
interface TTargetEnvExposedUser {
  readonly _id: string // User ID
  readonly username: string // Username
}
```

**Usage Examples:**

```ts
script: async (ctx) => {
  const userId = ctx.user._id
  const username = ctx.user.username

  ctx.sendOutput(`Operation initiated by ${username}`)

  // Use user info for audit logging
  console.log(`User ${userId} (${username}) executed target effect`)
}
```

### ctx.localStore

Provides session-scoped data storage specific to the current target environment. Data persists for the duration of the session and is isolated per target environment.

**Usage Examples:**

```ts
script: async (ctx) => {
  // Initialize or retrieve a counter
  const counter = ctx.localStore.use('requestCounter', 0)

  counter.value += 1
  ctx.sendOutput(`Request #${counter.value} processed`)

  // Cache API responses
  const apiCache = ctx.localStore.use<Map<string, any>>('apiCache', new Map())

  if (!apiCache.value.has('userList')) {
    const users = await fetchUsers()
    apiCache.value.set('userList', users)
  }
}
```

### ctx.globalStore

Provides session-scoped data storage shared across all target environments. Enables communication and state sharing between different targets within the same session.

**Usage Examples:**

```ts
script: async (ctx) => {
  // Share session state across target environments
  const sessionState = ctx.globalStore.use('missionState', {
    phase: 'planning',
    objectivesComplete: 0,
    startTime: Date.now(),
  })

  // Update shared state
  sessionState.value.phase = 'execution'
  sessionState.value.objectivesComplete += 1

  ctx.sendOutput(`Mission phase: ${sessionState.value.phase}`)
}
```

## 📤 Output Methods

### ctx.sendOutput()

Sends messages to the mission output panel.

```ts
sendOutput(message: string, options?: TManipulateForceOptions): void
```

**Parameters:**

- `message` (string) - The message to display
- `options` (optional) - Configuration object

**Options:**

```ts
interface TManipulateForceOptions {
  forceKey?: string // Target force key (default: 'self')
}
```

**Examples:**

```ts
script: async (ctx) => {
  const { targetForce } = ctx.effect.args // Assuming force metadata argument

  // Send to current force (default)
  ctx.sendOutput('Operation starting...')

  // Send to specific force using extracted metadata
  ctx.sendOutput('Alert: Security breach detected', {
    forceKey: targetForce.forceKey,
  })

  // Send to all forces by iterating mission forces
  const forces = ctx.mission.forces
  forces.forEach((force) => {
    ctx.sendOutput('Mission update broadcast', {
      forceKey: force.localKey,
    })
  })

  // Hardcoded keys are also valid when you know the exact force
  ctx.sendOutput('Direct communication to blue team', {
    forceKey: 'blue-team',
  })
}
```

## 📦 Data Store Methods

### ctx.localStore.use()

Retrieves or initializes data in the local store (session and target-environment scoped).

```ts
use<T>(key: string, defaultValue: T): { value: T }
```

**Parameters:**

- `key` (string) - Unique identifier for the stored data
- `defaultValue` (T) - Value to use if key doesn't exist

**Returns:**

- Object with `value` property that can be read and modified

**Examples:**

```ts
script: async (ctx) => {
  // Initialize counter
  const requestCounter = ctx.localStore.use('requests', 0)
  requestCounter.value += 1

  // Cache expensive API responses
  const cache = ctx.localStore.use<Map<string, any>>('apiCache', new Map())

  const cacheKey = `data_${args.userId}`
  if (!cache.value.has(cacheKey)) {
    const apiData = await fetchExpensiveData(args.userId)
    cache.value.set(cacheKey, apiData)
  }

  // Configuration that persists across executions
  const config = ctx.localStore.use('settings', {
    retryAttempts: 3,
    timeout: 5000,
  })

  if (args.enableDebugMode) {
    config.value.timeout = 30000
  }
}
```

### ctx.globalStore.use()

Retrieves or initializes data in the global store (session-wide, shared across target environments).

```ts
use<T>(key: string, defaultValue: T): { value: T }
```

**Parameters:**

- `key` (string) - Unique identifier for the stored data
- `defaultValue` (T) - Value to use if key doesn't exist

**Returns:**

- Object with `value` property that can be read and modified

**Examples:**

```ts
script: async (ctx) => {
  // Share mission state across different target environments
  const missionState = ctx.globalStore.use('missionProgress', {
    phase: 'planning',
    tasksComplete: 0,
    startTime: Date.now(),
  })

  // Update shared state
  missionState.value.phase = 'execution'
  missionState.value.tasksComplete += 1

  // Cross-target authentication state
  const authState = ctx.globalStore.use('authentication', {
    isAuthenticated: false,
    sessionToken: null,
  })

  if (authState.value.isAuthenticated) {
    ctx.sendOutput('Using existing authentication')
  } else {
    // Perform authentication...
    authState.value.isAuthenticated = true
    authState.value.sessionToken = 'new-token'
  }

  // Multi-step workflow coordination
  const deploymentState = ctx.globalStore.use('deployment', {
    steps: [],
    currentStep: 0,
  })

  deploymentState.value.steps.push({
    name: ctx.effect.name,
    completed: true,
    timestamp: Date.now(),
  })
}
```

## 🎯 Node Control Methods

### ctx.blockNode()

Blocks a node from further interaction.

```ts
blockNode(options?: TManipulateNodeOptions): void
```

**Parameters:**

- `options` (optional) - Node targeting configuration

**Options:**

```ts
interface TManipulateNodeOptions {
  nodeKey?: string // Target node key (default: 'self')
  forceKey?: string // Target force key (default: 'self')
}
```

**Examples:**

```ts
script: async (ctx) => {
  const { targetNode } = ctx.effect.args // Assuming node metadata argument

  // Block current node (default)
  ctx.blockNode()

  // Block specific node using extracted metadata
  ctx.blockNode({
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Block node in current force using just nodeKey
  ctx.blockNode({
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know the exact targets
  ctx.blockNode({
    forceKey: 'red-team',
    nodeKey: 'server-room',
  })
}
```

### ctx.unblockNode()

Unblocks a node, allowing interaction.

```ts
unblockNode(options: TManipulateNodeOptions): void
```

**Parameters:**

- `options` (required) - Node targeting configuration

**Examples:**

```ts
script: async (ctx) => {
  const { targetNode } = ctx.effect.args // Assuming node metadata argument

  // Unblock specific node using extracted metadata (options required)
  ctx.unblockNode({
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Unblock node in current force using just nodeKey
  ctx.unblockNode({
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know the exact targets
  ctx.unblockNode({
    forceKey: 'blue-team',
    nodeKey: 'firewall',
  })
}
```

### ctx.openNode()

Opens a node to reveal the next level in the mission structure.

```ts
openNode(options?: TManipulateNodeOptions): void
```

**Parameters:**

- `options` (optional) - Node targeting configuration

**Examples:**

```ts
script: async (ctx) => {
  const { targetNode } = ctx.effect.args // Assuming node metadata argument

  // Open current node (default)
  ctx.openNode()

  // Open specific node using extracted metadata
  ctx.openNode({
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know the exact target
  ctx.openNode({
    forceKey: 'red-team',
    nodeKey: 'network-segment',
  })
}
```

## ⚡ Action Modification Methods

### ctx.modifySuccessChance()

Modifies an action's probability of success.

```ts
modifySuccessChance(operand: number, options?: TManipulateActionOptions): void
```

**Parameters:**

- `operand` (number) - Amount to modify (positive or negative)
- `options` (optional) - Action targeting configuration

**Constraints:**

- Result clamped to 0-100%
- Affects all actions in node if no specific action targeted

**Options:**

```ts
interface TManipulateActionOptions {
  actionKey?: string // Target action key (default: all actions in node)
  nodeKey?: string // Target node key (default: 'self')
  forceKey?: string // Target force key (default: 'self')
}
```

**Examples:**

```ts
script: async (ctx) => {
  const { targetAction } = ctx.effect.args // Assuming action metadata argument

  // Increase success chance for current node's actions by 25%
  ctx.modifySuccessChance(25)

  // Decrease success chance for specific action using extracted metadata
  ctx.modifySuccessChance(-50, {
    forceKey: targetAction.forceKey,
    nodeKey: targetAction.nodeKey,
    actionKey: targetAction.actionKey,
  })

  // Boost all actions in a specific node using node metadata
  const { targetNode } = ctx.effect.args
  ctx.modifySuccessChance(15, {
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know exact targets
  ctx.modifySuccessChance(-30, {
    forceKey: 'red-team',
    nodeKey: 'firewall',
    actionKey: 'brute-force',
  })
}
```

### ctx.modifyProcessTime()

Modifies how long an action takes to execute.

```ts
modifyProcessTime(operand: number, options?: TManipulateActionOptions): void
```

**Parameters:**

- `operand` (number) - Milliseconds to add/subtract
- `options` (optional) - Action targeting configuration

**Constraints:**

- Result clamped to 0s - 1 hour (3,600s)
- Affects all actions in node if no specific action targeted

**Examples:**

```ts
script: async (ctx) => {
  const { targetAction } = ctx.effect.args // Assuming action metadata argument

  // Speed up current actions by 30 seconds
  ctx.modifyProcessTime(-30000)

  // Slow down specific action using extracted metadata
  ctx.modifyProcessTime(120000, {
    forceKey: targetAction.forceKey,
    nodeKey: targetAction.nodeKey,
    actionKey: targetAction.actionKey,
  })

  // Add time to all actions in a node using node metadata
  const { targetNode } = ctx.effect.args
  ctx.modifyProcessTime(45000, {
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know exact targets
  ctx.modifyProcessTime(90000, {
    forceKey: 'red-team',
    nodeKey: 'encryption',
    actionKey: 'decrypt',
  })
}
```

### ctx.modifyResourceCost()

Modifies the resource cost of actions.

```ts
modifyResourceCost(operand: number, options?: TManipulateActionOptions): void
```

**Parameters:**

- `operand` (number) - Resource amount to add/subtract
- `options` (optional) - Action targeting configuration

**Constraints:**

- Result clamped to minimum 0
- Affects all actions in node if no specific action targeted

**Examples:**

```ts
script: async (ctx) => {
  const { targetAction } = ctx.effect.args // Assuming action metadata argument

  // Reduce resource cost for current actions by 10
  ctx.modifyResourceCost(-10)

  // Increase cost for specific action using extracted metadata
  ctx.modifyResourceCost(25, {
    forceKey: targetAction.forceKey,
    nodeKey: targetAction.nodeKey,
    actionKey: targetAction.actionKey,
  })

  // Make actions cheaper in a node using node metadata
  const { targetNode } = ctx.effect.args
  ctx.modifyResourceCost(-5, {
    forceKey: targetNode.forceKey,
    nodeKey: targetNode.nodeKey,
  })

  // Hardcoded keys when you know exact targets
  ctx.modifyResourceCost(15, {
    forceKey: 'blue-team',
    nodeKey: 'intrusion-detection',
    actionKey: 'deep-scan',
  })
}
```

## 💰 Resource Management Methods

### ctx.modifyResourcePool()

Modifies a force's available resource pool.

```ts
modifyResourcePool(operand: number, options?: TManipulateForceOptions): void
```

**Parameters:**

- `operand` (number) - Resources to add (positive) or subtract (negative)
- `options` (optional) - Force targeting configuration

**Examples:**

```ts
script: async (ctx) => {
  const { targetForce } = ctx.effect.args // Assuming force metadata argument

  // Add 50 resources to current force
  ctx.modifyResourcePool(50)

  // Subtract resources from specific force using extracted metadata
  ctx.modifyResourcePool(-25, {
    forceKey: targetForce.forceKey,
  })

  // Hardcoded keys when you know the exact force
  ctx.modifyResourcePool(-30, {
    forceKey: 'red-team',
  })
}

  // Penalty for failed operation
  if (operationFailed) {
    ctx.modifyResourcePool(-100)
    ctx.sendOutput('Operation failed - resource penalty applied')
  }
}
```

## 📁 File Access Methods

### ctx.grantFileAccess()

Grants a force access to a mission file.

```ts
grantFileAccess(fileId: string, forceKey: string): void
```

**Parameters:**

- `fileId` (string) - ID of the file to grant access to
- `forceKey` (string) - Local key of the force to grant access

**Examples:**

```ts
script: async (ctx) => {
  const { targetFile, targetForce } = ctx.effect.args // File and force metadata arguments

  // Grant access using extracted file and force metadata
  ctx.grantFileAccess(targetFile.fileId, targetForce.forceKey)

  // Grant access to current force using file metadata
  ctx.grantFileAccess(targetFile.fileId, 'self')

  // Hardcoded approach when you know exact values
  ctx.grantFileAccess('file-123', 'blue-team')

  ctx.sendOutput(`Granted access to ${targetFile.filename}`)
}
```

### ctx.revokeFileAccess()

Revokes a force's access to a mission file.

```ts
revokeFileAccess(fileId: string, forceKey: string): void
```

**Parameters:**

- `fileId` (string) - ID of the file to revoke access from
- `forceKey` (string) - Local key of the force to revoke access

**Examples:**

```ts
script: async (ctx) => {
  const { targetFile, targetForce } = ctx.effect.args // File and force metadata arguments

  // Revoke access using extracted metadata
  ctx.revokeFileAccess(targetFile.fileId, targetForce.forceKey)

  // Hardcoded approach when you know exact values
  ctx.revokeFileAccess(targetFile.fileId, 'red-team')

  ctx.sendOutput(`Revoked access to ${targetFile.filename}`)
}
```

## 🔑 Method Options

### Key Resolution

All methods support flexible key resolution:

- `'self'` - Current effect's force/node/action
- `string` - Specific local key to target
- `undefined` - Default behavior (usually 'self')

### Force Keys

```ts
interface TManipulateForceOptions {
  forceKey?: string // 'self' | '<force-local-key>'
}
```

### Node Keys

```ts
interface TManipulateNodeOptions {
  forceKey?: string // 'self' | '<force-local-key>'
  nodeKey?: string // 'self' | '<node-local-key>'
}
```

### Action Keys

```ts
interface TManipulateActionOptions {
  forceKey?: string // 'self' | '<force-local-key>'
  nodeKey?: string // 'self' | '<node-local-key>'
  actionKey?: string // 'self' | 'all' | '<action-local-key>'
}
```

**Special Action Key Values:**

- `'self'` - Current effect's action only
- `'all'` - All actions in the target node (default)
- `'<key>'` - Specific action by local key

## 📊 Type Definitions

### Mission Structure Types

```ts
interface TTargetEnvExposedMission {
  readonly _id: string
  readonly name: string
  get forces(): TTargetEnvExposedForce[]
  get nodes(): TTargetEnvExposedNode[]
}

interface TTargetEnvExposedForce {
  readonly _id: string
  readonly name: string
  readonly nodes: TTargetEnvExposedNode[]
}

interface TTargetEnvExposedNode {
  readonly _id: string
  readonly name: string
  readonly description: string
  readonly actions: TTargetEnvExposedAction[]
}

interface TTargetEnvExposedAction {
  readonly _id: string
  readonly name: string
  readonly description: string
  readonly successChance: number
  readonly processTime: number
  readonly resourceCost: number
  readonly effects: TTargetEnvExposedEffect[]
}

interface TTargetEnvExposedEffect {
  readonly _id: string
  readonly name: string
  readonly forceName: string
  readonly args: AnyObject
}
```

### Option Types

```ts
interface TManipulateForceOptions {
  forceKey?: string
}

interface TManipulateNodeOptions {
  forceKey?: string
  nodeKey?: string
}

interface TManipulateActionOptions {
  forceKey?: string
  nodeKey?: string
  actionKey?: string
}
```

### User Structure Types

```ts
interface TTargetEnvExposedUser {
  readonly _id: string
  readonly username: string
}
```

## 💡 Usage Examples

### Auto-Generated Argument Objects

When using `force`, `node`, `action`, or `file` argument types, METIS automatically generates objects containing the selected keys and metadata. These are not manually defined values, but objects with auto-generated properties.

#### Argument Type Definitions

```ts
// Target definition with different metadata argument types
args: [
  {
    _id: 'targetForce', // Your argument ID
    type: 'force', // Auto-generates TForceMetadata object
    // ... other arg properties
  },
  {
    _id: 'targetNode', // Your argument ID
    type: 'node', // Auto-generates TNodeMetadata object
    // ... other arg properties
  },
  {
    _id: 'targetAction', // Your argument ID
    type: 'action', // Auto-generates TActionMetadata object
    // ... other arg properties
  },
  {
    _id: 'configFile', // Your argument ID
    type: 'file', // Auto-generates TFileMetadata object
    // ... other arg properties
  },
]
```

#### Extracting Auto-Generated Objects

In your target script, extract the metadata objects from `ctx.effect.args`:

```ts
import { TActionMetadata } from 'metis/target-environments/args/mission-component/action-arg'
import { TFileMetadata } from 'metis/target-environments/args/mission-component/file-arg'
import { TForceMetadata } from 'metis/target-environments/args/mission-component/force-arg'
import { TNodeMetadata } from 'metis/target-environments/args/mission-component/node-arg'

script: async (ctx) => {
  const { targetForce, targetNode, targetAction, configFile } = ctx.effect.args

  // Type-safe access with imported types:
  const forceMetadata: TForceMetadata = targetForce
  const nodeMetadata: TNodeMetadata = targetNode
  const actionMetadata: TActionMetadata | undefined = targetAction
  const fileMetadata: TFileMetadata = configFile

  // Extract keys for use in context methods:
  const forceKey = forceMetadata.forceKey
  const nodeKey = nodeMetadata.nodeKey
  const actionKey = actionMetadata?.actionKey
  const fileId = fileMetadata.fileId // Note: files use fileId, not fileKey
}
```

#### Metadata Object Properties

Each auto-generated object contains different properties:

```ts
// TForceMetadata object:
const forceMetadata = {
  forceKey: '<generated-force-key>',
  // ... other force properties
}

// TNodeMetadata object:
const nodeMetadata = {
  forceKey: '<generated-force-key>',
  nodeKey: '<generated-node-key>',
  // ... other node properties
}

// TActionMetadata object:
const actionMetadata = {
  forceKey: '<generated-force-key>',
  nodeKey: '<generated-node-key>',
  actionKey: '<generated-action-key>',
  // ... other action properties
}

// TFileMetadata object:
const fileMetadata = {
  fileId: '<generated-file-id>', // Note: fileId, not fileKey
  fileName: 'config.json',
  // ... other file properties
}
```

#### Using Extracted Keys

Use the extracted keys with context methods:

```ts
script: async (ctx) => {
  const { targetForce, targetNode, targetAction, configFile } = ctx.effect.args

  // Extract keys
  const forceKey = targetForce.forceKey
  const nodeKey = targetNode.nodeKey
  const actionKey = targetAction?.actionKey
  const fileId = configFile.fileId

  // Use keys with context methods
  ctx.blockNode({ nodeKey, forceKey })

  if (actionKey) {
    ctx.modifySuccessChance(50, { actionKey, nodeKey, forceKey })
  }

  // Access file information
  ctx.sendOutput(`Using config file: ${configFile.fileName}`)
}
```

**Important:** The `forceKey`, `nodeKey`, `actionKey`, and `fileId` values are automatically generated by METIS based on user selections in the UI. You cannot manually set these values - they must be extracted from the argument objects.

**TypeScript Support:** Import `TForceMetadata`, `TNodeMetadata`, `TActionMetadata`, and `TFileMetadata` types from the `shared` package for full type safety.

### Complete Target Example

```ts
export default new TargetSchema({
  name: 'Network Intrusion',
  description: 'Attempt to penetrate target network defenses',
  args: [
    {
      _id: 'targetNode',
      name: 'Target Node',
      type: 'node',
      required: true,
    },
    {
      _id: 'attackType',
      name: 'Attack Type',
      type: 'dropdown',
      required: true,
      default: { _id: 'stealth', name: 'Stealth', value: 'stealth' },
      options: [
        { _id: 'stealth', name: 'Stealth', value: 'stealth' },
        { _id: 'aggressive', name: 'Aggressive', value: 'aggressive' },
      ],
    },
  ],
  script: async (ctx) => {
    const { targetNode, attackType } = ctx.effect.args
    const username = ctx.user.username

    ctx.sendOutput(`${username} initiating ${attackType} attack`)

    if (attackType === 'stealth') {
      // Stealth approach - higher success, longer time
      ctx.modifySuccessChance(15, {
        forceKey: targetNode.forceKey,
        nodeKey: targetNode.nodeKey,
      })
      ctx.modifyProcessTime(30000, {
        forceKey: targetNode.forceKey,
        nodeKey: targetNode.nodeKey,
      })
      ctx.sendOutput('Using stealth approach - increased success chance')
    } else {
      // Aggressive approach - lower success, faster
      ctx.modifySuccessChance(-10, {
        forceKey: targetNode.forceKey,
        nodeKey: targetNode.nodeKey,
      })
      ctx.modifyProcessTime(-15000, {
        forceKey: targetNode.forceKey,
        nodeKey: targetNode.nodeKey,
      })
      ctx.sendOutput('Using aggressive approach - faster but riskier')
    }

    // Resource cost for the attack
    ctx.modifyResourcePool(-20)
    ctx.sendOutput('Resources consumed for attack')
  },
})
```

## 📖 Related Documentation

### 📋 Essential Guides

- **[Defining Targets](../guides/defining-targets.md)** - Target schema and script creation
- **[Data Stores](../guides/data-stores.md)** - Caching and sharing data between script executions
- **[Target-Effect Conversion](../guides/target-effect-conversion.md)** - Argument handling and extraction
- **[Argument Types](../guides/argument-types.md)** - Mission component argument usage

### 💡 Examples

- **[Basic Target](../examples/basic-target.md)** - Simple context API usage
- **[Complex Target](../examples/complex-target.md)** - Advanced context patterns

### 🔗 References

- **[Mission Structure](mission-structure.md)** - Mission hierarchy and relationships
- **[Effect Schema](effect-schema.md)** - Effect object structure and properties
