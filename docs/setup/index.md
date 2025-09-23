# METIS Setup & Installation

Complete setup guides for installing and configuring METIS in different environments. Choose your platform and follow the step-by-step instructions to get METIS running.

## 🎯 Choose Your Platform

### **[Debian Setup](debian.md)** - Linux/Server Installation

**Best for:** Production deployments, server environments, Linux users

- **Separate database and web servers** - Scalable architecture
- **MongoDB configuration** - Security and authentication setup
- **systemd service management** - Auto-start and monitoring
- **Environment configuration** - Production-ready settings

### **[Windows Setup](windows.md)** - Desktop Installation

**Best for:** Development, testing, Windows environments

- **Single-machine deployment** - Database and web server together
- **GUI-based installation** - Windows installer packages
- **Service management** - Windows Services integration
- **Development-friendly** - Quick setup for testing

## 📋 Pre-Setup Planning

### System Requirements

- **Node.js** 18+ for the web server
- **MongoDB** 6.0+ for data storage
- **Network access** for multi-server deployments
- **Storage space** for file uploads and database

### Architecture Decisions

- **Single vs. Multi-server** - Co-located or separated database/web server
- **Security requirements** - Authentication, network isolation, HTTPS
- **Backup strategy** - Database backup location and frequency
- **Environment type** - Development, testing, or production

### Pre-Installation Checklist

- [ ] Determine deployment architecture (single/multi-server)
- [ ] Plan network configuration and firewall rules
- [ ] Choose MongoDB authentication strategy
- [ ] Prepare environment variables and configuration
- [ ] Plan backup and monitoring approach

## ✅ Post-Setup Validation

After completing setup, verify your installation:

### Basic Functionality

- [ ] METIS web interface loads at configured URL
- [ ] User can create account and log in
- [ ] Database connection is working (check server logs)
- [ ] File upload functionality works

### Production Readiness

- [ ] MongoDB authentication is enabled and working
- [ ] Automatic database backups are configured
- [ ] Server starts automatically on system boot
- [ ] Log files are being generated
- [ ] Environment variables are properly secured

## 🔧 Common Issues

### Connection Problems

- **Database connection failed** → Check MongoDB service status and network configuration
- **Web server won't start** → Verify Node.js version and environment variables
- **Can't access from other machines** → Check firewall rules and bind addresses

### Authentication Issues

- **Can't create first user** → Verify database permissions and connection
- **Session timeouts** → Check session configuration in environment variables
- **Permission errors** → Verify file system permissions for METIS directories

## Related Documentation

- **[API Documentation](/docs/api/index.md)** - Integration and automation after setup
- **[Developer Documentation](/docs/devs/index.md)** - Architecture and development info
- **[Target Environment Integration](/docs/target-env-integration/index.md)** - Custom integrations
- **[Changelog](/docs/changelog.md)** - Version history and updates
