// This migration script is responsible
// for adding the role property for all
// admin users.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

let cursor_users = db.users.find({}, { userID: 1, role: 1 })

while (cursor_users.hasNext()) {
  let user = cursor_users.next()
  let userID = 'admin'

  if (user.userID !== userID) {
    user.role = 'admin'
  }

  db.users.updateOne({}, { $set: { role: user.role } })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 13 } })
