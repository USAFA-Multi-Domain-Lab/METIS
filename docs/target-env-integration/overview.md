# Target-Effect System Overview

The Target-Effect system enables METIS to integrate with external systems and create dynamic mission behaviors. It provides a simple way to define reusable operations that users can configure and execute during missions.

## What Problem Does It Solve?

METIS missions need to interact with external systems - APIs, databases, traffic lights, etc. The Target-Effect system makes this possible without requiring users to write code or modify METIS itself.

## Core Concepts

### 🎯 **Target Environments**

Groups of related functionality representing integrated systems:

- **Two-Way** - Bidirectional between METIS and your system
- **Open-Ended** - Build it your way
- **Distributable** - Take it and install anywhere

### 🔧 **Targets**

Specific actions you can perform within an environment:

- **Reusable** - Define once, use many times
- **Configurable** - Accept arguments for customization
- **Executable** - Contain scripts that run during mission sessions

### ⚡ **Effects**

User-configured instances of targets ready for execution:

- **Mission-Specific** - Created within the mission editor
- **User-Friendly** - Configured through auto-generated forms
- **Real-Time** - Execute during missions with customizable feedback

## How It Works

The system operates in three clear phases:

1. **Development** - Developers define target environments and targets (templates)
2. **Configuration** - Users create effects from targets in the mission editor (instances)
3. **Execution** - Effects run automatically during mission sessions (real-time)

```
📝 DEVELOPMENT PHASE        👤 USER PHASE           🚀 MISSION PHASE
(Developers)               (Mission Planners)      (During Missions)

┌─────────────────┐       ┌─────────────────┐      ┌─────────────────┐
│ Create Target   │  ──►  │ Configure       │ ──►  │ Execute Effects │
│ Environments    │       │ Effects         │      │ in Real-Time    │
│ & Targets       │       │ (fill forms)    │      │                 │
└─────────────────┘       └─────────────────┘      └─────────────────┘
         │                         │                        │
         │                         │                        │
    Write code once           Pick & configure         Run automatically
```

### Concept Relationships

```
Target Environment
      │
      └── Contains multiple Targets (templates)
                    │
                    └── Users configure into Effects (instances)
                                  │
                                  └── Execute during Missions
```

**Example Flow:**

- Developer creates "Drone Controller" environment with "Checkpoint" target
- Mission planner configures "Navigate to Point of Interest" effect with specific coordinates
- During mission, effect is enacted and actually invokes the drone to navigate to the specified location

## Key Benefits

- **🔄 Reusability** - Define operations once, use everywhere
- **🛡️ Safety** - Type-safe with validation at every step
- **🚀 Extensibility** - Add new integrations without modifying METIS
- **👥 User-Friendly** - Configure complex integrations through simple forms
- **📊 Real-Time** - Immediate feedback during execution

## Quick Example

```typescript
// 1. Developer defines a target for manipulating traffic lights
const changeLight = new TargetSchema({
  _id: 'traffic-light'
  name: 'Traffic Light',
  script: async (context) => {
    // Call traffic API with user's chosen color
    await fetch('/traffic-api', {
      method: 'POST',
      body: { color: context.effect.args.color },
    })
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

// 2. User creates effect in mission editor by selecting target and choosing color
// 3. During mission, effect executes and changes the traffic light
```

## Common Use Cases

- **External APIs** - Control traffic systems, building automation, etc.
- **Mission Modification** - Change node states, costs, success rates
- **Output Management** - Send messages to different displays
- **File Operations** - Grant/revoke access to mission files
- **Custom Logic** - Tailor to domain-specific requirements

## Related Documentation

- **[Architecture](architecture.md)** - High-level system design overview
- **[Quick Start](quickstart.md)** - Create a quick, simple target-environment integration
- **[Examples](examples/)** - Real-world integration examples
