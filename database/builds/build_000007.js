// This migration script is responsible for
// deleting nodeData values that don't exist
// in the nodeStructure. This fixes data
// corruption created by a previous bug.

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
  let nodeDataIDs = nodeData.map((nodeDatum) => nodeDatum.nodeID)
  let nodeStructureIDs = []

  const populateNodeStructureIDs = (nodeStructure = parentNodeStructure) => {
    for (let [key, value] of Object.entries(nodeStructure)) {
      nodeStructureIDs.push(key)

      populateNodeStructureIDs(value, key)
    }
  }

  populateNodeStructureIDs()

  console.log(`nodeDataIDs.length:\t${nodeDataIDs.length}`)
  console.log(`nodeStructureIDs.length:\t${nodeStructureIDs.length}`)
  console.log('\n')
  console.log(`nodeDataIDs:\n${nodeDataIDs}`)
  console.log('\n')
  console.log(`nodeStructureIDs:\n${nodeStructureIDs}`)

  // db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

// print('Updating schema build number...')

// db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 6 } })
