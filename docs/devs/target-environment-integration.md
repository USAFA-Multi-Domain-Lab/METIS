# Target Environment Integration Guide

## Overview

`Target environments` in METIS provide reusable `target` definitions that can be used to create `effects` in missions. Each `target` is configurable using specifically defined `arguments`. The results of `targets` that have been configured/modified by an end-user via METIS' UI (User-Interface) and saved to a `mission` are called `Effects.`

These `effects` are then executed during `sessions` created from `missions` and utilize the `WebSocket` system for real-time updates. This guide covers how to integrate `target environments` into your METIS project, including creating `target` definitions, configuring environments, and executing `effects.`

## Key Concepts

### `Target Environment`

- Collection of related target definitions
- Provides typed argument validation
- Manages version compatibility
- Shared between client and server

### `Targets`

- Reusable operation definitions
- Strongly typed configuration arguments
- Version-controlled schemas
- Used as building blocks for effects

### `Effects`

- Combine targets with specific configurations
- Execute during mission sessions
- Utilize WebSocket system for real-time updates
- Validated against target definitions

## Integration Steps

### `1. Create Environment Schema`

```typescript
import TargetEnvSchema from 'library/target-env-classes'

const MyEnvironment = new TargetEnvSchema({
  name: 'My Environment',
  description: 'My target environment',
  version: '1.0.0',
})
```

### `2. Create Target Definition`

```typescript
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'
import TargetSchema from 'library/target-env-classes/targets'

const MyTarget = new TargetSchema({
  _id: 'myTarget',
  name: 'My Target',
  description: 'Performs specific operations',
  args: [myArgument], // Details in "Define Argument Types" section below
  script: async (context) => {
    // The keys in the context.effect.args object correspond to the argument IDs defined in the target arguments. (e.g., "myArgument" found in the "Define Argument Types" section below)
    const { myArgument } = context.effect.args
    // ... operation logic
  },
  migrations: new TargetMigrationRegistry().register('1.1.0', (effectArgs) => {
    // ... migration logic
  }),
})
```

### `3. Define Argument Types`

```typescript
const myArgument = {
  // Required base properties
  _id: 'myArgument', // Unique identifier for the argument
  name: 'My Argument', // Display name for the UI
  type: 'string', // Argument type (string, number, boolean, etc.)
  required: true,

  // Optional base properties
  groupingId: 'myGroup', // Groups arguments together for the UI
  dependencies: [], // Conditional display rules
  tooltipDescription: 'This is a custom argument for demonstration purposes.',

  // ... additional properties for specific types

  // For example, if the type is 'string':
  // pattern: '^[a-zA-Z0-9]+$', // Regex pattern for validation
  // title: 'Custom Argument', // Used to display error messages
}
```

### `4. Configure Target Environment`

- Configuring your target environment involves creating a `.json` file in the `root` directory of the METIS project.
- The configuration will depend on how your target environment is set up. Are you using a REST API, WebSocket, or some other protocol? The configuration will include the necessary details such as protocol, address, port, authentication credentials, etc.

  #### `REST API Example:`

  ```typescript
  {
    "<your-target-environment-name>": {
      // Default: "http" (see description above)
      "protocol": "<your-protocol>",
      // Default: "localhost:80" (see description above)
      "address": "<your-address-here>",
      // Default: 80 or 443 (see description above)
      "port": "<your-port-here>"
      // Default: undefined (see description above)
      "username": "<your-username-here>",
      // Default: undefined (see description above)
      "password": "<your-password-here>",
      // Default: undefined (see description above)
      "apiKey": "<your-api-key-here>",
      // Default: true (see description above)
      "rejectUnauthorized": "<boolean>",
    },
  }
  ```

### `5. Start/Restart the METIS`

Once the server successfully starts you should see these messages in the terminal…

```jsx
$ Target Environment successfully loaded.
$ Started server on port <your-port>
```

### `6. Verify that the target environment exists in METIS`

1. Using the METIS UI (User-Interface) click on a pre-existing mission found on the home page within the list called `Missions`, or create a new mission.
2. Once you are navigated to the Mission Page, click on any tab at the top of the mission map that is **NOT** called `Master` (The default force is called `Friendly Force`) and locate a mission-node that has a lightning bolt icon or a device icon displayed on it on the mission map.
3. If there are not any mission-nodes that fit this description, then click on any mission-node. Then, in the side panel to the right of the mission map, scroll to the bottom and click the executable toggle so that it's enabled.
4. You will then need to click on an action displayed in the list of actions at the bottom of that side panel (beneath the executable toggle).
5. Once you select an action, scroll to the bottom of the side panel with all the action’s details and locate the effects list.
6. Once you locate the effects list, click on the new effect button and click the target environment dropdown. This is where the target environment will be displayed if it was successfully loaded in to METIS upon server startup.

## Example Implementation

See the [METIS](/integration/target-env/METIS/schema.ts) demo environment for a reference implementation.

## Related Documentation

- [Target Environments API](/docs/api/target-environments.md)
- [WebSocket System](/docs/devs/websocket.md)
- [Architecture Overview](/docs/devs/architecture.md)
