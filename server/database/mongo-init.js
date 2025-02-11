// This file is used by the docker-compose.yml
// file to create the database user for the web
// server.

db = db.getSiblingDB(process.env.MONGO_DB)

db.createUser({
  user: process.env.MONGO_USERNAME,
  pwd: process.env.MONGO_PASSWORD,
  roles: [{ role: 'readWrite', db: process.env.MONGO_DB }],
})
