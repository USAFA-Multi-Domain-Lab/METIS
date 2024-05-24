// This migration script is responsible
// for adding the new "forces" property
// to the mission schema, moving the
// node data in the mission to a new default
// force, and removing the "nodeData" property
// from the mission.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Get missions from database.
let cursor_missions = db.missions.find({}, { _id: 1, nodeData: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  // Add default force.
  mission.forces = [
    {
      _id: ObjectId(),
      name: 'Friendly Force',
      color: '#34a1fb',
      nodes: nodeData,
    },
  ]
  // Remove node data on mission level.
  delete mission.nodeData

  // Update mission in database.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
  // Remove the "nodeData" property from the mission.
  db.missions.updateOne(
    { _id: mission._id },
    {
      $unset: { nodeData: '' },
    },
  )
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 23 } })
