// Rename args → arguments on all effect subdocuments
// (session effects and execution effects) in mission documents.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Renaming args field to arguments on effect subdocuments...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()

  let forces = mission.forces

  for (let force of forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        for (let effect of action.sessionEffects) {
          if ('args' in effect) {
            effect['arguments'] = effect.args
            delete effect.args
          }
        }
        for (let effect of action.executionEffects) {
          if ('args' in effect) {
            effect['arguments'] = effect.args
            delete effect.args
          }
        }
      }
    }
  }

  db.missions.updateOne({ _id: mission._id }, { $set: { forces } })
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 58 } })
