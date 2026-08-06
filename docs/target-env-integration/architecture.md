# Target-Effect System Architecture

This document provides a high-level overview of the target-effect system architecture and how it enables METIS to integrate with external systems.

## Table of Contents

- [System Overview](#system-overview)
- [How It Works](#how-it-works)
  - [Integration Layer](#integration-layer)
  - [Registry Layer](#registry-layer)
  - [Execution Layer](#execution-layer)
- [Key Concepts](#key-concepts)
- [Quick Example](#quick-example)
- [Related Documentation](#related-documentation)

## System Overview

The target-effect system allows METIS to interact with external systems through a three-layer architecture:

1. **Integration Layer** - Define what systems METIS can affect and how
2. **Registry Layer** - Discover and manage available integrations
3. **Execution Layer** - Execute effects against external systems during METIS sessions

```text
┌─────────────────────────────────────────────────────────────────┐
│                      METIS APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│  EXECUTION LAYER                                                │
│  • Execute effects during missions                              │
│  • Secure context creation                                      │
│  • Realm-scoped data persistence                                │
│  • Real-time feedback                                           │
├─────────────────────────────────────────────────────────────────┤
│  REGISTRY LAYER                                                 │
│  • Auto-discover integrations                                   │
│  • Build target/environment registry                            │
│  • Share between client/server                                  │
├─────────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                              │
│  • Target environment definitions                               │
│  • Target implementations                                       │
│  • External system connections                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  EXTERNAL SYSTEMS   │
                     │  • APIs             │
                     │  • Databases        │
                     │  • Services         │
                     └─────────────────────┘
```

## How It Works

### Integration Layer

Lives in `integration/`. Developers define target environments (external systems) and targets (specific actions) using TypeScript schemas. These schemas specify what parameters the target declares and what script should execute.

**Key Benefit**: New integrations can be added without modifying core METIS code.

### Registry Layer

Lives in `shared/` and `server/`. At startup, METIS scans the integration folder and builds a registry of all available target environments and their targets. This registry is shared between client and server.

**Key Benefit**: Automatic discovery means no manual registration required.

### Execution Layer

Lives in `server/`. When an effect executes during a session, METIS creates a secure context and runs the target's script with the arguments the mission author supplied.

**Key Benefit**: External systems can be affected while maintaining security and isolation.

## Key Concepts

- **Target Environment**: A system with which METIS can integrate (e.g., "Traffic Control System")
- **Target**: An object within an environment that can be acted upon (e.g., "Traffic Light")
- **Effect**: A change enacted upon a target, caused by a chosen event (e.g., "Change Traffic Light to Red when an Action Succeeds")
- **Context**: The secure execution environment within which the target scripts run

## Quick Example

First, the environment, in `integration/target-env/traffic-control-system/schema.ts`:

```typescript
const TrafficControlSystem = TargetEnvSchema.create({
  name: 'Traffic Control System',
  description: 'Integration with city traffic management',
  version: '1.0.0',
})

export default TrafficControlSystem
```

Then a target, in `integration/target-env/traffic-control-system/targets/traffic-light/schema.ts`:

```typescript
const ChangeLight = TargetSchema.create({
  _id: 'traffic-light',
  name: 'Change Traffic Light',
  description: 'Set a traffic light to the selected color.',
  script: async (context, { color }) => {
    // Call external API to change light
    void color
  },
  parameters: [
    {
      _id: 'color',
      name: 'Light Color',
      type: 'dropdown',
      required: true,
      default: 'green',
      options: [
        { _id: 'green', name: 'Green', value: 'green' },
        { _id: 'red', name: 'Red', value: 'red' },
        { _id: 'yellow', name: 'Yellow', value: 'yellow' },
      ],
    },
  ],
})

export default ChangeLight
```

From there METIS takes over: it discovers the target at startup, mission authors create effects from it in the mission editor, and during a session the script runs with the color each author chose.

## Related Documentation

- **[Target Environment Integration Guide](guides/index.md)** - Step-by-step guide for integrating external systems
- **[Quickstart Guide](quickstart.md)** - Get started with your first integration
- **[API Reference](../api/overview.md)** - Complete API documentation
- **[Examples](examples/index.md)** - Real-world integration examples
