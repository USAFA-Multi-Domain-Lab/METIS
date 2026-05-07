import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource cost of a specific action within a node or
 * all actions within a node.
 */
const ResourceCostMod = TargetSchema.create({
  _id: 'resource-cost-mod',
  name: 'Resource Cost Modifier',
  description: '',
  script: async (context, actionMetadata, resourceMetadata, resourceCost) => {
    // Extract selected action and resource from the mission-component arguments.
    const [action] = actionMetadata
    const [resource] = resourceMetadata

    context.modifyResourceCost(resource._id, resourceCost, {
      forceKey: action.force.localKey,
      nodeKey: action.node.localKey,
      actionKey: action.localKey,
    })
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'actionMetadata',
      name: 'Action',
      required: true,
      groupingId: 'action',
      validComponentTypes: ['action'] as const,
    },
    {
      type: 'mission-component' as const,
      _id: 'resourceMetadata',
      name: 'Resource',
      required: true,
      groupingId: 'action',
      validComponentTypes: ['resource'] as const,
      dependencies: [TargetDependency.TRUTHY('actionMetadata')],
    },
    {
      type: 'number' as const,
      _id: 'resourceCost',
      name: 'Resource Cost',
      required: true,
      groupingId: 'action',
      dependencies: [
        TargetDependency.TRUTHY('actionMetadata'),
        TargetDependency.TRUTHY('resourceMetadata'),
      ],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the resource cost for the selected action(s). A positive value increases the resource cost, while a negative value decreases the resource cost.\n` +
        `\t\n` +
        `For example, if the resource cost is 100 and you set the resource cost to +10, then the resource cost will be 110.\n` +
        `\t\n` +
        `*Note: If the result is less than 0, then the resource cost will be 0.*`,
    },
  ],
  migrations,
})

export default ResourceCostMod
