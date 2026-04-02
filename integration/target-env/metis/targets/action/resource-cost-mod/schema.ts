/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource cost of a specific action within a node or
 * all actions within a node.
 */
const ResourceCostMod = new TargetSchema({
  _id: 'resource-cost-mod',
  name: 'Resource Cost Modifier',
  description: '',
  script: async (context) => {
    // Gather details.
    const { actionMetadata, resourceMetadata, resourceCost } =
      context.effect.args
    const { forceKey, nodeKey, actionKey } = actionMetadata as TActionMetadata
    const { resourceId } = resourceMetadata as Required<TResourceMetadata>

    context.modifyResourceCost(resourceId, resourceCost, {
      forceKey,
      nodeKey,
      actionKey,
    })
  },
  args: [
    {
      type: 'action',
      _id: 'actionMetadata',
      name: 'Action',
      required: false,
      groupingId: 'action',
    },
    {
      type: 'resource',
      _id: 'resourceMetadata',
      name: 'Resource',
      required: true,
      groupingId: 'action',
      dependencies: [TargetDependency.ACTION('actionMetadata')],
    },
    {
      type: 'number',
      _id: 'resourceCost',
      name: 'Resource Cost',
      required: true,
      groupingId: 'action',
      dependencies: [
        TargetDependency.ACTION('actionMetadata'),
        TargetDependency.RESOURCE('resourceMetadata'),
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
})

export default ResourceCostMod
