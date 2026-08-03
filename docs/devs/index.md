# METIS Developer Documentation

Technical documentation for developers working on the METIS core system, creating integrations, or contributing to the codebase.

## 🚀 Getting Started

**New METIS Developer?** Follow this path:

1. **[Architecture Overview](architecture.md)** → Understand the system design
2. **[Setup Guide](../setup/index.md)** → Get your development environment running
3. **[Target Environment Integration](../target-env-integration/index.md)** → Create your first integration
4. **[Style Guide](style-guide.md)** → Follow coding standards

## 🏗️ System Architecture

### **[Architecture Overview](architecture.md)** - System Design

- **Missions, sessions, and realms** - The realm model, and why gameplay state lives there rather than on the session
- **Component relationships** - How frontend, backend, and database interact
- **Target-effect system** - Integration framework architecture
- **Data flow patterns** - Request/response and real-time communication

### **[WebSocket System](websocket.md)** - Real-Time Communication

- **Event reference** - Every event METIS defines, grouped by direction and paired request to response
- **The event model** - How requests, responses, and broadcasts relate
- **Connecting** - How the handshake authenticates, and taking over an existing connection
- **Errors and rate limiting** - Error code families and the per-connection message limit

## 📝 Development Standards

### **[Style Guide](style-guide.md)** - Code Standards

- **Documentation patterns** - TSDoc standards and conventions
- **Naming conventions** - Consistent naming across TypeScript/JavaScript
- **Code organization** - File structure and import patterns

## 🗄️ Database Operations

### **[Database Backups](backups.md)** - Backup & Recovery

- **Backup schedule** - Automatic backups on startup and every 24 hours
- **Storage location** - Where backups are written on disk
- **Restoration** - How to restore from a backup using `mongorestore`
- **Interrupted migrations** - Why the server refuses to start after a migration is cut short, and how to recover

## 🔌 Integration Development

### External System Integration

- **[Target Environment Integration](../target-env-integration/index.md)** - Complete integration guide
- **[Target Environments API](../api/target-environments.md)** - REST API for managing integrations
- **[Context API](../target-env-integration/references/context-api.md)** - Runtime API reference

### Core System APIs

- **[API Documentation](../api/index.md)** - Complete REST API reference
- **[WebSocket Events](websocket.md)** - Real-time communication patterns

## Related Documentation

- **[Setup Instructions](../setup/index.md)** - Get your development environment running
- **[API Reference](../api/index.md)** - Complete REST API documentation
- **[Target Environment Integration](../target-env-integration/index.md)** - Integration development guide
- **[Database Backups](backups.md)** - How automatic backups work and how to restore them
- **[Changelog](../changelog.md)** - Release notes and version history
