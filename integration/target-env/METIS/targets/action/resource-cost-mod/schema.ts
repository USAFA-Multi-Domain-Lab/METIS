import { TActionMetadata } from 'metis/target-environments/args/mission-component/action-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource cost of a specific action within a node or
 * all actions within a node.
 */
const ResourceCostMod = new TargetSchema({
  name: 'Resource Cost Modifier',
  description: '',
  script: async (context) => {
    // Gather details.
    const { actionMetadata, resourceCost } = context.effect.args
    const { forceKey, nodeKey, actionKey } = actionMetadata as TActionMetadata
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    if (typeof forceKey !== 'string' || typeof nodeKey !== 'string') {
      throw new Error(errorMessage)
    }

    // If the resource cost is a number, then modify the resource cost.
    if (resourceCost && typeof resourceCost === 'number') {
      context.modifyResourceCost(resourceCost, { forceKey, nodeKey, actionKey })
    }
    // Otherwise, throw an error.
    else if (resourceCost && typeof resourceCost !== 'number') {
      throw new Error(errorMessage)
    }
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
      type: 'number',
      _id: 'resourceCost',
      name: 'Resource Cost',
      required: true,
      groupingId: 'action',
      dependencies: [Dependency.ACTION('actionMetadata')],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the resource cost for all actions within the node. A positive value increases the resource cost, while a negative value decreases the resource cost.\n` +
        `\t\n` +
        `For example, if the resource cost is 100 and you set the resource cost to +10, then the resource cost will be 110.\n` +
        `\t\n` +
        `*Note: If the result is less than 0, then the resource cost will be 0.*`,
    },
  ],
})

export default ResourceCostMod
