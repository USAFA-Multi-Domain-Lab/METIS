import { TMetisBaseComponents } from 'metis/index'
import { AnyObject } from 'metis/toolbox/objects'
import User from 'metis/users'
import Mission, { TMission, TMissionComponent, TMissionJsonOptions } from '..'
import context from '../../context'
import StringToolbox from '../../toolbox/strings'
import { TMissionNodeJson, TNode } from '../nodes'
import { TPrototype } from '../nodes/prototypes'
import { TOutput, TOutputJson } from './output'

/* -- CLASSES -- */

/**
 * Represents a force in a mission, which is a collection of nodes
 * that are interacted with by a group of participants in a session.
 */
export abstract class MissionForce<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> implements TMissionComponent<T, MissionForce<T>>
{
  /**
   * The mission to which the force belongs.
   */
  public mission: TMission<T>

  /**
   * The ID of the force.
   */
  public _id: string

  /**
   * The introductory message for the mission, displayed
   * when the mission is first started in a session.
   */
  public introMessage: string

  /**
   * The name of the force.
   */
  public name: string

  // Implemented
  public get path(): [...TMissionComponent<any, any>[], this] {
    return [this.mission, this]
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
   * The color of the force.
   */
  public color: string

  /**
   * The amount of resources available to the force at
   * the start of the session.
   */
  public initialResources: number

  /**
   * The current amount of resources available to the force.
   * @note Only relevant when in a session.
   */
  public resourcesRemaining: number

  /**
   * Whether or not to reveal all nodes in the force.
   */
  public revealAllNodes: boolean

  /**
   * The nodes in the force.
   */
  public nodes: TNode<T>[]

  /**
   * The root node of the force.
   */
  public root: TNode<T>

  /**
   * The revealed structure found in the force, based on the nodes
   * that have been opened.
   */
  public get revealedStructure(): AnyObject {
    /**
     * The recursive algorithm used to determine the structure.
     * @param cursor The current prototype being processed.
     * @param cursorStructure The structure of the current prototype being processed.
     */
    const algorithm = (
      cursor: TNode<T> = this.root,
      cursorStructure: AnyObject = {},
    ): AnyObject => {
      if (cursor.revealed) {
        for (let child of cursor.children) {
          if (child.hasChildren) {
            cursorStructure[child.prototype.structureKey] = algorithm(child)
          } else {
            cursorStructure[child.prototype.structureKey] = {}
          }
        }
      }
      return cursorStructure
    }

    // Return the result of the operation.
    return algorithm()
  }

  /**
   * The revealed prototypes in the force based on the revealed structure and
   * the nodes that have been opened.
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
        if (prototype) {
          revealedPrototypes.push(prototype)
        }
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
   * @param mission The mission to which the force belongs.
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   * @param options The options for creating the force.
   */
  public constructor(
    mission: TMission<T>,
    data: Partial<TMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
  ) {
    // Set properties.
    this.mission = mission
    this._id = data._id ?? MissionForce.DEFAULT_PROPERTIES._id
    this.introMessage =
      data.introMessage ?? MissionForce.DEFAULT_PROPERTIES.introMessage
    this.name = data.name ?? MissionForce.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionForce.DEFAULT_PROPERTIES.color
    this.initialResources =
      data.initialResources ?? MissionForce.DEFAULT_PROPERTIES.initialResources
    this.revealAllNodes =
      data.revealAllNodes ?? MissionForce.DEFAULT_PROPERTIES.revealAllNodes
    this.resourcesRemaining = data.resourcesRemaining ?? this.initialResources
    this.nodes = []
    this._outputs = []
    this.root = this.createNode(MissionForce.ROOT_NODE_PROPERTIES)

    // Import nodes into the force.
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
      initialResources: this.initialResources,
      revealAllNodes: this.revealAllNodes,
      nodes: this.exportNodes(options),
      filterOutputs: (userId) => {
        json.outputs = this.filterOutputs(userId).map((output) =>
          output.toJson(),
        )
      },
    }

    /**
     * Includes `resourcesRemaining` in the JSON.
     */
    const addResourcesRemaining = () => {
      json.resourcesRemaining = this.resourcesRemaining
    }

    /**
     * Adds the outputs to the JSON.
     */
    const addOutputs = (userId?: User['_id']) => {
      if (userId) {
        json.outputs = this.filterOutputs(userId).map((output) =>
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
        addResourcesRemaining()
        addOutputs()
        break
      case 'user-specific':
        addResourcesRemaining()
        addOutputs(sessionDataExposure.userId)
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
   * This will create a new node in the force with the given data and options.
   * Any data or options not provided will be set to default values.
   * @param data The data for the node.
   * @param options The options for creating the node.
   */
  protected abstract createNode(data: Partial<TMissionNodeJson>): TNode<T>

  /**
   * Filter the outputs based on the conditions of the output and the current user.
   * @param userId The ID of the user for which to filter the outputs.
   * @returns The filtered outputs.
   */
  public abstract filterOutputs(userId?: User['_id']): TOutput<T>[]

  /**
   * Stores an output in the force which is then displayed
   * in the force's output panel.
   * @param output The output to store.
   */
  public abstract storeOutput(output: TOutput<T>): void

  /**
   * Modifies the resource pool.
   * @param operand The amount by which to modify the resource pool.
   */
  public abstract modifyResourcePool(operand: number): void

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
      if (currentOutput.time < newOutput.time) {
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
  public static get DEFAULT_PROPERTIES(): Required<TMissionForceSaveJson> {
    return {
      _id: StringToolbox.generateRandomId(),
      introMessage: '<p>Welcome to your force!</p>',
      name: 'New Force',
      color: '#ffffff',
      initialResources: 100,
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
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Enemy Force',
        color: Mission.RED,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Guerrilla Force',
        color: Mission.YELLOW,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Local National Force',
        color: Mission.GREEN,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'White Cell',
        color: Mission.WHITE,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Non-State Actors',
        color: Mission.BROWN,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Coalition Force',
        color: Mission.PURPLE,
      },
      {
        ...MissionForce.DEFAULT_PROPERTIES,
        name: 'Civilian Industry',
        color: Mission.MAGENTA,
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
   * The amount of resources available to the student at the start of the mission.
   */
  initialResources: number
  /**
   * Whether or not to reveal all nodes in the force.
   */
  revealAllNodes: boolean
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
   * The resources remaining for the force.
   */
  resourcesRemaining: number
  /**
   * The outputs for a force's output panel.
   */
  outputs: TOutputJson[]
  /**
   * Updates the outputs in the JSON, only including
   * the outputs that are relevant to the given user.
   * @param userId The ID of the user for which to filter the outputs.
   */
  filterOutputs: (userId?: User['_id']) => void
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
export type TForceJsonOptions = Omit<TMissionJsonOptions, 'idExposure'>

/**
 * Options for the MissionForce.exportNodes method.
 */
export type TExportNodesOptions = TForceJsonOptions

/**
 * Extracts the force type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The force type.
 */
export type TForce<T extends TMetisBaseComponents> = T['force']
