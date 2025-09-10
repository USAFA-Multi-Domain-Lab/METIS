# METIS API Documentation

Complete REST API reference for integrating with METIS programmatically. All METIS functionality is accessible through these endpoints, enabling custom integrations, automation, and third-party applications.

## Quick Start

**New to the METIS API?** Start here:

1. **[API Overview](overview.md)** → Understand authentication and basics
2. **[Missions API](missions.md)** → Create and manage training missions
3. **[Sessions API](sessions.md)** → Launch and control mission sessions
4. **[Users API](users.md)** → Manage participants and permissions

**Base URL:** `/api/v1/`  
**Authentication:** Express sessions with HTTP-only cookies

## 🎯 Common Workflows

### Mission Management

- **[Missions API](missions.md)** - Create, update, and manage training scenarios
- **[Sessions API](sessions.md)** - Launch missions and control real-time sessions
- **[Target Environments API](target-environments.md)** - Manage external integrations

### User & Access Control

- **[Users API](users.md)** - Manage user accounts and permissions
- **[Logins API](logins.md)** - Handle authentication and session management

### Data & Resources

- **[Files API](files.md)** - Upload, manage, and control access to mission files
- **[Info API](info.md)** - System information and health monitoring

## 🔧 Technical Reference

### Core Concepts

- **[API Overview](overview.md)** - Authentication, rate limiting, and response codes
- **Base URL:** `/api/v1/` for all endpoints
- **Default Rate Limits:** 20 requests/second per IP for HTTP, 10 messages/second per user for WebSocket

### Integration Patterns

- **REST + WebSocket hybrid** - Use REST for CRUD operations, WebSocket for real-time updates
- **Session-based auth** - Login via REST, maintain session for subsequent requests
- **Permission-based access** - Each endpoint requires specific user permissions

## Related Documentation

- **[Setup Instructions](/docs/setup/index.md)** - Install METIS before using the API
- **[Developer Documentation](/docs/devs/index.md)** - Architecture and development patterns
- **[WebSocket Documentation](/docs/devs/websocket.md)** - Real-time communication patterns
- **[Target Environment Integration](/docs/target-env-integration/index.md)** - Create custom integrations
