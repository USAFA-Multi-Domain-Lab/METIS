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

// Get missions from database.
let cursor_missions = db.missions.find({}, { missionID: 1, name: 1 })
// This will be used to cache
// mission names when the name
// index is dropped, and it will be
// used to readd it.
let nameCache = {}

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Cache the name.
  nameCache[mission.missionID] = mission.name
}

// Drop the name index.
db.missions.dropIndex('name')

// Loop through missions.
while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  // Readd the name.
  mission.name = nameCache[mission.missionID]

  // Update the mission in the database.
  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 8 } })
