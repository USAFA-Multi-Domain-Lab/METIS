// This migration script is responsible
// for removing scripts from actions stored
// in a mission and adding a new property
// to actions called "effects."

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  let nodeData = mission.nodeData

  // Loop through nodes.
  for (let nodeDatum of nodeData) {
    // Grab all actions.
    let actions = nodeDatum.actions
    // Loop through actions.
    for (let action of actions) {
      // If the action doesn't have effects,
      // set it to an empty array.
      if (!action.effects) {
        action.effects = []
      }
      // Remove the scripts from the action.
      delete action.scripts
    }
  }

  // Update the mission with the new nodeData.
  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 17 } })
