# Technical References

Complete API documentation and technical specifications for target environment development. Use these references when you need exact details about schemas, methods, or configuration options.

## 🔌 Runtime APIs

### **[Context API](context-api.md)** - Your main runtime interface
Everything available during target execution:
- Context object properties and methods
- File system and network access
- WebSocket communication and state management

### **[REST API](rest-api.md)** - HTTP integration patterns  
Server communication and configuration:
- Target environment management endpoints
- Authentication flows and security
- Request/response formats and error handling

## 📋 Data Structures & Configuration

### **[Schema Documentation](schemas.md)** - TypeScript types and validation
Exact specifications for all data structures:
- Target environment and definition schemas
- Argument type specifications and validation rules
- Interface definitions for custom components

### **[Environment Configuration](environment-configuration.md)** - Setup and deployment
Configuration reference for all environments:
- Environment variables and setup parameters
- Configuration file formats and validation
- Runtime options and deployment considerations

## 🎯 Quick Lookup

| Need to... | Use this reference |
|------------|-------------------|
| Access files or network | [Context API](context-api.md) |
| Define argument types | [Schema Documentation](schemas.md) |
| Configure environments | [Environment Configuration](environment-configuration.md) |
| Integrate with server | [REST API](rest-api.md) |

## Related Documentation

- **[Implementation Guides](../guides/index.md)** - Step-by-step tutorials using these APIs
- **[Examples](../examples/index.md)** - See these references in working code  
- **[Migration Guide](../guides/migrations.md)** - Version management patterns
- **[REST API Endpoints](/docs/api/target-environments.md)** - Server-side API documentation
