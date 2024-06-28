import { v4 as generateHash } from 'uuid'
import { TCommonMission, TCommonMissionTypes, TMission } from '..'
import { Vector2D } from '../../../shared/toolbox/space'
import ArrayToolbox from '../../toolbox/arrays'
import MapToolbox from '../../toolbox/maps'
import { uuidTypeValidator } from '../../toolbox/validators'
import { TCommonMissionAction, TCommonMissionActionJson } from '../actions'
import IActionExecution, {
  TActionExecutionJson,
  default as TCommonMissionExecution,
} from '../actions/executions'
import {
  default as IActionOutcome,
  TActionOutcomeJson,
  default as TCommonActionOutcome,
} from '../actions/outcomes'
import { TCommonMissionForce, TForce } from '../forces'
import { TCommonMissionPrototype, TPrototype } from './prototypes'

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  T extends TCommonMissionTypes = TCommonMissionTypes,
  TAction extends T['action'] = T['action'],
> implements TCommonMissionNode
{
  // Implemented
  public prototype: TPrototype<T>

  // Implemented
  public force: TForce<T>

  // Implemented
  public get mission(): TMission<T> {
    return this.force.mission
  }

  // Implemented
  public _id: TCommonMissionNode['_id']

  // Inherited
  public structureKey: TCommonMissionNode['structureKey']

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
    let execution: IActionExecution | null = this.execution
    let outcomes: IActionOutcome[] = this.outcomes

    // Check for 'unexecuted' state.
    if (execution === null && outcomes.length === 0) {
      return 'unexecuted'
    } else if (execution !== null) {
      return 'executing'
    } else {
      return ArrayToolbox.lastOf(outcomes).successful ? 'successful' : 'failed'
    }
  }

  // Implemented
  public get readyToExecute(): TCommonMissionNode['readyToExecute'] {
    return (
      this.executable &&
      this.actions.size > 0 &&
      (this.executionState === 'unexecuted' || this.executionState === 'failed')
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

  /**
   * Cache for the depth padding of the node.
   */
  protected _depthPadding: number
  // Implemented
  public get depthPadding(): number {
    return this._depthPadding
  }
  // Implemented
  public set depthPadding(value: number) {
    this._depthPadding = value
  }

  // Implemented
  public actions: Map<string, TAction>

  /**
   * The current execution in process on the node by an action.
   */
  protected _execution: TExecution<T> | null
  // Implemented
  public get execution(): TExecution<T> | null {
    return this._execution
  }

  /**
   * The outcomes of the actions that are performed on the node.
   */
  protected _outcomes: TOutcome<T>[]
  // Inherited
  public get outcomes(): TOutcome<T>[] {
    return [...this._outcomes]
  }

  // Implemented
  public get parent(): TNode<T> | null {
    let parentPrototype = this.prototype.parent
    return parentPrototype
      ? this.force.getNodeFromPrototype(parentPrototype._id) ?? null
      : null
  }

  // Implemented
  public get children(): TNode<T>[] {
    let children: TNode<T>[] = []

    this.prototype.children.forEach((childPrototype) => {
      let child = this.force.getNodeFromPrototype(childPrototype._id)
      if (child) children.push(child)
    })

    return children
  }

  // Implemented
  public get firstChildNode(): TNode<T> | null {
    return this.children.length > 0 ? this.children[0] : null
  }

  // Implemented
  public get lastChildNode(): TNode<T> | null {
    return this.children.length > 0
      ? this.children[this.children.length - 1]
      : null
  }

  // Implemented
  public get hasChildren(): TCommonMissionNode['hasChildren'] {
    return this.children.length > 0
  }

  // Implemented
  public get hasSiblings(): TCommonMissionNode['hasSiblings'] {
    return this.childrenOfParent.length > 1
  }

  // Implemented
  public get siblings(): TNode<T>[] {
    let siblings: TNode<T>[] = []

    if (this.parent !== null) {
      let childrenOfParent: TNode<T>[] = this.parent.children

      siblings = childrenOfParent.filter(
        (childOfParent: TNode<T>) => childOfParent._id !== this._id,
      )
    }

    return siblings
  }

  // Implemented
  public get childrenOfParent(): TNode<T>[] {
    let childrenOfParent: TNode<T>[] = []

    if (this.parent !== null) {
      childrenOfParent = this.parent.children
    }

    return childrenOfParent
  }

  // Implemented
  public get previousSibling(): TNode<T> | null {
    let previousSibling: TNode<T> | null = null

    if (this.parent !== null) {
      let childrenOfParent: TNode<T>[] = this.parent.children

      childrenOfParent.forEach((childOfParent: TNode<T>, index: number) => {
        if (childOfParent._id === this._id && index > 0) {
          previousSibling = childrenOfParent[index - 1]
        }
      })
    }

    return previousSibling
  }

  // Implemented
  public get followingSibling(): TNode<T> | null {
    let followingSibling: TNode<T> | null = null

    if (this.parent !== null) {
      let childrenOfParent: TNode<T>[] = this.parent.children

      childrenOfParent.forEach((childOfParent: TNode<T>, index: number) => {
        if (
          childOfParent._id === this._id &&
          index + 1 < childrenOfParent.length
        ) {
          followingSibling = childrenOfParent[index + 1]
        }
      })
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
    return this.parent === null || this.parent.isOpen
  }

  /**
   * The position of the node on a mission map.
   */
  public position: Vector2D

  /**
   * @param force The force of which the node is a part.
   * @param data The node data from which to create the node. Any ommitted values will be set to the default properties defined in MissionNode.DEFAULT_PROPERTIES.
   * @param options The options for creating the node.
   */
  public constructor(
    force: TForce<T>,
    data: Partial<TMissionNodeJson> = MissionNode.DEFAULT_PROPERTIES,
    options: TMissionNodeOptions = {},
  ) {
    // Set properties from data.
    this.force = force
    this._id = data._id?.toString() ?? MissionNode.DEFAULT_PROPERTIES._id
    this.structureKey =
      data.structureKey ?? MissionNode.DEFAULT_PROPERTIES.structureKey
    this.name = data.name ?? MissionNode.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionNode.DEFAULT_PROPERTIES.color
    this.description =
      data.description ?? MissionNode.DEFAULT_PROPERTIES.description
    this.preExecutionText =
      data.preExecutionText ?? MissionNode.DEFAULT_PROPERTIES.preExecutionText
    this.executable =
      data.executable ?? MissionNode.DEFAULT_PROPERTIES.executable
    this.device = data.device ?? MissionNode.DEFAULT_PROPERTIES.device
    this._depthPadding =
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
    this.position = new Vector2D(0, 0)

    // Attempt to get prototype from mission.
    let prototype = this.mission.getPrototype(this.structureKey)

    // Throw error if prototype not found.
    if (!prototype) throw new Error('Prototype not found.')

    // Set prototype.
    this.prototype = prototype
  }

  /**
   * Parses the action data into MissionAction objects.
   * @param {TCommonMissionActionJson[]} data The action data to parse.
   * @returns {MissionAction[]} The parsed action data.
   */
  protected abstract parseActionData(
    data: TCommonMissionActionJson[],
  ): Map<string, TAction>

  /**
   * Parses the execution data into a execution object of the
   * type passed in IActionExecution.
   * @param {IActionExecutionJSON[]} data The outcome data to parse.
   * @returns {IActionExecution[]} The parsed outcome data.
   */
  protected abstract parseExecutionData(
    data: TActionExecutionJson,
  ): TExecution<T> | null

  /**
   * Parses the outcome data into the outcome objects of the
   * type passed in IActionOutcome.
   * @param {TActionOutcomeJson[]} data The outcome data to parse.
   * @returns {IActionOutcome[]} The parsed outcome data.
   */
  protected abstract parseOutcomeData(data: TActionOutcomeJson[]): TOutcome<T>[]

  // Implemented
  public toJson(options: TNodeJsonOptions = {}): TMissionNodeJson {
    let { includeSessionData: includeSessionData = false } = options

    // Construct base JSON.
    let json: TMissionNodeJson = {
      structureKey: this.structureKey,
      name: this.name,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      depthPadding: this.depthPadding,
      executable: this.executable,
      device: this.device,
      actions: MapToolbox.mapToArray(this.actions, (action: TAction) =>
        action.toJson(),
      ),
    }

    // Include _id if it's an ObjectId.
    // * Note: IDs in the database are
    // * stored as mongoose ObjectIds.
    // * If the ID is a UUID, then the
    // * mission won't save.
    let isObjectId: boolean = !uuidTypeValidator(this._id) ? true : false
    if (isObjectId) {
      json._id = this._id
    }

    // Include session data if includeSessionData
    // flag was set.
    if (includeSessionData) {
      // Construct execution JSON.
      let executionJson: TActionExecutionJson | null = null

      if (this.execution !== null) {
        executionJson = this.execution.toJson()
      }

      // Construct outcome JSON.
      let outcomeJSON: TActionOutcomeJson[] = this.outcomes.map((outcome) =>
        outcome.toJson(),
      )

      // Construct session-specific JSON.
      let sessionJson: IMissionNodeSessionJson = {
        opened: this.opened,
        executionState: this.executionState,
        execution: executionJson,
        outcomes: outcomeJSON,
      }

      // Join session-specific JSON with base JSON.
      json = {
        ...json,
        ...sessionJson,
      }
    }

    // Return finalized JSON.
    return json
  }

  // Implemented
  public abstract open(options?: INodeOpenOptions): Promise<void>

  // Implemented
  public abstract loadExecution(
    data: NonNullable<TActionExecutionJson>,
  ): IActionExecution

  // Implemented
  public abstract loadOutcome(
    data: TActionOutcomeJson,
    options?: ILoadOutcomeOptions,
  ): IActionOutcome

  /**
   * The default properties for a MissionNode object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionNodeJson> {
    return {
      _id: generateHash(),
      structureKey: generateHash(),
      name: 'Unnamed Node',
      color: '#ffffff',
      description: '',
      preExecutionText: '',
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
   * The force the node belongs to.
   */
  force: TCommonMissionForce
  /**
   * The corresponding prototype for the node.
   */
  prototype: TCommonMissionPrototype
  /**
   * The ID for the node.
   */
  _id: string
  /**
   * The key used in the nodeStructure object to represent a node's position and relationships to other
   * nodes.
   */
  structureKey: string
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
  get depthPadding(): number
  set depthPadding(value: number)
  /**
   * The actions that can be performed on the node.
   * @note Mapped by action ID.
   */
  actions: Map<string, TCommonMissionAction>
  /**
   * The current execution in process on the node by an action.
   */
  get execution(): TCommonMissionExecution | null
  /**
   * The outcomes of the actions that are performed on the node.
   */
  get outcomes(): TCommonActionOutcome[]
  /**
   * The parent of this node in the tree structure.
   */
  get parent(): TCommonMissionNode | null
  /**
   * The children of this node in the tree structure.
   */
  get children(): TCommonMissionNode[]
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
  get isOpen(): boolean
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
   * Loads the execution JSON into the node, returning a new
   * execution object.
   * @param data The execution data to load.
   * @returns The generated execution object.
   */
  loadExecution: (
    execution: NonNullable<TActionExecutionJson>,
  ) => TCommonMissionExecution
  /**
   * Loads the execution JSON into the node, returning a new
   * execution object..
   * @param data The outcome data to load.
   * @param options Options for loading the outcome.
   * @returns The generated outcome object.
   */
  loadOutcome: (
    data: TActionOutcomeJson,
    options?: ILoadOutcomeOptions,
  ) => TCommonActionOutcome
}

/**
 * Session-agnostic JSON data for a MissionNode object.
 */
export interface TCommonMissionNodeJson {
  /**
   * The ID for the node.
   */
  _id?: string
  /**
   * The key used in the nodeStructure object to represent a node's position and relationships to other
   * nodes.
   */
  structureKey: string
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
 * Extracts the node type from the mission types.
 * @param T The mission types.
 * @returns The node type.
 */
export type TNode<T extends TCommonMissionTypes> = T['node']

// todo: Move to executions class file.
/**
 * Extracts the execution type from the mission types.
 * @param T The mission types.
 * @returns The execution type.
 */
export type TExecution<T extends TCommonMissionTypes> = T['execution']

// todo: Move to outcomes class file.
/**
 * Extracts the outcome type from the mission types.
 * @param T The mission types.
 * @returns The outcome type.
 */
export type TOutcome<T extends TCommonMissionTypes> = T['outcome']

/**
 * Session-specific JSON data for a MissionNode object.
 */
export interface IMissionNodeSessionJson {
  opened: boolean
  executionState: TNodeExecutionState
  execution: TActionExecutionJson | null
  outcomes: TActionOutcomeJson[]
}

/**
 * Plain JSON representation of a MissionNode object.
 * Type built from TCommonMissionNodeJson and IMissionNodeSessionJSON,
 * with all properties from IMissionNodeSessionJSON being partial.
 */
export type TMissionNodeJson = TCommonMissionNodeJson &
  Partial<IMissionNodeSessionJson>

/**
 * Options for MissionNode.toJSON method.
 */
export type TNodeJsonOptions = {
  /**
   * Whether to include session-specific data in the JSON export.
   * @default false
   */
  includeSessionData?: boolean
}

/**
 * Options for creating a MissionNode object.
 */
export type TMissionNodeOptions = {}

/**
 * Possible states for the execution of a node.
 */
export type TNodeExecutionState =
  | 'unexecuted'
  | 'executing'
  | 'successful'
  | 'failed'

/**
 * Options for the `MissionNode.open` method.
 */
export interface INodeOpenOptions {}

/**
 * Options for the `MissionNode.loadOutcome` method.
 */
export interface ILoadOutcomeOptions {}
