// This migration script is responsible
// for adding the resource cost property
// to the action level of the mission schema
// and moving post-execution text from the
// node level down to the action level of the
// mission schema.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Dropping all collection for METIS...')

db.infos.drop()
db.users.drop()
db.missions.drop()
db.filereferences.drop()
