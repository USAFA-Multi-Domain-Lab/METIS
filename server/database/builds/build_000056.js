// Remove the seed field from all mission documents.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Removing seed field from mission documents...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()

  db.missions.updateOne(
    { _id: mission._id },
    { $unset: { seed: '' } },
  )
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 56 } })
