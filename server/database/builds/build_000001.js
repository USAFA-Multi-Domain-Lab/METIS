// This migration script is responsible
// for adding the resource cost property
// to the action level of the mission schema
// and moving post-execution text from the
// node level down to the action level of the
// mission schema.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  for (let nodeDatum of nodeData) {
    let actions = nodeDatum.actions

    for (let action of actions) {
      action.resourceCost = 1
      action.postExecutionSuccessText = nodeDatum.postExecutionSuccessText
      action.postExecutionFailureText = nodeDatum.postExecutionFailureText
    }

    delete nodeDatum.postExecutionSuccessText
    delete nodeDatum.postExecutionFailureText
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 1 } })
