import { TargetDependency } from '@shared/target-environments/targets/TargetDependency'
import type { TNodeMetadata } from '@shared/target-environments/types'
import { TargetSchema } from '../../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the block status of a node.
 */
const BlockStatus = new TargetSchema({
  name: 'Block Status',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    const { nodeMetadata, blockStatus } = context.effect.args
    const { forceKey, nodeKey } = nodeMetadata as TNodeMetadata

    // Set the error message.
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    // Check if the arguments are valid.
    if (
      typeof forceKey !== 'string' ||
      typeof nodeKey !== 'string' ||
      typeof blockStatus !== 'string'
    ) {
      throw new Error(errorMessage)
    }

    // Update the block status of the node.
    if (blockStatus === 'block') {
      context.blockNode({ forceKey, nodeKey })
    }
    if (blockStatus === 'unblock') {
      context.unblockNode({ forceKey, nodeKey })
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
      dependencies: [TargetDependency.NODE('nodeMetadata')],
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
})

export default BlockStatus
