# METIS (Modular Effects-Based Transmitter for Integrated Simulations)

### purpose

This is a mini-game used by the United States Air Force Academy to educate cadets on cyber operations.

### production-set-up

- Have `node` (NodeJS) and `npm` (Node Package Manager) installed (`npm` installs with `node` typically).
- Have `mongod`, `mongosh`, and `mongodb-database-tools` installed.
- Set up and run a Mongo server.
- Create and configure an `environment.json`, reference the **environment-configuration** section for help.
- Run `npm install` in the project directory to install dependencies.
- Run `npm run build-react` to build React app into the static files
- Run `npm run serve-prod` to run the production web server.

### development-set-up

- Have `node` (NodeJS) and `npm` (Node Package Manager) installed (`npm` installs with `node` typically).
- Have `mongod`, `mongosh`, and `mongodb-database-tools` installed.
- Set up and run a Mongo server.
- Create and configure an `environment.json`, reference the **environment-configuration** section for help.
- Run `npm install --also=dev` in the project directory to install all packages, including development packages.
- Run `npm run build-react` to build React app into the static files.
- Run `npm run serve-dev` to run the development web server.
- Run `npm run serve-react` to also run the React development server on a different port. This allows changes to the web app to be seen immediately without building.
- Build React at any point to see changes on the actual web server.

## environment-configuration

To configure the app further, an `environment.json` and/or `environment-test.json` can be created in the project directory with a custom configuration. This configuration will overwrite values defined in `config.ts`. Any values not provided will simply remain as their defaults. Make sure the Mongo configuration in the file works with the Mongo server you have running. An example for `environment.json` and `environment-test.json` is provided below.

---

environment.json

```json
{
  "PORT": 8080,
  "MONGO_HOST": "localhost",
  "MONGO_PORT": "27017",
  "MONGO_DB": "mdl",
  "MONGO_USERNAME": "username",
  "MONGO_PASSWORD": "password",
  "PLC_API_HOST": "https://your-plc-host-name-here.com",
  "API_KEY": "api-key-for-plc"
}
```

environment-test.json

```json
{
  "PORT": 8081,
  "MONGO_HOST": "localhost",
  "MONGO_PORT": "27017",
  "MONGO_DB": "mdl-test",
  "MONGO_USERNAME": "username",
  "MONGO_PASSWORD": "password"
}
```

---

## tests

After the testing environment is configured, these commands can be used to run all tests.

1. "npm run serve-test"
2. "npm run test"
