// This migration script is responsible
// for converting any objects nested within
// a mission that have an "_id" property that
// is an ObjectId to a UUID.

// Import the necessary modules.
const mongoose = require('mongoose')
const generateHash = require('uuid').v4

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating user data to updated schema...')

// Get missions from database.
let cursor_missions = db.missions.find({}, { _id: 1, forces: 1 })

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Loop through forces.
  for (let force of mission.forces) {
    // If the force has an ObjectId as the _id,
    // generate a UUID and set it as the _id.
    if (
      mongoose.isValidObjectId(force._id) ||
      mongoose.isObjectIdOrHexString(force._id)
    ) {
      force._id = generateHash()
    }

    // Loop through nodes.
    for (let node of force.nodes) {
      // If the node has an ObjectId as the _id,
      // generate a UUID and set it as the _id.
      if (
        mongoose.isValidObjectId(node._id) ||
        mongoose.isObjectIdOrHexString(node._id)
      ) {
        node._id = generateHash()
      }

      // Loop through actions.
      for (let action of node.actions) {
        // If the action has an ObjectId as the _id,
        // generate a UUID and set it as the _id.
        if (
          mongoose.isValidObjectId(action._id) ||
          mongoose.isObjectIdOrHexString(action._id)
        ) {
          action._id = generateHash()
        }

        // Loop through effects.
        for (let effect of action.effects) {
          // If the effect has an ObjectId as the _id,
          // generate a UUID and set it as the _id.
          if (
            mongoose.isValidObjectId(effect._id) ||
            mongoose.isObjectIdOrHexString(effect._id)
          ) {
            effect._id = generateHash()
          }
        }
      }
    }
  }

  // Update mission in database.
  db.missions.updateOne({ _id: mission._id }, { $set: mission })
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 26 } })
