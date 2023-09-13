import { v4 as generateHash } from 'uuid'
import { AnyObject } from 'metis/toolbox/objects'
import MissionNode, {
  IMissionNode,
  IMissionNodeJSON,
  TMissionNodeOptions,
} from './nodes'

/**
 * Interface of the abstract Mission class.
 * @note Any public, non-static properties and functions of the Mission
 * class must first be defined here for them to be accessible to the
 * MissionNode and MissionAction classes.
 */
export interface IMission {
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
  nodes: Map<string, IMissionNode>
  /**
   * The root node of the mission. If the mission nodes have not been imported, this will be null.
   */
  rootNode: IMissionNode | null
  /**
   * Converts the mission to JSON.
   * @param {TMissionJsonOptions} options The options for converting the mission to JSON.
   * @returns {IMissionNodeJSON} the JSON for the mission.
   */
  toJSON: () => IMissionJSON
  /**
   * This will spawn a new node in the mission with the given data and options. Any data or options not provided will be set to default values.
   * @param {Partial<IMissionNodeJSON>} data The data for the node.
   * @param {TMissionNodeOptions} options The options for creating the node.
   */
  spawnNode(
    data?: Partial<IMissionNodeJSON>,
    options?: TMissionNodeOptions<IMissionNode>,
  ): IMissionNode
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface IMissionJSON {
  missionID: string
  name: string
  introMessage: string
  versionNumber: number
  live: boolean
  initialResources: number
  seed: string
  nodeStructure: AnyObject
  nodeData: Array<IMissionNodeJSON>
}

/**
 * Options for creating a Mission object.
 */
export type TMissionOptions = {}

/**
 * Options for Mission.toJSON.
 */
export type TMissionJsonOptions = {
  /**
   * Whether or not to exclude non-revealed nodes from the generated JSON.
   */
  revealedOnly?: boolean
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
export type TExportedNodes<TMissionNode extends IMissionNode> = {
  nodeData: Array<IMissionNodeJSON>
  nodeStructure: AnyObject
}

/**
 * Options for Mission.exportNodes.
 */
type TExportNodesOptions = {
  /**
   * Whether to exclude non-revealed nodes in the export.
   * @default false
   */
  revealedOnly?: boolean
}

/**
 * Options for Mission.spawnNode.
 */
export interface ISpawnNodeOptions<TMissionNode extends IMissionNode>
  extends TMissionNodeOptions<TMissionNode> {
  /**
   * Whether or not to add newly generated node to the mission's node map.
   * @default true
   */
  addToNodeMap?: boolean
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

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<TMissionNode extends IMissionNode>
  implements IMission
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
  public nodes: Map<string, TMissionNode>
  // Inherited
  public seed: string
  // Inherited
  public rootNode: TMissionNode | null
  /**
   * The original raw data for the nodes in the mission, before any changes.
   */
  protected originalNodeData: Array<IMissionNodeJSON>
  /**
   * The original tree structure of the mission nodes, before any changes.
   */
  protected originalNodeStructure: AnyObject

  /**
   * @param {IMissionJSON} data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param {TMissionOptions} options The options for creating the mission.
   */
  public constructor(
    data: Partial<IMissionJSON> = Mission.DEFAULT_PROPERTIES,
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
    this.nodes = new Map<string, TMissionNode>()
    this.rootNode = null

    // Import nodes into the mission.
    this.importNodes(this.originalNodeData, this.originalNodeStructure)
  }

  // Inherited
  public toJSON(options: TMissionJsonOptions = {}): IMissionJSON {
    let { revealedOnly = false } = options
    return {
      missionID: this.missionID,
      name: this.name,
      introMessage: this.introMessage,
      versionNumber: this.versionNumber,
      live: this.live,
      initialResources: this.initialResources,
      seed: this.seed,
      ...this.exportNodes({ revealedOnly }),
    }
  }

  /**
   * This will import raw node data into the mission, creating MissionNode objects from it, and mapping the relationships found in the structure.
   * @param {Array<IMissionNodeJSON>} nodeData The raw node data to import. Upon success, the originalNodeData property will be updated to this value.
   * @param {AnyObject} nodeStructure The raw node structure to import. Upon success, the originalNodeStructure property will be updated to this value.
   */
  protected importNodes(
    nodeData: Array<IMissionNodeJSON>,
    nodeStructure: AnyObject,
    options: TNodeImportOptions = {},
  ): void {
    let nodes: Map<string, TMissionNode> = new Map<string, TMissionNode>()
    let rootNode: TMissionNode = this.spawnNode(Mission.ROOT_NODE_PROPERTIES, {
      addToNodeMap: false,
    })

    try {
      // Loop through data, spawn new nodes,
      // and add them to the nodes map.
      for (let nodeDatum of nodeData) {
        let node: TMissionNode = this.spawnNode(nodeDatum, {})
        nodes.set(node.nodeID, node)
      }
      // Map relationships between nodes.
      Mission.mapRelationships(nodes, nodeStructure, rootNode, options)
    } catch (error) {
      console.error('Node data/structure passed is invalid.')
      throw error
    }

    // Update object properties to imported values.
    this.originalNodeData = nodeData
    this.originalNodeStructure = nodeStructure
    this.nodes = nodes
    this.rootNode = rootNode
  }

  /**
   * Exports the nodes map into its raw data and structure.
   * @returns {Object} The exported node data and structure.
   * @returns {TExportedNodes<TMissionNode>} The exported node data and structure.
   */
  protected exportNodes(
    options: TExportNodesOptions = {},
  ): TExportedNodes<TMissionNode> {
    // Get root node.
    let rootNode: TMissionNode | null = this.rootNode

    // Throw error if root node is null.
    if (rootNode === null) {
      throw new Error('Cannot export nodes: Mission has no root node.')
    }

    // Extract options.
    let { revealedOnly = false } = options

    // Create an array of the MissionNode
    // objects from the nodes map.
    let nodes: Array<TMissionNode> = Array.from(this.nodes.values())
    // Predefine the node data and structure.
    let nodeData: Array<IMissionNodeJSON> = []
    let nodeStructure: AnyObject = {}

    // Apply filter if revealedOnly flag
    // is set.
    if (revealedOnly) {
      nodes = nodes.filter((node: TMissionNode) => node.revealed)
    }

    // Construct node data.
    nodeData = nodes.map((node: TMissionNode) => node.toJSON())

    // Construct node structure.
    nodeStructure = Mission.determineNodeStructure(rootNode, { revealedOnly })

    // Return the exported node data and structure.
    return { nodeData, nodeStructure }
  }

  // Inherited
  public abstract spawnNode(
    data?: Partial<IMissionNodeJSON>,
    options?: ISpawnNodeOptions<TMissionNode>,
  ): TMissionNode

  /**
   * The default properties for a Mission object.
   */
  public static readonly DEFAULT_PROPERTIES: IMissionJSON = {
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
  /**
   * The default properties for the root node of a Mission.
   */
  public static readonly ROOT_NODE_PROPERTIES: IMissionNodeJSON = {
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
   * @returns {void}
   */
  protected static mapRelationships = (
    nodes: Map<string, IMissionNode>,
    nodeStructure: AnyObject,
    rootNode: IMissionNode,
    options: TMapRelationshipOptions = {},
  ) => {
    let childNodes: Array<IMissionNode> = []
    let childNodeKeyValuePairs: Array<[string, AnyObject]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])
    // Parse options.
    let { openAll = false } = options

    for (let childNodeKeyValuePair of childNodeKeyValuePairs) {
      let key: string = childNodeKeyValuePair[0]
      let value: AnyObject = childNodeKeyValuePair[1]
      let childNode: IMissionNode | undefined = nodes.get(key)

      if (childNode !== undefined) {
        childNodes.push(this.mapRelationships(nodes, value, childNode, options))
      }
    }
    rootNode.childNodes = childNodes

    if (openAll && rootNode.hasChildren) {
      rootNode.open()
    }

    for (let childNode of childNodes) {
      childNode.parentNode = rootNode
    }

    return rootNode
  }

  /**
   * Determines the node structure found in the root node passed.
   * @param {IMissionNode} rootNode The root node from which to determine the node structure.
   * @param {TDetermineNodeStructureOptions} options Options for determining the node structure.
   * @returns {AnyObject} The raw node structure.
   */
  protected static determineNodeStructure(
    rootNode: IMissionNode,
    options: TDetermineNodeStructureOptions = {},
  ): AnyObject {
    // Parse options.
    let { revealedOnly = false } = options

    /**
     * The recursive algorithm used to determine the node structure.
     * @param {IMissionNode} nodeCursor The current node being processed.
     * @param {AnyObject} nodeCursorStructure The structure of the current node being processed.
     */
    const operation = (
      nodeCursor: IMissionNode = rootNode,
      nodeCursorStructure: AnyObject = {},
    ): AnyObject => {
      let childNodes: Array<IMissionNode> = nodeCursor.childNodes

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
