// This migration script is responsible for adding the
// `allowNegativeResources` property to all forces within
// the missions in the database.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  for (let force of mission.forces) {
    // Add the `allowNegativeResources` property to the force,
    // if it doesn't exist.
    if (force.allowNegativeResources === undefined) {
      force.allowNegativeResources = false
    }
  }

  // Update the mission with the new force data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 41 } })
