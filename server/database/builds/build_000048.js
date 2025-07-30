// This migration script is responsible for adding
// user preferences to the user schema.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all users.
let cursor_users = db.users.find({}, { _id: 1, preferences: 1 })

// Loop through users.
while (cursor_users.hasNext()) {
  let user = cursor_users.next()

  // Initialize `preferences` if not set.
  if (!user.preferences) {
    user.preferences = { _id: ObjectId() }
  }
  // Initialize `missionMap` if not set.
  if (!user.preferences.missionMap) {
    user.preferences.missionMap = { _id: ObjectId() }
  }
  // Initialize `panOnDefectSelection` if not set.
  if (user.preferences.missionMap.panOnDefectSelection === undefined) {
    user.preferences.missionMap.panOnDefectSelection = true
  }

  // Write changes to database.
  db.users.updateOne({ _id: user._id }, { $set: user })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 48 } })
