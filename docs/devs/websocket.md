# WebSocket System Overview

METIS uses Socket.IO to enable real-time communication between clients and the server. This system handles:

- Session management and state synchronization
- Real-time mission updates
- Force/team coordination
- Node operations and action execution
- Live output streaming

## Core Features

### Session Management

- Secure session-based authentication
- Role-based access control
- Team (force) management
- Real-time member coordination

### Mission Control

- Live mission state updates
- Node operations and discovery
- Action execution and validation
- Resource management

### Real-time Communication

- Bi-directional event system
- Automatic reconnection handling
- Rate limiting and security controls
- Output streaming and filtering

## Authentication & Security

### Overview

- Requires active user session (via REST API)
- Uses session token for WebSocket connection
- Role-based access control and permissions
- Force-specific visibility restrictions

### Rate limiting:

- Default rate: 10 messages/second per user
- [Configurable via environment variables](/docs/setup/debian.md#step-5---configure-environment)
- Applies to all WebSocket connections
- Exceeding limits results in error events
- Rate limits are enforced per user account rather than IP

## Event Types

### Session Events

- Session lifecycle (start/end/reset)
- Member management (join/leave/kick)
- Force assignments
- Role management
- State synchronization

### Mission Events

- Node discovery and operations
- Action execution
- Resource management
- Force coordination

### System Events

- Connection management
- Error handling
- Status updates
- Output streaming

## Additional Resources

- [Architecture Documentation](architecture.md)
- [API Overview](/docs/api/overview.md)
