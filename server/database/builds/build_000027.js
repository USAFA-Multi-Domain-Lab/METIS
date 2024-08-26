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
let cursor_missions = db.missions.find(
  {},
  { _id: 1, initialResources: 1, forces: 1 },
)

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Loop through forces.
  for (let force of mission.forces) {
    // Set initial resources for force from mission.
    force.initialResources = mission.initialResources
  }

  // Update mission in database with updated force
  // and delete initial resources on the mission level.
  db.missions.updateOne(
    { _id: mission._id },
    { $unset: { initialResources: 1 }, $set: { forces: mission.forces } },
  )
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 27 } })
