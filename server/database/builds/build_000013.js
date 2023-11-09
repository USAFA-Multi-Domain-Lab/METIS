// This migration script is responsible for
// removing default text from existing
// properties with default text.
// (i.e. '<p>No description set...</p>',
// '<p>Description text goes here.</p>')

let dbName = 'metis'

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
    // If the description has default text, set it to an empty string.
    if (
      nodeDatum.description === '<p>No description set...</p>' ||
      nodeDatum.description === '<p>Description text goes here.</p>' ||
      nodeDatum.description === '<p>Description not set...</p>'
    ) {
      nodeDatum.description = '<p><br></p>'
    }

    // If the pre-execution text has default text, set it to an empty string.
    if (
      nodeDatum.preExecutionText === '<p>No pre-execution text set...</p>' ||
      nodeDatum.preExecutionText === '<p>Node has not been executed.</p>'
    ) {
      nodeDatum.preExecutionText = '<p><br></p>'
    }
  }

  // Update mission in database.
  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 13 } })
