import { TTargetJson } from '.'
import Dependency from '../dependencies'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the process time of a specific action within a node or
 * all actions within a node.
 */
export const processTimeMod: TTargetJson = {
  targetEnvId: 'metis',
  _id: 'node',
  name: 'Node',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    let { nodeMetadata, processTime } = context.effect.args
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

    // If the process time is a number, then modify the process time.
    if (processTime && typeof processTime === 'number') {
      context.modifyProcessTime(processTime * 1000, { nodeId })
    }
    // Otherwise, throw an error.
    else if (processTime && typeof processTime !== 'number') {
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
      _id: 'processTime',
      name: 'Process Time',
      required: true,
      min: -3600,
      max: 3600,
      unit: 's',
      groupingId: 'actions',
      dependencies: [Dependency.NODE('nodeMetadata')],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 60s and you set the process time to +10s, then the process time will be 70s.\n` +
        `\t\n` +
        `*Note: If the result is less than 0s, then the process time will be 0s. If the result is greater than 3600s, then the process time will be 3600s.*`,
    },
  ],
}

export default processTimeMod
