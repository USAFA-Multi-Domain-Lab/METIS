// This migration script is responsible for adding
// the "launchedAt" fields to the  "Missions"
// collection, if any documents do  not already have
// these fields populated.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

db.missions.updateMany(
  { launchedAt: { $exists: false } },
  { $set: { launchedAt: null } },
)

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 31 } })
