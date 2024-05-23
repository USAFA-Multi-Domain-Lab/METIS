// This migration script is responsible
// for changing the "roleId" property to
// "accessId" for all users.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Query for all users.
let cursor_users = db.users.find({}, { roleId: 1 })

// Loop through users.
while (cursor_users.hasNext()) {
  // Grab the next user.
  let user = cursor_users.next()

  // Change the "roleId" property to "accessId".
  if (user.roleId) {
    user.accessId = user.roleId
  }

  // Update the user with the new properties.
  db.users.updateOne(
    { _id: user._id },
    {
      $set: user,
    },
  )
  // Remove the "roleId" property from the user.
  db.users.updateOne(
    { _id: user._id },
    {
      $unset: { roleId: '' },
    },
  )
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 22 } })
