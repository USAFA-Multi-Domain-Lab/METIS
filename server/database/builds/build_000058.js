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

// Determines the argument type based on
// the format of the value.
function inferArgumentType(value) {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value !== null && typeof value === 'object') return 'mission-component'
  return 'unknown'
}

// Converts an old-style mission component metadata object into the new
// TMissionComponentSerializedSelection[] format by resolving localKeys
// against the mission document. Returns an empty array if any lookup fails.
function buildMissionComponentValue(
  mission,
  object,
  sourceForce = null,
  sourceNode = null,
  sourceAction = null,
) {
  let force = null
  let pool = null
  let node = null
  let action = null

  // Determine force.
  if (object.forceKey === 'self') {
    force = sourceForce
  } else if (object.forceKey) {
    force = mission.forces.find((force) => {
      return force.localKey === object.forceKey
    })
  }

  // Determine pool.
  if (force && object.poolKey) {
    pool = force.resourcePools.find((pool) => {
      return pool.localKey === object.poolKey
    })
  }

  // Determine node.
  if (force && object.nodeKey === 'self') {
    node = sourceNode
  } else if (force && object.nodeKey) {
    node = force.nodes.find((node) => {
      return node.localKey === object.nodeKey
    })
  }

  // Determine action.
  if (force && node && object.actionKey === 'self') {
    action = sourceAction
  } else if (force && node && object.actionKey) {
    action = node.actions.find((action) => {
      return action.localKey === object.actionKey
    })
  }

  // Format and return results.
  if (action) {
    return [
      {
        componentType: 'action',
        lastKnownName: action.name,
        ids: [force._id, node._id, action._id],
      },
    ]
  }
  if (pool) {
    return [
      {
        componentType: 'resource-pool',
        lastKnownName: pool.name,
        ids: [force._id, pool._id],
      },
    ]
  }
  if (node) {
    return [
      {
        componentType: 'node',
        lastKnownName: node.name,
        ids: [force._id, node._id],
      },
    ]
  }
  if (force) {
    return [
      { componentType: 'force', lastKnownName: force.name, ids: [force._id] },
    ]
  }
  if (object.fileId) {
    return [
      {
        componentType: 'file',
        lastKnownName: object.fileName ?? '',
        ids: [object.fileId],
      },
    ]
  }
  if (object.resourceId) {
    return [
      {
        componentType: 'resource',
        lastKnownName: object.resourceName ?? '',
        ids: [object.resourceId],
      },
    ]
  }
  return []
}

// Converts argument value to a new format,
// if a new format is needed.
function migrateArgumentValue(
  mission,
  type,
  value,
  sourceForce = null,
  sourceNode = null,
  sourceAction = null,
) {
  if (type === 'mission-component') {
    return buildMissionComponentValue(
      mission,
      value,
      sourceForce,
      sourceNode,
      sourceAction,
    )
  } else {
    return value
  }
}

// Converts effect args to the updated
// data structure requirements.
function convertEffectArgs(
  mission,
  effect,
  sourceForce = null,
  sourceNode = null,
  sourceAction = null,
) {
  let record = effect.args
  effect['arguments'] = Object.entries(record).map(([parameterId, value]) => {
    let type = inferArgumentType(value)
    return {
      _id: crypto.randomUUID(),
      parameterId,
      type,
      value: migrateArgumentValue(
        mission,
        type,
        value,
        sourceForce,
        sourceNode,
        sourceAction,
      ),
    }
  })
  delete effect.args
}

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating effect arguments to typed array format...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()
  let forces = mission.forces
  let effects = mission.effects ?? []

  for (let effect of effects) {
    convertEffectArgs(mission, effect)
  }

  for (let force of forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        for (let effect of action.effects) {
          convertEffectArgs(mission, effect, force, node, action)
        }
      }
    }
  }

  db.missions.updateOne({ _id: mission._id }, { $set: { forces, effects } })
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 58 } })
