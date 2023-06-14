// This migration script is responsible
// for changing the color property's
// value at the node level of the
// missions collection to use hexidecimal
// values.

let dbName = 'mdl'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

let cursor_missions = db.missions.find({}, { missionID: 1, nodeData: 1 })

while (cursor_missions.hasNext()) {
  let mission = cursor_missions.next()
  let nodeData = mission.nodeData

  for (let nodeDatum of nodeData) {
    let color = nodeDatum.color

    if (color === 'default') {
      nodeDatum.color = '#ffffff'
    } else if (color === 'green') {
      nodeDatum.color = '#65eb59'
    } else if (color === 'pink') {
      nodeDatum.color = '#fa39ac'
    } else if (color === 'yellow') {
      nodeDatum.color = '#f7e346'
    } else if (color === 'blue') {
      nodeDatum.color = '#34a1fb'
    } else if (color === 'purple') {
      nodeDatum.color = '#ae66d6'
    } else if (color === 'red') {
      nodeDatum.color = '#f9484f'
    } else if (color === 'brown') {
      nodeDatum.color = '#ac8750'
    } else if (color === 'orange') {
      nodeDatum.color = '#ffab50'
    }
  }

  db.missions.updateOne({ missionID: mission.missionID }, { $set: mission })
}

print('Updating schema build number...')

db.infos.updateOne({ infoID: 'default' }, { $set: { schemaBuildNumber: 10 } })
