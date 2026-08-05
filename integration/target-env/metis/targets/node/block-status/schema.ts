import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the block status of a node.
 */
const BlockStatus = TargetSchema.create({
  _id: 'block-status',
  name: 'Block Status',
  description: '',
  script: async (context, { applyTo, blockStatus }) => {
    context.updateNodeBlockStatus(applyTo, blockStatus === 'block')
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Apply To',
      description:
        'Blocks or unblocks a node(s), preventing access to that node and cutting off access to its descendants.',
      groupingId: 'node',
      validComponentTypes: ['mission', 'force', 'node'],
      tooltipDescription:
        'Select a group of components within the mission ' +
        'to which this block status will be applied.\n' +
        '\t\n' +
        '*Selecting a node will apply the block status to that node. ' +
        'Selecting a mission or force will apply the block status ' +
        'to all nodes within the selected item. ' +
        'Select multiple components to update a broad range of nodes.*',
    },
    {
      _id: 'blockStatus',
      type: 'dropdown',
      name: 'Block Status',
      required: true,
      groupingId: 'node',
      options: [
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
      default: 'block',
    },
  ],
  migrations,
})

export default BlockStatus
