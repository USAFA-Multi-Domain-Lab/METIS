// This migration script is responsible for adding the
// `exclude` property to all nodes in every
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

  // Loop through effects.
  for (let force of mission.forces) {
    for (let node of force.nodes) {
      if (node.exclude === undefined) node.exclude = false
    }
  }

  // Update the mission with the new force data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 39 } })
