// This migration script is responsible
// for adding the introduction message
// property at the mission level of the
// missions collection.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  mission.introMessage = 'Enter your overview message here.'

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 11 } })
