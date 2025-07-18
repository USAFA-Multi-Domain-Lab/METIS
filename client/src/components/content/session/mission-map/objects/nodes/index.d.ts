import { TButtonSvg_Input } from 'src/components/content/user-controls/buttons/v3/types'
import ClientMission from 'src/missions'
import ClientActionExecution from 'src/missions/actions/executions'
import { MetisComponent } from '../../../../../../../../shared/'
import { TListenerTarget } from '../../../../../../../../shared/events'
import { TNodeBlockStatus } from '../../../../../../../../shared/missions/nodes'
import { TWithKey } from '../../../../../../../../shared/toolbox/objects'
import {
  Vector1D,
  Vector2D,
} from '../../../../../../../../shared/toolbox/space'
import MissionMap from '../../MissionMap'

/**
 * A node that can be displayed on the map.
 * @note Implement this in a class to make
 * that class compatible with mission maps.
 */
export type TMapCompatibleNode = MetisComponent &
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
     * The status of a node being blocked. That is,
     * whether the node is directly blocked, cut-off
     * from being accessed because one of its ancestors
     * is blocked, or unblocked and is accessible.
     */
    blockStatus: TNodeBlockStatus
    /**
     * Whether the node is currently excluded
     * from the force it belongs to or not.
     */
    exclude: boolean
    /**
     * Requests to center the node on a mission map.
     * This is contigent, of course, on the node being
     * used on a mission map component.
     * @see {@link MissionMap}
     */
    requestCenterOnMap(): void
  }

/**
 * Valid events that can be emitted on a node.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'set-buttons'
 * Triggered when the buttons for the node are set.
 * @option 'set-blocked'
 * Triggered when the following occurs:
 * - The node is blocked.
 * - The node is unblocked.
 * @option 'exec-state-change'
 * Triggered when the following occurs:
 * - An execution is initiated on the server.
 * - An execution outcome is received from the server.
 * @option 'set-exclude'
 * Triggered when the node is excluded from the force it belongs to.
 * @option 'set-color'
 * Triggered when the color of the node is set.
 * @option 'set-name'
 * Triggered when the name of the node is set.
 * @option 'new-icon'
 * Triggered when the icon of the node is changed.
 * @option 'center-on-map'
 * Triggered when the node is requested to be centered on the map,
 * assuming there is a MissionMap rendering the node.
 */
export type TMapCompatibleNodeEvent =
  | 'activity'
  | 'set-buttons'
  | 'set-pending'
  | 'set-blocked'
  | 'exec-state-change'
  | 'set-exclude'
  | 'set-color'
  | 'set-name'
  | 'new-icon'
  | 'center-on-map'

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
export type TNodeButton<TNode extends TMapCompatibleNode> =
  TWithKey<TButtonSvg_Input>
