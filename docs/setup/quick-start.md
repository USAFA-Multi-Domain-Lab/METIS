# Quick Start Guide

## Prerequisites

- Node.js v20+ (Make sure NPM gets installed with Node.js)
  - [Debian Installation Instructions](./debian.md#step-1---install-nodejs)
  - [Windows Installation Instructions](./windows.md#step-1---install-nodejs)
- MongoDB v8+
  - [Debian Installation Instructions](./debian.md#step-1---install-mongodb-community-edition)
  - [Windows Installation Instructions](./windows.md#step-1---install-mongodb-community-edition)
- Git
  - [Installation Instructions](https://github.com/git-guides/install-git)
- Docker (optional for MongoDB setup)
  - [Installation Instructions](https://docs.docker.com/engine/install/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/USAFA-Multi-Domain-Lab/METIS-Modular-Effects-based-Transmitter-for-Integrated-Simulations.git
   cd metis
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Setup the database via Docker:

   ```bash

   ```

4. Configure environment:

   Update MongoDB credentials in `prod.env`:

   ```bash
   MONGO_USERNAME='your_username'
   MONGO_PASSWORD='your_password'
   ```

5. Build the frontend:

   ```bash
   npm run build
   ```

6. Start METIS:

   ```bash
   npm run prod
   ```

7. Access METIS:

   Open your browser and go to [http://localhost:8080](http://localhost:8080).

8. Login with default credentials:

   - **Username:** `admin`
   - **Password:** `temppass` (you will be prompted to reset this on first login)
