// This migration script is responsible
// for removing the "infoID" property from
// all infos.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating info data to updated schema...')

// Query for all infos.
let cursor_infos = db.infos.find({}, { infoID: 1 })

// Loop through infos.
while (cursor_infos.hasNext()) {
  let info = cursor_infos.next()

  // Update the info.
  db.infos.updateOne({ _id: info._id }, { $unset: { infoID: '' } })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 19 } })
