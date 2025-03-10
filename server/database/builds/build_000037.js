// This migration script is responsible for adding the
// `revealAllNodes` property to all forces in every
// mission in the database.

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

  // Loop through forces.
  for (let force of mission.forces) {
    // If the force doesn't have the `revealAllNodes` property,
    // initialize it as false.
    if (force.revealAllNodes === undefined) force.revealAllNodes = false
  }

  // Update the mission with the new force data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 37 } })
