import { v4 as generateHash } from 'uuid'
import context from '../context'
import { AnyObject } from '../toolbox/objects'
import { uuidTypeValidator } from '../toolbox/validators'
import { TCommonMissionForceJson } from './forces'
import {
  TCommonMissionNode,
  TMissionNodeJson,
  TMissionNodeOptions,
} from './nodes'
import {
  TCommonMissionPrototype,
  TMissionPrototypeOptions,
} from './nodes/prototypes'

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<
  TMissionPrototype extends TCommonMissionPrototype,
  TMissionNode extends TCommonMissionNode,
> implements TCommonMission
{
  // Implemented
  public _id: string
  // Implemented
  public name: string
  // Implemented
  public introMessage: string
  // Implemented
  public versionNumber: number
  // Implemented
  public initialResources: number
  // Implemented
  public nodes: TMissionNode[]
  // Implemented
  public prototypes: TMissionPrototype[]
  // Implemented
  public seed: string
  // Implemented
  public rootNode: TMissionNode
  // Implemented
  public rootPrototype: TMissionPrototype
  /**
   * The original raw data for the nodes in the mission, before any changes.
   */
  protected originalNodeData: TMissionNodeJson[]
  /**
   * The original tree structure of the mission nodes, before any changes.
   */
  protected originalNodeStructure: AnyObject

  /**
   * @param data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data: Partial<TCommonMissionJson> = Mission.DEFAULT_PROPERTIES,
    options: TMissionOptions = {},
  ) {
    this._id = data._id?.toString() ?? Mission.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Mission.DEFAULT_PROPERTIES.name
    this.introMessage =
      data.introMessage ?? Mission.DEFAULT_PROPERTIES.introMessage
    this.versionNumber =
      data.versionNumber ?? Mission.DEFAULT_PROPERTIES.versionNumber
    this.initialResources =
      data.initialResources ?? Mission.DEFAULT_PROPERTIES.initialResources
    this.seed = data.seed ?? Mission.DEFAULT_PROPERTIES.seed
    this.originalNodeStructure =
      data.nodeStructure ?? Mission.DEFAULT_PROPERTIES.nodeStructure
    this.originalNodeData = data.forces
      ? data.forces[0].nodes
      : Mission.DEFAULT_PROPERTIES.forces[0].nodes
    this.nodes = []
    this.prototypes = []
    this.rootNode = this.createRootNode()
    this.rootPrototype = this.createRootPrototype()

    // Parse options.
    let { openAll = false } = options

    // Import nodes into the mission.
    this.importNodes(this.originalNodeData, this.originalNodeStructure, {
      openAll,
    })

    // Import node structure into the mission.
    this.importStructure(this.originalNodeStructure)

    // If root node is not open, open it.
    if (!this.rootNode.isOpen) {
      this.rootNode.open()
    }
  }

  // Implemented
  public toJson(options: TMissionJsonOptions = {}): TCommonMissionJson {
    let {
      revealedOnly = false,
      includeSessionData: includeSessionData = false,
    } = options

    let json: TCommonMissionJson = {
      name: this.name,
      introMessage: this.introMessage,
      versionNumber: this.versionNumber,
      initialResources: this.initialResources,
      seed: this.seed,
      ...this.exportNodes({ revealedOnly, includeSessionData }),
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

    return json
  }

  /**
   * Creates a new node that is the root node of the mission structure. This node is not added to the mission's nodes map, as it is really a pseudo-node.
   * @deprecated
   */
  protected abstract createRootNode(): TMissionNode

  /**
   * Creates a new prototype that is the root prototype of the mission structure.
   * This prototype is not added to the mission's prototypes map, as it is really
   * a pseudo-prototype.
   */
  protected abstract createRootPrototype(): TMissionPrototype

  /**
   * This will import raw node data into the mission, creating MissionNode objects from it, and mapping the relationships found in the structure.
   * @param nodeData The raw node data to import. The originalNodeData property will be updated to this value.
   * @param nodeStructure The raw node structure to import. The originalNodeStructure property will be updated to this value.
   * @deprecated
   */
  protected importNodes(
    nodeData: TMissionNodeJson[],
    nodeStructure: AnyObject,
    options: TNodeImportOptions = {},
  ): void {
    // Reinitialize relevant object properties.
    this.originalNodeData = nodeData
    this.originalNodeStructure = nodeStructure

    try {
      // Loop through data, spawn new nodes,
      // and add them to the nodes map.
      for (let nodeDatum of nodeData) {
        this.spawnNode(nodeDatum)
      }

      // Create a node map to pass to the mapRelationships function.
      let nodeMap = new Map<string, TMissionNode>()

      // Add nodes to the node map.
      for (let node of this.nodes) {
        nodeMap.set(node.structureKey, node)
      }

      // Map relationships between nodes.
      Mission.mapNodeRelationships(
        nodeMap,
        nodeStructure,
        this.rootNode,
        options,
      )

      // Convert nodes map to array.
      this.nodes = Array.from(nodeMap.values())
    } catch (error) {
      if (context === 'react') {
        console.error('Node data/structure passed is invalid.')
      }
      throw error
    }
  }

  /**
   * This will import the node structure into the mission, creating
   * MissionPrototype objects from it, and mapping the relationships
   * found in the structure.
   * @param nodeStructure The raw node structure to import. The originalNodeStructure property
   * will be updated to this value.
   */
  protected importStructure(nodeStructure: AnyObject): void {
    // Reinitialize relevant object property.
    this.originalNodeStructure = nodeStructure

    try {
      /**
       * Recursively spawns prototypes from the node structure.
       */
      const spawnPrototypes = (cursor: AnyObject = nodeStructure) => {
        for (let key of Object.keys(cursor)) {
          let childStructure: AnyObject = cursor[key]
          this.spawnPrototype(key)
          spawnPrototypes(childStructure)
        }
      }

      // Spawn prototypes from the node structure.
      spawnPrototypes(nodeStructure)

      // Create a prototype map to pass to the mapRelationships function.
      let prototypeMap = new Map<string, TMissionPrototype>()

      // Add prototypes to the prototype map.
      for (let prototype of this.prototypes) {
        prototypeMap.set(prototype._id, prototype)
      }

      // Map relationships between prototypes.
      Mission.mapRelationships(prototypeMap, nodeStructure, this.rootPrototype)

      // Convert prototypes map to array.
      this.prototypes = Array.from(prototypeMap.values())
    } catch (error) {
      if (context === 'react') {
        console.error('Node structure passed is invalid.')
      }
      throw error
    }
  }

  /**
   * Exports the nodes map into its raw data and structure.
   * @param {TExportNodesOptions} options Options for exporting the nodes.
   * @returns {TExportedNodes<TMissionNode>} The exported node data and structure.
   */
  protected exportNodes(options: TExportNodesOptions = {}): TExportedNodes {
    // Get root node.
    let rootNode: TMissionNode | null = this.rootNode

    // Throw error if root node is null.
    if (rootNode === null) {
      throw new Error('Cannot export nodes: Mission has no root node.')
    }

    // Extract options.
    let {
      revealedOnly = false,
      includeSessionData: includeSessionData = false,
    } = options

    // Create an array of the MissionNode
    // objects from the nodes map.
    let nodes: TMissionNode[] = this.nodes
    // Predefine the node data and structure.
    let nodeData: TMissionNodeJson[] = []
    let nodeStructure: AnyObject = {}

    // Apply filter if revealedOnly flag
    // is set.
    if (revealedOnly) {
      nodes = nodes.filter((node: TMissionNode) => node.revealed)
    }

    // Construct node data.
    nodeData = nodes.map((node: TMissionNode) =>
      node.toJson({ includeSessionData: includeSessionData }),
    )

    // Construct node structure.
    nodeStructure = Mission.determineNodeStructure(rootNode, { revealedOnly })

    // Return the exported node data and structure.
    return {
      forces: [
        {
          name: 'Friendly Force',
          color: '#34a1fb',
          nodes: nodeData,
        },
      ],
      nodeStructure,
    }
  }

  // Implemented
  /**
   * @deprecated
   */
  public abstract spawnNode(data?: Partial<TMissionNodeJson>): TMissionNode

  // Implemented
  public abstract spawnPrototype(
    _id: TMissionPrototype['_id'],
  ): TMissionPrototype

  // Implemented
  public getNode(nodeId: string): TMissionNode | undefined {
    for (let node of this.nodes) {
      if (node._id === nodeId) {
        return node
      }
    }
    return undefined
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionJson> {
    return {
      _id: generateHash(),
      name: 'New Mission',
      introMessage: '<p>Welcome to your new mission!</p>',
      versionNumber: 1,
      initialResources: 100,
      seed: generateHash(),
      nodeStructure: {},
      forces: [
        {
          name: 'Default Force',
          color: '#000000',
          nodes: [],
        },
      ],
    }
  }

  /**
   * The default properties for the root node of a Mission.
   */
  public static readonly ROOT_NODE_PROPERTIES: TMissionNodeJson = {
    _id: 'ROOT',
    structureKey: 'ROOT',
    name: 'ROOT',
    color: '#000000',
    description:
      'Invisible node that is the root of all other nodes in the structure.',
    preExecutionText: 'N/A',
    depthPadding: 0,
    executable: false,
    device: false,
    actions: [],
  }

  /**
   * Maps relationships between nodes passed based on the structure passed, recursively.
   * @param {Map<string, TMissionNode>} nodes The nodes to map.
   * @param {AnyObject} nodeStructure The node structure from which to map the relationships.
   * @param {TMissionNode} rootNode The root node of the structure. This root node should not be defined in the node map, nor in the node structure.
   * @param {TMapRelationshipOptions} options Options for mapping the relationships.
   * @deprecated
   */
  protected static mapNodeRelationships = <
    TMissionNode extends TCommonMissionNode,
  >(
    nodes: Map<string, TMissionNode>,
    nodeStructure: AnyObject,
    rootNode: TMissionNode,
    options: TMapRelationshipOptions = {},
  ) => {
    let childNodes: Array<TMissionNode> = []
    let childNodeKeyValuePairs: Array<[string, AnyObject]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])
    // Parse options.
    let { openAll = false } = options

    for (let childNodeKeyValuePair of childNodeKeyValuePairs) {
      let key: string = childNodeKeyValuePair[0]
      let value: AnyObject = childNodeKeyValuePair[1]
      let childNode: TMissionNode | undefined = nodes.get(key)

      if (childNode !== undefined) {
        childNodes.push(
          this.mapNodeRelationships(nodes, value, childNode, options),
        )
      }
    }
    rootNode.childNodes = childNodes

    if (openAll) {
      if (rootNode.openable) {
        rootNode.open()
      }
    }

    for (let childNode of childNodes) {
      childNode.parentNode = rootNode
    }

    return rootNode
  }

  /**
   * Maps relationships between prototypes passed based on the structure passed, recursively.
   * @param prototypes The prototypes to map.
   * @param nodeStructure The node structure from which to map the relationships.
   * @param rootPrototype The root prototype of the structure. This root prototype should not be defined in the prototype map, nor in the node structure.
   */
  protected static mapRelationships = <
    TMissionPrototype extends TCommonMissionPrototype,
  >(
    prototypes: Map<string, TMissionPrototype>,
    nodeStructure: AnyObject,
    rootPrototype: TMissionPrototype,
  ) => {
    let children: Array<TMissionPrototype> = []
    let childrenKeyValuePairs: Array<[string, AnyObject]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])

    for (let childrenKeyValuePair of childrenKeyValuePairs) {
      let key: string = childrenKeyValuePair[0]
      let value: AnyObject = childrenKeyValuePair[1]
      let child: TMissionPrototype | undefined = prototypes.get(key)

      if (child !== undefined) {
        children.push(this.mapRelationships(prototypes, value, child))
      }
    }
    rootPrototype.children = children

    for (let child of children) {
      child.parentNode = rootPrototype
    }

    return rootPrototype
  }

  /**
   * Determines the node structure found in the root node passed.
   * @param {TMissionNode} rootNode The root node from which to determine the node structure.
   * @param {TDetermineNodeStructureOptions} options Options for determining the node structure.
   * @returns {AnyObject} The raw node structure.
   */
  protected static determineNodeStructure<
    TMissionNode extends TCommonMissionNode,
  >(
    rootNode: TMissionNode,
    options: TDetermineNodeStructureOptions = {},
  ): AnyObject {
    // Parse options.
    let { revealedOnly = false } = options

    /**
     * The recursive algorithm used to determine the node structure.
     * @param {TCommonMissionNode} nodeCursor The current node being processed.
     * @param {AnyObject} nodeCursorStructure The structure of the current node being processed.
     */
    const operation = (
      nodeCursor: TMissionNode = rootNode,
      nodeCursorStructure: AnyObject = {},
    ): AnyObject => {
      let childNodes: Array<TMissionNode> =
        nodeCursor.childNodes as Array<TMissionNode>

      if (!revealedOnly || nodeCursor.isOpen) {
        for (let childNode of childNodes) {
          if (childNode.hasChildren) {
            nodeCursorStructure[childNode.structureKey] = operation(childNode)
          } else {
            nodeCursorStructure[childNode.structureKey] = {}
          }
        }
      }

      return nodeCursorStructure
    }

    // Return the result of the operation.
    return operation()
  }
}

/* ------------------------------ MISSION TYPES ------------------------------ */

/**
 * Interface of the abstract Mission class.
 * @note Any public, non-static properties and functions of the Mission
 * class must first be defined here for them to be accessible to the
 * MissionNode and MissionAction classes.
 */
export interface TCommonMission {
  /**
   * The ID of the mission.
   */
  _id: string
  /**
   * The name of the mission.
   */
  name: string
  /**
   * The introductory message for the mission, displayed when the mission is first started in a session.
   */
  introMessage: string
  /**
   * The version number of the mission.
   */
  versionNumber: number
  /**
   * The amount of resources available to the student at the start of the mission.
   */
  initialResources: number
  /**
   * The seed for the mission. Pre-determines outcomes.
   */
  seed: string
  /**
   * A map of nodeIDs to nodes.
   * @deprecated
   */
  nodes: TCommonMissionNode[]
  /**
   * Prototype nodes for the mission, representing the mission's node
   * structure outside of any forces.
   */
  prototypes: TCommonMissionPrototype[]
  /**
   * The root node of the mission. If the mission nodes have not been imported, this will be null.
   * @deprecated
   */
  rootNode: TCommonMissionNode | null
  /**
   * The root prototype of the mission. If the node structure have not
   * been imported, this will be null.
   */
  rootPrototype: TCommonMissionPrototype | null
  /**
   * Converts the mission to JSON.
   * @param options The options for converting the mission to JSON.
   * @returns the JSON for the mission.
   */
  toJson: (options?: TMissionJsonOptions) => TCommonMissionJson
  /**
   * This will spawn a new node in the mission with the given data and options. Any data or options not provided will be set to default values.
   * @param data The data for the node.
   * @param options The options for creating the node.
   * @deprecated
   */
  spawnNode(
    data?: Partial<TMissionNodeJson>,
    options?: TMissionNodeOptions<TCommonMissionNode>,
  ): TCommonMissionNode
  /**
   * This will spawn a new prototype in the mission with the given _id and options.
   * @param _id The ID for the prototype.
   * @param options The options for creating the prototype.
   */
  spawnPrototype(
    _id: TCommonMissionPrototype['_id'],
    options?: TMissionPrototypeOptions<TCommonMissionPrototype>,
  ): TCommonMissionPrototype
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface TCommonMissionJson {
  /**
   * The ID of the mission.
   */
  _id?: string
  /**
   * The name of the mission.
   */
  name: string
  /**
   * The introductory message for the mission, displayed when the mission is first started in a session.
   */
  introMessage: string
  /**
   * The version number of the mission.
   */
  versionNumber: number
  /**
   * The amount of resources available to the student at the start of the mission.
   */
  initialResources: number
  /**
   * The seed for the mission. Pre-determines outcomes.
   */
  seed: string
  /**
   * The tree structure used to determine the relationships and positions of the nodes in the mission.
   */
  nodeStructure: AnyObject
  /**
   * The forces in the mission.
   */
  forces: TCommonMissionForceJson[]
}

/**
 * Options for creating a Mission object.
 */
export type TMissionOptions = {
  /**
   * Whether or not to force open all nodes.
   * @default false
   */
  openAll?: boolean
}

/**
 * Options for Mission.toJSON.
 */
export type TMissionJsonOptions = {
  /**
   * Whether or not to exclude non-revealed nodes from the generated JSON.
   * @default false
   */
  revealedOnly?: boolean
  /**
   * Whether or not to include session-specific data in the generated JSON.
   * @default false
   */
  includeSessionData?: boolean
}

/**
 * Options for Mission.mapRelationships.
 */
export type TMapRelationshipOptions = {
  /**
   * Whether or not to force open all nodes.
   * @default false
   */
  openAll?: boolean
}

/**
 * Options for Mission.importNodes.
 */
export type TNodeImportOptions = {
  /**
   * Whether or not to force open the newly created nodes.
   * @default false
   */
  openAll?: boolean
}

/**
 * Return type for Mission.exportNodes.
 */
export type TExportedNodes = {
  forces: TCommonMissionForceJson[]
  nodeStructure: AnyObject
}

/**
 * Options for the Mission.exportNodes method.
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
 * Options for Mission.determineNodeStructure.
 */
export type TDetermineNodeStructureOptions = {
  /**
   * Whether to exclude non-revealed nodes in the node structure.
   * @default false
   */
  revealedOnly?: boolean
}
