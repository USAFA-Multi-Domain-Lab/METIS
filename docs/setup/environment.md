# METIS Environment Configuration

## Configuration Architecture

For the web server to properly connect to the database, the environment for METIS must be configured correctly so that the web server knows how to connect.

Go into the `config` directory in your METIS project. You will find several files such as:

- `prod.env` and `prod.defaults.env`
- `dev.env` and `dev.defaults.env`
- `test.env` and `test.defaults.env`
- `docker.defaults.env`

To configure your environment, edit the appropriate `.env` file for your deployment (for example, `prod.env` for production, which is standard for this setup). **Do not edit the `*.defaults.env` files directly.** Override values by setting them in the corresponding `.env` file.

> Configuration for Docker is unique to other setups. The .env file should instead be place in the root directory with the name `.env` See the [Docker Setup](/docs/setup/index.md#docker-setup) guide for detailled information.

## Configuration Options

All available environment options are outlined below (example for `prod.env`):

```env
PORT=8080                        # Default: 8080 (Optional)
MONGO_DB='metis'                 # Default: "metis" (Optional)
MONGO_HOST='localhost'           # Default: "localhost" (Optional) 🐳❌
MONGO_PORT=27017                 # Default: 27017 (Optional) 🐳❌
MONGO_USERNAME='<your-username>' # Required
MONGO_PASSWORD='<your-password>' # Required
FILE_STORE_DIR='./files/store'   # Default: "./files/store" (Optional) 🐳❌
HTTP_RATE_LIMIT=20               # Default: 20 (Optional)
HTTP_RATE_LIMIT_DURATION=1       # Default: 1 (second) (Optional)
WS_RATE_LIMIT=10                 # Default: 10 (Optional)
WS_RATE_LIMIT_DURATION=1         # Default: 1 (second) (Optional)


# Note: Options marked with 🐳❌ will not function properly with Docker setups. If using Docker, do not configure these values if using the native docker-compose provided with the project.
```

All properties are optional except for `MONGO_USERNAME` and `MONGO_PASSWORD`, which are required due to the authentication restrictions set up.

**After editing your `.env` file, restart the METIS server for changes to take effect.**
