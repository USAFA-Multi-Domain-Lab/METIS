import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { NumberToolbox } from '@metis/toolbox/numbers/NumberToolbox'
import type { TPoolMetadata } from '@shared/target-environments/types'

let migrations = new TargetMigrationRegistry()

// Migrates awards to be compatible with new multi-resource
// system added in v2.4.0 of METIS.
migrations.register('2.4.0', (effect) => {
  let { forceKey, forceName } = effect.args.forceMetadata as TForceMetadata

  // Find force
  let force: typeof effect.sourceForce | undefined = effect.sourceForce // Default to source force.
  if (forceKey !== 'self') {
    effect.mission.forces.find(({ localKey }) => localKey === forceKey) // Perform search if not targeting source force.
  }
  if (!force) {
    throw new Error(
      `Migration failed. Force with key "${forceKey}" not found. A force with the key must be added to the mission before this migration can be applied.`,
    )
  }
  // Find pool
  let firstPool = force?.resourcePools.sort(
    (poolA, poolB) => poolA.resource.order - poolB.resource.order,
  )[0]
  if (!firstPool) {
    throw new Error(
      `Migration failed. No resource pools found for force "${forceName}". A resource pool must be added to the force before this migration can be applied.`,
    )
  }

  // Update args to include pool metadata instead
  // of simple force metadata.
  effect.args.poolMetadata = {
    forceKey,
    forceName,
    poolKey: firstPool.localKey,
    poolName: firstPool.name,
  } satisfies TPoolMetadata
  delete effect.args.forceMetadata
})

/**
 * A target available in the METIS target environment that enables a user
 * to modify a force's resource pool through various operations.
 */
const ResourcePool = new TargetSchema({
  _id: 'resource-pool',
  name: 'Resource Pool',
  description: "Modify a force's resource pool",
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { operation, amount, poolMetadata } = effect.args
    const { forceKey, poolKey } = poolMetadata as TPoolMetadata

    // Set the error message.
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    if (!NumberToolbox.isNonNegative(amount)) {
      throw new Error(
        `${errorMessage}\n` + `Amount must be a non-negative number.`,
      )
    }

    // Execute the operation on the resource pool.
    switch (operation) {
      case 'award':
        context.modifyResourcePool(amount, { forceKey, poolKey })
        break
      default:
        throw new Error(
          `${errorMessage}\n` + `Unknown operation: "${operation}"`,
        )
    }
  },
  args: [
    {
      type: 'pool',
      _id: 'poolMetadata',
      name: 'Resource Pool',
      required: true,
    },
    {
      type: 'dropdown',
      _id: 'operation',
      name: 'Operation',
      required: true,
      default: { _id: 'award', name: 'Award', value: 'award' },
      options: [
        {
          _id: 'award',
          name: 'Award',
          value: 'award',
        },
      ],
      dependencies: [TargetDependency.POOL('poolMetadata')],
    },
    {
      type: 'number',
      _id: 'amount',
      name: 'Amount',
      required: true,
      default: 0,
      min: 0,
      dependencies: [TargetDependency.EQUALS('operation', 'award')],
      tooltipDescription: 'The amount to award to the resource pool.',
    },
  ],
  migrations,
})

export default ResourcePool
