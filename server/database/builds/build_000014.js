// This migration script is responsible
// for adding the roleID property, setting all
// users without a roleID to 'admin'. It also
// removes the old role property, if present.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Query for all users.
let cursor_users = db.users.find({}, { userID: 1, roleID: 1 })

// Loop through users.
while (cursor_users.hasNext()) {
  let user = cursor_users.next()

  // If the user has no roleID, set it to 'admin'.
  if (!user.roleID) {
    user.roleID = 'admin'
  }

  // Update the user with the new roleID,
  // clearing the role property.
  db.users.updateOne(
    { userID: user.userID },
    { $unset: { role: 1 }, $set: { roleID: user.roleID } },
  )
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 14 } })
