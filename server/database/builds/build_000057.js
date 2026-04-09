// Rename processTime → baseProcessTime and successChance → baseSuccessChance
// on all action subdocuments in mission documents.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Renaming processTime and successChance fields on action subdocuments...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()

  let forces = mission.forces

  for (let force of forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        action.baseProcessTime = action.processTime
        action.baseSuccessChance = action.successChance
        delete action.processTime
        delete action.successChance
      }
    }
  }

  db.missions.updateOne({ _id: mission._id }, { $set: { forces } })
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 57 } })
