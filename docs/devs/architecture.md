# METIS Architecture

## System Overview

METIS is a real-time training system built with:

- Node.js/Express backend server
- React Single Page Application frontend
- MongoDB for data persistence
- Socket.IO for real-time communication

## Core Components

### Backend Services

#### API

- RESTful API endpoints for CRUD operations
- Express session-based authentication
- Rate limiting and access control
- Environment-specific configurations
- [API Documentation](/docs/api/overview.md)

#### WebSocket

- Real-time mission & session updates
- Client connection management
- Integrated with session auth
- Real-time state synchronization
- [WebSocket Documentation](websocket.md)

#### Database

- MongoDB with Mongoose ODM
- Session storage
- Automated backups
- Schema versioning

#### Target-Effect System

- Target environments provide reusable target definitions
- Targets expose configurable operations with typed arguments
- Effects combine targets with specific configurations
- WebSocket-based effect execution during sessions
- Version-controlled schema migration for compatibility
- Shared validation logic between client and server

### Frontend Application

#### Core Features

- React SPA with TypeScript
- Socket.IO for real-time updates
- Modular component architecture
- Responsive design

#### State Management

- React Context API
- Global app state
- Component-local state
- Real-time sync with backend

## 🔄 System Data Flow

### Request/Response Flow
```
┌─────────────┐    HTTP/REST     ┌─────────────┐    MongoDB     ┌─────────────┐
│   Client    │ ────────────────▶│   Server    │ ──────────────▶│  Database   │
│ (React SPA) │                  │ (Node.js)   │                │ (MongoDB)   │
│             │ ◀────────────────│             │ ◀──────────────│             │
└─────────────┘    JSON Data     └─────────────┘   Query Results └─────────────┘
```

### Real-Time Updates Flow
```
┌─────────────┐                  ┌─────────────┐                ┌─────────────┐
│  Client A   │                  │   Server    │                │  Client B   │
│             │ ──WebSocket────▶ │             │ ──WebSocket──▶ │             │
│ (Mission    │    Action        │ (Processes  │   Broadcast    │ (Receives   │
│  Control)   │                  │  & Updates) │   Update       │  Update)    │
└─────────────┘                  └─────────────┘                └─────────────┘
```

### Target-Effect System Flow
```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   Development       │         │   Configuration     │         │    Execution        │
│                     │         │                     │         │                     │
│ 1. Define Target    │ ──────▶ │ 4. User Creates     │ ──────▶ │ 7. Effect Executes  │
│    Environment      │         │    Effect from      │         │    During Mission   │
│                     │         │    Target           │         │                     │
│ 2. Create Targets   │         │                     │         │ 8. Real-time        │
│    (Templates)      │         │ 5. Configure        │         │    Feedback via     │
│                     │         │    Arguments        │         │    WebSocket        │
│ 3. Server Auto-     │         │                     │         │                     │
│    discovers &      │         │ 6. Save to Mission  │         │ 9. Update Mission   │
│    Registers        │         │                     │         │    State            │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

## Key Interactions

### Data Flow

1. REST API for CRUD operations
2. WebSocket for real-time updates
3. Session-based authentication
4. Role-based access control

### Security Layer

- Express sessions (HTTP-only cookies)
- Multi-level authentication
- Permission-based access
- Rate limiting

## Developer Resources

### Implementation Details

- [RESTful API](/docs/api/overview.md) - REST endpoints, authentication, and data models
- [WebSocket](websocket.md) - Real-time communication protocols and events
- [Target Environment Integration](/docs/target-env-integration/index.md) - How to create and register new target environments

### Development Guidelines

- [Style Guide](style-guide.md) - Coding standards and best practices
