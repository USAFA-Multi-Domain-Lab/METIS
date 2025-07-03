// This migration script is responsible for adding the
// `environmentId` property to all effects in every
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
      for (let action of node.actions) {
        for (let effect of action.effects) {
          // If the effect doesn't have the `environmentId` property,
          // initialize it as "INFER". This temporary ID will be
          // replaced by the METIS client when the mission is next
          // opened in the editor.
          if (!effect.environmentId) effect.environmentId = 'INFER'
        }
      }
    }
  }

  // Update the mission with the new force data.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 38 } })
