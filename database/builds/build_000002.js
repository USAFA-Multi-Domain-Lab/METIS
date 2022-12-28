// This migration script is responsible
// for adding the depthPadding property
// to the node level of the mission schema.

use('mdl')

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  for (let nodeDatum of nodeData) {
    nodeDatum.depthPadding = 0
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 2 } })
