// This migration script is responsible
// for adding the password reset property for
// all users.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

let cursor_users = db.users.find({}, { userID: 1 })

while (cursor_users.hasNext()) {
  let user = cursor_users.next()

  user.needsPasswordReset = false

  db.users.updateOne({ userID: user.userID }, { $set: user })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 15 } })
