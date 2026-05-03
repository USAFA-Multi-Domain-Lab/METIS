// Build 58: Migrate effect arguments to typed array format.
//
// Renames the args field to arguments on all effect subdocuments, and
// converts the value from a plain record { [parameterId]: value } to a
// typed array [{ _id, parameterId, type, value }].
//
// Type is inferred from the stored value's JS type:
//   number              → 'number'
//   boolean             → 'boolean'
//   Array or object     → 'mission-component' (consolidates the old force/node/action/
//                         file/resource/pool metadata types; value shape is preserved
//                         as-is and will surface as a mission issue for manual correction)
//   string or other     → 'unknown' (string, large-string, and string-option dropdown
//                         are indistinguishable; the editor will promote to the real
//                         type on the next save once the target environment is available)
//
// Applies to session-triggered root effects and all execution-triggered
// action effects.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

function inferArgumentType(value) {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'mission-component'
  if (value !== null && typeof value === 'object') return 'mission-component'
  return 'unknown'
}

// Extracts the component localKey or ID from an old-style metadata object.
// Detection order is most-specific-first: action has nodeKey too, so check
// actionKey before nodeKey.
function extractComponentId(object) {
  if (typeof object.actionKey === 'string') return object.actionKey
  if (typeof object.nodeKey === 'string') return object.nodeKey
  if (typeof object.poolKey === 'string') return object.poolKey
  if (typeof object.forceKey === 'string') return object.forceKey
  if (typeof object.fileId === 'string') return object.fileId
  if (typeof object.resourceId === 'string') return object.resourceId
  return ''
}

function migrateArgumentValue(type, value) {
  if (
    type === 'mission-component' &&
    !Array.isArray(value) &&
    value !== null &&
    typeof value === 'object'
  ) {
    return extractComponentId(value)
  }
  return value
}

function convertEffectArgs(effect) {
  let record = effect.args
  let entries = Object.entries(record)
  let converted = []
  for (let i = 0; i < entries.length; i++) {
    let parameterId = entries[i][0]
    let value = entries[i][1]
    let type = inferArgumentType(value)
    converted.push({
      _id: new ObjectId().toString(),
      parameterId,
      type,
      value: migrateArgumentValue(type, value),
    })
  }
  delete effect.args
  effect['arguments'] = converted
}

print('Migrating effect arguments to typed array format...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()
  let forces = mission.forces
  let effects = mission.effects ?? []

  for (let effect of effects) {
    convertEffectArgs(effect)
  }

  for (let force of forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        for (let effect of action.effects) {
          convertEffectArgs(effect)
        }
      }
    }
  }

  db.missions.updateOne({ _id: mission._id }, { $set: { forces, effects } })
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 58 } })
