// This migration script is responsible for adding the
// `opensNodeHidden` property to all actions in every
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
    // Loop through nodes.
    for (let node of force.nodes) {
      // Loop through actions.
      for (let action of node.actions) {
        // If the action doesn't have any the `opensNodeHidden`
        // property, initialize it as `false`.
        if (action.opensNodeHidden === undefined) {
          action.opensNodeHidden = false
        }
      }
    }
  }

  // Update the mission with the new nodeData.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 35 } })
