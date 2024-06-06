import { v4 as generateHash } from 'uuid'
import { TCommonMission, TCommonMissionTypes, TMission } from '..'
import context from '../../context'
import {
  TCommonMissionNode,
  TCommonMissionNodeJson,
  TMissionNodeJson,
  TMissionNodeOptions,
  TNode,
} from '../nodes'

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

  /**
   * The nodes in the force.
   */
  public nodes: TNode<T>[]

  /**
   * The root node of the force.
   */
  public rootNode: TNode<T>

  /**
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   * @param options The options for creating the force.
   */
  public constructor(
    mission: TMission<T>,
    data: Partial<TCommonMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
    options: TMissionForceOptions = {},
  ) {
    // Parse options.
    const { openAll = false } = options

    // Set properties.
    this.mission = mission
    this._id = data._id?.toString() ?? MissionForce.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionForce.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionForce.DEFAULT_PROPERTIES.color
    this.nodes = []
    this.rootNode = this.createRootNode()

    // Import nodes into the force.
    this.importNodes(data.nodes ?? MissionForce.DEFAULT_PROPERTIES.nodes, {
      openAll,
    })
  }

  /**
   * Creates a new node that is the root node of the force. This node is not added to the list
   * of nodes because it is more of a pseudo-node.
   */
  protected abstract createRootNode(): TNode<T>

  // Implemented
  public abstract spawnNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions,
  ): TNode<T>

  // Implemented
  public getNode(nodeId: string): TNode<T> | undefined {
    if (nodeId === this.rootNode._id) return this.rootNode
    else return this.nodes.find((node) => node._id === nodeId)
  }

  // Implemented
  public getNodeFromPrototype(prototypeId: string): TNode<T> | undefined {
    if (prototypeId === this.mission.rootPrototype._id) return this.rootNode
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
      const { openAll } = options

      // Loop through data, spawn new nodes,
      // and add them to the nodes map.
      for (let datum of data) {
        // Set node as open, if openAll is marked.
        if (openAll) datum.opened = true

        let node = this.spawnNode(datum, {})
      }
    } catch (error) {
      if (context === 'react') {
        console.error('Node data/structure passed is invalid.')
      }
      throw error
    }
  }

  // todo: Implement this.
  //   /**
  //    * Determines the node structure found in the root node passed.
  //    * @param {TMissionNode} rootNode The root node from which to determine the node structure.
  //    * @param {TDetermineNodeStructureOptions} options Options for determining the node structure.
  //    * @returns {AnyObject} The raw node structure.
  //    */
  //   protected static determineNodeStructure<
  //     TMissionNode extends TCommonMissionNode,
  //   >(
  //     rootNode: TMissionNode,
  //     options: TDetermineNodeStructureOptions = {},
  //   ): AnyObject {
  //     // Parse options.
  //     let { revealedOnly = false } = options
  //
  //     /**
  //      * The recursive algorithm used to determine the node structure.
  //      * @param {TCommonMissionNode} nodeCursor The current node being processed.
  //      * @param {AnyObject} nodeCursorStructure The structure of the current node being processed.
  //      */
  //     const operation = (
  //       nodeCursor: TMissionNode = rootNode,
  //       nodeCursorStructure: AnyObject = {},
  //     ): AnyObject => {
  //       let childNodes: Array<TMissionNode> =
  //         nodeCursor.children as Array<TMissionNode>
  //
  //       if (!revealedOnly || nodeCursor.isOpen) {
  //         for (let childNode of childNodes) {
  //           if (childNode.hasChildren) {
  //             nodeCursorStructure[childNode.structureKey] = operation(childNode)
  //           } else {
  //             nodeCursorStructure[childNode.structureKey] = {}
  //           }
  //         }
  //       }
  //
  //       return nodeCursorStructure
  //     }
  //
  //     // Return the result of the operation.
  //     return operation()
  //   }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionForceJson> {
    return {
      _id: generateHash(),
      name: 'New Force',
      color: '#000000',
      nodes: [],
    }
  }

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
   * The nodes in the force.
   */
  nodes: TCommonMissionNode[]
  /**
   * The root node of the force.
   */
  rootNode: TCommonMissionNode
  /**
   * This will spawn a new node in the force with the given data and options.
   * Any data or options not provided will be set to default values.
   * @param data The data for the node.
   * @param options The options for creating the node.
   */
  spawnNode(
    data?: Partial<TMissionNodeJson>,
    options?: TMissionNodeOptions,
  ): TCommonMissionNode
  /**
   * Gets a node from the given node ID.
   */
  getNode(nodeId: string): TCommonMissionNode | undefined
  /**
   * Gets a node from the given prototype ID.
   */
  getNodeFromPrototype(prototypeId: string): TCommonMissionNode | undefined
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface TCommonMissionForceJson {
  /**
   * The ID of the force.
   */
  _id?: string
  /**
   * The name of the force.
   */
  name: string
  /**
   * The color of the force.
   */
  color: string
  /**
   * The nodes in the force.
   */
  nodes: TCommonMissionNodeJson[]
}

/**
 * Options for creating a MissionForce object.
 */
export type TMissionForceOptions = {
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
