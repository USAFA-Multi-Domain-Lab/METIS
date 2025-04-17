import { TTargetJson } from '.'
import Dependency from '../dependencies'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource cost of a specific action within a node or
 * all actions within a node.
 */
export const resourceCostMod: TTargetJson = {
  targetEnvId: 'metis',
  _id: 'node',
  name: 'Node',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    let { nodeMetadata, resourceCost } = context.effect.args
    let { nodeId } = nodeMetadata

    // Set the error message.
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    // Check if the arguments are valid.
    if (
      typeof nodeMetadata.forceId !== 'string' ||
      typeof nodeMetadata.nodeId !== 'string'
    ) {
      throw new Error(errorMessage)
    }

    // If the resource cost is a number, then modify the resource cost.
    if (resourceCost && typeof resourceCost === 'number') {
      context.modifyResourceCost(resourceCost, { nodeId })
    }
    // Otherwise, throw an error.
    else if (resourceCost && typeof resourceCost !== 'number') {
      throw new Error(errorMessage)
    }
  },
  args: [
    {
      type: 'node',
      _id: 'nodeMetadata',
      name: 'Node',
      required: true,
      groupingId: 'node',
    },
    {
      type: 'number',
      _id: 'resourceCost',
      name: 'Resource Cost',
      required: true,
      groupingId: 'node',
      dependencies: [Dependency.NODE('nodeMetadata')],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the resource cost for all actions within the node. A positive value increases the resource cost, while a negative value decreases the resource cost.\n` +
        `\t\n` +
        `For example, if the resource cost is 100 and you set the resource cost to +10, then the resource cost will be 110.\n` +
        `\t\n` +
        `*Note: If the result is less than 0, then the resource cost will be 0.*`,
    },
  ],
}

export default resourceCostMod
