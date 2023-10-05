// This migration script is responsible
// for updating all the properties that
// are allowed to have rich text to
// be wrapped in "p" tags.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  mission.introMessage = '<p>' + mission.introMessage + '</p>'

  let nodeData = mission.nodeData

  for (let nodeDatum of nodeData) {
    nodeDatum.description = '<p>' + nodeDatum.description + '</p>'
    nodeDatum.preExecutionText = '<p>' + nodeDatum.preExecutionText + '</p>'

    let actions = nodeDatum.actions
    for (let action of actions) {
      action.description = '<p>' + action.description + '</p>'
      action.postExecutionSuccessText =
        '<p>' + action.postExecutionSuccessText + '</p>'
      action.postExecutionFailureText =
        '<p>' + action.postExecutionFailureText + '</p>'
    }
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 12 } })
