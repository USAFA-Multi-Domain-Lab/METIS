import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMissionImportBuild } from '../ImportMigrationBuilder'

// -- BUILD 58 --
// Renames args → arguments on all effect objects and converts the value
// from a plain record { [parameterId]: value } to a typed array
// [{ _id, parameterId, type, value }].
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

const inferArgumentType = (value: unknown): string => {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value !== null && typeof value === 'object') return 'mission-component'
  return 'unknown'
}

// Converts an old-style mission component metadata object into the new
// TMissionComponentSerializedSelection[] format by resolving localKeys
// against the mission document. Returns an empty array if any lookup fails.
const buildMissionComponentValue = (
  missionData: any,
  object: Record<string, unknown>,
): object[] => {
  let force = null
  let pool = null
  let node = null
  let action = null

  if (object.forceKey) {
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
  if (force && object.nodeKey) {
    node =
      force.nodes.find((node: any) => node.localKey === object.nodeKey) ?? null
  }
  if (force && node && object.actionKey) {
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
): unknown => {
  if (type === 'mission-component') {
    return buildMissionComponentValue(
      missionData,
      value as Record<string, unknown>,
    )
  }
  return value
}

const migrateEffect = (missionData: any, effect: any) => {
  const record: Record<string, unknown> = effect.args
  effect.arguments = Object.entries(record).map(([parameterId, value]) => {
    const type = inferArgumentType(value)
    return {
      _id: StringToolbox.generateRandomId(),
      parameterId,
      type,
      value: migrateArgumentValue(missionData, type, value),
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
          migrateEffect(missionData, effect)
        }
      }
    }
  }
}

export default build
