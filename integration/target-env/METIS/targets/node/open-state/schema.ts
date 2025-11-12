/**
 * The ID of the `openState` argument.
 */
const openStateArg = {
  _id: 'openState',
  name: 'Open State',
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
 * The option that represents closing the node.
 */
const closeNodeOption = {
  _id: 'close',
  name: 'Close',
  value: 'close',
}
/**
 * The grouping ID used for all arguments in this target.
 */
const groupingId = 'node'

/**
 * A target available in the METIS target environment that enables effects to
 * manipulate whether a node is open (descendants visible) or closed (descendants hidden).
 *
 * When a node is opened:
 * - Its descendant nodes become visible to players in the mission map
 * - The prototype tree structure is revealed to show parent-child relationships
 * - Any in-progress action execution on the node is aborted
 *
 * When a node is closed:
 * - Its descendant nodes are hidden from players (unless they have complete visibility)
 * - Any in-progress executions on descendant nodes are aborted to prevent orphaned actions
 * - Members with complete visibility still see the full tree (but nodes are greyed out)
 *
 * The operation is idempotent - opening an already-open node or closing an already-closed
 * node is a safe no-op that will be silently skipped.
 */
const NodeOpenState = new TargetSchema({
  name: 'Node Open State',
  description: 'Opens or closes a node, revealing or hiding its descendants',
  script: async (context) => {
    // Extract the effect arguments configured in the mission editor.
    const { nodeMetadata, openState } = context.effect.args
    const { forceKey, nodeKey } = nodeMetadata as TNodeMetadata

    // Validate that all required arguments are present and correctly typed.
    if (
      typeof forceKey !== 'string' ||
      typeof nodeKey !== 'string' ||
      typeof openState !== 'string'
    ) {
      const errorMessage =
        `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
        `Effect ID: "${context.effect._id}"\n` +
        `Effect Name: "${context.effect.name}"`
      throw new Error(errorMessage)
    }

    // Execute the appropriate operation based on the configured open state.
    if (openState === openNodeOption.value) {
      // Open the node, revealing its descendants to players.
      context.openNode({ forceKey, nodeKey })
    } else if (openState === closeNodeOption.value) {
      // Close the node, hiding its descendants from players.
      context.closeNode({ forceKey, nodeKey })
    }
    // If openState is 'no-change', do nothing (skip the operation).
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
      _id: openStateArg._id,
      type: 'dropdown',
      name: openStateArg.name,
      required: true,
      groupingId: groupingId,
      dependencies: [TargetDependency.NODE(nodeMetadataArg._id)],
      options: [noChangeOption, openNodeOption, closeNodeOption],
      default: noChangeOption,
    },
  ],
})

export default NodeOpenState
