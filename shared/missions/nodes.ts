import { IMission } from '.'
import { IMissionAction, IMissionActionJSON } from './actions'
import { v4 as generateHash } from 'uuid'

/**
 * Interface of the abstract MissionNode class.
 * @note Any public, non-static properties and functions of the MissionNode class
 * must first be defined here for them to be accessible to the Mission and
 * MissionAction classes.
 */
export interface IMissionNode {
  mission: IMission
  nodeID: string
  name: string
  color: string
  description: string
  preExecutionText: string
  /**
   * Whether an action can be executed on the node.
   */
  executable: boolean
  /**
   * Whether or not this node is currently having an action executed on it.
   */
  executing: boolean
  /**
   * Whether or not this node is a device.
   */
  device: boolean
  /**
   * Whether or not this node is open.
   */
  isOpen: boolean
  /**
   * Whether or not this node is can be opened using the "open" function.
   */
  openable: boolean
  /**
   * Whether or not this node has been (or at least is expected to be) revealed to the player.
   */
  revealed: boolean
  /**
   * Whether or not this nodes has child nodes.
   */
  hasChildren: boolean
  /**
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  depthPadding: number
  actions: Array<IMissionAction>
  parentNode: IMissionNode | null
  childNodes: Array<IMissionNode>
  /**
   * Converts the node to JSON.
   * @returns {IMissionNodeJSON} the JSON for the node.
   */
  toJSON: () => IMissionNodeJSON
  /**
   * Opens the node.
   * @returns {Promise<void>} a promise that resolves when the node opening has been fulfilled.
   */
  open: () => Promise<void>
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface IMissionNodeJSON {
  nodeID: string
  name: string
  color: string
  description: string
  preExecutionText: string
  depthPadding: number
  executable: boolean
  device: boolean
  actions: Array<IMissionActionJSON>
  isOpen?: boolean
}

/**
 * Options for creating a MissionNode object.
 */
export type TMissionNodeOptions<TRelative extends IMissionNode> = {
  /**
   * The node of which this node is a child.
   * @default null
   */
  parentNode?: TRelative | null
  /**
   * The child nodes of this node.
   * @default []
   */
  childNodes?: Array<TRelative>
}

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  TMission extends IMission,
  TRelativeNode extends IMissionNode,
  TMissionAction extends IMissionAction,
> implements IMissionNode
{
  // inherited
  public mission: TMission
  // inherited
  public nodeID: string
  // inherited
  public name: string
  // inherited
  public color: string
  // inherited
  public description: string
  // inherited
  public preExecutionText: string
  // inherited
  public executable: boolean
  // inherited
  public device: boolean
  /**
   * Whether or not this node is open.
   */
  protected _isOpen: boolean
  // inherited
  public depthPadding: number
  // inherited
  public actions: Array<TMissionAction>
  // inherited
  public parentNode: TRelativeNode | null
  // inherited
  public childNodes: Array<TRelativeNode>
  // inherited
  public executing: boolean = false
  // inherited
  public get isOpen(): boolean {
    return this._isOpen
  }
  // inherited
  public get openable(): boolean {
    return !this.executable && !this.isOpen
  }
  // inherited
  public get revealed(): boolean {
    return this.parentNode === null || this.parentNode.isOpen
  }
  // inherited
  public get hasChildren(): boolean {
    return this.childNodes.length > 0
  }

  /**
   * @param {TMission} mission The mission of which the node is a part.
   * @param {IMissionNodeJSON} data The node data from which to create the node. Any ommitted values will be set to the default properties defined in MissionNode.DEFAULT_PROPERTIES.
   * @param {TMissionNodeOptions<TMission>} options The options for creating the node.
   */
  public constructor(
    mission: TMission,
    data: Partial<IMissionNodeJSON> = MissionNode.DEFAULT_PROPERTIES,
    options: TMissionNodeOptions<TRelativeNode> = {},
  ) {
    // Set properties from data.
    this.mission = mission
    this.nodeID = data.nodeID ?? MissionNode.DEFAULT_PROPERTIES.nodeID
    this.name = data.name ?? MissionNode.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionNode.DEFAULT_PROPERTIES.color
    this.description =
      data.description ?? MissionNode.DEFAULT_PROPERTIES.description
    this.preExecutionText =
      data.preExecutionText ?? MissionNode.DEFAULT_PROPERTIES.preExecutionText
    this.executable =
      data.executable ?? MissionNode.DEFAULT_PROPERTIES.executable
    this.device = data.device ?? MissionNode.DEFAULT_PROPERTIES.device
    this.depthPadding =
      data.depthPadding ?? MissionNode.DEFAULT_PROPERTIES.depthPadding
    this.actions = this.parseActionData(
      data.actions ?? MissionNode.DEFAULT_PROPERTIES.actions,
    )
    this._isOpen = data.isOpen ?? MissionNode.DEFAULT_PROPERTIES.isOpen

    // Set properties from options.
    this.parentNode = options.parentNode ?? null
    this.childNodes = options.childNodes ?? []
  }

  /**
   * Parses the action data into MissionAction objects.
   * @param {Array<IMissionActionJSON>} data The action data to parse.
   * @returns {Array<MissionAction>} The parsed action data.
   */
  protected abstract parseActionData(
    data: Array<IMissionActionJSON>,
  ): Array<TMissionAction>

  // inherited
  public toJSON(): IMissionNodeJSON {
    return {
      nodeID: this.nodeID,
      name: this.name,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      depthPadding: this.depthPadding,
      executable: this.executable,
      device: this.device,
      actions: this.actions.map((action) => action.toJSON()),
      isOpen: this._isOpen,
    }
  }

  // inherited
  public abstract open(): Promise<void>

  /**
   * The default properties for a MissionNode object.
   */
  public static readonly DEFAULT_PROPERTIES: Required<IMissionNodeJSON> = {
    nodeID: generateHash(),
    name: 'Unnamed Node',
    color: '#ffffff',
    description: 'Description text goes here.',
    preExecutionText: 'Node has not been executed.',
    depthPadding: 0,
    executable: false,
    device: false,
    actions: [],
    isOpen: false,
  }
}
