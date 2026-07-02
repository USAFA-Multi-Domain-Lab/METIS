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
  script: async (context, { applyTo, resources, amount }) => {
    context.modifyResourceCost(applyTo, resources, amount)
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Apply To',
      groupingId: 'main',
      validComponentTypes: ['mission', 'force', 'node', 'action'],
    },
    {
      type: 'mission-component',
      _id: 'resources',
      name: 'Resources to Modify',
      groupingId: 'main',
      validComponentTypes: ['resource'],
    },
    {
      type: 'number',
      _id: 'amount',
      name: 'Modifier Amount',
      required: true,
      groupingId: 'main',
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
