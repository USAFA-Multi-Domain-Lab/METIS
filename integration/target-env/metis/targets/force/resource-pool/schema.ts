import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to modify a force's resource pool through various operations.
 */
const ResourcePool = TargetSchema.create({
  _id: 'resource-pool',
  name: 'Resource Pool',
  description: "Modify a force's resource pool",
  script: async (context, applyTo, operation, amount) => {
    switch (operation) {
      case 'award':
        context.modifyResourcePool(applyTo, amount)
        break
      default:
        throw new Error(
          `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
            `Effect ID: "${context.effect._id}"\n` +
            `Effect Name: "${context.effect.name}"\n` +
            `Unknown operation: "${operation}"`,
        )
    }
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Resource Pool',
      validComponentTypes: ['mission', 'force', 'resourcePool'],
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
      dependencies: [TargetDependency.NOT_EMPTY('applyTo')],
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
