import { TTargetJson } from '.'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the block status of a node.
 */
export const blockNode: TTargetJson = {
  targetEnvId: 'metis',
  _id: 'node',
  name: 'Node',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    let { nodeMetadata, blockStatus } = context.effect.args
    let { nodeId } = nodeMetadata

    // Set the error message.
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    // Check if the arguments are valid.
    if (
      typeof nodeMetadata.forceId !== 'string' ||
      typeof nodeMetadata.nodeId !== 'string' ||
      typeof blockStatus !== 'string'
    ) {
      throw new Error(errorMessage)
    }

    // Update the block status of the node.
    if (blockStatus === 'block') {
      context.blockNode({ nodeId })
    } else if (blockStatus === 'unblock') {
      context.unblockNode({ nodeId })
    } else if (typeof blockStatus !== 'string') {
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
      _id: 'blockStatus',
      type: 'dropdown',
      name: 'Block Status',
      required: true,
      groupingId: 'node',
      options: [
        {
          _id: 'no-change',
          name: 'No Change',
          value: 'no-change',
        },
        {
          _id: 'block',
          name: 'Block',
          value: 'block',
        },
        {
          _id: 'unblock',
          name: 'Unblock',
          value: 'unblock',
        },
      ],
      default: { _id: 'no-change', name: 'No Change', value: 'no-change' },
    },
  ],
}

export default blockNode
