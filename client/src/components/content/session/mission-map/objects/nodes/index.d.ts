import ClientMission from 'src/missions'
import ClientActionExecution from 'src/missions/actions/executions'
import { TMetisComponent } from '../../../../../../../../shared/'
import { TListenerTarget } from '../../../../../../../../shared/events'
import { TWithKey } from '../../../../../../../../shared/toolbox/objects'
import {
  Vector1D,
  Vector2D,
} from '../../../../../../../../shared/toolbox/space'
import { TButtonSvg_P } from '../../../../../content/user-controls/buttons/ButtonSvg'

/**
 * A node that can be displayed on the map.
 * @note Implement this in a class to make
 * that class compatible with mission maps.
 */
export type TMapCompatibleNode = TMetisComponent &
  TListenerTarget<TMapCompatibleNodeEvent> & {
    /**
     * The mission containing the node.
     */
    mission: ClientMission
    /**
     * The color to display for the node.
     */
    color: string
    /**
     * The number of lines to provide to display
     * the node's name.
     */
    get nameLineCount(): number
    /**
     * The position of the node on the map.
     */
    position: Vector2D
    /**
     * The buttons to display on the node.
     */
    buttons: TNodeButton[]
    /**
     * The icon to display on the node.
     */
    get icon(): TMetisIcon
    /**
     * Whether the node is currently selected.
     */
    selected: boolean
    /**
     * Whether the node is currently pending the
     * resolution of some internal process.
     * @note This is will fade out the node slightly
     * to indicate a pending state to the user.
     */
    get pending(): boolean
    /**
     * Whether the node is currently revealed to the user
     * on the map.
     */
    get revealed(): boolean
    /**
     * The current execution being performed on the node,
     * or the last execution, if not executing. `null` is
     * returned if no executions have been performed.
     */
    get latestExecution(): ClientActionExecution | null
    /**
     * The current execution state of the node.
     */
    get executionState(): TNodeExecutionState
    /**
     * Whether the node is currently executing an action.
     */
    get executing(): boolean
    /**
     * Whether the node has been blocked
     * from being accessed.
     */
    blocked: boolean
    /**
     * Whether the node is currently excluded
     * from the force it belongs to or not.
     */
    exclude: boolean
  }

/**
 * Valid events that can be emitted on a node.
 */
export type TMapCompatibleNodeEvent =
  | 'activity'
  | 'set-buttons'
  | 'set-pending'
  | 'set-blocked'
  | 'exec-state-change'
  | 'set-exclude'

/**
 * Props for `MapNode`.
 */
export type TMapNode_P<TNode extends TMapCompatibleNode> = {
  /**
   * The node to display.
   */
  node: TNode
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * Handler for when the node is selected.
   * @default () => {}
   */
  onSelect: ((node: TNode) => void) | null
  /**
   * Applies a tooltip to the node.
   * @default () => ''
   */
  applyTooltip: ((node: TNode) => string) | null
}

/**
 * Button SVG type for node-specific buttons.
 */
export type TNodeButton<TNode extends TMapCompatibleNode> = TWithKey<
  Omit<TButtonSvg_P, 'onClick'>
> & {
  // Overridden
  /**
   * Handles when the button is clicked.
   * @param event The click event.
   * @param node The node associated with the button.
   */
  onClick: (event: React.MouseEvent, node: TNode) => void
}
