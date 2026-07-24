import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'
import { StringToolbox } from '@metis/toolbox/strings/StringToolbox'

let migrations = new TargetMigrationRegistry()

// Migrates effects to be compatible with the new 'resources' arg
// added in v2.4.0 of METIS.
migrations.register('2.4.0', (effect) => {
  let firstResource = effect.mission.resources.sort(
    (resourceA, resourceB) => resourceA.order - resourceB.order,
  )[0]
  if (!firstResource) {
    throw new Error(
      `Migration failed. No resources found in the mission. ` +
        `A resource must be added to the mission before this migration can be applied.`,
    )
  }

  effect.arguments.push({
    _id: StringToolbox.generateRandomId(),
    parameterId: 'resourceMetadata',
    type: 'mission-component',
    value: [
      {
        componentType: 'resource',
        lastKnownName: firstResource.name,
        ids: [firstResource._id],
      },
    ],
  })
})

// Migrates effects to be compatible with renamed parameter IDs in v2.5.0 of METIS.
migrations.register('2.5.0', (effect) => {
  // Renames are wrapped for this update only. Legacy args predate the typed
  // storage format and may omit an optional or dependency-gated parameter, so a
  // rename can find nothing to update. A missing argument is backfilled with its
  // default by the client on load, so skipping it here is safe.
  try {
    MigrationToolbox.updateParameterId(effect, 'actionMetadata', 'applyTo')
  } catch {
    // Legacy argument absent; safe to skip.
  }
  try {
    MigrationToolbox.updateParameterId(effect, 'resourceMetadata', 'resources')
  } catch {
    // Legacy argument absent; safe to skip.
  }
  try {
    MigrationToolbox.updateParameterId(effect, 'resourceCost', 'amount')
  } catch {
    // Legacy argument absent; safe to skip.
  }
})

export { migrations }
