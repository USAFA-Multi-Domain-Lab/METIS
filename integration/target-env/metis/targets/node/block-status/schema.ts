/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the block status of a node.
 */
const BlockStatus = new TargetSchema({
  _id: 'block-status',
  name: 'Block Status',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    const { nodeMetadata, blockStatus } = context.effect.args
    const { forceKey, nodeKey } = nodeMetadata as TNodeMetadata

    // Update the block status of the node.
    if (blockStatus === 'block') {
      context.blockNode({ forceKey, nodeKey })
    } else if (blockStatus === 'unblock') {
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
