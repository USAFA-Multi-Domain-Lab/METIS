// Build 58: Migrate effect arguments to typed array format.
//
// Renames the args field to arguments on all effect subdocuments, and
// converts the value from a plain record { [parameterId]: value } to a
// typed array [{ _id, parameterId, type, value }].
//
// Type detection:
//   mission-component   → value is a non-null, non-array object whose keys are all
//                         drawn from one of the 6 known metadata key sets (TForceMetadata,
//                         TNodeMetadata, TActionMetadata, TPoolMetadata, TResourceMetadata,
//                         TFileMetadata) and whose every value is a string
//   everything else     → 'unknown' (numbers, booleans, strings, and plain objects are all
//                         valid dropdown option values and are indistinguishable; the editor
//                         will promote to the real type on the next save once the target
//                         environment is available)
//
// Applies to session-triggered root effects and all execution-triggered
// action effects.

// The known key sets for the 6 old mission-component metadata types.
const METADATA_KEY_SETS = [
  new Set(['forceKey', 'forceName']),
  new Set(['forceKey', 'forceName', 'nodeKey', 'nodeName']),
  new Set([
    'forceKey',
    'forceName',
    'nodeKey',
    'nodeName',
    'actionKey',
    'actionName',
  ]),
  new Set(['forceKey', 'forceName', 'poolKey', 'poolName']),
  new Set(['resourceId', 'resourceName']),
  new Set(['fileId', 'fileName']),
]

// Maximum number of unresolved references listed individually in the
// migration output. mongosh stdout is captured through a fixed buffer by
// the process that runs this build, so the detail list is capped while
// the summary count stays complete.
const UNRESOLVED_DETAIL_LIMIT = 50

let unresolvedReferenceCount = 0
let unresolvedReferenceDetails = []

// Returns the component type the legacy metadata was pointing at, based on
// the most specific key it carries. Used to detect when a lookup failed and
// buildMissionComponentValue fell back to an ancestor component.
function expectedComponentType(object) {
  if (object.actionKey) return 'action'
  else if (object.poolKey) return 'resourcePool'
  else if (object.nodeKey) return 'node'
  else if (object.forceKey) return 'force'
  else if (object.fileId) return 'missionFile'
  else if (object.resourceId) return 'resource'
  else return null
}

// Records a mission component reference that did not resolve to the
// component it named. The original metadata is included because the
// effect's args record is deleted by this migration, leaving this output as
// the only record of what the effect used to point at.
function recordUnresolvedReference(
  mission,
  effect,
  parameterId,
  metadata,
  expectedType,
  resolvedType,
) {
  unresolvedReferenceCount++

  if (unresolvedReferenceDetails.length < UNRESOLVED_DETAIL_LIMIT) {
    let outcome = resolvedType
      ? `expected ${expectedType}, resolved ${resolvedType} only`
      : `expected ${expectedType}, nothing resolved`

    unresolvedReferenceDetails.push(
      `  mission ${mission._id} / effect ${effect._id} / ` +
        `parameter "${parameterId}" - ${JSON.stringify(metadata)} - ${outcome}`,
    )
  }
}

// Returns true if value matches one of the 6 old mission-component
// metadata shapes: non-null non-array object, at least one key, every
// value a string, and every key present in a single known key set.
function isMissionComponentMetadata(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  if (!keys.every((key) => typeof value[key] === 'string')) return false
  return METADATA_KEY_SETS.some((keySet) =>
    keys.every((key) => keySet.has(key)),
  )
}

// Determines the argument type based on the format of the value.
function inferArgumentType(value) {
  if (isMissionComponentMetadata(value)) return 'mission-component'
  else return 'unknown'
}

// Returns the first element of a nested mission document array matching the
// predicate, or undefined. Nested document arrays are not true JS arrays and
// do not reliably support Array.prototype methods such as .find() in the
// mongosh shell, so this iterates with for...of per the migration guide.
function findInArray(array, predicate) {
  for (let item of array) {
    if (predicate(item)) return item
  }
  return undefined
}

// Converts an old-style mission component metadata object into the new
// TMissionComponentSerializedSelection[] format by resolving localKeys
// against the mission document.
//
// Returns the selections alongside the most specific component that actually
// resolved, so a failed lookup can report how far it got before running out
// of matches.
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
    force = findInArray(
      mission.forces,
      (force) => force.localKey === object.forceKey,
    )
  }

  // Determine pool.
  if (force && object.poolKey) {
    pool = findInArray(
      force.resourcePools,
      (pool) => pool.localKey === object.poolKey,
    )
  }

  // Determine node.
  if (force && object.nodeKey === 'self') {
    node = sourceNode
  } else if (force && object.nodeKey) {
    node = findInArray(force.nodes, (node) => node.localKey === object.nodeKey)
  }

  // Determine action.
  if (force && node && object.actionKey === 'self') {
    action = sourceAction
  } else if (force && node && object.actionKey) {
    action = findInArray(
      node.actions,
      (action) => action.localKey === object.actionKey,
    )
  }

  // The most specific component that resolved, regardless of which one the
  // metadata actually named.
  let resolvedType = null

  if (action) resolvedType = 'action'
  else if (pool) resolvedType = 'resourcePool'
  else if (node) resolvedType = 'node'
  else if (force) resolvedType = 'force'

  // Format results. Each branch keys off the component the metadata named,
  // and the guard for a missing match is nested inside it rather than folded
  // into the condition. Folding it in would let a failed action lookup fall
  // through to the nodeKey branch its own metadata also carries, silently
  // retargeting the effect at a broader component than it pointed at before.
  let selections = []

  if (object.actionKey) {
    if (action) {
      selections = [
        {
          componentType: 'action',
          lastKnownName: action.name,
          ids: [force._id, node._id, action._id],
        },
      ]
    }
  } else if (object.poolKey) {
    if (pool) {
      let resourceName =
        findInArray(
          mission.resources,
          (resource) => resource._id === pool.resourceId,
        )?.name ?? 'Unknown Resource'
      selections = [
        {
          componentType: 'resourcePool',
          lastKnownName: resourceName,
          ids: [force._id, pool._id],
        },
      ]
    }
  } else if (object.nodeKey) {
    if (node) {
      selections = [
        {
          componentType: 'node',
          lastKnownName: node.name,
          ids: [force._id, node._id],
        },
      ]
    }
  } else if (object.forceKey) {
    if (force) {
      selections = [
        { componentType: 'force', lastKnownName: force.name, ids: [force._id] },
      ]
    }
  } else if (object.fileId) {
    selections = [
      {
        componentType: 'missionFile',
        lastKnownName: object.fileName ?? '',
        ids: [object.fileId],
      },
    ]
  } else if (object.resourceId) {
    selections = [
      {
        componentType: 'resource',
        lastKnownName: object.resourceName ?? '',
        ids: [object.resourceId],
      },
    ]
  }

  return { selections, resolvedType }
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
    let migratedValue = value

    if (isMissionComponentMetadata(value)) {
      let resolution = buildMissionComponentValue(
        mission,
        value,
        sourceForce,
        sourceNode,
        sourceAction,
      )
      migratedValue = resolution.selections

      // The effect targeted a component that no longer exists. Report it,
      // since the args record naming it is deleted below.
      if (resolution.selections.length === 0) {
        recordUnresolvedReference(
          mission,
          effect,
          parameterId,
          value,
          expectedComponentType(value),
          resolution.resolvedType,
        )
      }
    }

    return {
      _id: crypto.randomUUID(),
      parameterId,
      type,
      value: migratedValue,
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

if (unresolvedReferenceCount > 0) {
  print(
    `Warning: ${unresolvedReferenceCount} mission component reference(s) did ` +
      'not resolve to the component they named. The effects below now target ' +
      'nothing and must be reconfigured by hand.',
  )

  for (let detail of unresolvedReferenceDetails) {
    print(detail)
  }

  let truncatedCount =
    unresolvedReferenceCount - unresolvedReferenceDetails.length

  if (truncatedCount > 0) {
    print(`  ...and ${truncatedCount} more (truncated).`)
  }
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 58 } })
