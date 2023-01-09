// This migration script is responsible
// for generating a default action for
// any existing nodes that are executable
// and without an action.

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
