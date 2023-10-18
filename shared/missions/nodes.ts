import { IMissionAction, IMissionActionJSON } from './actions'
import { IMission } from '.'
import { v4 as generateHash } from 'uuid'
import MapToolbox from '../toolbox/maps'
import IActionOutcome from './actions/outcomes'
import IActionExecution, { TActionExecutionJSON } from './actions/executions'
import { IActionOutcomeJSON } from './actions/outcomes'
import ArrayToolbox from '../toolbox/arrays'

/**
 * Interface of the abstract MissionNode class.
 * @note Any public, non-static properties and functions of the MissionNode class
 * must first be defined here for them to be accessible to the Mission and
 * MissionAction classes.
 */
export interface IMissionNode {
  /**
   * The mission of which the node is a part.
   */
  mission: IMission
  /**
   * The ID for the node.
   */
  nodeID: string
  /**
   * The name for the node.
   */
  name: string
  /**
   * The color for the node used as a border in the mission map.
   */
  color: string
  /**
   * The description for the node.
   */
  description: string
  /**
   * The text outputted to the console when the node is clicked on.
   */
  preExecutionText: string
  /**
   * Whether an action can be executed on the node.
   */
  executable: boolean
  /**
   * Whether or not this node is a device.
   */
  device: boolean
  /**
   * The execution state of the node.
   */
  executionState: TNodeExecutionState
  /**
   * Whether or not this node is ready to be executed upon by an action.
   */
  readyToExecute: boolean
  /**
   * Whether an action is currently being executed on the node.
   */
  executing: boolean
  /**
   * Whether an action has been executed on the node.
   */
  executed: boolean
  /**
   * Whether or not this node is open. True if a non-executable node has been opened, or if
   * an executable node has been successfully executed.
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
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  depthPadding: number
  /**
   * The actions that can be performed on the node.
   * @note Mapped by action ID.
   */
  actions: Map<string, IMissionAction>
  /**
   * The current execution in process on the node by an action.
   */
  get execution(): IActionExecution | null
  /**
   * The outcomes of the actions that are performed on the node.
   */
  get outcomes(): Array<IActionOutcome>
  /**
   * The parent of this node in the tree structure.
   */
  parentNode: IMissionNode | null
  /**
   * The children of this node in the tree structure.
   */
  childNodes: Array<IMissionNode>
  /**
   * Whether or not this nodes has child nodes.
   */
  hasChildren: boolean
  /**
   * Whether or not this node has siblings.
   */
  hasSiblings: boolean
  /**
   * The siblings of this node.
   */
  siblings: Array<IMissionNode>
  /**
   * The children of the parent of this node (Essentially siblings plus self).
   */
  childrenOfParent: Array<IMissionNode>
  /**
   * The sibling, if any, ordered before this node in the structure.
   */
  previousSibling: IMissionNode | null
  /**
   * The sibling, if any, ordered after this node in the structure.
   */
  followingSibling: IMissionNode | null
  /**
   * Converts the node to JSON.
   * @param options Options for exporting the node to JSON.
   * @returns the JSON for the node.
   */
  toJSON: (options?: TNodeJsonOptions) => TMissionNodeJSON
  /**
   * Opens the node.
   * @param options Options for opening the node.
   * @returns a promise that resolves when the node opening has been fulfilled.
   */
  open: (options?: INodeOpenOptions) => Promise<void>
  /**
   * Handles an exection of an action performed on the node.
   * @param data The execution data to handle.
   * @returns The generated execution object.
   */
  handleExecution: (
    execution: NonNullable<TActionExecutionJSON>,
  ) => IActionExecution
  /**
   * Handles an outcome of an action performed on the node.
   * @param data The outcome data to handle.
   * @param options Options for handling the outcome.
   * @returns The generated outcome object.
   */
  handleOutcome: (
    data: IActionOutcomeJSON,
    options?: IHandleOutcomeOptions,
  ) => IActionOutcome
}

/**
 * Game-agnostic JSON data for a MissionNode object.
 */
export interface IMissionNodeBaseJSON {
  nodeID: string
  name: string
  color: string
  description: string
  preExecutionText: string
  depthPadding: number
  executable: boolean
  device: boolean
  actions: Array<IMissionActionJSON>
}

/**
 * Game-specific JSON data for a MissionNode object.
 */
export interface IMissionNodeGameJSON {
  opened: boolean
  executionState: TNodeExecutionState
  execution: TActionExecutionJSON | null
  outcomes: Array<IActionOutcomeJSON>
}

/**
 * Plain JSON representation of a MissionNode object.
 * Type built from IMissionNodeBaseJSON and IMissionNodeGameJSON,
 * with all properties from IMissionNodeGameJSON being partial.
 */
export type TMissionNodeJSON = IMissionNodeBaseJSON &
  Partial<IMissionNodeGameJSON>

/**
 * Options for MissionNode.toJSON method.
 */
export type TNodeJsonOptions = {
  /**
   * Whether to include game-specific data in the JSON export.
   * @default false
   */
  includeGameData?: boolean
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
 * Possible states for the execution of a node.
 */
export type TNodeExecutionState =
  | 'unexecuted'
  | 'executing'
  | 'successful'
  | 'failure'

/**
 * Options for the `MissionNode.open` method.
 */
export interface INodeOpenOptions {}

/**
 * Options for the `MissionNode.handleOutcome` method.
 */
export interface IHandleOutcomeOptions {}

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  TMission extends IMission,
  TRelativeNode extends IMissionNode,
  TMissionAction extends IMissionAction,
  TActionExecution extends IActionExecution,
  TActionOutcome extends IActionOutcome,
> implements IMissionNode
{
  // Implemented
  public mission: TMission

  // Implemented
  public nodeID: string

  // Implemented
  public name: string

  // Implemented
  public color: string

  // Implemented
  public description: string

  // Implemented
  public preExecutionText: string

  // Implemented
  public executable: boolean

  // Implemented
  public device: boolean

  // Implemented
  public get executionState(): TNodeExecutionState {
    let execution: TActionExecution | null = this.execution
    let outcomes: Array<TActionOutcome> = this.outcomes

    // Check for 'unexecuted' state.
    if (execution === null && outcomes.length === 0) {
      return 'unexecuted'
    } else if (execution !== null) {
      return 'executing'
    } else {
      return ArrayToolbox.lastOf(outcomes).successful ? 'successful' : 'failure'
    }
  }

  // Implemented
  public get readyToExecute(): boolean {
    return (
      this.executable &&
      this.actions.size > 0 &&
      (this.executionState === 'unexecuted' ||
        this.executionState === 'failure')
    )
  }

  // Implemented
  public get executing(): boolean {
    return this.execution !== null
  }

  // Implemented
  public get executed(): boolean {
    return this.outcomes.length > 0
  }

  /**
   * Whether or not this node was manually opened.
   * @note Only applicable to non-executable nodes.
   */
  protected opened: boolean

  // Implemented
  public depthPadding: number

  // Implemented
  public actions: Map<string, TMissionAction>

  /**
   * The current execution in process on the node by an action.
   */
  protected _execution: TActionExecution | null
  // Implemented
  public get execution(): TActionExecution | null {
    return this._execution
  }

  /**
   * The outcomes of the actions that are performed on the node.
   */
  protected _outcomes: Array<TActionOutcome>
  // Inherited
  public get outcomes(): Array<TActionOutcome> {
    return [...this._outcomes]
  }

  // Implemented
  public parentNode: TRelativeNode | null

  // Implemented
  public childNodes: Array<TRelativeNode>

  // Implemented
  public get hasChildren(): boolean {
    return this.childNodes.length > 0
  }

  // Implemented
  public get hasSiblings(): boolean {
    return this.childrenOfParent.length > 1
  }

  // Implemented
  public get siblings(): Array<TRelativeNode> {
    let siblings: Array<TRelativeNode> = []

    if (this.parentNode !== null) {
      let childrenOfParent: Array<TRelativeNode> = this.parentNode
        .childNodes as TRelativeNode[]

      siblings = childrenOfParent.filter(
        (childOfParent: TRelativeNode) => childOfParent.nodeID !== this.nodeID,
      )
    }

    return siblings
  }

  // Implemented
  public get childrenOfParent(): Array<TRelativeNode> {
    let childrenOfParent: Array<TRelativeNode> = []

    if (this.parentNode !== null) {
      childrenOfParent = this.parentNode.childNodes as TRelativeNode[]
    }

    return childrenOfParent
  }

  // Implemented
  public get previousSibling(): TRelativeNode | null {
    let previousSibling: TRelativeNode | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<TRelativeNode> = this.parentNode
        .childNodes as TRelativeNode[]

      childrenOfParent.forEach(
        (childOfParent: TRelativeNode, index: number) => {
          if (childOfParent.nodeID === this.nodeID && index > 0) {
            previousSibling = childrenOfParent[index - 1]
          }
        },
      )
    }

    return previousSibling
  }

  // Implemented
  public get followingSibling(): TRelativeNode | null {
    let followingSibling: TRelativeNode | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<TRelativeNode> = this.parentNode
        .childNodes as TRelativeNode[]

      childrenOfParent.forEach(
        (childOfParent: TRelativeNode, index: number) => {
          if (
            childOfParent.nodeID === this.nodeID &&
            index + 1 < childrenOfParent.length
          ) {
            followingSibling = childrenOfParent[index + 1]
          }
        },
      )
    }

    return followingSibling
  }

  // Implemented
  public get isOpen(): boolean {
    return this.opened || this.executionState === 'successful'
  }

  // Implemented
  public get openable(): boolean {
    return !this.executable && !this.isOpen
  }

  // Implemented
  public get revealed(): boolean {
    return this.parentNode === null || this.parentNode.isOpen
  }

  /**
   * @param {TMission} mission The mission of which the node is a part.
   * @param {TMissionNodeJSON} data The node data from which to create the node. Any ommitted values will be set to the default properties defined in MissionNode.DEFAULT_PROPERTIES.
   * @param {TMissionNodeOptions<TMission>} options The options for creating the node.
   */
  public constructor(
    mission: TMission,
    data: Partial<TMissionNodeJSON> = MissionNode.DEFAULT_PROPERTIES,
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
    this.opened = data.opened ?? MissionNode.DEFAULT_PROPERTIES.opened
    this._execution = this.parseExecutionData(
      data.execution !== undefined
        ? data.execution
        : MissionNode.DEFAULT_PROPERTIES.execution,
    )
    this._outcomes = this.parseOutcomeData(
      data.outcomes ?? MissionNode.DEFAULT_PROPERTIES.outcomes,
    )

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
  ): Map<string, TMissionAction>

  /**
   * Parses the execution data into a execution object of the
   * type passed in TActionExecution.
   * @param {Array<IActionExecutionJSON>} data The outcome data to parse.
   * @returns {Array<TActionExecution>} The parsed outcome data.
   */
  protected abstract parseExecutionData(
    data: TActionExecutionJSON,
  ): TActionExecution | null

  /**
   * Parses the outcome data into the outcome objects of the
   * type passed in TActionOutcome.
   * @param {Array<IActionOutcomeJSON>} data The outcome data to parse.
   * @returns {Array<TActionOutcome>} The parsed outcome data.
   */
  protected abstract parseOutcomeData(
    data: Array<IActionOutcomeJSON>,
  ): Array<TActionOutcome>

  // Implemented
  public toJSON(options: TNodeJsonOptions = {}): TMissionNodeJSON {
    let { includeGameData = false } = options

    // Construct base JSON.
    let json: TMissionNodeJSON = {
      nodeID: this.nodeID,
      name: this.name,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      depthPadding: this.depthPadding,
      executable: this.executable,
      device: this.device,
      actions: MapToolbox.mapToArray(this.actions, (action) => action.toJSON()),
    }

    // Include game data if includeGameData
    // flag was set.
    if (includeGameData) {
      // Construct execution JSON.
      let executionJSON: TActionExecutionJSON | null = null

      if (this.execution !== null) {
        executionJSON = this.execution.toJSON()
      }

      // Construct outcome JSON.
      let outcomeJSON: Array<IActionOutcomeJSON> = this.outcomes.map(
        (outcome) => outcome.toJSON(),
      )

      // Construct game-specific JSON.
      let gameJSON: IMissionNodeGameJSON = {
        opened: this.opened,
        executionState: this.executionState,
        execution: executionJSON,
        outcomes: outcomeJSON,
      }

      // Join game-specific JSON with base JSON.
      json = {
        ...json,
        ...gameJSON,
      }
    }

    // Return finalized JSON.
    return json
  }

  // Implemented
  public abstract open(options?: INodeOpenOptions): Promise<void>

  // Implemented
  public abstract handleExecution(
    data: NonNullable<TActionExecutionJSON>,
  ): TActionExecution

  // Implemented
  public abstract handleOutcome(
    data: IActionOutcomeJSON,
    options?: IHandleOutcomeOptions,
  ): TActionOutcome

  /**
   * The default properties for a MissionNode object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionNodeJSON> {
    return {
      nodeID: generateHash(),
      name: 'Unnamed Node',
      color: '#ffffff',
      description: '<p>Description text goes here.</p>',
      preExecutionText: '<p>Node has not been executed.</p>',
      depthPadding: 0,
      executable: false,
      device: false,
      actions: [],
      opened: false,
      executionState: 'unexecuted',
      execution: null,
      outcomes: [],
    }
  }
}
