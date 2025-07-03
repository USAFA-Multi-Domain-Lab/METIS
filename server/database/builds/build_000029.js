// This migration script is responsible
// for creating an array of prototypes
// within a mission and extracting the
// "structureKey" and "depthPadding"
// properties from the "nodes" array
// and setting them on the prototype.
// It also renames the "nodeStructure"
// property to "structure" and adds a
// "prototypeId" property to each node.

// Import the necessary modules.
const generateHash = require('uuid').v4

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

// Get missions from database.
let cursor_missions = db.missions.find(
  {},
  { _id: 1, forces: 1, nodes: 1, nodeStructure: 1 },
)

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Rename nodeStructure to structure.
  mission.structure = mission.nodeStructure
  delete mission.nodeStructure

  // Create prototypes array.
  mission.prototypes = []

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // See if prototype already exists.
      let prototype = mission.prototypes.find(
        (prototype) => prototype.structureKey === node.structureKey,
      )

      // If the prototype doesn't already exist, create it.
      if (prototype === undefined) {
        let prototypeId = generateHash()

        // Create prototype object.
        let prototype = {
          _id: prototypeId,
          structureKey: node.structureKey,
          depthPadding: node.depthPadding,
        }

        // Add prototype to mission.
        mission.prototypes.push(prototype)

        // Set prototypeId on node.
        node.prototypeId = prototypeId
      }
      // Set prototypeId on node.
      else {
        node.prototypeId = prototype._id
      }

      // Delete structureKey and depthPadding from node.
      delete node.structureKey
      delete node.depthPadding
    }
  }

  // Update mission in database.
  db.missions.updateOne(
    { _id: mission._id },
    {
      $unset: { nodeStructure: 1 },
      $set: {
        structure: mission.structure,
        prototypes: mission.prototypes,
        forces: mission.forces,
      },
    },
  )
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 29 } })
