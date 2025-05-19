import { TNodeMetadata } from 'metis/target-environments/args/mission-component/node-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to open a node.
 */
const OpenNode = new TargetSchema({
  name: 'Open Node',
  description: '',
  script: async (context) => {
    // Extract the arguments from the effect.
    const { nodeMetadata, openNode } = context.effect.args
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
      typeof openNode !== 'string'
    ) {
      throw new Error(errorMessage)
    }

    // Open the status of the node.
    if (openNode === 'open') context.openNode({ forceKey, nodeKey })
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
      _id: 'openNode',
      type: 'dropdown',
      name: 'Open Node',
      required: true,
      groupingId: 'node',
      dependencies: [Dependency.NODE('nodeMetadata')],
      options: [
        {
          _id: 'no-change',
          name: 'No Change',
          value: 'no-change',
        },
        {
          _id: 'open',
          name: 'Open',
          value: 'open',
        },
      ],
      default: { _id: 'no-change', name: 'No Change', value: 'no-change' },
    },
  ],
})

export default OpenNode
