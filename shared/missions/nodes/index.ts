import { v4 as generateHash } from 'uuid'
import Mission, { TCommonMissionTypes, TMission } from '..'
import { Vector2D } from '../../../shared/toolbox/space'
import ArrayToolbox from '../../toolbox/arrays'
import MapToolbox from '../../toolbox/maps'
import { TAction, TMissionActionJson, TMissionActionOptions } from '../actions'
import TActionExecution, {
  TActionExecutionJson,
  TActionExecutionState,
  default as TCommonMissionExecution,
  TExecution,
} from '../actions/executions'
import {
  default as IActionOutcome,
  TActionOutcomeJson,
  default as TCommonActionOutcome,
  TOutcome,
} from '../actions/outcomes'
import { TForce, TForceJsonOptions } from '../forces'
import MissionPrototype, { TPrototype } from './prototypes'

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The corresponding prototype for the node.
   */
  public prototype: TPrototype<T>

  /**
   * The force the node belongs to.
   */
  public force: TForce<T>

  /**
   * The ID for the node.
   */
  public _id: string

  /**
   * The name for the node.
   */
  public name: string

  /**
   * The color for the node used as a border in the mission
   * map.
   */
  public color: string

  /**
   * The description for the node.
   */
  public description: string

  /**
   * The text that is sent to the output panel when the node
   * is clicked on.
   */
  public preExecutionText: string

  /**
   * Whether an action can be executed on the node.
   */
  public executable: boolean

  /**
   * Whether or not this node is a device.
   */
  public device: boolean

  /**
   * The actions that can be performed on the node.
   * @note Mapped by action ID.
   */
  public actions: Map<string, TAction<T>>

  /**
   * The mission of which the node is a part.
   */
  public get mission(): TMission<T> {
    return this.force.mission
  }

  /**
   * The execution state of the node.
   */
  public get executionState(): TNodeExecutionState {
    let execution: TActionExecution | null = this.execution
    let outcomes: IActionOutcome[] = this.outcomes

    // Check for 'unexecuted' state.
    if (execution === null && outcomes.length === 0) {
      return 'unexecuted'
    } else if (execution !== null) {
      return 'executing'
    } else {
      let outcomeStatus = ArrayToolbox.lastOf(outcomes).status

      if (outcomeStatus === 'aborted') {
        return 'unexecuted'
      } else {
        return outcomeStatus
      }
    }
  }

  /**
   * Whether or not this node is ready to be
   * executed upon by an action.
   */
  public get readyToExecute(): boolean {
    return (
      this.executable &&
      this.actions.size > 0 &&
      this.executionState !== 'executing'
    )
  }

  /**
   * Whether an action is currently being executed on the node.
   */
  public get executing(): boolean {
    return (
      this.execution !== null &&
      this.execution.timeRemaining > 0 &&
      !this.execution.aborted
    )
  }

  /**
   * Whether an action has been executed on the node.
   */
  public get executed(): boolean {
    return this.outcomes.length > 0
  }

  /**
   * Whether or not this node was manually opened.
   */
  protected _opened: boolean

  /**
   * Whether or not this node was manually opened.
   */
  public get opened(): boolean {
    return this._opened
  }

  /**
   * Whether or not this node is blocked.
   */
  protected _blocked: boolean
  /**
   * Whether or not this node is blocked.
   */
  public get blocked(): boolean {
    return this._blocked
  }

  /**
   * The current execution in process on the node by an action.
   */
  protected _execution: TExecution<T> | null
  /**
   * The current execution in process on the node by an action.
   */
  public get execution(): TExecution<T> | null {
    return this._execution
  }

  /**
   * The outcomes of the actions that are performed on the node.
   */
  protected _outcomes: TOutcome<T>[]
  /**
   * The outcomes of the actions that are performed on
   * the node.
   */
  public get outcomes(): TOutcome<T>[] {
    return [...this._outcomes]
  }

  /**
   * The parent of this node in the tree structure.
   */
  public get parent(): TNode<T> | null {
    let parentPrototype = this.prototype.parent
    return parentPrototype
      ? this.force.getNodeFromPrototype(parentPrototype._id) ?? null
      : null
  }

  /**
   * The children of this node in the tree structure.
   */
  public get children(): TNode<T>[] {
    let children: TNode<T>[] = []

    this.prototype.children.forEach((childPrototype) => {
      let child = this.force.getNodeFromPrototype(childPrototype._id)
      if (child) children.push(child)
    })

    return children
  }

  /**
   * The first child node of the node in the
   * tree structure.
   */
  public get firstChildNode(): TNode<T> | null {
    return this.children.length > 0 ? this.children[0] : null
  }

  /**
   * The last child node of the node in the
   * tree structure.
   */
  public get lastChildNode(): TNode<T> | null {
    return this.children.length > 0
      ? this.children[this.children.length - 1]
      : null
  }

  /**
   * Whether or not this nodes has child nodes
   * in the tree structure.
   */
  public get hasChildren(): boolean {
    return this.children.length > 0
  }

  /**
   * Whether or not this node has siblings tree
   * structure.
   */
  public get hasSiblings(): boolean {
    return this.childrenOfParent.length > 1
  }

  /**
   * The siblings of this node in the tree
   * structure.
   */
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

  /**
   * The children of the parent of this node in the
   * tree structure.
   */
  public get childrenOfParent(): TNode<T>[] {
    let childrenOfParent: TNode<T>[] = []

    if (this.parent !== null) {
      childrenOfParent = this.parent.children
    }

    return childrenOfParent
  }

  /**
   * The sibling, if any, ordered before this node in the
   * tree structure.
   */
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

  /**
   * The sibling, if any, ordered after this node in the
   * tree structure.
   */
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

  /**
   * Whether or not this node can be opened.
   */
  public get openable(): boolean {
    return !this.opened
  }

  /**
   * Whether or not this node has been (or at least
   * is expected to be) revealed to the player.
   */
  public get revealed(): boolean {
    return this.parent === null || this.parent.opened
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
    let { populateTargets = false } = options

    // Set properties from data.
    this.force = force
    this._id = data._id ?? MissionNode.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionNode.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionNode.DEFAULT_PROPERTIES.color
    this.description =
      data.description ?? MissionNode.DEFAULT_PROPERTIES.description
    this.preExecutionText =
      data.preExecutionText ?? MissionNode.DEFAULT_PROPERTIES.preExecutionText
    this.executable =
      data.executable ?? MissionNode.DEFAULT_PROPERTIES.executable
    this.device = data.device ?? MissionNode.DEFAULT_PROPERTIES.device
    this.actions = this.importActions(
      data.actions ?? MissionNode.DEFAULT_PROPERTIES.actions,
      { populateTargets },
    )
    this._opened = data.opened ?? MissionNode.DEFAULT_PROPERTIES.opened
    this._blocked = data.blocked ?? MissionNode.DEFAULT_PROPERTIES.blocked
    this._execution = this.importExecutions(
      data.execution !== undefined
        ? data.execution
        : MissionNode.DEFAULT_PROPERTIES.execution,
    )
    this._outcomes = this.importOutcomes(
      data.outcomes ?? MissionNode.DEFAULT_PROPERTIES.outcomes,
    )
    this.position = new Vector2D(0, 0)

    // Attempt to get prototype from mission.
    let prototype = this.mission.getPrototype(data.prototypeId)

    // Throw error if prototype not found.
    if (!prototype) throw new Error('Prototype not found.')

    // Set prototype.
    this.prototype = prototype
  }

  /**
   * Imports the action data into MissionAction objects.
   * @param data The action data to parse.
   * @param options The options used to create the actions.
   * @returns The parsed action data.
   */
  protected abstract importActions(
    data: TMissionActionJson[],
    options?: TMissionActionOptions,
  ): Map<string, TAction<T>>

  /**
   * Imports the execution data into a execution object of the
   * type passed in IActionExecution.
   * @param data The outcome data to parse.
   * @returns The parsed outcome data.
   */
  protected abstract importExecutions(
    data: TActionExecutionJson,
  ): TExecution<T> | null

  /**
   * Imports the outcome data into the outcome objects of the
   * type passed in IActionOutcome.
   * @param data The outcome data to parse.
   * @returns The parsed outcome data.
   */
  protected abstract importOutcomes(data: TActionOutcomeJson[]): TOutcome<T>[]

  /**
   * Handles the blocking and unblocking of the node's children.
   * @param blocked Whether or not the node is blocked.
   * @param node The starting node.
   */
  protected abstract updateBlockStatusForChildren(
    blocked: boolean,
    node?: TNode<T>,
  ): void

  /**
   * Converts the node to JSON.
   * @param options Options for exporting the node to JSON.
   * @returns the JSON for the node.
   */
  public toJson(options: TNodeJsonOptions = {}): TMissionNodeJson {
    const { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options
    // Construct base JSON.
    let json: TMissionNodeJson = {
      _id: this._id,
      prototypeId: this.prototype._id,
      name: this.name,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      executable: this.executable,
      device: this.device,
      actions: MapToolbox.mapToArray(this.actions, (action: TAction<T>) =>
        action.toJson(options),
      ),
    }

    // Include session-specific data based on exposure level.
    switch (sessionDataExposure.expose) {
      case 'all':
      case 'user-specific':
        // Construct execution JSON.
        let executionJson: TActionExecutionJson | null = null

        if (this.execution !== null) {
          executionJson = this.execution.toJson()
        }

        // Construct outcome JSON.
        let outcomeJson: TActionOutcomeJson[] = this.outcomes.map((outcome) =>
          outcome.toJson(),
        )

        // Construct session-specific JSON.
        let sessionJson: TMissionNodeSessionJson = {
          opened: this.opened,
          executionState: this.executionState,
          execution: executionJson,
          outcomes: outcomeJson,
          blocked: this.blocked,
        }

        // Join session-specific JSON with base JSON.
        json = {
          ...json,
          ...sessionJson,
        }
        break
      case 'none':
        break
    }

    // Return finalized JSON.
    return json
  }

  /**
   * Opens the node.
   * @param options Options for opening the node.
   * @returns a promise that resolves when the node opening has been fulfilled.
   */
  public abstract open(options?: INodeOpenOptions): Promise<void>

  /**
   * Loads the execution JSON into the node, returning a new
   * execution object.
   * @param data The execution data to load.
   * @returns The generated execution object.
   */
  public abstract loadExecution(
    data: NonNullable<TActionExecutionJson>,
  ): TActionExecution

  /**
   * Loads the execution JSON into the node, returning a new
   * execution object..
   * @param data The outcome data to load.
   * @param options Options for loading the outcome.
   * @returns The generated outcome object.
   */
  public abstract loadOutcome(
    data: TActionOutcomeJson,
    options?: ILoadOutcomeOptions,
  ): TOutcome<T>

  /**
   * Handles the blocking and unblocking of the node.
   * @param blocked Whether the node is blocked or unblocked.
   */
  public abstract updateBlockStatus(blocked: boolean): void

  /**
   * Modifies the chance of success for all the node's
   * actions.
   * @param successChanceOperand The operand to modify
   * the success chance by.
   */
  public abstract modifySuccessChance(successChanceOperand: number): void

  /**
   * Modifies the processing time for all the node's
   * actions.
   * @param processTimeOperand The operand to modify
   * the process time by.
   */
  public abstract modifyProcessTime(processTimeOperand: number): void

  /**
   * Modifies the resource cost for all the node's
   * actions.
   * @param resourceCostOperand The operand to modify
   * the resource cost by.
   */
  public abstract modifyResourceCost(resourceCostOperand: number): void

  /**
   * The maximum length allowed for a node's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

  /**
   * The default properties for a `MissionNode` object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionNodeJson> {
    return {
      _id: generateHash(),
      prototypeId: MissionPrototype.DEFAULT_PROPERTIES._id,
      name: 'Unnamed Node',
      color: '#ffffff',
      description: '',
      preExecutionText: '',
      executable: false,
      device: false,
      actions: [],
      opened: false,
      blocked: false,
      executionState: 'unexecuted',
      execution: null,
      outcomes: [],
    }
  }
}

/* ------------------------------ NODE TYPES ------------------------------ */

/**
 * Session-agnostic JSON data for a MissionNode object.
 */
export interface TMissionNodeJsonBase {
  /**
   * The ID for the node.
   */
  _id: string
  /**
   * The ID of the prototype node that the node is based on.
   */
  prototypeId: string
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
   * The text that is sent to the output panel when the node is clicked on.
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
   * The actions that can be performed on the node.
   */
  actions: TMissionActionJson[]
}

/**
 * Extracts the node type from the mission types.
 * @param T The mission types.
 * @returns The node type.
 */
export type TNode<T extends TCommonMissionTypes> = T['node']

/**
 * Session-specific JSON data for a MissionNode object.
 */
export interface TMissionNodeSessionJson {
  opened: boolean
  executionState: TNodeExecutionState
  execution: TActionExecutionJson | null
  outcomes: TActionOutcomeJson[]
  blocked: boolean
}

/**
 * Plain JSON representation of a MissionNode object.
 * Type built from TCommonMissionNodeJson and TMissionNodeSessionJSON,
 * with all properties from TMissionNodeSessionJSON being partial.
 */
export type TMissionNodeJson = TMissionNodeJsonBase &
  Partial<TMissionNodeSessionJson>

/**
 * Options for MissionNode.toJSON method.
 */
export type TNodeJsonOptions = Omit<TForceJsonOptions, 'forceExposure'>

/**
 * Options for creating a MissionNode object.
 */
export type TMissionNodeOptions = {
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
}

/**
 * Possible states for the execution of a node.
 */
export type TNodeExecutionState = 'unexecuted' | TActionExecutionState

/**
 * Options for the `MissionNode.open` method.
 */
export interface INodeOpenOptions {}

/**
 * Options for the `MissionNode.loadOutcome` method.
 */
export interface ILoadOutcomeOptions {}
