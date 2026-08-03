# METIS API Documentation

REST API reference for integrating with METIS programmatically — building missions, managing users, launching sessions, and handling files. What happens *inside* a running session is driven over the [WebSocket connection](../devs/websocket.md) instead.

## Quick Start

**New to the METIS API?** Start here:

1. **[API Overview](overview.md)** → Understand authentication and basics
2. **[Missions API](missions.md)** → Create and manage training missions
3. **[Sessions API](sessions.md)** → Launch and control mission sessions
4. **[Users API](users.md)** → Manage participants and permissions

The remaining references are the [Files API](files.md), the [Logins API](logins.md), the [Target Environments API](target-environments.md), and the [Info API](info.md).

**Base URL:** `/api/v1/`  
**Authentication:** Express sessions with HTTP-only cookies

## 🎯 Common Workflows

### Mission Management

- **[Missions API](missions.md)** - Create, update, and manage training scenarios
- **[Sessions API](sessions.md)** - Launch missions and control real-time sessions
- **[Target Environments API](target-environments.md)** - Read the registry and migrate effect arguments

### User & Access Control

- **[Users API](users.md)** - Manage user accounts and permissions
- **[Logins API](logins.md)** - Handle authentication and session management

### Data & Resources

- **[Files API](files.md)** - Upload, read, download, and delete files
- **[Info API](info.md)** - Version, changelog, and credits

## 🔧 Technical Reference

### Core Concepts

- **[API Overview](overview.md)** - Authentication, rate limiting, and response codes
- **Base URL:** `/api/v1/` for all endpoints
- **Default Rate Limits:** 100 requests/second per IP for HTTP, 100 messages/second per user for WebSocket

### Integration Patterns

- **REST + WebSocket hybrid** - Use REST for CRUD operations, WebSocket for real-time updates
- **Session-based auth** - Login via REST, maintain session for subsequent requests
- **Permission-based access** - Most endpoints require specific permissions; the logins and info endpoints do not

## Related Documentation

- **[Setup Instructions](../setup/index.md)** - Install METIS before using the API
- **[Developer Documentation](../devs/index.md)** - Architecture and development patterns
- **[WebSocket Documentation](../devs/websocket.md)** - Real-time communication patterns
- **[Target Environment Integration](../target-env-integration/index.md)** - Create custom integrations
