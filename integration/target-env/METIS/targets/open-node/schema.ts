import { TNodeMetadata } from 'metis/target-environments/args/mission-component/node-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * The ID of the `openNode` argument.
 */
const openNodeArg = {
  _id: 'openNode',
  name: 'Open Node',
}
/**
 * The ID of the `nodeMetadata` argument.
 */
const nodeMetadataArg = {
  _id: 'nodeMetadata',
  name: 'Node',
}
/**
 * The option that represents no change.
 */
const noChangeOption = {
  _id: 'no-change',
  name: 'No Change',
  value: 'no-change',
}
/**
 * The option that represents opening the node.
 */
const openNodeOption = {
  _id: 'open',
  name: 'Open',
  value: 'open',
}
/**
 * The grouping ID used for all arguments in this target.
 */
const groupingId = 'node'

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
      _id: nodeMetadataArg._id,
      name: nodeMetadataArg.name,
      required: true,
      groupingId: groupingId,
    },
    {
      _id: openNodeArg._id,
      type: 'dropdown',
      name: openNodeArg.name,
      required: true,
      groupingId: groupingId,
      dependencies: [Dependency.NODE(nodeMetadataArg._id)],
      options: [
        {
          _id: noChangeOption._id,
          name: noChangeOption.name,
          value: noChangeOption.value,
        },
        {
          _id: openNodeOption._id,
          name: openNodeOption.name,
          value: openNodeOption.value,
        },
      ],
      default: noChangeOption,
    },
  ],
})

export default OpenNode
