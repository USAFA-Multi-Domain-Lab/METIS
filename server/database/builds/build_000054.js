// This migration script adds fields for tracking failed login attempts
// and account lockout to existing user documents.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Adding login attempt tracking fields to user documents...')

// Update all users that don't have the new fields
let result = db.users.updateMany(
  {
    $or: [
      { failedLoginAttempts: { $exists: false } },
      { lastFailedLoginAt: { $exists: false } },
      { loginLockedUntil: { $exists: false } },
    ],
  },
  {
    $set: {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      loginLockedUntil: null,
    },
  },
)

print(
  `Updated ${result.modifiedCount} user document(s) with login attempt tracking fields.`,
)
print('Migration complete.')

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 54 } })
