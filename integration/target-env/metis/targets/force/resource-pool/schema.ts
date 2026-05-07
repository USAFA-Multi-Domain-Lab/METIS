import { NumberToolbox } from '@metis/toolbox/numbers/NumberToolbox'
import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to modify a force's resource pool through various operations.
 */
const ResourcePool = TargetSchema.create({
  _id: 'resource-pool',
  name: 'Resource Pool',
  description: "Modify a force's resource pool",
  script: async (context, poolMetadata, operation, amount) => {
    // Extract the selected resource pool from the mission-component argument.
    const [pool] = poolMetadata

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
        context.modifyResourcePool(amount, {
          forceKey: pool.force.localKey,
          poolKey: pool.localKey,
        })
        break
      default:
        throw new Error(
          `${errorMessage}\n` + `Unknown operation: "${operation}"`,
        )
    }
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'poolMetadata',
      name: 'Resource Pool',
      required: true,
      validComponentTypes: ['resourcePool'] as const,
    },
    {
      type: 'dropdown' as const,
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
      dependencies: [TargetDependency.TRUTHY('poolMetadata')],
    },
    {
      type: 'number' as const,
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
