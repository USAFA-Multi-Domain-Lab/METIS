# METIS Architecture

METIS is a real-time training system: a Node.js server holding live session state, a React client, and MongoDB behind it. This page describes how those pieces fit together and introduces the concepts a developer needs before reading the API or WebSocket references.

## Table of Contents

- [System Overview](#system-overview)
- [Missions, Sessions, and Realms](#missions-sessions-and-realms)
  - [The Realm Model](#the-realm-model)
  - [What a Realm Owns](#what-a-realm-owns)
- [Backend Services](#backend-services)
  - [API](#api)
  - [WebSocket](#websocket)
  - [Database](#database)
  - [Target-Effect System](#target-effect-system)
- [Frontend Application](#frontend-application)
  - [Core Features](#core-features)
  - [State Management](#state-management)
- [System Data Flow](#system-data-flow)
  - [Request and Response](#request-and-response)
  - [Real-Time Updates](#real-time-updates)
  - [Target-Effect Lifecycle](#target-effect-lifecycle)
- [Key Interactions](#key-interactions)
  - [Data Flow](#data-flow)
  - [Security Layer](#security-layer)
  - [Failure Handling](#failure-handling)
- [Related Documentation](#related-documentation)

## System Overview

- **Node.js / Express** backend server
- **React** single-page application frontend, in TypeScript
- **MongoDB** with Mongoose for persistence
- **Socket.IO** for real-time communication between client and server

Sessions are held in memory on the server rather than in the database. A session exists for as long as the process that launched it, which is one reason METIS runs as a single process — see [Session Cookies](../api/logins.md#session-cookies).

## Missions, Sessions, and Realms

Three concepts sit at the center of the system, and the distinction between the second and third is the one most likely to cause confusion.

| Concept | What it is                                                                 |
| ------- | -------------------------------------------------------------------------- |
| Mission | The authored scenario, stored in MongoDB — forces, nodes, actions, effects |
| Session | A live instance of a mission, with its members and configuration           |
| Realm   | An isolated, playable copy of the mission inside that session              |

### The Realm Model

A **realm** is a parallel copy of a mission within a session — usefully thought of as an alternate timeline for it. The session holds an **authoring template** of the mission; realms are minted from that template and are where play actually happens.

How many realms a session has depends on its mode:

- **Multiplayer** — exactly one realm, a full copy of the launched mission, shared by everyone. Here the realm's mission and the session's template are the same object.
- **Standalone** — one realm per participant, each containing only that participant's assigned force. Participants cannot see or affect one another.

Every member is subscribed to exactly one realm at a time. A manager or observer may switch between them, which is what the `request-switch-realm` and `realm-switched` events on the [WebSocket API](websocket.md) exist for. When a member's realm cannot be resolved, they land in the session's **default realm** — a deliberately blank realm that acts as the system's equivalent of a 404 page.

### What a Realm Owns

The practical consequence of the realm model is that **a realm, not the session, is the unit of gameplay state.** Resolving a force, node, or action for a member goes through that member's realm rather than the session's template.

A realm owns its own copy of the mission and everything mutable derived from it. That extends to target-environment storage, which is scoped in three tiers:

| Store         | Scope                                         |
| ------------- | --------------------------------------------- |
| `localStore`  | One realm, within one target environment      |
| `realmStore`  | One realm, across all target environments     |
| `globalStore` | The whole session instance, across all realms |

In a standalone session this means `localStore` no longer sees data from other participants — `globalStore` is the only store that crosses realms. Integrations that assume a single shared world need to account for this; see [Target Environment Integration](../target-env-integration/index.md).

Realms are a sibling of sessions and members, not a component inside a mission. A realm _owns_ a mission rather than living within one.

## Backend Services

### API

- RESTful endpoints for CRUD operations
- Express session-based authentication in HTTP-only cookies
- Rate limiting and permission-based access control
- Environment-specific configuration
- [API Documentation](../api/overview.md)

### WebSocket

- Real-time mission and session updates over Socket.IO
- Client connection management, tied to the user's login
- Everything that happens inside a running session: joining, starting, executing effects, switching realms
- [WebSocket Documentation](websocket.md)

### Database

- MongoDB with the Mongoose ODM
- Express session storage
- Automated backups
- Schema versioning, with migrations applied on startup — see [Backups](backups.md)

### Target-Effect System

- Target environments are registered integrations, discovered by the server at startup
- A **target** declares **parameters**; an **effect** supplies **arguments** for them
- Effects execute over the WebSocket connection during a session
- Argument reconciliation and versioned migrations keep existing effects working as targets change
- Validation logic is shared between client and server
- Environment data stores are realm-scoped, as described above

## Frontend Application

### Core Features

- React SPA with TypeScript
- Socket.IO client for real-time updates
- Modular component architecture
- Responsive design

### State Management

- React Context API
- Global application state
- Component-local state
- Real-time synchronization with the server

## System Data Flow

### Request and Response

```text
┌─────────────┐    HTTP/REST     ┌─────────────┐    MongoDB     ┌─────────────┐
│   Client    │ ────────────────▶│   Server    │ ──────────────▶│  Database   │
│ (React SPA) │                  │ (Node.js)   │                │ (MongoDB)   │
│             │ ◀────────────────│             │ ◀──────────────│             │
└─────────────┘    JSON Data     └─────────────┘  Query Results └─────────────┘
```

### Real-Time Updates

```text
┌─────────────┐                  ┌─────────────┐                ┌─────────────┐
│  Client A   │                  │   Server    │                │  Client B   │
│             │ ──WebSocket────▶ │             │ ──WebSocket──▶ │             │
│ (Mission    │    Action        │ (Processes  │   Broadcast    │ (Receives   │
│  Control)   │                  │  & Updates) │   Update       │  Update)    │
└─────────────┘                  └─────────────┘                └─────────────┘
```

### Target-Effect Lifecycle

```text
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   Development       │         │   Configuration     │         │    Execution        │
│                     │         │                     │         │                     │
│ 1. Define target    │ ──────▶ │ 4. Author creates   │ ──────▶ │ 7. Effect executes  │
│    environment      │         │    effect from      │         │    during session   │
│                     │         │    target           │         │                     │
│ 2. Declare targets  │         │                     │         │ 8. Real-time        │
│    and parameters   │         │ 5. Supply           │         │    feedback via     │
│                     │         │    arguments        │         │    WebSocket        │
│ 3. Server auto-     │         │                     │         │                     │
│    discovers &      │         │ 6. Save to mission  │         │ 9. Update realm     │
│    registers        │         │                     │         │    state            │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

## Key Interactions

### Data Flow

1. REST API for CRUD operations
2. WebSocket for real-time updates and all in-session activity
3. Session-based authentication
4. Role-based access control

### Security Layer

- Express sessions in HTTP-only cookies
- Three authentication levels: signed in, holding a connection, joined to a session
- Permission-based access control
- Rate limiting on both HTTP and WebSocket traffic

### Failure Handling

An unhandled promise rejection does not end the process. It is logged instead, so a single stray rejection in one request handler cannot take down a server holding live sessions for everyone else. A failure while handling a session request is reported back to the member who made it.

## Related Documentation

- [RESTful API](../api/overview.md) - Endpoints, authentication, and data models
- [WebSocket](websocket.md) - Real-time communication protocols and events
- [Target Environment Integration](../target-env-integration/index.md) - Creating and registering target environments
- [Backups](backups.md) - Database backups and schema migration
- [Style Guide](style-guide.md) - Coding standards and conventions
