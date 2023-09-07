// This migration script is responsible for
// deleting nodeData values that don't exist
// in the nodeStructure. This fixes data
// corruption created by a previous bug.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Get missions from database.
let cursor_missions = db.missions.find(
  {},
  { missionID: 1, nodeData: 1, nodeStructure: 1 },
)

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let parentNodeStructure = mission.nodeStructure
  let nodeData = mission.nodeData
  let nodeStructureIDs = []

  // This will get all the nodeIDs from
  // nodeStructure.
  const populateNodeStructureIDs = (nodeStructure) => {
    for (let [key, value] of Object.entries(nodeStructure)) {
      nodeStructureIDs.push(key)

      populateNodeStructureIDs(value, key)
    }
  }

  populateNodeStructureIDs(parentNodeStructure)

  // Filter out any nodes in the nodeData
  // that don't exist in the nodeStructure.
  nodeData = nodeData.filter((nodeDatum) =>
    nodeStructureIDs.includes(nodeDatum.nodeID),
  )

  // Add updated list to mission.
  mission.nodeData = nodeData

  // Update the mission in the database.
  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 7 } })
