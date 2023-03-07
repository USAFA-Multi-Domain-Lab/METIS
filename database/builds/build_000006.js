// This migration script is responsible for
// adding default properties to existing
// properties with empty strings.

let dbName = 'mdl'

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
    if (nodeDatum.description === '') {
      nodeDatum.description = 'No description set...'
    }

    let actions = nodeDatum.actions

    for (let action of actions) {
      if (action.description === '') {
        action.description = 'No description set...'
      }
      if (action.postExecutionSuccessText === '') {
        action.postExecutionSuccessText = 'No success text set...'
      }
      if (action.postExecutionFailureText === '') {
        action.postExecutionFailureText = 'No failure text set...'
      }
    }
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 6 } })
