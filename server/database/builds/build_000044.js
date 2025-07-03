// This migration script is responsible for updating
// various collections to have createdBy and
// createdByUsername fields populated with the system
// user.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating mission data to updated schema...')

function assignCreatedByFields(collection) {
  // Query for all documents in the collection.
  let cursor = db[collection].find(
    {},
    { _id: 1, createdBy: 1, createdByUsername: 1 },
  )

  while (cursor.hasNext()) {
    let doc = cursor.next()

    // If createdBy is not set, set it to the system user ID.
    if (!doc.createdBy) {
      doc.createdBy = ObjectId('000000000000000000000000')
    }
    // If createdByUsername is not set, set it to 'metis'.
    if (!doc.createdByUsername) {
      doc.createdByUsername = 'metis'
    }

    // Update the document with the new fields.
    db[collection].updateOne({ _id: doc._id }, { $set: doc })
  }
}

assignCreatedByFields('missions')
assignCreatedByFields('users')

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 44 } })
