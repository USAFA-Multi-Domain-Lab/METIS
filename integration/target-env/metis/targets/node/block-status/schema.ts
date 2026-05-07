/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the block status of a node.
 */
const BlockStatus = TargetSchema.create({
  _id: 'block-status',
  name: 'Block Status',
  description: '',
  script: async (context, nodeMetadata, blockStatus) => {
    // Extract the selected node from the mission-component argument.
    const [node] = nodeMetadata

    // Update the block status of the node.
    if (blockStatus === 'block') {
      context.blockNode({
        forceKey: node.force.localKey,
        nodeKey: node.localKey,
      })
    } else if (blockStatus === 'unblock') {
      context.unblockNode({
        forceKey: node.force.localKey,
        nodeKey: node.localKey,
      })
    }
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'nodeMetadata',
      name: 'Node',
      required: true,
      groupingId: 'node',
      validComponentTypes: ['node'] as const,
    },
    {
      _id: 'blockStatus',
      type: 'dropdown' as const,
      name: 'Block Status',
      required: true,
      groupingId: 'node',
      dependencies: [TargetDependency.TRUTHY('nodeMetadata')],
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
