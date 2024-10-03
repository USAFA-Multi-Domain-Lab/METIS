// This migration script is responsible
// for moving the introMessage from the
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
  { _id: 1, introMessage: 1, forces: 1 },
)

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Loop through forces.
  for (let force of mission.forces) {
    // Set intro message for force from mission.
    force.introMessage = mission.introMessage
  }

  // Update mission in database with updated force
  // and delete intro message on the mission level.
  db.missions.updateOne(
    { _id: mission._id },
    { $unset: { introMessage: 1 }, $set: { forces: mission.forces } },
  )
}
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 28 } })
