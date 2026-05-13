import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 58 --
// Renames args → arguments on all effect objects and converts the value
// from a plain record { [parameterId]: value } to a typed array
// [{ _id, parameterId, type, value }].
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

// The known key sets for the 6 old mission-component metadata types.
const METADATA_KEY_SETS: Set<string>[] = [
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

// Returns true if value matches one of the 6 old mission-component
// metadata shapes: non-null non-array object, at least one key, every
// value a string, and every key present in a single known key set.
const isMissionComponentMetadata = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const keys = Object.keys(value as object)
  if (keys.length === 0) return false
  const record = value as Record<string, unknown>
  if (!keys.every((key) => typeof record[key] === 'string')) return false
  return METADATA_KEY_SETS.some((keySet) =>
    keys.every((key) => keySet.has(key)),
  )
}

// Determines the argument type based on the format of the value.
const inferArgumentType = (value: unknown): string => {
  if (isMissionComponentMetadata(value)) return 'mission-component'
  return 'unknown'
}

// Converts an old-style mission component metadata object into the new
// TMissionComponentSerializedSelection[] format by resolving localKeys
// against the mission document. Returns an empty array if any lookup fails.
const buildMissionComponentValue = (
  missionData: any,
  object: Record<string, unknown>,
  sourceForce: any = null,
  sourceNode: any = null,
  sourceAction: any = null,
): object[] => {
  let force = null
  let pool = null
  let node = null
  let action = null

  if (object.forceKey === 'self') {
    force = sourceForce
  } else if (object.forceKey) {
    force =
      missionData.forces.find(
        (force: any) => force.localKey === object.forceKey,
      ) ?? null
  }
  if (force && object.poolKey) {
    pool =
      force.resourcePools.find(
        (pool: any) => pool.localKey === object.poolKey,
      ) ?? null
  }
  if (force && object.nodeKey === 'self') {
    node = sourceNode
  } else if (force && object.nodeKey) {
    node =
      force.nodes.find((node: any) => node.localKey === object.nodeKey) ?? null
  }
  if (force && node && object.actionKey === 'self') {
    action = sourceAction
  } else if (force && node && object.actionKey) {
    action =
      node.actions.find(
        (action: any) => action.localKey === object.actionKey,
      ) ?? null
  }

  if (action) {
    return [
      {
        componentType: 'action',
        lastKnownName: action.name,
        ids: [force._id, node._id, action._id],
      },
    ]
  } else if (pool) {
    return [
      {
        componentType: 'resourcePool',
        lastKnownName: pool.name,
        ids: [force._id, pool._id],
      },
    ]
  } else if (node) {
    return [
      {
        componentType: 'node',
        lastKnownName: node.name,
        ids: [force._id, node._id],
      },
    ]
  } else if (force) {
    return [
      { componentType: 'force', lastKnownName: force.name, ids: [force._id] },
    ]
  } else if (object.fileId) {
    return [
      {
        componentType: 'missionFile',
        lastKnownName: object.fileName ?? '',
        ids: [object.fileId as string],
      },
    ]
  } else if (object.resourceId) {
    return [
      {
        componentType: 'resource',
        lastKnownName: object.resourceName ?? '',
        ids: [object.resourceId as string],
      },
    ]
  }
  return []
}

const migrateArgumentValue = (
  missionData: any,
  type: string,
  value: unknown,
  sourceForce: any = null,
  sourceNode: any = null,
  sourceAction: any = null,
): unknown => {
  if (type === 'mission-component') {
    return buildMissionComponentValue(
      missionData,
      value as Record<string, unknown>,
      sourceForce,
      sourceNode,
      sourceAction,
    )
  }
  return value
}

const migrateEffect = (
  missionData: any,
  effect: any,
  sourceForce: any = null,
  sourceNode: any = null,
  sourceAction: any = null,
) => {
  const record: Record<string, unknown> = effect.args
  effect.arguments = Object.entries(record).map(([parameterId, value]) => {
    const type = inferArgumentType(value)
    return {
      _id: StringToolbox.generateRandomId(),
      parameterId,
      type,
      value: migrateArgumentValue(
        missionData,
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

const build: TMissionImportBuild = async (missionData) => {
  for (const effect of missionData.effects ?? []) {
    migrateEffect(missionData, effect)
  }

  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        for (const effect of action.effects) {
          migrateEffect(missionData, effect, force, node, action)
        }
      }
    }
  }
}

export default build
