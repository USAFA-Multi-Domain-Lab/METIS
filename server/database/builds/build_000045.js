// This migration script is responsible for updating
// various collections to have createdBy and
// createdByUsername fields populated with the system
// user.

let dbName = 'metis'
let patchlessVersionRegex = /^\d+\.\d+$/

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
        // Loop through effects.
        for (let effect of action.effects) {
          if (patchlessVersionRegex.test(effect.targetEnvironmentVersion)) {
            // If the version is patchless (e.g., "1.0"),
            // append ".0" to make it "1.0.0".
            effect.targetEnvironmentVersion += '.0'
          }
        }
      }
    }
  }

  // Update the mission with the new nodeData.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 45 } })
