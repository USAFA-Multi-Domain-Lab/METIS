// This migration script is responsible
// for removing the "userID" property,
// changing the "roleID" property to
// "roleId", and changing the "expressPermissionIDs"
// property to "expressPermissionIds" for all users.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Query for all users.
let cursor_users = db.users.find(
  {},
  { userID: 1, roleID: 1, expressPermissionIDs: 1 },
)

// Loop through users.
while (cursor_users.hasNext()) {
  // Grab the next user.
  let user = cursor_users.next()

  // Add the "username" property to the user.
  if (user.userID) {
    user.username = user.userID
  }

  // Change the "roleID" property to "roleId".
  if (user.roleID) {
    user.roleId = user.roleID
  }

  // Change the "expressPermissionIDs" property to "expressPermissionIds".
  if (user.expressPermissionIDs) {
    user.expressPermissionIds = user.expressPermissionIDs
  }

  // Drop the "userID" index.
  db.users.dropIndex('userID_1')
  // Update the user with the new properties.
  db.users.updateOne(
    { _id: user._id },
    {
      $set: user,
    },
  )
  // Remove the "userID", "roleID", and "expressPermissionIDs" properties from the user.
  db.users.updateOne(
    { _id: user._id },
    {
      $unset: { userID: '', roleID: '', expressPermissionIDs: '' },
    },
  )
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 21 } })
