import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'
import { StringToolbox } from '@metis/toolbox/strings/StringToolbox'

let migrations = new TargetMigrationRegistry()

// Migrates awards to be compatible with new multi-resource
// system added in v2.4.0 of METIS.
migrations.register('2.4.0', (effect) => {
  // Find force
  let forceIndex = effect.arguments.findIndex(
    (argument) => argument.parameterId === 'forceMetadata',
  )
  let forceArgument = effect.arguments[forceIndex]
  if (
    !forceArgument ||
    forceArgument.type !== 'mission-component' ||
    !forceArgument.value.length ||
    forceArgument.value[0].componentType !== 'force' ||
    !forceArgument.value[0].ids.length
  ) {
    throw new Error(
      `Migration failed. No force found in effect arguments. ` +
        `A force must be selected in the effect arguments before this migration can be applied.`,
    )
  }

  let forceSelection = forceArgument.value[0]
  let forceId = forceSelection.ids[0]
  let forceName = forceSelection.lastKnownName

  let force = effect.mission.forces.find((f) => f._id === forceId)
  if (!force) {
    throw new Error(
      `Migration failed. Force "${forceName}" not found. ` +
        `A force with this ID must exist in the mission before this migration can be applied.`,
    )
  }

  // Find pool
  let firstPool = force.resourcePools.sort(
    (poolA, poolB) => poolA.resource.order - poolB.resource.order,
  )[0]
  if (!firstPool) {
    throw new Error(
      `Migration failed. No resource pools found for force "${force.name}". ` +
        `A resource pool must be added to the force before this migration can be applied.`,
    )
  }

  // Replace force argument with pool argument.
  effect.arguments[forceIndex] = {
    _id: StringToolbox.generateRandomId(),
    parameterId: 'poolMetadata',
    type: 'mission-component',
    value: [
      {
        componentType: 'resourcePool',
        lastKnownName: firstPool.name,
        ids: [force._id, firstPool._id],
      },
    ],
  }
})

// Migrates effects to be compatible with renamed parameter IDs in v2.5.0 of METIS.
migrations.register('2.5.0', (effect) => {
  // Renames are wrapped for this update only. Args stored before the typed array
  // format may omit an optional or dependency-gated parameter, so a rename can
  // find nothing to update. A missing argument is backfilled with its default by
  // the client on load, so skipping it here is safe.
  try {
    MigrationToolbox.updateParameterId(effect, 'poolMetadata', 'applyTo')
  } catch {
    // Argument absent; safe to skip.
  }
})

export { migrations }
