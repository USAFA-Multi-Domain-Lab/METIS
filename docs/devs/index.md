# METIS Developer Documentation

Technical documentation for developers working on METIS core system, creating integrations, or contributing to the codebase.

## 🚀 Getting Started

**New METIS Developer?** Follow this path:

1. **[Architecture Overview](architecture.md)** → Understand the system design
2. **[Setup Guide](/docs/setup/index.md)** → Get your development environment running
3. **[Target Environment Integration](/docs/target-env-integration/index.md)** → Create your first integration
4. **[Style Guide](style-guide.md)** → Follow coding standards

## 🏗️ System Architecture

### **[Architecture Overview](architecture.md)** - System Design

- **Component relationships** - How frontend, backend, and database interact
- **Target-effect system** - Integration framework architecture
- **Data flow patterns** - Request/response and real-time communication

### **[WebSocket System](websocket.md)** - Real-Time Communication

- **Session management** - Authentication and connection handling
- **Mission control** - Live updates and coordination
- **Security model** - Rate limiting and access control

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

## 🔌 Integration Development

### External System Integration

- **[Target Environment Integration](/docs/target-env-integration/index.md)** - Complete integration guide
- **[Target Environments API](/docs/api/target-environments.md)** - REST API for managing integrations
- **[Context API](/docs/target-env-integration/references/context-api.md)** - Runtime API reference

### Core System APIs

- **[API Documentation](/docs/api/index.md)** - Complete REST API reference
- **[WebSocket Events](websocket.md)** - Real-time communication patterns

## Development Workflow

### 🛠️ Core Development

1. **System changes** → Follow architecture patterns and style guide
2. **API changes** → Update documentation and maintain compatibility
3. **Frontend changes** → Coordinate with WebSocket and REST patterns

### 🔗 Integration Development

1. **External integrations** → Use target-environment framework
2. **Custom functionality** → Extend through target-effect system
3. **Third-party APIs** → Follow security and error handling patterns

## Related Documentation

- **[Setup Instructions](/docs/setup/index.md)** - Get your development environment running
- **[API Reference](/docs/api/index.md)** - Complete REST API documentation
- **[Target Environment Integration](/docs/target-env-integration/index.md)** - Integration development guide
- **[Database Backups](backups.md)** - How automatic backups work and how to restore them
- **[Changelog](/docs/changelog.md)** - Release notes and version history
