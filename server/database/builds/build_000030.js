// This migration script is responsible for adding
// "createdAt" and "updatedAt" fields to the "Users"
// and "Missions" collections, if any documents do
// not already have these fields populated.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission and user data to updated schema...')

db.missions.updateMany(
  { createdAt: { $exists: false } },
  { $set: { createdAt: new Date() } },
)
db.missions.updateMany(
  { updatedAt: { $exists: false } },
  { $set: { updatedAt: new Date() } },
)
db.users.updateMany(
  { createdAt: { $exists: false } },
  { $set: { createdAt: new Date() } },
)
db.users.updateMany(
  { updatedAt: { $exists: false } },
  { $set: { updatedAt: new Date() } },
)

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 30 } })
