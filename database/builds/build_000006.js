// This migration script is responsible for
// adding default properties to existing
// properties with empty strings.

let dbName = 'mdl'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Get missions from database.
let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  // Loop through nodeData.
  for (let nodeDatum of nodeData) {
    // Set description to  default if empty.
    if (nodeDatum.description === '') {
      nodeDatum.description = 'No description set...'
    }

    let actions = nodeDatum.actions

    // Loop through actions.
    for (let action of actions) {
      // Set description to  default if empty.
      if (action.description === '') {
        action.description = 'No description set...'
      }
      // Set success and failure text to default if empty.
      if (action.postExecutionSuccessText === '') {
        action.postExecutionSuccessText = 'No success text set...'
      }
      if (action.postExecutionFailureText === '') {
        action.postExecutionFailureText = 'No failure text set...'
      }
    }
  }

  // Update mission in database.
  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 6 } })
