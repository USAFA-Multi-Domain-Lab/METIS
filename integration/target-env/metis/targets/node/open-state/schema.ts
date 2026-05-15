import { migrations } from './migrations'

/**
 * The ID of the `openState` argument.
 */
const openStateArg = {
  _id: 'openState',
  name: 'Open State',
} as const

/**
 * The ID of the `applyTo` argument.
 */
const applyToArg = {
  _id: 'applyTo',
  name: 'Apply To',
} as const

/**
 * The grouping ID used for all arguments in this target.
 */
const groupingId = 'nodeOpenState'

/**
 * A target available in the METIS target environment that enables effects to
 * manipulate whether a node(s) is open (descendants visible) or closed (descendants hidden).
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
const NodeOpenState = TargetSchema.create({
  _id: 'open-state',
  name: 'Node Open State',
  description: 'Opens or closes a node(s), revealing or hiding its descendants',
  script: async (context, applyTo, openState) => {
    if (openState !== 'no-change') {
      context.updateNodeOpenState(applyTo, openState === 'open')
    }
  },
  parameters: [
    {
      type: 'mission-component',
      _id: applyToArg._id,
      name: applyToArg.name,
      required: true,
      groupingId: groupingId,
      multiSelect: true,
      validComponentTypes: ['mission', 'force', 'node'],
      tooltipDescription:
        'Select a group of components within the mission ' +
        'to which this open state will be applied.\n' +
        '\t\n' +
        '*Selecting a node will apply the open state to that node. ' +
        'Selecting a mission or force will apply the open state ' +
        'to all nodes within the selected item. ' +
        'Select multiple components to update a broad range of nodes.*',
    },
    {
      type: 'dropdown',
      _id: openStateArg._id,
      name: openStateArg.name,
      required: true,
      groupingId: groupingId,
      dependencies: [TargetDependency.NOT_EMPTY(applyToArg._id)],
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
        {
          _id: 'close',
          name: 'Close',
          value: 'close',
        },
      ],
      default: {
        _id: 'no-change',
        name: 'No Change',
        value: 'no-change',
      },
    },
  ],
  migrations,
})

export default NodeOpenState
