// This migration script is responsible
// for adding the deleted property
// to the missions collection.

use('mdl')

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()

  mission.deleted = false

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 4 } })
