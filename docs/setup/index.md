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

> **Note:** This installer has only been tested on fresh Ubuntu 24.04 installations. This is not to say that it won't work on other Debian-based distributions. Feel free to experiment at your own risk.

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

> **Note:** MongoDB users are auto-generated during installation. With the correct permissions, you can retrieve the credentials for these users from `/root/.metis-credentials.txt`.

The METIS web app should now be accessible on your host machine at your configured port (default is `http://localhost:8080`). You can now access the web app in the browser. To log in, a temporary user has been created with the following credentials:

```
Username: admin
Password: temppass
```

From there you will be prompted to reset your password to something permanent and more secure. You can now begin using METIS!

---

### **Docker Setup**

For Docker installations, we provide a `docker-compose.yml` file to set up METIS along with its dependencies. This method is ideal for quick deployments and testing. Follow this step-by-step guide to get started:

**Step 1:** Ensure you have Docker and Docker Compose installed on your system.

**Step 2:** Clone the METIS repository and navigate to the root directory of the project.

```bash
git clone https://github.com/USAFA-Multi-Domain-Lab/METIS
cd METIS
```

> **Note:** If you don't have Git, you may also download the repository as a ZIP file, extract it, and navigate into the extracted folder.

**Step 3:** Create a `.env` file in the root directory.

**Step 4:** Optional, but recommended for production deployments. Add custom environment
variables to the `.env` file to override default settings:

```env
PORT=8083
MONGO_INITDB_ROOT_USERNAME='admin'
MONGO_INITDB_ROOT_PASSWORD='adminpass'
MONGO_USERNAME='metis-server'
MONGO_PASSWORD='metispass'
```

> **Note:** Whatever you set for the database credentials will be initialized when you build the containers. Therefore, you will need to recreate the containers if you wish to change the database credentials after the initial setup. Make sure to update the file permissions for your `.env` file to restrict access to authorized users only, as it contains sensitive information.

> **Note:** See the [Environment Configuration Guide](environment.md#configuration-options) for additional settings which can be configured from this file.

**Step 5:** Run the following command to build the METIS project with Docker Compose and start the services:

```bash
docker compose up --build -d
```

**Step 6:** Confirm that the services are running:

```bash
docker compose ps
```

```bash
# Example output where services are properly running:

NAME                 IMAGE              COMMAND                  SERVICE      CREATED          STATUS                    PORTS
metis-mongodb-1      mongo:8.0.4        "docker-entrypoint.s…"   mongodb      10 minutes ago   Up 10 minutes (healthy)   27017/tcp
metis-web-server-1   metis-web-server   "docker-entrypoint.s…"   web-server   10 minutes ago   Up 10 minutes             0.0.0.0:8083->8083/tcp
```

To manage the Docker containers, you can use the following commands:

```bash
docker compose ps # Lists information about the containers that are currently running.
docker compose start # Starts both containers.
docker compose stop # Stops both containers.
docker compose restart # Restarts both containers.
docker compose down # Stops and removes containers (Include -v to remove volumes also).
```

**Step 7:** The METIS web app should now be accessible on your host machine at your configured port (default is `http://localhost:8083`). You can now access the web app in the browser. To log in, a temporary user has been created with the following credentials. Afterwards, you will be prompted to reset your password to something permanent and more secure:

```
Username: admin
Password: temppass
```

You can now begin using METIS!

> **Note:** METIS is served over plain HTTP at this point. To serve it over HTTPS instead, continue with [Docker HTTPS Setup](#docker-https-setup-optional) below.

---

### **Docker HTTPS Setup (Optional)**

This section continues from the Docker setup above and applies only to Docker deployments. By default, those serve plain HTTP. HTTPS is provided by an optional `caddy` service, a reverse proxy that terminates TLS in front of the METIS web server. METIS itself continues to speak HTTP on the internal Docker network, so no certificates are configured in the application.

**Step 1:** Choose how this deployment will obtain its certificate.

| `SSL_MODE`         | Use when                                                                        |
| ------------------ | ------------------------------------------------------------------------------- |
| `staging`          | Bringing up a new site for the first time. See the note on rate limits below.   |
| `acme` _(default)_ | The domain resolves publicly and port 80 or 443 is reachable from the internet. |
| `internal`         | There is no public DNS, and a root certificate can be distributed to clients.   |
| `file`             | Your organization issues certificates from its own PKI.                         |

**Step 2:** Add the HTTPS settings to the `.env` file created in Step 3:

```env
COMPOSE_PROFILES=tls
BIND_ADDRESS=127.0.0.1
DOMAIN='metis.example.com'
SSL_MODE='staging'
TRUST_PROXY=true
```

`COMPOSE_PROFILES=tls` is what starts the `caddy` service; without it, nothing in this section takes effect. `BIND_ADDRESS=127.0.0.1` restricts the METIS web server to the loopback interface so that it is reachable only through the proxy. `TRUST_PROXY=true` lets METIS recognize proxied requests as encrypted, so that session cookies are marked secure.

> **Note:** `TRUST_PROXY` does not mean trusting proxies in general. METIS trusts exactly one hop, the proxy it is directly connected to, and disregards forwarding details claimed by anything beyond it. Set it only where a proxy really is in front of the server. On a deployment reached directly, the machine connecting is the client itself, and enabling this would let it claim an encrypted connection and an address of its choosing.

If you are supplying your own certificates, also set the directory holding them. The files must be named `server.crt` and `server.key`:

```env
SSL_MODE='file'
SSL_DIR='/etc/metis/tls'
```

> **Note:** If including a custom `PORT` in `.env`, it cannot be set to `80` or `443` when the `tls` profile is active, as both collide with the ports the proxy publishes and the containers will fail to start. `PORT` must also be set in `.env` rather than exported in your shell, otherwise the published port and the port METIS actually listens on will disagree.

**Step 3:** Ensure ports 80 and 443 are available on the host and permitted through its firewall, then start the services with the same command as before:

```bash
docker compose up --build -d
```

**Step 4:** Confirm the proxy started and obtained a certificate:

```bash
docker compose ps          # a caddy container is now listed alongside the others
docker compose logs caddy  # look for "certificate obtained successfully"
```

METIS is now served over HTTPS at your configured domain. Requests over HTTP are redirected automatically.

> **Note:** Automatic certificates require the domain in `DOMAIN` to resolve publicly to this host, port 80 or 443 to be reachable from the internet, and outbound access to Let's Encrypt. Deployments with no inbound path from the internet should use `internal` or `file` instead.

> **Note:** Let's Encrypt allows only five failed validations per hostname per hour. A wrong DNS record or a closed firewall port can exhaust that allowance while you are still diagnosing the problem. Deploy with `SSL_MODE='staging'` first, which validates identically but has no practical rate limit, then switch to `acme` once the logs confirm a certificate was obtained. Certificates issued by `staging` are not trusted by browsers, so a certificate warning at this stage is expected and indicates success.

> **Note:** With `SSL_MODE='internal'`, clients will show a certificate warning until they trust Caddy's root certificate. Copy it out with `docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./root.crt`.

> **Note:** With `SSL_MODE='file'`, replacing the certificate files does not take effect until Caddy re-reads them. Run `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` after installing a renewed certificate.

---

### **Windows Setup**

A command-line installer is available to set up METIS on Windows dedicated instances. This will install and configure the following software:

- **Node.js v22** - The language on which METIS is built
- **MongoDB v8** - The database service METIS used to store persistent data (missions, users, file metadata)
- **METIS Web Server** - The core application service
- **METIS CLI** - Command-line interface for managing METIS services (start/stop server)

> **Note:** This installer has only been tested on fresh Windows 11 installations. This is not to say that it won't work on other Windows versions. Feel free to experiment at your own risk.

To begin, connect to a fresh Windows 11 install and run PowerShell as Administrator. Then, run this command to set up METIS:

```PowerShell
iwr -Uri "https://raw.githubusercontent.com/USAFA-Multi-Domain-Lab/METIS-Deployment-Tools/master/windows-installer.ps1?t=$(Get-Date -UFormat %s)" -OutFile "$env:TEMP\metis-installer.ps1"; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & "$env:TEMP\metis-installer.ps1"; Remove-Item "$env:TEMP\metis-installer.ps1" -Force -ErrorAction SilentlyContinue
```

Once complete, METIS will be set up as a service and will start automatically on boot. You can control the METIS server using the following commands:

```bash
metis start
metis stop
metis restart
metis status
```

> **Note:** MongoDB users are auto-generated during installation. With the correct permissions, you can retrieve the credentials for these users from `C:\ProgramData\METIS\.metis-credentials.txt`.

The METIS web app should now be accessible on your host machine at your configured port (default is `http://localhost:8080`). You can now access the web app in the browser. To log in, a temporary user has been created with the following credentials:

```
Username: admin
Password: temppass
```

From there you will be prompted to reset your password to something permanent and more secure. You can now begin using METIS!

---

### **Windows Uninstallation**

To remove METIS from your Windows machine, an uninstaller script is available which will remove METIS entirely from the system. You will be prompted to optionally remove MongoDB and NodeJS as well, or keep them for other purposes. To uninstall METIS, run PowerShell as Administrator and execute the following command:

```PowerShell
iwr -Uri "https://raw.githubusercontent.com/USAFA-Multi-Domain-Lab/METIS-Deployment-Tools/master/windows-uninstaller.ps1?t=$(Get-Date -UFormat %s)" -OutFile "$env:TEMP\metis-uninstaller.ps1"; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & "$env:TEMP\metis-uninstaller.ps1"; Remove-Item "$env:TEMP\metis-uninstaller.ps1" -Force -ErrorAction SilentlyContinue
```

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
- [ ] If HTTPS is enabled, the site loads over `https://` and HTTP requests redirect to it
- [ ] If HTTPS is enabled, a session can be launched or joined (confirms WebSocket connections pass through the proxy)

## 🔧 Common Issues

### Connection Problems

- **Database connection failed** → Check MongoDB service status and network configuration
- **Web server won't start** → Verify Node.js version and environment variables
- **Can't access from other machines** → Check firewall rules and bind addresses

### Authentication Issues

- **Can't create first user** → Verify database permissions and connection
- **Session timeouts** → Check session configuration in environment variables
- **Permission errors** → Verify file system permissions for METIS directories

### HTTPS and Certificates

These apply to Docker deployments running the `tls` profile. Check `docker compose logs caddy` first — certificate failures are reported there explicitly.

- **Containers won't start, "address already in use"** → Something else on the host holds port 80 or 443. On Windows this is usually IIS or another service on HTTP.sys. Alternatively, `PORT` is set to `80` or `443`, which collides with the proxy's own ports
- **Site still serves plain HTTP** → `COMPOSE_PROFILES=tls` is missing from `.env`, so the proxy was never started. Confirm with `docker compose ps`
- **Certificate was never issued** → The domain in `DOMAIN` must resolve publicly to this host, and port 80 or 443 must be reachable from the internet. Deployments with no inbound path should use `SSL_MODE='internal'` or `'file'`
- **Certificate requests are being refused** → Let's Encrypt rate limits took effect after repeated failures. Switch to `SSL_MODE='staging'` while diagnosing, then back to `acme`
- **"no such file or directory" for `server.crt`** → `SSL_MODE='file'` is set but `SSL_DIR` does not point at a directory containing `server.crt` and `server.key`
- **Certificate warning in the browser** → Expected with `SSL_MODE='staging'` and with `'internal'` until clients trust Caddy's root certificate
- **Renewed certificate not being served** → With `SSL_MODE='file'`, run `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`

## Related Documentation

- **[Environment Configuration](environment.md)** - Configure server port, rate limiting, file-store location, and more

- **[API Documentation](../api/index.md)** - Integration and automation after setup
- **[Developer Documentation](../devs/index.md)** - Architecture and development info
- **[Target Environment Integration](../target-env-integration/index.md)** - Custom integrations
