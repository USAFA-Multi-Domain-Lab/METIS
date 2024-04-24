// This migration script is responsible
// for removing the "live" property from
// all missions and removing the "missionID",
// "actionID", and "effect.id" properties from
// all missions, nodes, and actions. It also
// renames the "nodeID" property to "structureKey"
// in all nodes.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Query for all missions.
let cursor_missions = db.missions.find(
  {},
  { missionID: 1, live: 1, nodeData: 1 },
)

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Grab the nodeData.
  let nodeData = mission.nodeData

  // Loop through nodes.
  for (let nodeDatum of nodeData) {
    // Rename the "nodeID" property to "structureKey".
    if (nodeDatum.nodeID) {
      nodeDatum.structureKey = nodeDatum.nodeID
      delete nodeDatum.nodeID
    }

    // Grab all actions.
    let actions = nodeDatum.actions
    // Loop through actions.
    for (let action of actions) {
      // Remove the "actionID" property from the action.
      if (action.actionID) {
        delete action.actionID
      }

      // Remove the "effectID" property from the action.
      if (action.effects && action.effects.length > 0) {
        for (let effect of action.effects) {
          if (effect.id) {
            delete effect.id
          }
        }
      }
    }
  }

  // Drop the "missionID" index.
  db.missions.dropIndex('missionID_1')
  // Update the mission with the new nodeData.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
  // Remove the "missionID" and "live" properties from the mission.
  db.missions.updateOne(
    { _id: mission._id },
    { $unset: { missionID: '', live: '' } },
  )
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 20 } })
