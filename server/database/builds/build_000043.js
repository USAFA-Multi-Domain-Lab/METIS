// This migration script is responsible for updating
// the ID of the primary admin user in the database
// to use a fixed ID, that will not change regardless
// of where METIS is deployed.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Get the current admin user.
let cursor_admin = db.users.find({ username: 'admin' })

// If present, update the admin user ID
// to a fixed value.
if (cursor_admin.hasNext()) {
  let admin = cursor_admin.next() // Only update if it's not already the fixed ID

  print('Rewriting admin user with fixed _id...')

  // Set the new ID
  let newAdmin = Object.assign({}, admin)
  newAdmin._id = ObjectId('000000000000000000000001')
  newAdmin.deleted = false // Ensure the deleted flag is set to false.

  // Remove the old one
  db.users.deleteOne({ _id: admin._id })
  // Insert the new admin
  db.users.insertOne(newAdmin)

  print('Admin _id updated successfully.')
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 43 } })
