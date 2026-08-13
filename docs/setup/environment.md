# METIS Environment Configuration

METIS reads its settings from environment files in the `config` directory. This page covers which file to edit and every setting available.

## Table of Contents

- [Configuration Architecture](#configuration-architecture)
- [Configuration Options](#configuration-options)
- [Related Documentation](#related-documentation)

## Configuration Architecture

For the web server to properly connect to the database, the environment for METIS must be configured correctly so that the web server knows how to connect.

Go into the `config` directory in your METIS project. You will find several files such as:

- `prod.env` and `prod.defaults.env`
- `dev.env` and `dev.defaults.env`
- `test.env` and `test.defaults.env`
- `docker.defaults.env`

To configure your environment, edit the appropriate `.env` file for your deployment (for example, `prod.env` for production, which is standard for this setup). **Do not edit the `*.defaults.env` files directly.** Override values by setting them in the corresponding `.env` file.

> **Note:** Configuration for Docker is unique to other setups. The .env file should instead be place in the root directory with the name `.env` See the [Docker Setup](index.md#docker-setup) guide for detailled information.

## Configuration Options

All available environment options are outlined below (example for `prod.env`):

```env
PORT=8080                             # Default: 8080 (Optional)
MONGO_DB='metis'                      # Default: "metis" (Optional)
MONGO_HOST='localhost'                # Default: "localhost" (Optional) 🐳❌
MONGO_PORT=27017                      # Default: 27017 (Optional) 🐳❌
MONGO_USERNAME='<your-username>'      # Required
MONGO_PASSWORD='<your-password>'      # Required
FILE_STORE_DIR='./server/files/store' # Default: "./server/files/store" (Optional) 🐳❌
HTTP_RATE_LIMIT=100                   # Default: 100 (Optional)
HTTP_RATE_LIMIT_DURATION=1            # Default: 1 (second) (Optional)
WS_RATE_LIMIT=100                     # Default: 100 (Optional)
WS_RATE_LIMIT_DURATION=1              # Default: 1 (second) (Optional)
DB_BACKUPS_ENABLED=true               # Default: true (Optional)
MAX_LOGIN_ATTEMPTS=5                  # Default: 5 (Optional)
LOGIN_ATTEMPT_WINDOW=300              # Default: 300 (seconds) (Optional)
LOGIN_LOCKOUT_DURATION=900            # Default: 900 (seconds) (Optional)
TRUST_PROXY=false                     # Default: false (Optional)
SSL_KEY_PATH='<path-to-key>'          # (Optional) prod.env only. HTTPS needs both SSL paths 🐳❌
SSL_CERT_PATH='<path-to-cert>'        # (Optional) prod.env only. HTTPS needs both SSL paths 🐳❌

# Docker-Specific HTTPS configuration options
COMPOSE_PROFILES='tls'                # (Optional) Set to "tls" to serve HTTPS
BIND_ADDRESS='127.0.0.1'              # Default: "0.0.0.0" (Optional)
DOMAIN='<your-domain>'                # Default: "localhost" (Optional)
SSL_MODE='acme'                       # Default: "acme" (Optional)
SSL_DIR='<path-to-cert-directory>'    # Default: "./caddy/tls" (Optional)
HSTS_MAX_AGE=31536000                 # Default: 31536000 (seconds) (Optional)


# Note: Options marked with 🐳❌ will not function properly with Docker setups. If using Docker, do not configure these values if using the native docker-compose provided with the project.
```

All properties are optional except for `MONGO_USERNAME` and `MONGO_PASSWORD`, which are required due to the authentication restrictions set up.

Docker deployments serve HTTPS through the `caddy` service instead, configured with the Docker-specific options above. See [Docker HTTPS Setup](index.md#docker-https-setup-optional) for the full walkthrough.

**After editing your `.env` file, restart the METIS server for changes to take effect.**

## Related Documentation

- **[Setup Instructions](index.md)** - Installing METIS on your platform
- **[Database Backups](../devs/backups.md)** - What `DB_BACKUPS_ENABLED` controls
- **[Logins API](../api/logins.md)** - Session cookies and the login lockout settings
- **[API Overview](../api/overview.md)** - Where the rate-limit settings apply
