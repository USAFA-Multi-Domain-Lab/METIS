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
  if (Array.isArray(value)) return 'mission-component'
  if (value !== null && typeof value === 'object') return 'mission-component'
  return 'unknown'
}

// Extracts the component localKey or ID from an old-style metadata object.
// Detection order is most-specific-first: action has nodeKey too, so check
// actionKey before nodeKey.
const extractComponentId = (obj: Record<string, unknown>): string => {
  if (typeof obj.actionKey === 'string') return obj.actionKey
  if (typeof obj.nodeKey === 'string') return obj.nodeKey
  if (typeof obj.poolKey === 'string') return obj.poolKey
  if (typeof obj.forceKey === 'string') return obj.forceKey
  if (typeof obj.fileId === 'string') return obj.fileId
  if (typeof obj.resourceId === 'string') return obj.resourceId
  return ''
}

const migrateArgumentValue = (type: string, value: unknown): unknown => {
  if (type === 'mission-component' && !Array.isArray(value) && value !== null && typeof value === 'object') {
    return extractComponentId(value as Record<string, unknown>)
  }
  return value
}

const build: TMissionImportBuild = async (missionData) => {
  const migrateEffect = (effect: any) => {
    const record: Record<string, unknown> = effect.args
    effect.arguments = Object.entries(record).map(([parameterId, value]) => {
      const type = inferArgumentType(value)
      return {
        _id: StringToolbox.generateRandomId(),
        parameterId,
        type,
        value: migrateArgumentValue(type, value),
      }
    })
    delete effect.args
  }

  for (const effect of missionData.effects ?? []) {
    migrateEffect(effect)
  }

  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
        for (const effect of action.effects) {
          migrateEffect(effect)
        }
      }
    }
  }
}

export default build
