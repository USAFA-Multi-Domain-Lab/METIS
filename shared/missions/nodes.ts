import { TCommonMissionAction, TCommonMissionActionJson } from './actions'
import { TCommonMission } from '.'
import { v4 as generateHash } from 'uuid'
import MapToolbox from '../toolbox/maps'
import IActionOutcome from './actions/outcomes'
import IActionExecution, {
  TActionExecutionJSON as TActionExecutionJson,
} from './actions/executions'
import { IActionOutcomeJSON as IActionOutcomeJson } from './actions/outcomes'
import ArrayToolbox from '../toolbox/arrays'

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  TMission extends TCommonMission,
  TRelativeNode extends TCommonMissionNode,
  TMissionAction extends TCommonMissionAction,
  TActionExecution extends IActionExecution,
  TActionOutcome extends IActionOutcome,
> implements TCommonMissionNode
{
  // Implemented
  public mission: TMission

  // Implemented
  public nodeID: TCommonMissionNode['nodeID']

  // Implemented
  public name: TCommonMissionNode['name']

  // Implemented
  public color: TCommonMissionNode['color']

  // Implemented
  public description: TCommonMissionNode['description']

  // Implemented
  public preExecutionText: TCommonMissionNode['preExecutionText']

  // Implemented
  public executable: TCommonMissionNode['executable']

  // Implemented
  public device: TCommonMissionNode['device']

  // Implemented
  public get executionState(): TCommonMissionNode['executionState'] {
    let execution: TActionExecution | null = this.execution
    let outcomes: TActionOutcome[] = this.outcomes

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
  public get readyToExecute(): TCommonMissionNode['readyToExecute'] {
    return (
      this.executable &&
      this.actions.size > 0 &&
      (this.executionState === 'unexecuted' ||
        this.executionState === 'failure')
    )
  }

  // Implemented
  public get executing(): TCommonMissionNode['executing'] {
    return this.execution !== null
  }

  // Implemented
  public get executed(): TCommonMissionNode['executed'] {
    return this.outcomes.length > 0
  }

  /**
   * Whether or not this node was manually opened.
   * @note Only applicable to non-executable nodes.
   */
  protected opened: boolean

  // Implemented
  public depthPadding: TCommonMissionNode['depthPadding']

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
  protected _outcomes: TActionOutcome[]
  // Inherited
  public get outcomes(): TActionOutcome[] {
    return [...this._outcomes]
  }

  // Implemented
  public parentNode: TRelativeNode | null

  // Implemented
  public childNodes: TRelativeNode[]

  // Implemented
  public get hasChildren(): TCommonMissionNode['hasChildren'] {
    return this.childNodes.length > 0
  }

  // Implemented
  public get hasSiblings(): TCommonMissionNode['hasSiblings'] {
    return this.childrenOfParent.length > 1
  }

  // Implemented
  public get siblings(): TRelativeNode[] {
    let siblings: TRelativeNode[] = []

    if (this.parentNode !== null) {
      let childrenOfParent: TRelativeNode[] = this.parentNode
        .childNodes as TRelativeNode[]

      siblings = childrenOfParent.filter(
        (childOfParent: TRelativeNode) => childOfParent.nodeID !== this.nodeID,
      )
    }

    return siblings
  }

  // Implemented
  public get childrenOfParent(): TRelativeNode[] {
    let childrenOfParent: TRelativeNode[] = []

    if (this.parentNode !== null) {
      childrenOfParent = this.parentNode.childNodes as TRelativeNode[]
    }

    return childrenOfParent
  }

  // Implemented
  public get previousSibling(): TRelativeNode | null {
    let previousSibling: TRelativeNode | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: TRelativeNode[] = this.parentNode
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
      let childrenOfParent: TRelativeNode[] = this.parentNode
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
  public get isOpen(): TCommonMissionNode['isOpen'] {
    return this.opened || this.executionState === 'successful'
  }

  // Implemented
  public get openable(): TCommonMissionNode['openable'] {
    return !this.executable && !this.isOpen
  }

  // Implemented
  public get revealed(): TCommonMissionNode['revealed'] {
    return this.parentNode === null || this.parentNode.isOpen
  }

  /**
   * @param {TMission} mission The mission of which the node is a part.
   * @param {TMissionNodeJson} data The node data from which to create the node. Any ommitted values will be set to the default properties defined in MissionNode.DEFAULT_PROPERTIES.
   * @param {TMissionNodeOptions<TMission>} options The options for creating the node.
   */
  public constructor(
    mission: TMission,
    data: Partial<TMissionNodeJson> = MissionNode.DEFAULT_PROPERTIES,
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
   * @param {TCommonMissionActionJson[]} data The action data to parse.
   * @returns {MissionAction[]} The parsed action data.
   */
  protected abstract parseActionData(
    data: TCommonMissionActionJson[],
  ): Map<string, TMissionAction>

  /**
   * Parses the execution data into a execution object of the
   * type passed in TActionExecution.
   * @param {IActionExecutionJSON[]} data The outcome data to parse.
   * @returns {TActionExecution[]} The parsed outcome data.
   */
  protected abstract parseExecutionData(
    data: TActionExecutionJson,
  ): TActionExecution | null

  /**
   * Parses the outcome data into the outcome objects of the
   * type passed in TActionOutcome.
   * @param {IActionOutcomeJson[]} data The outcome data to parse.
   * @returns {TActionOutcome[]} The parsed outcome data.
   */
  protected abstract parseOutcomeData(
    data: IActionOutcomeJson[],
  ): TActionOutcome[]

  // Implemented
  public toJson(options: TNodeJsonOptions = {}): TMissionNodeJson {
    let { includeGameData = false } = options

    // Construct base JSON.
    let json: TMissionNodeJson = {
      nodeID: this.nodeID,
      name: this.name,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      depthPadding: this.depthPadding,
      executable: this.executable,
      device: this.device,
      actions: MapToolbox.mapToArray(this.actions, (action: TMissionAction) =>
        action.toJson(),
      ),
    }

    // Include game data if includeGameData
    // flag was set.
    if (includeGameData) {
      // Construct execution JSON.
      let executionJson: TActionExecutionJson | null = null

      if (this.execution !== null) {
        executionJson = this.execution.toJson()
      }

      // Construct outcome JSON.
      let outcomeJSON: IActionOutcomeJson[] = this.outcomes.map((outcome) =>
        outcome.toJson(),
      )

      // Construct game-specific JSON.
      let gameJson: IMissionNodeGameJson = {
        opened: this.opened,
        executionState: this.executionState,
        execution: executionJson,
        outcomes: outcomeJSON,
      }

      // Join game-specific JSON with base JSON.
      json = {
        ...json,
        ...gameJson,
      }
    }

    // Return finalized JSON.
    return json
  }

  // Implemented
  public abstract open(options?: INodeOpenOptions): Promise<void>

  // Implemented
  public abstract handleExecution(
    data: NonNullable<TActionExecutionJson>,
  ): TActionExecution

  // Implemented
  public abstract handleOutcome(
    data: IActionOutcomeJson,
    options?: IHandleOutcomeOptions,
  ): TActionOutcome

  /**
   * The default properties for a MissionNode object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionNodeJson> {
    return {
      nodeID: generateHash(),
      name: 'Unnamed Node',
      color: '#ffffff',
      description: '<p><br></p>',
      preExecutionText: '<p><br></p>',
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

/* ------------------------------ NODE TYPES ------------------------------ */

/**
 * Interface of the abstract MissionNode class.
 * @note Any public, non-static properties and functions of the MissionNode class
 * must first be defined here for them to be accessible to the Mission and
 * MissionAction classes.
 */
export interface TCommonMissionNode {
  /**
   * The mission of which the node is a part.
   */
  mission: TCommonMission
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
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  depthPadding: number
  /**
   * The actions that can be performed on the node.
   * @note Mapped by action ID.
   */
  actions: Map<string, TCommonMissionAction>
  /**
   * The current execution in process on the node by an action.
   */
  get execution(): IActionExecution | null
  /**
   * The outcomes of the actions that are performed on the node.
   */
  get outcomes(): IActionOutcome[]
  /**
   * The parent of this node in the tree structure.
   */
  parentNode: TCommonMissionNode | null
  /**
   * The children of this node in the tree structure.
   */
  childNodes: TCommonMissionNode[]
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
  siblings: TCommonMissionNode[]
  /**
   * The children of the parent of this node (Essentially siblings plus self).
   */
  childrenOfParent: TCommonMissionNode[]
  /**
   * The sibling, if any, ordered before this node in the structure.
   */
  previousSibling: TCommonMissionNode | null
  /**
   * The sibling, if any, ordered after this node in the structure.
   */
  followingSibling: TCommonMissionNode | null
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
   * Converts the node to JSON.
   * @param options Options for exporting the node to JSON.
   * @returns the JSON for the node.
   */
  toJson: (options?: TNodeJsonOptions) => TMissionNodeJson
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
    execution: NonNullable<TActionExecutionJson>,
  ) => IActionExecution
  /**
   * Handles an outcome of an action performed on the node.
   * @param data The outcome data to handle.
   * @param options Options for handling the outcome.
   * @returns The generated outcome object.
   */
  handleOutcome: (
    data: IActionOutcomeJson,
    options?: IHandleOutcomeOptions,
  ) => IActionOutcome
}

/**
 * Game-agnostic JSON data for a MissionNode object.
 */
export interface TCommonMissionNodeJson {
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
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  depthPadding: number
  /**
   * The actions that can be performed on the node.
   */
  actions: TCommonMissionActionJson[]
}

/**
 * Game-specific JSON data for a MissionNode object.
 */
export interface IMissionNodeGameJson {
  opened: boolean
  executionState: TNodeExecutionState
  execution: TActionExecutionJson | null
  outcomes: IActionOutcomeJson[]
}

/**
 * Plain JSON representation of a MissionNode object.
 * Type built from TCommonMissionNodeJson and IMissionNodeGameJSON,
 * with all properties from IMissionNodeGameJSON being partial.
 */
export type TMissionNodeJson = TCommonMissionNodeJson &
  Partial<IMissionNodeGameJson>

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
export type TMissionNodeOptions<TRelative extends TCommonMissionNode> = {
  /**
   * The node of which this node is a child.
   * @default null
   */
  parentNode?: TRelative | null
  /**
   * The child nodes of this node.
   * @default []
   */
  childNodes?: TRelative[]
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
