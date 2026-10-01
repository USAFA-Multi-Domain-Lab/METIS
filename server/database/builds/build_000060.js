// Add an empty description to every resource defined on a mission,
// including missions marked deleted.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Adding a description to mission resources...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()
  let resources = mission.resources

  for (let resource of resources) {
    resource.description = ''
  }

  db.missions.updateOne({ _id: mission._id }, { $set: { resources } })
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 60 } })
