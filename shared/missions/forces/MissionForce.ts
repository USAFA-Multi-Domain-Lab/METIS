import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { context } from '../../context'
import { Mission, type TMission, type TMissionJsonOptions } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import type { TMissionNodeJson, TNode } from '../nodes/MissionNode'
import type { TPrototype } from '../nodes/MissionPrototype'
import type { NodeAlert } from '../nodes/NodeAlert'
import type { TOutput, TOutputJson } from './MissionOutput'
import { ResourcePool, type TResourcePoolJson } from './ResourcePool'

/**
 * Represents a force in a mission, which is a collection of nodes
 * that are interacted with by a group of participants in a session.
 */
export abstract class MissionForce<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, MissionForce<T>> {
  /**
   * @see {@link MissionComponent.mission}
   */
  protected _mission: TMission<T>
  // Implemented
  public get mission(): TMission<T> {
    return this._mission
  }

  /**
   * The introductory message for the mission, displayed
   * when the mission is first started in a session.
   */
  public introMessage: string

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [this.mission, this]
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return MissionForce.consolidateIssues(...this.nodes)
  }

  /**
   * The color of the force.
   */
  public color: string

  /**
   * The resource pools for this force, each corresponding to
   * a resource defined in the parent mission.
   */
  public resourcePools: JsonSerializableArray<T['resourcePool']>

  /**
   * The subset of {@link resourcePools} that are not excluded from this force.
   */
  public get includedPools(): T['resourcePool'][] {
    return this.resourcePools.filter((pool) => !pool.excluded)
  }

  /**
   * Whether or not to reveal all nodes in the force.
   */
  public revealAllNodes: boolean

  /**
   * A key for the force, used to identify it within the mission.
   */
  public localKey: string

  /**
   * The nodes in the force.
   */
  public nodes: T['node'][]

  /**
   * The root node of the force.
   */
  public root: T['node']

  /**
   * The revealed structure found in the force, based on the node's
   * descendants that have been revealed.
   */
  public get revealedStructure(): TAnyObject {
    return this.root.revealedStructure
  }

  /**
   * The revealed prototypes based on the revealed node structure.
   */
  public get revealedPrototypes(): TPrototype<T>[] {
    return this.root.revealedPrototypes
  }

  /**
   * The outputs for the force's output panel.
   */
  protected _outputs: TOutput<T>[]
  /**
   * The outputs for the force's output panel.
   */
  public get outputs(): TOutput<T>[] {
    return this._outputs
  }

  /**
   * The prefix to display for an output sent by this
   * force.
   */
  public get outputPrefix(): string {
    return `${this.name.replaceAll(' ', '-')}:`
  }

  /**
   * The list of all pending alerts for nodes within the force.
   */
  public get pendingAlerts(): NodeAlert[] {
    let alerts: NodeAlert[] = []
    for (let node of this.nodes) {
      alerts.push(...node.pendingAlerts)
    }
    return alerts
  }

  /**
   * Whether there are any nodes within the force that have
   * pending alerts.
   */
  public get hasPendingAlerts(): boolean {
    return this.nodes.some((node) => node.hasPendingAlerts)
  }

  /**
   * The next pending alert of highest priority in the force that
   * has not yet been acknowledged.
   */
  public get nextPendingAlert(): NodeAlert | null {
    let result: NodeAlert | null = null

    for (let node of this.nodes) {
      let alert = node.nextPendingAlert
      if (!alert) continue

      // Even if another alert has already been found,
      // if one of higher severity is found, it should
      // be prioritized.
      if (!result || alert.severityLevelNumber > result.severityLevelNumber) {
        result = alert
      }
    }

    return result
  }

  /**
   * @param mission The mission to which the force belongs.
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   */
  public constructor(
    mission: TMission<T>,
    data: Partial<TMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
  ) {
    super(
      data._id ?? MissionForce.DEFAULT_PROPERTIES._id,
      data.name ?? MissionForce.DEFAULT_PROPERTIES.name,
      false,
    )

    // Set properties.
    this._mission = mission
    this.introMessage =
      data.introMessage ?? MissionForce.DEFAULT_PROPERTIES.introMessage
    this.color = data.color ?? MissionForce.DEFAULT_PROPERTIES.color
    this.revealAllNodes =
      data.revealAllNodes ?? MissionForce.DEFAULT_PROPERTIES.revealAllNodes
    this.localKey = data.localKey ?? mission.generateForceKey()
    this.resourcePools = new JsonSerializableArray()
    this.nodes = []
    this._outputs = []
    this.root = this.createNode(MissionForce.ROOT_NODE_PROPERTIES)

    // Import resource pools and nodes into the force.

    this.importPools(
      data.resourcePools ?? MissionForce.DEFAULT_PROPERTIES.resourcePools,
    )
    this.importNodes(data.nodes ?? MissionForce.DEFAULT_PROPERTIES.nodes)
  }

  /**
   * Converts the force to JSON.
   * @param options The options for converting the force to JSON.
   * @returns The JSON for the force.
   */
  public toJson(options: TForceJsonOptions = {}): TMissionForceJson {
    let { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options
    let json: TMissionForceJson = {
      _id: this._id,
      introMessage: this.introMessage,
      name: this.name,
      color: this.color,
      revealAllNodes: this.revealAllNodes,
      localKey: this.localKey,
      nodes: this.exportNodes(options),
      resourcePools: this.resourcePools.serialize(options),
      filterOutputs: (memberId) => {
        json.outputs = this.filterOutputs(memberId).map((output) =>
          output.toJson(),
        )
      },
    }

    /**
     * Adds the outputs to the JSON.
     * @param memberId The ID of the member for which to filter the outputs.
     */
    const addOutputs = (memberId?: string) => {
      if (memberId) {
        json.outputs = this.filterOutputs(memberId).map((output) =>
          output.toJson(),
        )
      } else {
        json.outputs = this.outputs.map((output) => output.toJson())
      }
    }

    // Expose force-level session data based on
    // the options provided.
    switch (sessionDataExposure.expose) {
      case 'all':
        addOutputs()
        break
      case 'member-specific':
        addOutputs(sessionDataExposure.memberId)
        break
      case 'none':
        break
    }

    return json
  }

  /**
   * Exports the nodes to JSON.
   * @param options Options for exporting the nodes.
   * @returns The exported node data and structure.
   */
  protected exportNodes(options: TExportNodesOptions = {}): TMissionNodeJson[] {
    // Gather details.
    const { forceExposure = Mission.DEFAULT_FORCE_EXPOSURE } = options
    let nodes: TNode<T>[]

    // Determine which nodes to export based on the
    // force exposure
    switch (forceExposure.expose) {
      case 'all':
      case 'force-with-all-nodes':
        nodes = [...this.nodes]
        break
      case 'force-with-revealed-nodes':
        nodes = this.nodes.filter((node) => node.revealed)
        break
      case 'none':
      default:
        nodes = []
        break
    }

    // Convert nodes to JSON and return.
    return nodes.map((node) => node.toJson(options))
  }

  /**
   * Generates a new key for a resource pool.
   * @returns The new key for the pool.
   */
  public generatePoolKey(): string {
    let newKey: number = 0

    for (let pool of this.resourcePools) {
      let poolKey: number = Number(pool.localKey)
      if (poolKey > newKey) newKey = Math.max(newKey, poolKey)
    }

    newKey++
    return String(newKey)
  }

  /**
   * Generates a new key for the node.
   * @returns The new key for the node.
   */
  public generateNodeKey(): string {
    // Initialize
    let newKey: number = 0

    for (let node of this.nodes) {
      let nodeKey: number = Number(node.localKey)
      // If the node has a key, and it is greater than the current
      // new key, set the new key to the node's key.
      if (nodeKey > newKey) newKey = Math.max(newKey, nodeKey)
    }

    // Increment the new key by 1 and return it as a string.
    newKey++
    return String(newKey)
  }

  /**
   * This will create a new node in the force with the given data and options.
   * Any data or options not provided will be set to default values.
   * @param data The data for the node.
   * @param options The options for creating the node.
   */
  protected abstract createNode(data: Partial<TMissionNodeJson>): TNode<T>

  /**
   * Filter the outputs based on the conditions of the output and the current member.
   * @param memberId The ID of the member for which to filter the outputs.
   * @returns The filtered outputs.
   */
  public abstract filterOutputs(memberId?: string): TOutput<T>[]

  /**
   * Stores an output in the force which is then displayed
   * in the force's output panel.
   * @param output The output to store.
   */
  public abstract storeOutput(output: TOutput<T>): void

  /**
   * Callback for when a resource pool in the force is modified by
   * an effect. This will be called from a pool.
   * @note Override this to add callback logic. By default, this has
   * no logic.
   */
  public onModifyPool(pool: T['resourcePool']): void {}

  /**
   * Gets the resource pool instance for the given resource ID.
   * @param resourceId The ID of the {@link TResource} to retrieve the pool for.
   * @returns The resource pool instance, or undefined if not found.
   */
  public getPoolByResourceId(
    resourceId: string,
  ): T['resourcePool'] | undefined {
    return this.resourcePools.find(
      (instance) => instance.resourceId === resourceId,
    )
  }

  /**
   * @param nodeId The ID of the node to retrieve.
   * @returns The node with the given ID, or undefined
   * if not found.
   */
  public getNode(nodeId: string): TNode<T> | undefined {
    if (nodeId === this.root._id) return this.root
    else return this.nodes.find((node) => node._id === nodeId)
  }

  /**
   * @param prototypeId The ID of the prototype to retrieve.
   * @returns The node with the given prototype ID, or undefined
   * if not found.
   */
  public getNodeFromPrototype(prototypeId: string): TNode<T> | undefined {
    if (prototypeId === this.mission.root._id) return this.root
    else return this.nodes.find((node) => node.prototype._id === prototypeId)
  }

  /**
   * Imports resource pool data into the force, creating {@link ResourcePool} objects from it.
   * @param data The raw resource pool data to import.
   */
  protected importPools(data: TResourcePoolJson[]): void {
    try {
      this.resourcePools.push(...ResourcePool.fromJson(this, data))
    } catch (error) {
      if (context === 'react') {
        console.error('Resource pool data passed is invalid.')
      }
      throw error
    }
  }

  /**
   * This will import raw node data into the mission, creating MissionNode objects from it, and mapping the relationships found in the structure.
   * @param data The raw node data to import.
   * @param options The options for importing the nodes.
   */
  protected importNodes(data: TMissionNodeJson[]): void {
    try {
      // Loop through data, spawn new nodes,
      // and add them to the nodes map.
      for (let datum of data) {
        this.nodes.push(this.createNode(datum))
      }
    } catch (error) {
      if (context === 'react') {
        console.error('Node data/structure passed is invalid.')
      }
      throw error
    }
  }

  /**
   * Finds the index where the output should be inserted based on the time.
   * @param newOutput The new output to insert.
   * @returns The index where the output should be inserted.
   */
  protected findInsertionIndex(newOutput: TOutput<T>): number {
    // The low and high bounds for the binary search.
    let low: number = 0
    let high: number = this._outputs.length

    // While the low bound is less than the high bound,
    // find the middle index and compare the time of the
    // current output to the new output.
    while (low < high) {
      // Find the middle index.
      let mid: number = Math.floor((low + high) / 2)
      // Get the current output.
      let currentOutput = this._outputs[mid]

      // Compare the time of the current output to the new output.
      if (currentOutput.time <= newOutput.time) {
        // If the time of the current output is less than the new output,
        // set the low bound to the middle index plus one.
        low = mid + 1
      } else {
        // Otherwise, set the high bound to the middle index.
        high = mid
      }
    }

    // Return the low bound.
    return low
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): TMissionForceDefaultJson {
    return {
      _id: StringToolbox.generateRandomId(),
      introMessage: '<p>Welcome to your force!</p>',
      name: 'New Force',
      color: '#ffffff',
      resourcePools: [],
      revealAllNodes: false,
      nodes: [],
    }
  }

  /**
   * The maximum length allowed for a force's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

  /**
   * The default properties for the root node of a Force.
   */
  public static readonly ROOT_NODE_PROPERTIES: TMissionNodeJson = {
    _id: 'ROOT',
    localKey: 'ROOT',
    prototypeId: 'ROOT',
    name: 'ROOT',
    color: '#000000',
    description:
      'Invisible node that is the root of all other nodes in the force.',
    preExecutionText: 'N/A',
    executable: false,
    device: false,
    actions: [],
    opened: true,
    exclude: false,
    initiallyBlocked: false,
  }

  /**
   * Default forces for a mission.
   */
  public static get DEFAULT_FORCES(): TMissionForceJson[] {
    return [
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Friendly Force',
        color: Mission.BLUE,
        localKey: '1',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Enemy Force',
        color: Mission.RED,
        localKey: '2',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Guerrilla Force',
        color: Mission.YELLOW,
        localKey: '3',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Local National Force',
        color: Mission.GREEN,
        localKey: '4',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'White Cell',
        color: Mission.WHITE,
        localKey: '5',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Non-State Actors',
        color: Mission.BROWN,
        localKey: '6',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Coalition Force',
        color: Mission.PURPLE,
        localKey: '7',
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Civilian Industry',
        color: Mission.MAGENTA,
        localKey: '8',
      },
    ]
  }
}

/* -- TYPES -- */

/**
 * Session-agnostic JSON representation of a MissionForce object
 * which can be saved to a database.
 */
export interface TMissionForceSaveJson {
  /**
   * The ID of the force.
   */
  _id: string
  /**
   * The introductory message for the mission, displayed when the mission is first started in a session.
   */
  introMessage: string
  /**
   * The name of the force.
   */
  name: string
  /**
   * The color of the force.
   */
  color: string
  /**
   * The resource pools for this force, each corresponding to a
   * resource defined in the parent mission.
   */
  resourcePools: TResourcePoolJson[]
  /**
   * Whether or not to reveal all nodes in the force.
   */
  revealAllNodes: boolean
  /**
   * A key for the force, used to identify it within the mission.
   */
  localKey: string
  /**
   * The nodes in the force.
   */
  nodes: TMissionNodeJson[]
}

/**
 * Session-specific JSON data for a MissionForce object.
 */
export interface TMissionForceSessionJson {
  /**
   * The outputs for a force's output panel.
   */
  outputs: TOutputJson[]
  /**
   * Updates the outputs in the JSON, only including
   * the outputs that are relevant to the given member.
   * @param memberId The ID of the member for which to filter the outputs.
   */
  filterOutputs: (memberId?: string) => void
}

/**
 * Plain JSON representation of a MissionForce object.
 * Type built from TMissionForceJsonBase and TMissionForceSessionJson,
 * with all properties from TMissionForceSessionJson being partial.
 */
export type TMissionForceJson = TMissionForceSaveJson &
  Partial<TMissionForceSessionJson>

/**
 * Options for converting a MissionForce to JSON.
 * @inheritdoc TMissionJsonOptions
 */
export type TForceJsonOptions = Omit<
  TMissionJsonOptions,
  'idExposure' | 'fileExposure'
>

/**
 * Options for the MissionForce.exportNodes method.
 */
export type TExportNodesOptions = TForceJsonOptions

/**
 * The default properties for a MissionForce object.
 * @inheritdoc TMissionForceSaveJson
 */
export type TMissionForceDefaultJson = Required<
  Omit<TMissionForceSaveJson, 'localKey'>
>

/**
 * Extracts the force type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The force type.
 */
export type TForce<T extends TMetisBaseComponents> = T['force']
