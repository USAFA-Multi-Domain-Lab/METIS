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

let cursor_missions = db.missions.find(
  {},
  { missionID: 1, nodeData: 1, nodeStructure: 1 },
)

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let parentNodeStructure = mission.nodeStructure
  let nodeData = mission.nodeData
  let nodeStructureIDs = []

  const populateNodeStructureIDs = (nodeStructure) => {
    for (let [key, value] of Object.entries(nodeStructure)) {
      nodeStructureIDs.push(key)

      populateNodeStructureIDs(value, key)
    }
  }

  populateNodeStructureIDs(parentNodeStructure)

  print(`missionID: ${mission.missionID}`)
  print('BEFORE')
  print(`nodeDataLength: ${nodeData.length}`)
  print(`nodeStructureIDsLength: ${nodeStructureIDs.length}`)

  nodeData = nodeData.filter((nodeDatum) =>
    nodeStructureIDs.includes(nodeDatum.nodeID),
  )

  print('AFTER')
  print(`nodeDataLength: ${nodeData.length}`)
  print(`nodeStructureIDsLength: ${nodeStructureIDs.length}`)
  print('\n\n')

  // db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

// print('Updating schema build number...')

// db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 6 } })
