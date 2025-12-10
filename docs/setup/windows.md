# METIS Setup Instructions (Windows Environment With GUI)

> **Note:** These instructions assume the database server and the web server will be running on the same _Windows_ instance. All commands should be run in an elevated _PowerShell_ (Run as Administrator). This is a temporary guide while we build a _Windows_ installer. For quicker setup on _Windows_, consider using the [Docker Setup Guide](/docs/setup/index.md#docker-setup) instead.

## Database

### Step #1 - Install MongoDB Community Edition

MongoDB is needed so that METIS can store and manage persistent data. To install MongoDB Community Edition, download the installer [here](https://www.mongodb.com/try/download/community), selecting `.msi` as the package. Make sure when installing to install as a service so that MongoDB will run on startup. MongoDB Compass also can be installed with the installer, but it is not necessary.

Once the installer completes, you can confirm it is running by opening Services. To do so, press `Win + R`, enter `services.msc` into the text box that appears, and press Enter. A window should open showing available services. Scroll down and ensure that MongoDB is there and that it is running.

### Step #2 - Install MongoSH

MongoSH is needed so that you can connect to the database via the command line and configure the database for use, as well as manage it as needed in the future. It is also used by the METIS server itself to run migration scripts in the event of any updates.

You can download and run the installer [here](https://www.mongodb.com/try/download/shell), selecting `.msi` as the package. You can confirm its installation by opening up _PowerShell_ and typing the following command, which should return the version number of MongoSH:

```bash
mongosh --version
```

### Step #3 - Install Mongo Database Tools

Mongo Database Tools is needed so that Mongo can create backups automatically. It can also be used to restore these backups using `mongorestore` .

To install Mongo Database Tools, download and run the installer [here](https://www.mongodb.com/try/download/database-tools), selecting `.msi` as the package. You can confirm the installation of the tools by checking the versions of `mongorestore`and `mongodump` :

```bash
mongorestore --version
mongodump --version
```

If for some reason the tools are installed, but these commands do not work, Mongo Database Tools may not be added to Path. To do so complete the following steps:

- **Find the Installation Path**:
  By default, the tools are installed in `C:\Program Files\MongoDB\Tools\<version>\bin`.
- **Open Environment Variables**:
  - Right-click on **This PC** or **Computer** on the desktop or in File Explorer and select **Properties**.
  - Click on **Advanced system settings**.
  - In the System Properties window, click the **Environment Variables** button.
- **Edit PATH Variable**:
  - In the System Variables section, find and select the `Path` variable, then click **Edit**.
  - Click **New** and add the path to the MongoDB Database Tools bin directory, e.g., `C:\Program Files\MongoDB\Tools\<version>\bin`.
  - Click **OK** to save your changes.
- **Restart Command Prompt**:
  Close and reopen the Command Prompt for the changes to take effect.

Confirm the tools are now on Path by running the previously mentioned version-check commands.

### Step #4 - Set Up Database Authorization

By default, the database server running can be connected to and managed without any authentication requirements. However, it is highly recommended to enable authentication and create a user for the web server to use to connect and manage data securely. Otherwise, the data stored can be wiped by anyone with a connection.

Ensure that MongoDB is running, then connect to it via the following command:

```bash
mongosh

```

Once connected, switch to the already-created `admin` database to create a new admin user.

```bash
use admin

```

Then, create the new admin user. You can change the name of the user from “admin” to the username you like. After you hit enter, you will be prompted for a password. You will then use this username and password to connect to the database in the future.

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

Exit MongoDB Shell with `exit`. Now that we have an admin user, we can enable authentication and restart MongoDB. Open your MongoDB config, which should be at `C:\Program Files\MongoDB\Server\<version>\bin\mongod.conf` , replacing `<version>` with your version number for MongoDB. If it is not located there, determine where MongoDB is installed and it should be in the bin folder.

Open this file in a text editor, making sure your text editor is started as an administrator. Then find and replace the comment `#security:` with the following code to configure MongoDB to start up with authentication enabled:

```bash
security:
    authorization: enabled

```

Save the file then restart MongoDB. Open command prompt as administrator and execute these commands to stop and start the server.

```bash
net stop MongoDB
net start MongoDB
```

Now anyone can still connect to the database, but they can only read and write if they are an authorized user. To confirm this behavior, connect via `mongosh` without authenticating yourself and try to print a list of database collection names with this command here:

```bash
db.getCollectionNames()

```

This command should result in the following authentication error.

```bash
MongoServerError: command listCollections requires authentication

```

To authenticate yourself as an admin, while connected with `mongosh`, switch to the admin database, and run the `db.auth` function.

```bash
use admin
db.auth("admin", passwordPrompt())

```

You can also authenticate upon connection:

```bash
mongosh --authenticationDatabase admin -u admin -p

```

### Step #5 - Create Web Server Database User

Your database is now secure. However, using an admin user with full access as the authentication method for a web server is bad practice. Therefore, it is highly advised to create a secondary user that can only read and write to the specific database that the web server will use.

To do so, first connect to the database server using `mongosh` authenticating yourself as the admin user. Then switch to a new database called `metis`, which is the database METIS is configured to use by default. Then create a new user with read-write access to `metis`. Note, it is crucial that you create the user while in the `metis` database.

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

## Web Server Setup

### Step #1 - Install NodeJS

NodeJS must be installed in the web server environment for the web server to run properly. You can download and run the installer [here](https://nodejs.org/en/download/prebuilt-installer), making sure to download version 22. When running the installer, click to install necessary third-party tools when prompted.

### Step #2 - Install and Set Up METIS

To install METIS, first choose a directory to store the METIS source code. This can be any directory you prefer. Then, either clone the repository to your system using [Git](https://git-scm.com/), or download the source code as a ZIP file from GitHub, and extract it to your chosen directory. If using [Git](https://git-scm.com/), run the following command to clone the project:

```bash
git clone https://github.com/USAFA-Multi-Domain-Lab/METIS.git
```

Then, navigate into the METIS project directory and install the required dependencies:

```bash
cd ./METIS
npm install
```

The front-end interface for METIS is a React App hosted by the web server. The React App must be built initially and after any updates (new releases) for the front-end interface to be accessible and up-to-date to web users. While in the METIS project directory, run the following command to build the React App:

```bash
npm run build

```

### Step #3 - Configure Environment

For the web server to properly connect to the database, the environment for METIS must be configured correctly so that the web server knows how to connect.  
**As of the current version, METIS uses environment variable files located in the `config` directory instead of an `environment.json` file.**

Go into the `config` directory in your METIS project. You will find several files such as:

- `dev.env` and `dev.defaults.env`
- `prod.env` and `prod.defaults.env`
- `test.env` and `test.defaults.env`
- `docker.defaults.env`

To configure your environment, edit the appropriate `.env` file for your deployment (for example, `prod.env` for production, which is standard for this setup).  
**Do not edit the `*.defaults.env` files directly.**  
Override values by setting them in the corresponding `.env` file.

All properties are optional except for `MONGO_USERNAME` and `MONGO_PASSWORD`, which are required due to the authentication restrictions set up.  
If you have a custom host or port for MongoDB, you can also configure these here.

All available environment options are outlined below (example for `prod.env`):

```env
PORT=8080                        # Default: 8080 (Optional)
MONGO_DB='metis'                 # Default: "metis" (Optional)
MONGO_HOST='localhost'           # Default: "localhost" (Optional)
MONGO_PORT=27017                 # Default: 27017 (Optional)
MONGO_USERNAME='<your-username>' # Required
MONGO_PASSWORD='<your-password>' # Required
FILE_STORE_DIR='./files/store'   # Default: "./files/store" (Optional)
HTTP_RATE_LIMIT=20               # Default: 20 (Optional)
HTTP_RATE_LIMIT_DURATION=1       # Default: 1 (second) (Optional)
WS_RATE_LIMIT=10                 # Default: 10 (Optional)
WS_RATE_LIMIT_DURATION=1         # Default: 1 (second) (Optional)
```

**After editing your `.env` file, restart the METIS server for changes to take effect.**

### Step #4 - Run METIS

To run METIS in a production environment, run the following command:

```bash
npm start
```

It should start up and be accessible at the configured port (8080 by default). You can now access the web app in the browser. To log in, a temporary user has been created with the following credentials:

```
Username: admin
Password: temppass
```

From there you will be prompted to reset your password to something permanent and more secure. You can now begin using METIS!
