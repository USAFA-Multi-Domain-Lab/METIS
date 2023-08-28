// This migration script is responsible
// for adding the role property for all
// admin users.

let dbName = 'mdl'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

let userID = 'admin'
let cursor_users = db.users.find({}, { userID: userID })

while (cursor_users.hasNext()) {
  let user = cursor_users.next()

  user.role = 'admin'

  db.users.updateOne({}, { $set: { role: user.role } })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 12 } })
