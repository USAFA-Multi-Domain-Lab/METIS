// This migration script is responsible
// for converting the "externalEffects" property
// to "effects" and removing the "internalEffects"
// property from the mission schema. This script
// also converts any properties with "<p><br></p>"
// to an empty string ("").

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
      // If the description has "<p><br></p>",
      // set it to an empty string.
      if (node.description === '<p><br></p>') {
        node.description = ''
      }
      // If the preExecutionText has "<p><br></p>",
      // set it to an empty string.
      if (node.preExecutionText === '<p><br></p>') {
        node.preExecutionText = ''
      }

      // Loop through actions.
      for (let action of node.actions) {
        // If the description has "<p><br></p>",
        // set it to an empty string.
        if (action.description === '<p><br></p>') {
          action.description = ''
        }

        // If the action does have internalEffects,
        // delete internalEffects.
        if (action.internalEffects) {
          delete action.internalEffects
        }
        // If the action does have externalEffects,
        // set effects to externalEffects and delete
        // externalEffects.
        if (action.externalEffects) {
          action.effects = action.externalEffects
          delete action.externalEffects
        }

        // Loop through effects.
        for (let effect of action.effects) {
          // If the description has "<p><br></p>",
          // set it to an empty string.
          if (effect.description === '<p><br></p>') {
            effect.description = ''
          }
        }
      }
    }
  }

  // Update mission in database.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 25 } })
