import { v4 as generateHash } from 'uuid'
import context from '../context'
import { AnyObject } from '../toolbox/objects'
import {
  TCommonMissionNode,
  TMissionNodeJson,
  TMissionNodeOptions,
} from './nodes'

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<TMissionNode extends TCommonMissionNode>
  implements TCommonMission
{
  // Inherited
  public missionID: string
  // Inherited
  public name: string
  // Inherited
  public introMessage: string
  // Inherited
  public versionNumber: number
  // Inherited
  public live: boolean
  // Inherited
  public initialResources: number
  // Inherited
  public nodes: TMissionNode[]
  // Inherited
  public seed: string
  // Inherited
  public rootNode: TMissionNode
  /**
   * The original raw data for the nodes in the mission, before any changes.
   */
  protected originalNodeData: Array<TMissionNodeJson>
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
    this.missionID = data.missionID ?? Mission.DEFAULT_PROPERTIES.missionID
    this.name = data.name ?? Mission.DEFAULT_PROPERTIES.name
    this.introMessage =
      data.introMessage ?? Mission.DEFAULT_PROPERTIES.introMessage
    this.versionNumber =
      data.versionNumber ?? Mission.DEFAULT_PROPERTIES.versionNumber
    this.live = data.live ?? Mission.DEFAULT_PROPERTIES.live
    this.initialResources =
      data.initialResources ?? Mission.DEFAULT_PROPERTIES.initialResources
    this.seed = data.seed ?? Mission.DEFAULT_PROPERTIES.seed
    this.originalNodeStructure =
      data.nodeStructure ?? Mission.DEFAULT_PROPERTIES.nodeStructure
    this.originalNodeData = data.nodeData ?? Mission.DEFAULT_PROPERTIES.nodeData
    this.nodes = []
    this.rootNode = this.createRootNode()

    // Parse options.
    let { openAll = false } = options

    // Import nodes into the mission.
    this.importNodes(this.originalNodeData, this.originalNodeStructure, {
      openAll,
    })

    // If root node is not open, open it.
    if (!this.rootNode.isOpen) {
      this.rootNode.open()
    }
  }

  // Inherited
  public toJson(options: TMissionJsonOptions = {}): TCommonMissionJson {
    let { revealedOnly = false, includeGameData = false } = options
    return {
      missionID: this.missionID,
      name: this.name,
      introMessage: this.introMessage,
      versionNumber: this.versionNumber,
      live: this.live,
      initialResources: this.initialResources,
      seed: this.seed,
      ...this.exportNodes({ revealedOnly, includeGameData }),
    }
  }

  /**
   * Creates a new node that is the root node of the mission structure. This node is not added to the mission's nodes map, as it is really a pseudo-node.
   */
  protected abstract createRootNode(): TMissionNode

  /**
   * This will import raw node data into the mission, creating MissionNode objects from it, and mapping the relationships found in the structure.
   * @param {Array<TMissionNodeJson>} nodeData The raw node data to import. Upon success, the originalNodeData property will be updated to this value.
   * @param {AnyObject} nodeStructure The raw node structure to import. Upon success, the originalNodeStructure property will be updated to this value.
   */
  protected importNodes(
    nodeData: Array<TMissionNodeJson>,
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
        this.spawnNode(nodeDatum, {})
      }

      // Create a node map to pass to the mapRelationships function.
      let nodeMap = new Map<string, TMissionNode>()

      // Add nodes to the node map.
      for (let node of this.nodes) {
        nodeMap.set(node.nodeID, node)
      }

      // Map relationships between nodes.
      Mission.mapRelationships(nodeMap, nodeStructure, this.rootNode, options)

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
    let { revealedOnly = false, includeGameData = false } = options

    // Create an array of the MissionNode
    // objects from the nodes map.
    let nodes: Array<TMissionNode> = this.nodes
    // Predefine the node data and structure.
    let nodeData: Array<TMissionNodeJson> = []
    let nodeStructure: AnyObject = {}

    // Apply filter if revealedOnly flag
    // is set.
    if (revealedOnly) {
      nodes = nodes.filter((node: TMissionNode) => node.revealed)
    }

    // Construct node data.
    nodeData = nodes.map((node: TMissionNode) =>
      node.toJson({ includeGameData }),
    )

    // Construct node structure.
    nodeStructure = Mission.determineNodeStructure(rootNode, { revealedOnly })

    // Return the exported node data and structure.
    return { nodeData, nodeStructure }
  }

  // Inherited
  public abstract spawnNode(
    data?: Partial<TMissionNodeJson>,
    options?: ISpawnNodeOptions<TMissionNode>,
  ): TMissionNode

  // Inherited
  public getNode(nodeID: string): TMissionNode | undefined {
    for (let node of this.nodes) {
      if (node.nodeID === nodeID) {
        return node
      }
    }
    return undefined
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonMissionJson {
    return {
      missionID: generateHash(),
      name: 'New Mission',
      introMessage: 'Welcome to your new mission!',
      versionNumber: 1,
      live: false,
      initialResources: 100,
      seed: generateHash(),
      nodeStructure: {},
      nodeData: [],
    }
  }

  /**
   * The default properties for the root node of a Mission.
   */
  public static readonly ROOT_NODE_PROPERTIES: TMissionNodeJson = {
    nodeID: 'ROOT',
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
   */
  protected static mapRelationships = <TMissionNode extends TCommonMissionNode>(
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
        childNodes.push(this.mapRelationships(nodes, value, childNode, options))
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
            nodeCursorStructure[childNode.nodeID] = operation(childNode)
          } else {
            nodeCursorStructure[childNode.nodeID] = {}
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
  missionID: string
  /**
   * The name of the mission.
   */
  name: string
  /**
   * The introductory message for the mission, displayed when the mission is first started in a game.
   */
  introMessage: string
  /**
   * The version number of the mission.
   */
  versionNumber: number
  /**
   * Whether or not the mission is live and ready for student-use.
   */
  live: boolean
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
   */
  nodes: TCommonMissionNode[]
  /**
   * The root node of the mission. If the mission nodes have not been imported, this will be null.
   */
  rootNode: TCommonMissionNode | null
  /**
   * Converts the mission to JSON.
   * @param {TMissionJsonOptions} options The options for converting the mission to JSON.
   * @returns {TMissionNodeJson} the JSON for the mission.
   */
  toJson: (options?: TMissionJsonOptions) => TCommonMissionJson
  /**
   * This will spawn a new node in the mission with the given data and options. Any data or options not provided will be set to default values.
   * @param {Partial<TMissionNodeJson>} data The data for the node.
   * @param {TMissionNodeOptions} options The options for creating the node.
   */
  spawnNode(
    data?: Partial<TMissionNodeJson>,
    options?: TMissionNodeOptions<TCommonMissionNode>,
  ): TCommonMissionNode
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface TCommonMissionJson {
  missionID: string
  name: string
  introMessage: string
  versionNumber: number
  live: boolean
  initialResources: number
  seed: string
  nodeStructure: AnyObject
  nodeData: TMissionNodeJson[]
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
   * Whether or not to include game-specific data in the generated JSON.
   * @default false
   */
  includeGameData?: boolean
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
  nodeData: TMissionNodeJson[]
  nodeStructure: AnyObject
}

/**
 * Options for the Mission.exportNodes method.
 */
type TExportNodesOptions = {
  /**
   * Whether to exclude non-revealed nodes in the export.
   * @default false
   */
  revealedOnly?: boolean
  /**
   * Whether or not to include game-specific data in the export.
   * @default false
   */
  includeGameData?: boolean
}

/**
 * Options for Mission.spawnNode.
 */
export interface ISpawnNodeOptions<TMissionNode extends TCommonMissionNode>
  extends TMissionNodeOptions<TMissionNode> {
  /**
   * Whether or not to add newly generated node to the mission's node map.
   * @default true
   */
  addToNodeMap?: boolean
  /**
   * Whether or not to add newly generated node to the root node's children.
   * @default true
   */
  makeChildOfRoot?: boolean
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
