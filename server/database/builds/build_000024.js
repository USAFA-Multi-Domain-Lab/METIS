// This migration script is responsible
// for converting the "effects" property
// to "externalEffects" and adding the
// "internalEffects" property to the mission schema.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Get missions from database.
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
        // If the action doesn't have internalEffects,
        // set it to an empty array.
        if (!action.internalEffects) {
          action.internalEffects = []
        }
        // If the action doesn't have externalEffects,
        // but has effects, set externalEffects to effects
        // and delete effects.
        if (!action.externalEffects && action.effects) {
          action.externalEffects = action.effects
          delete action.effects
        }
      }
    }
  }

  // Update mission in database.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 24 } })
