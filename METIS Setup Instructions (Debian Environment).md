# METIS Setup Instructions (Debian Environment)

Note: These instructions assume the database server and the web server will be running on separate instances of Debain.

## Set Up Database Server

### Step #1 - Install MongoDB Community Edition

MongoDB is needed so that METIS can store and manage persistent data.. Set up a Debian environment for the database. Then, to install MongoDB Community Edition, follow the installation guide [here](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/). Confirm installation was successful with the following command.

```bash
mongod --version
```

### Step #2 - Configure MongoDB for Use

Next, assuming the database will be connected to via an outside host, we must enable this functionality in the MongoDB config. The config will be located at`/etc/mongod.conf`. Open the config using your preferred text editor, such as `vim` or `nano`. Note, `sudo` may be needed to save this file. Find the section labeled `# network interfaces` and update the section to have `bindIp` set to `0.0.0.0`. This will allow outside hosts to connect to the database server:

```bash
# network interfaces
net:
  port: 27017
  bindIp: 0.0.0.0
```

Now, to run MongoDB. The following commands will start and stop the MongoDB server respectively:

```bash
sudo systemctl stop mongod
sudo systemctl start mongod
```

In order to check if MongoDB is running, use this command:

```bash
sudo systemctl status mongod
```

It is recommend to have MongoDB run on start up. This can be done with the following command:

```bash
sudo systemctl enable mongod
```

If enabled, reboot and confirm MongoDB starts up with the status command mentioned earlier.

### Step #3 - Set Up Database Authorization

By default, the database server running can be connected to and managed without any authentication requirements. However, it is highly recommended to enable authentication and create a user for the web server to use in order to connect and manage data securely. Otherwise, the data stored can be wiped by anyone with a connection.

Ensure that MongoDB is running, then connect to it via the following command:

```bash
mongosh
```

Once connected, switch to the already created `admin` database to create a new admin user.

```bash
use admin
```

Then, create the new admin user. You can change the name of the user from “admin” to whatever you like. After you hit enter, you will be prompted for a password. You will then use this username and password to connect to the database in the future.

```bash
db.createUser(
  {
    user: "admin",
    pwd: passwordPrompt(),
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
    ]
  }
)
```

Exit MongoDB Shell with `exit`. Now that we have an admin user, we can enable authentication and restart MongoDB. Open your MongoDB config at `/etc/mongod.conf` using your preferred text editor, such as `vim` or `nano`. Note, `sudo` may be needed to save this file. Find and replace the comment `#security:` with the following code to configure MongoDB to start up with authentication enabled:

```bash
security:
    authorization: enabled
```

Then restart MongoDB.

```bash
sudo systemctl restart mongod
```

Now anyone can still connect to the database, but they can only read and write if they are an authorized user. To confirm this behavior, connect via `mongosh` without authenticating yourself and try to print a list of database collection names with this command here:

```bash
db.getCollectionNames()
```

This command should result in the following authentication error.

```bash
MongoServerError: command listCollections requires authentication
```

To authenticate yourself as an admin, while connected with `mongosh`, switch to the admin database and run the `db.auth` function.

```bash
use admin
db.auth("admin", passwordPrompt())
```

You can also authenticate upon connection:

```bash
mongosh --authenticationDatabase admin -u admin -p
```

### Step #5 - Create Web Server User

Your database is now secure. However, using an admin user with full access as the authentication method for a web server is bad practice. Therefore, it is highly advised to create a secondary user that can only read and write to the specific database that the web server will use.

To do so, first connect to the database server using `mongosh` authenticating yourself as the admin user. Then switch to a new database called `metis`, which is the database METIS is configured to use by default. Then create a new user with read-write access to `metis`. Note, it is crucial that you create the user while in the `metis` database.

```bash
use metis
db.createUser(
  {
    user: "web-server",
    pwd:  passwordPrompt(),
    roles: [ { role: "readWrite", db: "metis" } ]
  }
)
```

Disconnect and attempt to authenticate yourself using this new user:

```bash
mongosh --authenticationDatabase metis -u web-server -p
```

After that, everything should be prepared for the web server. The user you created for the web server will be used in the server’s environment file, referenced in the “environment-configuration” section.

## Set Up Web Server

NodeJS, MongoDB Shell, and MongoDB Command Line Database Tools must be installed in the web server environment for the web server to run properly. Set up a Debian environment with network connectivity to the database server, then continue to the following instructions to install the necessary software.

### Step #1 - Install MongoSH

If you install NodeJS now via the `apt` command, you will install an outdated version of NodeJS that is not supported by METIS. In order to install the correct version of NodeJS, you can download a _PPA_ (personal package archive) maintained by NodeSource. These PPAs have more versions of Node.js available than the official Ubuntu repositories.

First, install the PPA to get access to its packages. From your home directory, use `curl` to retrieve the installation script for version 20.x of NodeJS:

```bash
cd ~
curl -sL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
```

Then run the script with `sudo`:

```bash
sudo bash /tmp/nodesource_setup.sh
```

The PPA will be added to your configuration and your local package cache will be updated automatically. You can now install the Node.js package using `apt`:

```bash
sudo apt install nodejs
```

Verify that you’ve installed the new version by running the following command:

```bash
node -v
```

For alternative NodeJS installation options, view this great Digital Ocean article [here](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04#option-2-installing-node-js-with-apt-using-a-nodesource-ppa).

### Step #2 - Install MongoSH

The `mongosh` command is needed by the web server to run migration scripts on the database. If the database and web server are running on the same system, then this command is already available from the installation of MongoDB Community Edition, and this step can be skipped. Otherwise, refer to the guide [here](https://www.mongodb.com/docs/mongodb-shell/install/) to install MongoDB Shell in your web server environment.

Confirm MongoDB Shell was installed properly:

```bash
mongosh --version
```

Confirm MongoDB Shell can connect to the database you have set up.

```bash
mongosh --host <your-host-name>
```

### Step #3 - Install Mongo Database Tools

The `mongodump` command is needed by the web server to create regular backups of the database. The `mongorestore` command can be used to restore these backups. If the database and web server are running on the same system, then these commands are already available from the installation of MongoDB Community Edition, and this step can be skipped. Otherwise, refer to the guide [here](https://www.mongodb.com/docs/database-tools/installation/installation-linux/) to install MongoDB Command Line Database Tools in your web server environment.

Confirm the installation of `mongodump` and `mongorestore` with the following commands:

```bash
mongodump --version
mongorestore --version
```

### Step #4 - Install and Set Up METIS

Clone METIS to your web server environment where NodeJS, MongoDB Shell, and MongoDB Command Line Database Tools are already installed. Navigate into the cloned project and install the required NPM packages that METIS needs to run.

```bash
cd ./metis
npm install
```

The front-end interface for METIS is a React App hosted by the web server. The React App must be built initially and after any updates (new releases) in order for the front-end interface to be accessible and up-to-date to web users. While in the METIS project directory, run the following command to build the React App:

```bash
npm run build
```

### Step #5 - Configure Environment

In order for the web server to properly connect to the database, the environment file for the METIS must be configured correctly so that the web server knows how to connect to the database. Go into the METIS directory and create a new file called `environment.json` .

In this file METIS can be configured differently from it’s default values. All properties are optional, except the `mongoUsername` and `mongoPassword` , which are required due to the auth restrictions set up. If you have a custom host or port for MongoDB as well, this can also be configured here. All available environment options are outlined below:

```json
{
	"port": "<your-port>" // Default: 8080, Optional
  "mongoDB": "<your-db-name>", // Default: "metis", Optional
  "mongoHost": "<your-host>", // Default: "localhost", Optional
  "mongoPort": "<your-port>", // Default: 27017, Optional
  "mongoUsername": "<your-username>", // Required
  "mongoPassword": "<your-password>", // Required
  "fileStoreDir": "<your-file-store-dir>", // Default: "./files/store" Optional
  "httpRateLimit": "<your-rate-limit>", // Default: 25 Optional
  "wsRateLimit": "<your-rate-limit>" // Default 25 Optional
}
```

### Step #6 - Run METIS

To run METIS in a production environment, run the following command.

```bash
npm run prod
```

The should start up and be accessible at the configured port (8080 by default). You can now access the web app in the browser. To login, a temporary user has been created with the following credentials:

```
Username: admin
Password: temppass
```

### Step #7 - Configure METIS to Auto Start

It is recommend to create a start up script to run the web server automatically on start up. View this article [here](https://www.baeldung.com/linux/run-script-on-startup) for potential solutions to accomplish this, `cron` being the recommended solution.

It is also recommended to include the `npm install` and `npm run build-react` commands in the start up script to make updating to new releases easier, only requiring the system to be rebooted. The following script could be used to accomplish this:

```bash
#!/bin/sh
cd /path/to/metis
npm install
npm run build
npm run prod
```

Restart your system and confirm METIS starts up. After that you are good to go!
