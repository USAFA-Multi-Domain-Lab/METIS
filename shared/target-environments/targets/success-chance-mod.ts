import { TTargetJson } from '.'
import Dependency from '../dependencies'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the success chance of a specific action within a node or
 * all actions within a node.
 */
export const successChanceMod: TTargetJson = {
  targetEnvId: 'metis',
  _id: 'node',
  name: 'Node',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    let { nodeMetadata, successChance } = context.effect.args
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

    // If the success chance is a number, then modify the success chance.
    if (successChance && typeof successChance === 'number') {
      context.modifySuccessChance(successChance / 100, { nodeId })
    }
    // Otherwise, throw an error.
    else if (successChance && typeof successChance !== 'number') {
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
      _id: 'successChance',
      name: 'Success Chance',
      required: true,
      min: -100,
      max: 100,
      unit: '%',
      groupingId: 'actions',
      dependencies: [Dependency.NODE('nodeMetadata')],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the chance of success for all actions within the node. A positive value increases the chance of success, while a negative value decreases the chance of success.\n` +
        `\t\n` +
        `For example, if the chance of success is 50% and you set the chance of success to +10%, then the chance of success will be 60%.\n` +
        `\t\n` +
        `*Note: If the result is less than 0%, then the chance of success will be 0%. If the result is greater than 100%, then the chance of success will be 100%.*`,
    },
  ],
}

export default successChanceMod
