import { v4 as generateHash } from 'uuid'
import context from '../context'
import { AnyObject } from '../toolbox/objects'
import { uuidTypeValidator } from '../toolbox/validators'
import { TCommonMissionAction } from './actions'
import IActionExecution from './actions/executions'
import IActionOutcome from './actions/outcomes'
import { TCommonMissionForce, TCommonMissionForceJson, TForce } from './forces'
import { TCommonMissionNode, TMissionNodeJson } from './nodes'
import {
  TCommonMissionPrototype,
  TMissionPrototypeOptions,
  TPrototype,
} from './nodes/prototypes'

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<
  T extends TCommonMissionTypes = TCommonMissionTypes,
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
  public prototypes: TPrototype<T>[]

  // Implemented
  public forces: TForce<T>[]

  // Implemented
  public seed: string

  // Implemented
  public root: TPrototype<T>

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
    this.prototypes = []
    this.root = this.createRootPrototype()

    // Parse options.
    let { openAll = false } = options

    // Import node structure into the mission.
    this.importStructure(
      data.nodeStructure ?? Mission.DEFAULT_PROPERTIES.nodeStructure,
    )

    // Parse force data.
    this.forces = this.parseForceData(
      data.forces ?? Mission.DEFAULT_PROPERTIES.forces,
    )
  }

  /**
   * Parses the force data into MissionForce objects.
   * @param data The force data to parse.
   * @returns The parsed force data.
   */
  protected abstract parseForceData(
    data: TCommonMissionForceJson[],
  ): TForce<T>[]

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
      // todo: Resolve revealedOnly not working.
      nodeStructure: Mission.determineNodeStructure(
        this.root /*{ revealedOnly }*/,
      ),
      forces: this.forces.map((force) =>
        force.toJson({ revealedOnly, includeSessionData }),
      ),
      // ...this.exportNodes({ revealedOnly, includeSessionData }),
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
   * Creates a new prototype that is the root prototype of the mission structure.
   * This prototype is not added to the mission's prototypes map, as it is really
   * a pseudo-prototype.
   */
  protected abstract createRootPrototype(): TPrototype<T>

  /**
   * This will import the node structure into the mission, creating
   * MissionPrototype objects from it, and mapping the relationships
   * found in the structure.
   * @param nodeStructure The raw node structure to import. The originalNodeStructure property
   * will be updated to this value.
   */
  protected importStructure(nodeStructure: AnyObject): void {
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
      let prototypeMap = new Map<string, TPrototype<T>>()

      // Add prototypes to the prototype map.
      for (let prototype of this.prototypes) {
        prototypeMap.set(prototype._id, prototype)
      }

      // Map relationships between prototypes.
      Mission.mapRelationships(prototypeMap, nodeStructure, this.root)

      // Convert prototypes map to array.
      this.prototypes = Array.from(prototypeMap.values())
    } catch (error) {
      if (context === 'react') {
        console.error('Node structure passed is invalid.')
      }
      throw error
    }
  }

  // Implemented
  public abstract spawnPrototype(_id: TPrototype<T>['_id']): TPrototype<T>

  // Implemented
  public getPrototype(
    prototypeId: TPrototype<T>['_id'],
  ): TPrototype<T> | undefined {
    if (prototypeId === this.root._id) return this.root
    else return this.prototypes.find(({ _id }) => _id === prototypeId)
  }

  // Implemented
  public getForce(forceId: TForce<T>['_id']): TForce<T> | undefined {
    return this.forces.find((force) => force._id === forceId)
  }

  /**
   * The maximum number of forces allowed in a mission.
   */
  public static readonly MAX_FORCE_COUNT: number = 8

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
    opened: true,
  }

  /**
   * Maps relationships between prototypes passed based on the structure passed, recursively.
   * @param prototypes The prototypes to map.
   * @param nodeStructure The node structure from which to map the relationships.
   * @param rootPrototype The root prototype of the structure. This root prototype should not be defined in the prototype map, nor in the node structure.
   */
  protected static mapRelationships = <
    TPrototype extends TCommonMissionPrototype,
  >(
    prototypes: Map<string, TPrototype>,
    nodeStructure: AnyObject,
    rootPrototype: TPrototype,
  ) => {
    let children: Array<TPrototype> = []
    let childrenKeyValuePairs: Array<[string, AnyObject]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])

    for (let childrenKeyValuePair of childrenKeyValuePairs) {
      let key: string = childrenKeyValuePair[0]
      let value: AnyObject = childrenKeyValuePair[1]
      let child: TPrototype | undefined = prototypes.get(key)

      if (child !== undefined) {
        children.push(this.mapRelationships(prototypes, value, child))
      }
    }
    rootPrototype.children = children

    for (let child of children) {
      child.parent = rootPrototype
    }

    return rootPrototype
  }

  /**
   * Determines the structure found in the root prototype passed.
   * @param rootNode The root prototype from which to determine the structure.
   * @returns The raw structure.
   */
  protected static determineNodeStructure(
    root: TCommonMissionPrototype,
  ): AnyObject {
    /**
     * The recursive algorithm used to determine the structure.
     * @param {TCommonMissionNode} cursor The current prototype being processed.
     * @param {AnyObject} cursorStructure The structure of the current prototype being processed.
     */
    const operation = (
      cursor: TCommonMissionPrototype = root,
      cursorStructure: AnyObject = {},
    ): AnyObject => {
      for (let child of cursor.children) {
        if (child.hasChildren) {
          cursorStructure[child._id] = operation(child)
        } else {
          cursorStructure[child._id] = {}
        }
      }

      return cursorStructure
    }

    // Return the result of the operation.
    return operation()
  }
}

/* ------------------------------ MISSION TYPES ------------------------------ */

/**
 * Common types for Mission objects.
 * @note Used as a generic argument for all base,
 * mission-related classes.
 */
export type TCommonMissionTypes = {
  mission: TCommonMission
  force: TCommonMissionForce
  prototype: TCommonMissionPrototype
  node: TCommonMissionNode
  action: TCommonMissionAction
  execution: IActionExecution
  outcome: IActionOutcome
}

/**
 * Interface of the abstract `Mission` class.
 * @note Any public, non-static properties and functions of the `Mission`
 * class must first be defined here for them to be accessible to other
 * mission-related classes.
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
   * Prototype nodes for the mission, representing the mission's node
   * structure outside of any forces.
   */
  prototypes: TCommonMissionPrototype[]
  /**
   * Forces in the mission, representing different implementation of nodes
   * from their corresponding prototypes.
   */
  forces: TCommonMissionForce[]
  /**
   * The root prototype of the mission.
   */
  root: TCommonMissionPrototype
  /**
   * Converts the mission to JSON.
   * @param options The options for converting the mission to JSON.
   * @returns the JSON for the mission.
   */
  toJson: (options?: TMissionJsonOptions) => TCommonMissionJson
  /**
   * This will spawn a new prototype in the mission with the given _id and options.
   * @param _id The ID for the prototype.
   * @param options The options for creating the prototype.
   */
  spawnPrototype(
    _id: TCommonMissionPrototype['_id'],
    options?: TMissionPrototypeOptions<TCommonMissionPrototype>,
  ): TCommonMissionPrototype
  /**
   * Gets a prototype from the mission by its ID.
   */
  getPrototype: (
    prototypeId: TCommonMissionPrototype['_id'],
  ) => TCommonMissionPrototype | undefined
  /**
   * Gets a force from the mission by its ID.
   */
  getForce: (
    forceId: TCommonMissionForce['_id'],
  ) => TCommonMissionForce | undefined
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
 * Extracts the mission type from the mission types.
 * @param T The mission types.
 * @returns The mission type.
 */
export type TMission<T extends TCommonMissionTypes> = T['mission']
