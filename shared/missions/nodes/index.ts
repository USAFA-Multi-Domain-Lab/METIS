import { TMetisBaseComponents, TMetisComponent } from 'metis/index'
import { AnyObject } from 'metis/toolbox/objects'
import { v4 as generateHash } from 'uuid'
import Mission, { TMission, TMissionComponent } from '..'
import { Vector2D } from '../../../shared/toolbox/space'
import ArrayToolbox from '../../toolbox/arrays'
import MapToolbox from '../../toolbox/maps'
import { TAction, TMissionActionJson, TMissionActionOptions } from '../actions'
import {
  TActionExecutionJson,
  TActionExecutionState,
  TExecution,
} from '../actions/executions'
import { TOutcome } from '../actions/outcomes'
import { TForce, TForceJsonOptions } from '../forces'
import MissionPrototype, { TPrototype } from './prototypes'

/**
 * This represents an individual node in a mission.
 */
export default abstract class MissionNode<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> implements TMissionComponent<T, MissionNode<T>>
{
  // Implemented
  public get mission(): TMission<T> {
    return this.force.mission
  }

  /**
   * The corresponding prototype for the node.
   */
  public prototype: TPrototype<T>

  /**
   * The force the node belongs to.
   */
  public force: TForce<T>

  /**
   * The ID of the force the node belongs to.
   */
  public get forceId(): string {
    return this.force._id
  }

  // Implemented
  public _id: TMetisComponent['_id']

  // Implemented
  public name: string

  // Implemented
  public get path(): [...TMissionComponent<any, any>[], this] {
    return [this.mission, this.force, this]
  }

  // Implemented
  public get defective(): boolean {
    return false
  }

  // Implemented
  public get defectiveMessage(): string {
    return ''
  }

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
   * Determines if this node should be excluded from the node structure.
   * @note This allows for nodes within a force to be hidden from
   * participants during a session.
   */
  protected _exclude: boolean
  /**
   * Determines if this node should be excluded from the node structure.
   * @note This allows for nodes within a force to be hidden from
   * participants during a session.
   */
  public abstract get exclude(): boolean
  public abstract set exclude(value: boolean)

  /**
   * The execution state of the node.
   */
  public get executionState(): TNodeExecutionState {
    let { latestExecution } = this
    // Determine the execution state from
    // the value of the latest execution.
    if (latestExecution === null) return { status: 'unexecuted' }
    else return latestExecution.state
  }

  /**
   * The execution status of the node, determined
   * by the execution state.
   */
  public get executionStatus(): TNodeExecutionState['status'] {
    return this.executionState.status
  }

  /**
   * Whether or not this node is ready to be
   * executed upon by an action.
   */
  public get readyToExecute(): boolean {
    return (
      this.executable &&
      this.actions.size > 0 &&
      this.executionStatus !== 'executing'
    )
  }

  /**
   * Whether an action is currently being executed on the node.
   */
  public get executing(): boolean {
    return this.latestExecution?.status === 'executing'
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
    if (!this._opened && this.force.revealAllNodes) return false
    if (this.parent?.opened && this.exclude) return true
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
   * Cache for the `executions` field.
   */
  protected _executions: T['execution'][]
  /**
   * A list of executions that have been performed on the node.
   */
  public get executions(): T['execution'][] {
    return this._executions
  }

  /**
   * The current execution being performed on the node,
   * or the last execution, if not executing. `null` is
   * returned if no executions have been performed.
   */
  public get latestExecution(): TExecution<T> | null {
    return this.executions.length ? ArrayToolbox.lastOf(this.executions) : null
  }

  /**
   * The outcomes of the actions that are performed on
   * the node.
   */
  public get outcomes(): TOutcome<T>[] {
    return this.executions
      .map(({ outcome }) => outcome)
      .filter((outcome) => outcome !== null)
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
   * The next set of nodes in the node structure that are not excluded.
   * @note This is used to determine the next set of nodes that
   * are available to be opened.
   */
  public get relativeChildren(): TNode<T>[] {
    let directChildren: TNode<T>[] = this.children
    let relativeChildren: TNode<T>[] = []

    for (let child of directChildren) {
      if (child.exclude) {
        relativeChildren.push(...child.relativeChildren)
      } else {
        relativeChildren.push(child)
      }
    }

    return relativeChildren
  }

  /**
   * Any nodes that descend from this node
   * in the tree structure.
   */
  public get descendants(): TNode<T>[] {
    let descendants: TNode<T>[] = []

    this.children.forEach((child: TNode<T>) => {
      descendants.push(child)
      descendants.push(...child.descendants)
    })

    return descendants
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
   * The first child found in the node's relative children
   * array.
   * @note This is used to determine the first child that
   * is not excluded.
   */
  public get firstRelativeChildNode(): TNode<T> | null {
    return this.relativeChildren.length > 0 ? this.relativeChildren[0] : null
  }

  /**
   * The last child found in the node's relative children
   * array.
   * @note This is used to determine the last child that
   * is not excluded.
   */
  public get lastRelativeChildNode(): TNode<T> | null {
    return this.relativeChildren.length > 0
      ? this.relativeChildren[this.relativeChildren.length - 1]
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
    return !this.opened && !this.force.revealAllNodes
  }

  /**
   * Whether or not this node has been (or at least
   * is expected to be) revealed to the player.
   */
  public get revealed(): boolean {
    const algorithm = (node: TNode<T> = this): boolean => {
      if (!node.parent || this.force.revealAllNodes) return true
      if (node.parent.exclude) algorithm(node.parent)
      return node.parent.opened
    }

    return algorithm()
  }

  /**
   * The revealed structure found in the node, based on the node's
   * descendants that have been revealed.
   */
  public get revealedStructure(): AnyObject {
    /**
     * The recursive algorithm used to determine the structure.
     * @param cursor The current node being processed.
     * @param cursorStructure The structure of the current node being processed.
     */
    const algorithm = (
      cursor: TNode<T> = this,
      cursorStructure: AnyObject = {},
    ): AnyObject => {
      if (cursor.revealed) {
        let { structureKey } = cursor.prototype
        cursorStructure[structureKey] = {}
        for (let child of cursor.children) {
          algorithm(child, cursorStructure[structureKey])
        }
      }

      return cursorStructure
    }

    // Gather details.
    const { root: rootNode } = this.force
    const { prototype: rootPrototype } = rootNode

    // Get the structure of the node.
    const structure = algorithm()

    // If the node is the root node, return the
    // next level of the structure to make sure
    // the root node is not included in the structure.
    if (this._id === rootNode._id) return structure[rootPrototype.structureKey]
    // Otherwise, return the structure as is.
    return structure
  }

  /**
   * The revealed prototypes based on the revealed node structure.
   */
  public get revealedPrototypes(): TPrototype<T>[] {
    // The revealed prototypes.
    let revealedPrototypes: TPrototype<T>[] = []

    /**
     * Recursively finds prototypes from the node structure.
     */
    const findPrototypes = (cursor: AnyObject = this.revealedStructure) => {
      for (let key of Object.keys(cursor)) {
        // Get the child structure.
        let childStructure: AnyObject = cursor[key]
        // Find the prototype data for the current key.
        let prototype = this.mission.prototypes.find(
          ({ structureKey }) => structureKey === key,
        )
        // If the prototype was found, add it to the list.
        if (prototype) revealedPrototypes.push(prototype)
        // Find this prototype's children.
        findPrototypes(childStructure)
      }
    }

    // Find prototypes from the node structure.
    findPrototypes()

    // Return the revealed prototypes.
    return revealedPrototypes
  }

  /**
   * All descendants of the node that are revealed.
   * @note Relies on the `revealed` property of the node.
   */
  get revealedDescendants(): TNode<T>[] {
    return this.descendants.filter((descendant) => descendant.revealed)
  }

  /**
   * All prototypes of the node that are revealed.
   * @note Relies on the `revealed` property of the node.
   */
  get revealedDescendantPrototypes(): TPrototype<T>[] {
    return this.revealedDescendants.map((descendant) => descendant.prototype)
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
    this.actions = new Map<string, TAction<T>>()
    this._exclude = data.exclude ?? MissionNode.DEFAULT_PROPERTIES.exclude
    this._executions = []
    this._opened = data.opened ?? MissionNode.DEFAULT_PROPERTIES.opened
    this._blocked = data.blocked ?? MissionNode.DEFAULT_PROPERTIES.blocked
    this.position = new Vector2D(0, 0)

    // Attempt to get prototype from mission.
    let prototype = this.mission.getPrototype(data.prototypeId)

    // Throw error if prototype not found.
    if (!prototype) throw new Error('Prototype not found.')

    // Set prototype.
    this.prototype = prototype

    // Import action and execution data.
    this.importActions(data.actions ?? MissionNode.DEFAULT_PROPERTIES.actions, {
      populateTargets,
    })
    this.importExecutions(
      data.executions ?? MissionNode.DEFAULT_PROPERTIES.executions,
    )
  }

  /**
   * Imports the action JSON data, storing it in `actions`.
   * @param data The action data to import.
   * @param options The options used to create the actions.
   */
  protected abstract importActions(
    data: TMissionActionJson[],
    options?: TMissionActionOptions,
  ): void

  /**
   * Imports the execution JSON data, storing it in `_executions`.
   * @param data The outcome data to import.
   */
  protected abstract importExecutions(data: TActionExecutionJson[]): void

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
      exclude: this.exclude,
    }

    // Include session-specific data based on exposure level.
    switch (sessionDataExposure.expose) {
      case 'all':
      case 'user-specific':
        // Construct execution JSON.
        let executionJson = this.executions.map((execution) =>
          execution.toJson(),
        )

        // Construct session-specific JSON.
        let sessionJson: TMissionNodeSessionJson = {
          opened: this.opened,
          executions: executionJson,
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
   * @param _id The ID of the execution to retrieve.
   * @returns The execution with the given ID, or `undefined`
   * if no execution with the given ID is found.
   */
  public getExecution(_id: string): TExecution<T> | undefined {
    return this.executions.find((execution) => execution._id === _id)
  }

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
   * Processes an incoming execution that is being performed
   * on the node, appending it to the end of the execution list.
   * @param execution The execution object to process.
   * @throws If the execution is not associated with this node.
   */
  public onExecution(execution: TExecution<T>): void {
    if (execution.nodeId !== this._id) {
      throw new Error(
        `Execution node ID "${execution.nodeId}" does not match node ID "${this._id}".`,
      )
    }
    this._executions.push(execution)
  }

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
      executions: [],
      exclude: false,
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
  /**
   * Determines if this node should be excluded from the node structure.
   * @note This allows for nodes within a force to be hidden from
   * participants during a session.
   */
  exclude: boolean
}

/**
 * Extracts the node type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The node type.
 */
export type TNode<T extends TMetisBaseComponents> = T['node']

/**
 * Session-specific JSON data for a MissionNode object.
 */
export interface TMissionNodeSessionJson {
  opened: boolean
  executions: TActionExecutionJson[]
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
export type TNodeExecutionState =
  | { status: 'unexecuted' }
  | TActionExecutionState

/**
 * Options for the `MissionNode.open` method.
 */
export interface INodeOpenOptions {}

/**
 * Options for the `MissionNode.loadOutcome` method.
 */
export interface ILoadOutcomeOptions {}
