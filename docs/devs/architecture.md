# METIS Architecture

## System Overview

METIS uses a microservices architecture with:

- Node.js/Express API server
- React frontend
- MongoDB database
- Socket.IO for real-time communication

## Key Components

### Backend Services

- API Server: RESTful endpoints for CRUD operations
- WebSocket Server: Real-time mission updates
- Database Layer: MongoDB with Mongoose ODM
- Target Environment System: Pluggable simulation integrations

### Frontend Architecture

- React SPA with TypeScript
- Redux state management
- Socket.IO client for real-time updates
- Modular component structure

### Data Flow

1. Client requests via REST/WebSocket
2. API middleware validates requests
3. Business logic processed
4. Database operations executed
5. Response returned to client

### Security

- JWT authentication
- Role-based access control
- Request validation
- API rate limiting

## Development

Refer to [Style Guide](style-guide.md) for coding standards
