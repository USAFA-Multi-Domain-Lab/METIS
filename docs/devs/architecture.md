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
- [WebSocket Documentation](/docs/devs/websocket.md)

#### Database

- MongoDB with Mongoose ODM
- Session storage
- Automated backups
- Schema versioning

#### Target Environments

- Pluggable training simulations
- Dynamic environment registration
- Real-time state synchronization

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
- [WebSocket](/docs/devs/websocket.md) - Real-time communication protocols and events
- [Target Environment Integration](/docs/devs/target-environment-integration.md) - How to create and register new target environments

### Development Guidelines

- [Style Guide](style-guide.md) - Coding standards and best practices
