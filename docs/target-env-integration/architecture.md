# Target-Effect System Architecture

This document provides a high-level overview of the Target-Effect system architecture and how it enables METIS to integrate with external systems.

## System Overview

The Target-Effect system allows METIS to interact with external systems through a three-layer architecture:

1. **Integration Layer** - Define what external systems METIS can affect and how
2. **Registry Layer** - Discover and manage available integrations
3. **Execution Layer** - Execute effects against external systems during METIS sessions

```
┌─────────────────────────────────────────────────────────────────┐
│                     METIS APPLICATION                           │
├─────────────────────────────────────────────────────────────────┤
│  EXECUTION LAYER                                               │
│  • Execute effects during missions                             │
│  • Secure context creation                                     │
│  • Real-time feedback                                          │
├─────────────────────────────────────────────────────────────────┤
│  REGISTRY LAYER                                                │
│  • Auto-discover integrations                                  │
│  • Build target/environment registry                           │
│  • Share between client/server                                 │
├─────────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                             │
│  • Target environment definitions                              │
│  • Target implementations                                      │
│  • External system connections                                 │
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

### Integration Layer (`/integration`)

Developers define target environments (external systems) and targets (specific actions) using TypeScript schemas. These schemas specify what arguments are needed and what script should execute.

**Key Benefit**: New integrations can be added without modifying core METIS code.

### Registry Layer (`/shared` & `/server`)

At startup, METIS scans the integration folder and builds a registry of all available target environments and their targets. This registry is shared between client and server.

**Key Benefit**: Automatic discovery means no manual registration required.

### Execution Layer (`/server`)

When an effect executes during a session, METIS creates a secure context and runs the target's script with user-provided arguments.

**Key Benefit**: External systems can be affected while maintaining security and isolation.

## Key Concepts

- **Target Environment**: An external system that METIS can integrate with (e.g., "Traffic Control System")
- **Target**: A specific action within an environment (e.g., "Change Traffic Light")
- **Effect**: A configured target with user-provided arguments, ready to execute
- **Context**: The secure execution environment that target scripts run within

## Quick Example

```typescript
// 1. Create your target environment in "/integration/target-env/traffic-control-system/schema.ts"
const myEnvironment = new TargetEnvSchema({
  name: 'Traffic Control System',
  description: 'Integration with city traffic management',
  version: '1.0.0',
})

// 2. Define a target in "/integration/target-env/traffic-control-system/targets/traffic-light/schema.ts"
const changeLight = new TargetSchema({
  name: 'Change Traffic Light',
  script: async (context) => {
    // Call external API to change light
  },
  args: [
    {
      _id: 'color',
      name: 'Light Color',
      type: 'dropdown',
      required: true,
      options: [
        {
          _id: 'green',
          name: 'Green',
          value: 'green',
        },
        {
          _id: 'red',
          name: 'Red',
          value: 'red',
        },
        {
          _id: 'yellow',
          name: 'Yellow',
          value: 'yellow',
        },
      ],
    },
  ],
})

// 3. METIS automatically discovers this target at startup
// 4. Users can create effects from this target in mission editor
// 5. During mission execution, the script runs with user's chosen color
```

## Related Documentation

- **[Target Environment Integration Guide](guides/index.md)** - Step-by-step guide for integrating external systems
- **[Quickstart Guide](quickstart.md)** - Get started with your first integration
- **[API Reference](/docs/api/overview.md)** - Complete API documentation
- **[Examples](examples/index.md)** - Real-world integration examples
