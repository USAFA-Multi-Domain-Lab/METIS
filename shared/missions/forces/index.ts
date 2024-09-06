import { AnyObject } from 'metis/toolbox/objects'
import Mission, { TCommonMission, TCommonMissionTypes, TMission } from '..'
import context from '../../context'
import StringToolbox from '../../toolbox/strings'
import {
  TCommonMissionNode,
  TCommonMissionNodeJson,
  TMissionNodeJson,
  TMissionNodeOptions,
  TNode,
} from '../nodes'
import { TCommonOutput, TOutput } from './output'

/* -- CLASSES -- */

/**
 * Represents a force in a mission, which is a collection of nodes
 * that are interacted with by a group of participants in a session.
 */
export abstract class MissionForce<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonMissionForce
{
  // Implemented
  public mission: TMission<T>

  /**
   * The ID of the force.
   */
  public _id: string

  /**
   * The name of the force.
   */
  public name: string

  /**
   * The color of the force.
   */
  public color: string

  // Implemented
  public initialResources: number

  // Implementd
  public resourcesRemaining: number

  /**
   * The nodes in the force.
   */
  public nodes: TNode<T>[]

  /**
   * The root node of the force.
   */
  public root: TNode<T>

  // Implemented
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
      if (cursor.isOpen) {
        for (let child of cursor.children) {
          if (child.hasChildren) {
            cursorStructure[child.structureKey] = algorithm(child)
          } else {
            cursorStructure[child.structureKey] = {}
          }
        }
      }
      return cursorStructure
    }
    let structure = algorithm()

    // Return the result of the operation.
    return algorithm()
  }

  /**
   * The outputs for the force's output panel.
   */
  protected _outputs: TOutput<T>[]
  // Implemented
  public get outputs(): TOutput<T>[] {
    return this._outputs
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
    options: TMissionForceOptions = {},
  ) {
    // Parse options.
    const {
      openAll = false,
      populateTargets = false,
      sendIntroMessage = false,
    } = options

    // Set properties.
    this.mission = mission
    this._id = data._id ?? MissionForce.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionForce.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionForce.DEFAULT_PROPERTIES.color
    this.initialResources =
      data.initialResources ?? MissionForce.DEFAULT_PROPERTIES.initialResources
    this.resourcesRemaining = data.resourcesRemaining ?? this.initialResources
    this.nodes = []
    this._outputs = data.outputs ?? []
    this.root = this.createNode(MissionForce.ROOT_NODE_PROPERTIES)

    // Import nodes into the force.
    this.importNodes(data.nodes ?? MissionForce.DEFAULT_PROPERTIES.nodes, {
      openAll,
      populateTargets,
    })

    // If root node is not open, open it.
    if (!this.root.isOpen) {
      this.root.open()
    }

    // Send the intro message if the flag is set.
    if (sendIntroMessage) {
      this.sendOutput({
        _id: StringToolbox.generateRandomId(),
        forceId: this._id,
        time: Date.now(),
        type: 'intro-message',
        introMessage: this.mission.introMessage,
      })
    }
  }

  // Implemented
  public toJson(options: TForceJsonOptions = {}): TMissionForceJson {
    let { revealedOnly = false, includeSessionData = false } = options

    let json: TMissionForceJson = {
      _id: this._id,
      name: this.name,
      color: this.color,
      initialResources: this.initialResources,
      nodes: this.exportNodes({ revealedOnly, includeSessionData }),
    }

    // Include session data if includeSessionData
    // flag was set.
    if (includeSessionData) {
      json.resourcesRemaining = this.resourcesRemaining
      json.outputs = this.outputs
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
    const { revealedOnly = false, includeSessionData = false } = options
    let nodes: TNode<T>[] = this.nodes
    let nodeData: TMissionNodeJson[] = []

    // Apply filter if revealedOnly flag
    // is set.
    if (revealedOnly) {
      nodes = nodes.filter((node: TNode<T>) => node.revealed)
    }

    // Construct node data.
    nodeData = nodes.map((node: TNode<T>) =>
      node.toJson({ includeSessionData: includeSessionData }),
    )

    // Return the exported node data.
    return nodeData
  }

  /**
   * This will create a new node in the force with the given data and options.
   * Any data or options not provided will be set to default values.
   * @param data The data for the node.
   * @param options The options for creating the node.
   */
  protected abstract createNode(
    data: Partial<TMissionNodeJson>,
    options?: TMissionNodeOptions,
  ): TNode<T>

  // Implemented
  public abstract sendOutput(output: TCommonOutput): void

  // Implemented
  public getNode(nodeId: string): TNode<T> | undefined {
    if (nodeId === this.root._id) return this.root
    else return this.nodes.find((node) => node._id === nodeId)
  }

  // Implemented
  public getNodeFromPrototype(prototypeId: string): TNode<T> | undefined {
    if (prototypeId === this.mission.root._id) return this.root
    else return this.nodes.find((node) => node.prototype._id === prototypeId)
  }

  /**
   * This will import raw node data into the mission, creating MissionNode objects from it, and mapping the relationships found in the structure.
   * @param nodeData The raw node data to import. The originalNodeData property will be updated to this value.
   * @param nodeStructure The raw node structure to import. The originalNodeStructure property will be updated to this value.
   */
  protected importNodes(
    data: TMissionNodeJson[],
    options: TNodeImportOptions = {},
  ): void {
    try {
      // Parse options.
      const { openAll, populateTargets } = options

      // Loop through data, spawn new nodes,
      // and add them to the nodes map.
      for (let datum of data) {
        // Set node as open, if openAll is marked.
        if (openAll) datum.opened = true

        this.nodes.push(this.createNode(datum, { populateTargets }))
      }
    } catch (error) {
      if (context === 'react') {
        console.error('Node data/structure passed is invalid.')
      }
      throw error
    }
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionForceJson> {
    return {
      _id: StringToolbox.generateRandomId(),
      name: 'New Force',
      color: '#ffffff',
      initialResources: 100,
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
    structureKey: 'ROOT',
    name: 'ROOT',
    color: '#000000',
    description:
      'Invisible node that is the root of all other nodes in the force.',
    preExecutionText: 'N/A',
    depthPadding: 0,
    executable: false,
    device: false,
    actions: [],
    opened: true,
  }

  /**
   * Default forces for a mission.
   */
  public static get DEFAULT_FORCES(): TCommonMissionForceJson[] {
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
 * Interface of the abstract MissionForce class.
 * @note Any public, non-static properties and functions of the Force
 * class must first be defined here for them to be accessible to the
 * Mission, MissionNode, and MissionAction classes.
 */
export interface TCommonMissionForce {
  /**
   * The mission to which the force belongs.
   */
  mission: TCommonMission
  /**
   * The ID of the force.
   */
  _id: string
  /**
   * The name of the force.
   */
  name: string
  /**
   * The color of the force.
   */
  color: string
  /**
   * The amount of resources available to the force at
   * the start of the session.
   */
  initialResources: number
  /**
   * The nodes in the force.
   */
  nodes: TCommonMissionNode[]
  /**
   * The root node of the force.
   */
  root: TCommonMissionNode
  /**
   * The current amount of resources available to the force.
   * @note Only relevant when in a session.
   */
  resourcesRemaining: number
  /**
   * The revealed structure found in the force, based on the nodes
   * that have been opened.
   */
  get revealedStructure(): AnyObject
  /**
   * The outputs for the force's output panel.
   */
  get outputs(): TCommonOutput[]
  /**
   * Converts the force to JSON.
   * @param options The options for converting the force to JSON.
   * @returns the JSON for the force.
   */
  toJson: (options?: TForceJsonOptions) => TCommonMissionForceJson
  /**
   * Gets a node from the given node ID.
   */
  getNode(nodeId: string | undefined): TCommonMissionNode | undefined
  /**
   * Gets a node from the given prototype ID.
   */
  getNodeFromPrototype(
    prototypeId: string | undefined,
  ): TCommonMissionNode | undefined
  /**
   * Sends a message to the output panel.
   * @param output The output to send.
   */
  sendOutput(output: TCommonOutput): void
}

/**
 * Session-agnostic JSON representation of a MissionNode object.
 */
export interface TCommonMissionForceJson {
  /**
   * The ID of the force.
   */
  _id: string
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
   * The nodes in the force.
   */
  nodes: TCommonMissionNodeJson[]
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
  outputs: TCommonOutput[]
}

/**
 * Plain JSON representation of a MissionForce object.
 * Type built from TCommonMissionForceJson and TMissionForceSessionJSON,
 * with all properties from TMissionNodeSessionJSON being partial.
 */
export type TMissionForceJson = TCommonMissionForceJson &
  Partial<TMissionForceSessionJson>

/**
 * Options for creating a MissionForce object.
 */
export type TMissionForceOptions = {
  /**
   * Whether or not to force open all nodes.
   * @default false
   */
  openAll?: boolean
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
  /**
   * Whether to send the intro message to the output panel.
   */
  sendIntroMessage?: boolean
}

/**
 * Options for converting a MissionForce to JSON.
 */
export type TForceJsonOptions = {
  /**
   * Whether or not to only include revealed nodes.
   * @default false
   */
  revealedOnly?: boolean
  /**
   * Whether or not to include session data.
   * @default false
   */
  includeSessionData?: boolean
}

/**
 * Options for MissionForce.importNodes.
 */
export type TNodeImportOptions = {
  /**
   * Whether or not to force open the newly created nodes.
   * @default false
   */
  openAll?: boolean
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
}

/**
 * Options for the MissionForce.exportNodes method.
 */
export type TExportNodesOptions = {
  /**
   * Whether to exclude non-revealed nodes in the export.
   * @default false
   */
  revealedOnly?: boolean
  /**
   * Whether or not to include session-specific data in the export.
   * @default false
   */
  includeSessionData?: boolean
}

/**
 * Options for MissionForce.mapRelationships.
 */
export type TMapRelationshipOptions = {
  /**
   * Whether or not to force open all nodes.
   * @default false
   */
  openAll?: boolean
}

/**
 * Extracts the force type from the mission types.
 * @param T The mission types.
 * @returns The force type.
 */
export type TForce<T extends TCommonMissionTypes> = T['force']
