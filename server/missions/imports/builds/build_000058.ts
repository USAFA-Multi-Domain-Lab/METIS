import { databaseLogger } from '@server/logging'
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

// Maximum number of unresolved references listed individually in the
// warning logged for an import. The summary count stays complete.
const UNRESOLVED_DETAIL_LIMIT = 50

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
const isMissionComponentMetadata = (
  value: unknown,
): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const entries = Object.entries(value)
  if (entries.length === 0) return false
  if (!entries.every(([, entry]) => typeof entry === 'string')) return false
  return METADATA_KEY_SETS.some((keySet) =>
    entries.every(([key]) => keySet.has(key)),
  )
}

// Determines the argument type based on the format of the value.
const inferArgumentType = (value: unknown): string => {
  if (isMissionComponentMetadata(value)) return 'mission-component'
  return 'unknown'
}

// Converts an old-style mission component metadata object into the new
// TMissionComponentSerializedSelection[] format by resolving localKeys
// against the mission document.
//
// Returns the selections alongside the most specific component that actually
// resolved, so a failed lookup can report how far it got before running out
// of matches.
const buildMissionComponentValue = (
  missionData: any,
  object: Record<string, unknown>,
  sourceForce: any = null,
  sourceNode: any = null,
  sourceAction: any = null,
): TComponentResolution => {
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

  // The most specific component that resolved, regardless of which one the
  // metadata actually named.
  let resolvedType: string | null = null

  if (action) resolvedType = 'action'
  else if (pool) resolvedType = 'resourcePool'
  else if (node) resolvedType = 'node'
  else if (force) resolvedType = 'force'

  // Format results. Each branch keys off the component the metadata named,
  // and the guard for a missing match is nested inside it rather than folded
  // into the condition. Folding it in would let a failed action lookup fall
  // through to the nodeKey branch its own metadata also carries, silently
  // retargeting the effect at a broader component than it pointed at before.
  let selections: TSerializedSelection[] = []

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
        missionData.resources.find((resource: any) => {
          return resource._id === pool.resourceId
        })?.name ?? 'Unknown Resource'
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
  } else if (typeof object.fileId === 'string' && object.fileId) {
    selections = [
      {
        componentType: 'missionFile',
        lastKnownName:
          typeof object.fileName === 'string' ? object.fileName : '',
        ids: [object.fileId],
      },
    ]
  } else if (typeof object.resourceId === 'string' && object.resourceId) {
    selections = [
      {
        componentType: 'resource',
        lastKnownName:
          typeof object.resourceName === 'string' ? object.resourceName : '',
        ids: [object.resourceId],
      },
    ]
  }

  return { selections, resolvedType }
}

// Returns the component type the legacy metadata was pointing at, based on
// the most specific key it carries. Used to detect when a lookup failed and
// buildMissionComponentValue fell back to an ancestor component.
const expectedComponentType = (
  object: Record<string, unknown>,
): string | null => {
  if (object.actionKey) return 'action'
  else if (object.poolKey) return 'resourcePool'
  else if (object.nodeKey) return 'node'
  else if (object.forceKey) return 'force'
  else if (object.fileId) return 'missionFile'
  else if (object.resourceId) return 'resource'
  else return null
}

const migrateEffect = (
  missionData: any,
  effect: any,
  unresolvedReferences: TUnresolvedReference[],
  sourceForce: any = null,
  sourceNode: any = null,
  sourceAction: any = null,
) => {
  const record: Record<string, unknown> = effect.args
  effect.arguments = Object.entries(record).map(([parameterId, value]) => {
    const type = inferArgumentType(value)
    let migratedValue: unknown = value

    if (isMissionComponentMetadata(value)) {
      let resolution = buildMissionComponentValue(
        missionData,
        value,
        sourceForce,
        sourceNode,
        sourceAction,
      )
      migratedValue = resolution.selections

      // The effect targeted a component that no longer exists. Report it,
      // since the args record naming it is deleted below.
      if (resolution.selections.length === 0) {
        unresolvedReferences.push({
          effectId: effect._id,
          parameterId,
          metadata: value,
          expectedType: expectedComponentType(value),
          resolvedType: resolution.resolvedType,
        })
      }
    }

    return {
      _id: StringToolbox.generateRandomId(),
      parameterId,
      type,
      value: migratedValue,
    }
  })
  delete effect.args
}

// Logs the references that could not be resolved against the imported
// mission. The original metadata is included because this build deletes
// each effect's args record, leaving this warning as the only record of
// what the effect used to point at.
const reportUnresolvedReferences = (
  missionData: any,
  unresolvedReferences: TUnresolvedReference[],
): void => {
  if (unresolvedReferences.length === 0) return

  let details = unresolvedReferences
    .slice(0, UNRESOLVED_DETAIL_LIMIT)
    .map((reference) => {
      let outcome = reference.resolvedType
        ? `expected ${reference.expectedType}, resolved ${reference.resolvedType} only`
        : `expected ${reference.expectedType}, nothing resolved`

      return (
        `  effect ${reference.effectId} / parameter "${reference.parameterId}"` +
        ` - ${JSON.stringify(reference.metadata)} - ${outcome}`
      )
    })
  let truncatedCount = unresolvedReferences.length - details.length

  if (truncatedCount > 0) {
    details.push(`  ...and ${truncatedCount} more (truncated).`)
  }

  databaseLogger.warn(
    `Build 58 import migration: ${unresolvedReferences.length} mission component ` +
      `reference(s) in mission "${missionData.name}" did not resolve to the ` +
      'component they named. The effects below now target nothing and must ' +
      'be reconfigured by hand.\n' +
      details.join('\n'),
  )
}

const build: TMissionImportBuild = async (missionData) => {
  let unresolvedReferences: TUnresolvedReference[] = []

  for (const effect of missionData.effects ?? []) {
    migrateEffect(missionData, effect, unresolvedReferences)
  }

  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        for (const effect of action.effects) {
          migrateEffect(
            missionData,
            effect,
            unresolvedReferences,
            force,
            node,
            action,
          )
        }
      }
    }
  }

  reportUnresolvedReferences(missionData, unresolvedReferences)
}

export default build

/* -- TYPES -- */

/**
 * A mission component reference that did not resolve to the
 * component it named in the imported mission data.
 */
type TUnresolvedReference = {
  effectId: string
  parameterId: string
  metadata: unknown
  expectedType: string | null
  resolvedType: string | null
}

/**
 * The shape of a migrated mission component selection.
 */
type TSerializedSelection = {
  componentType: string
  lastKnownName: string
  ids: string[]
}

/**
 * The outcome of resolving a legacy metadata object against the mission:
 * the selections it named, and the most specific component that actually
 * resolved so a failed lookup can report how far it got.
 */
type TComponentResolution = {
  selections: TSerializedSelection[]
  resolvedType: string | null
}
