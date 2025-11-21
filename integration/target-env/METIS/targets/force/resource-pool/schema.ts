import { NumberToolbox } from '@metis/toolbox/numbers/NumberToolbox'

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
    const { operation, amount, forceMetadata } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata

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
        context.modifyResourcePool(amount, { forceKey })
        break
      default:
        throw new Error(
          `${errorMessage}\n` + `Unknown operation: "${operation}"`,
        )
    }
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetadata',
      name: 'Force',
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
      dependencies: [TargetDependency.FORCE('forceMetadata')],
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
})

export default ResourcePool
