// This migration script is responsible for
// deleting the name index from the missions
// collection. This is because the name field
// is no longer unique.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Dropping name_1 from missions collection..')

// Drop the name index.
db.missions.dropIndex('name_1')

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 8 } })
