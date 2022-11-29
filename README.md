# CESAR (Cyber Effects Simulator and Relay)

### purpose

This is a mini game used by the United States Air Force Academy to educate cadets on cyber operations.

### production-set-up

- Have `node` (NodeJS) and `npm` (Node Package Manager) installed (`npm` installs with `node` typically).
- Have `mongo` installed.
- Set up and run a Mongo server.
- Create and configure an `environment.json`, reference the **environment-configuration** section for help.
- Run `npm install` in project directory to install dependencies.
- Run `npm run build-react` to build React app into the static files
- Run `npm run serve-prod` to run the production web server.

### development-set-up

- Have `node` (NodeJS) and `npm` (Node Package Manager) installed (`npm` installs with `node` typically).
- Have `mongo` installed.
- Set up and run a Mongo server.
- Create and configure an `environment.json`, reference the **environment-configuration** section for help.
- Run `npm install --also=dev` in project directory to install all packages, including development packages.
- Run `npm run build-react` to build React app into the static files.
- Run `npm run serve-dev` to run the development web server.
- Run `npm run serve-react` to also run the React development server on a different port. This allows changes to the web app to be seen immediately without building.
- Build React at any point to see changes on the actual web server.

## environment-configuration

To configure the app further, an `environment.json` can be created in the project directory with a custom configuration. This configuration will overrite values defined in `config.ts`. Any values not provided will simply remain as their defaults. Make sure the Mongo configuration in the file works with the Mongo server you have running. An example `environment.json` is provided below.

---

environment.json

```json
{
  "PORT": 8080,
  "MONGO_HOST": "mongodb://localhost:27017/mdl"
}
```

---
