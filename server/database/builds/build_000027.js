// This migration script is responsible
// for moving initial resources from the
// mission level to the force level.

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
