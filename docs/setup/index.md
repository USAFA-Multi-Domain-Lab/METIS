# METIS Setup & Installation

Complete setup guides for installing and configuring METIS in different environments. Choose your platform and follow the step-by-step instructions to get METIS running.

### System Requirements

- **Network access** for downloading dependencies and updates
- **Port availability** for web server access
- **Variable storage space** for file uploads and database

## 🎯 Choose Your Platform

### **Ubuntu 24 Setup**

A command-line installer is available to set up METIS on Ubuntu 24.04 dedicated instances. This will install and configure the following software:

- **Node.js v22** - The language on which METIS is built
- **MongoDB v8** - The database service METIS used to store persistent data (missions, users, file metadata)
- **METIS Web Server** - The core application service
- **METIS CLI** - Command-line interface for managing METIS services (start/stop server)

To begin, run this command on a fresh Ubuntu 24.04 install to set up METIS:

```bash
curl -o /tmp/ubuntu-24-installer.sh https://raw.githubusercontent.com/USAFA-Multi-Domain-Lab/METIS-Deployment-Tools/master/ubuntu-24-installer.sh && chmod +x /tmp/ubuntu-24-installer.sh && sudo /tmp/ubuntu-24-installer.sh && rm /tmp/ubuntu-24-installer.sh
```

Once complete, METIS will be set up as a service and will start automatically on boot. You can control the METIS server using the following commands:

```bash
metis start
metis stop
metis restart
metis status
```

> MongoDB users are auto-generated during installation. With the correct permissions, you can retrieve the credentials for these users from `/root/.metis-credentials.txt`.

---

### **Docker Setup**

For Docker installations, we provide a `docker-compose.yml` file to set up METIS along with its dependencies. This method is ideal for quick deployments and testing. Follow this step-by-step guide to get started:

1. Ensure you have Docker and Docker Compose installed on your system.
2. Clone the METIS repository and navigate to the root directory of the project.

```bash
git clone https://github.com/USAFA-Multi-Domain-Lab/METIS-Modular-Effects-based-Transmitter-for-Integrated-Simulations.git
cd METIS-Modular-Effects-based-Transmitter-for-Integrated-Simulations
```

> If you don't have Git, you may also download the repository as a ZIP file, extract it, and navigate into the extracted folder.

3. Optional, but recommended for production deployments. Create a `.env` file in the root directory to override default environment variables. Example contents:

```env
PORT=8083
MONGO_INITDB_ROOT_USERNAME='admin'
MONGO_INITDB_ROOT_PASSWORD='adminpass'
MONGO_USERNAME='metis-server'
MONGO_PASSWORD='metispass'
```

> Make sure to adjust the values as needed for your deployment. Whatever you set for the database credentials will be initialized when you build the containers. Therefore, you will need to recreate the containers if you wish to change the database credentials after the initial setup.

4. If you did create a `.env` file, ensure it is secured by running `chmod 600 .env` to restrict access.

5. Run the following command to build the METIS project with Docker Compose and start the services:

```bash
docker compose up --build -d
```

6. Confirm that the services are running:

```bash
docker compose ps
```

```bash
# Example output where services are properly running:

NAME                 IMAGE              COMMAND                  SERVICE      CREATED          STATUS                    PORTS
metis-mongodb-1      mongo:8.0.4        "docker-entrypoint.s…"   mongodb      10 minutes ago   Up 10 minutes (healthy)   27017/tcp
metis-web-server-1   metis-web-server   "docker-entrypoint.s…"   web-server   10 minutes ago   Up 10 minutes             0.0.0.0:8084->8084/tcp
```

7. The METIS web app should now be accessible on your host machine at your configured port (default is `http://localhost:8083`).

8. The following commands can be used to manage the containers:

```bash
docker compose ps # Lists information about the containers that are currently running.
docker compose start # Starts both containers.
docker compose stop # Stops both containers.
docker compose restart # Restarts both containers.
docker compose down # Stops and removes containers (Include -v to remove volumes also).
```

---

### **Windows Setup**

For Windows installations, we will soon provide both command-line and GUI installer options to simplify the setup process. For now, we have this
detailed manual installation guide that you may follow [here](windows.md).

---

## ✅ Post-Setup Validation

After completing setup, you can verify your installation with this checklist:

### Basic Functionality

- [ ] METIS web interface loads at configured URL
- [ ] User can create account and log in
- [ ] Database connection is working (check server logs)
- [ ] File upload functionality works

### Production Readiness

- [ ] MongoDB authentication is enabled and working
- [ ] Server starts automatically on system boot
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
