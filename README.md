# rancho-cucamonga | airline | state-switch

### purpose

This serves as a dashboard for instructors to switch between various airline states. This provides intructors with the option of having multiple teams work in their own state and for the resulting state to be selected and viewed in Rancho Cucamonga on demand.

### installation

- have `node` (NodeJS) and `npm` (Node Package Manager) installed (`npm` installs with `node` typically).
- install `ts-node` through npm globally (`npm install -g ts-node`), as this project is written in TypeScript.
- run `npm install` in project directory to install dependencies.
- run `npm run build-react` to build React app into the static files
  that are actually served.
- run `npm run serve-prod` to run the production application.

## optional-setup

To configure the app further, a `.env` can be created in the project directory with a custom configuration. This configuration will overrite values defined in `server-config.ts`. Any values not provided will simply remain as their defaults. The syntax for setting variables in a `.env` files is simple, and like so: `variableName="example-value"`. Any of the following values can be included if desired:

---

.env

```sh
PORT # (default: 3000) This is the port that the web server is run on.
PLC_URL # (default: 'http://10.24.92.21:8000/GPIO/24/value/') This is the address that the server will make requests to in order to update the PLC.
PLC_SYNC_RATE # (default: '1000') This is the rate that the PLC will be updated in milliseconds.

MYSQL_POOL_SIZE # (default: 5) This is the amount of connections to the database held in reserve to be pulled from as needed.
MYSQL_HOST # (default: "127.0.0.1") This is the host IP or name where the database server is found.
MYSQL_USER # (default: "root") This is the database user used to access the database server.
MYSQL_PASSWORD # (default: "password") This is the password used to access the database server.
MYSQL_DATABASE # (default: "rc_airline") This is the name of the database on the database server that is actually accessed to write and read data.
```

---
