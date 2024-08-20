import { TCommonTargetEnv } from 'metis/target-environments'
import { TCommonTarget } from 'metis/target-environments/targets'
import { v4 as generateHash } from 'uuid'
import context from '../context'
import { AnyObject } from '../toolbox/objects'
import { TAction, TCommonMissionAction } from './actions'
import IActionExecution from './actions/executions'
import IActionOutcome from './actions/outcomes'
import { TCommonEffect, TEffect } from './effects'
import {
  MissionForce,
  TCommonMissionForce,
  TCommonMissionForceJson,
  TForce,
  TMissionForceOptions,
} from './forces'
import { TCommonMissionNode, TNode } from './nodes'
import { TCommonMissionPrototype, TPrototype } from './nodes/prototypes'

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonMission
{
  // Implemented
  public get nodes(): TNode<T>[] {
    return this.forces.flatMap((force) => force.nodes)
  }

  // Implemented
  public get actions(): Map<string, TAction<T>> {
    let actions = new Map<string, TAction<T>>()

    for (let node of this.nodes) {
      for (let action of node.actions.values()) {
        actions.set(action._id, action)
      }
    }

    return actions
  }

  // Implemented
  public get effects(): TEffect<T>[] {
    return Array.from(this.actions.values()).flatMap((action) => action.effects)
  }

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
    this._id = data._id ?? Mission.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Mission.DEFAULT_PROPERTIES.name
    this.introMessage =
      data.introMessage ?? Mission.DEFAULT_PROPERTIES.introMessage
    this.versionNumber =
      data.versionNumber ?? Mission.DEFAULT_PROPERTIES.versionNumber
    this.initialResources =
      data.initialResources ?? Mission.DEFAULT_PROPERTIES.initialResources
    this.seed = data.seed ?? Mission.DEFAULT_PROPERTIES.seed
    this.prototypes = []
    this.forces = []
    this.root = this.initializeRoot()

    // Parse options.
    let { openAll = false, populateTargets = false } = options

    // Import node structure into the mission.
    this.importStructure(
      data.nodeStructure ?? Mission.DEFAULT_PROPERTIES.nodeStructure,
    )

    // Parse force data.
    this.importForces(data.forces ?? Mission.DEFAULT_PROPERTIES.forces, {
      populateTargets,
    })
  }

  // Implemented
  public toJson(
    options: TMissionJsonOptions = { exportType: 'standard' },
  ): TCommonMissionJson {
    let { includeId = false } = options

    // Predefine limited JSON.
    let json: TCommonMissionJson = {
      name: this.name,
      introMessage: this.introMessage,
      versionNumber: this.versionNumber,
      initialResources: this.initialResources,
      seed: this.seed,
      nodeStructure: {},
      forces: [],
    }

    // Include the ID if the option is set.
    if (includeId) json._id = this._id

    // Handle the export based on the export type
    // passed in the options.
    switch (options.exportType) {
      case 'standard':
        json.nodeStructure = Mission.determineNodeStructure(this.root)
        json.forces = this.forces.map((force) => force.toJson())
        break
      case 'session-participant':
        // Get the force to include in the export.
        let force = this.forces.find((force) => force._id === options.forceId)

        // If the force is found, include it in the export.
        if (force) {
          json.forces = [
            force.toJson({ revealedOnly: true, includeSessionData: true }),
          ]
          // Set the structure to revealed structure of the force.
          json.nodeStructure = force.revealedStructure
        }
        // todo: Log a warning if the force is not found.
        break
      case 'session-observer':
        // Include all data.
        json.nodeStructure = Mission.determineNodeStructure(this.root)
        json.forces = this.forces.map((force) =>
          force.toJson({ includeSessionData: true }),
        )
        break
    }

    return json
  }

  /**
   * Creates a new prototype that is the root prototype of the mission structure.
   * This prototype is not added to the mission's prototypes map, as it is really
   * a pseudo-prototype.
   */
  protected abstract initializeRoot(): TPrototype<T>

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
          this.importPrototype(key)
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

  /**
   * Creates a prototype for the given ID.
   * @param _id The ID of the prototype to import.
   * @returns The imported prototype.
   */
  protected abstract importPrototype(_id: TPrototype<T>['_id']): TPrototype<T>

  /**
   * Imports the force data into MissionForce objects and
   * stores it in the array of forces.
   * @param data The force data to parse.
   * @returns The parsed force data.
   */
  protected abstract importForces(
    data: TCommonMissionForceJson[],
    options?: TMissionForceOptions,
  ): TForce<T>[]

  // Implemented
  public getPrototype(
    prototypeId: TPrototype<T>['_id'],
  ): TPrototype<T> | undefined {
    if (prototypeId === this.root._id) return this.root
    else return this.prototypes.find(({ _id }) => _id === prototypeId)
  }

  // Implemented
  public getForce(
    forceId: TForce<T>['_id'] | undefined,
  ): TForce<T> | undefined {
    return forceId ? Mission.getForce(this, forceId) : undefined
  }

  // Implemented
  public getNode(nodeId: TNode<T>['_id']): TNode<T> | undefined {
    return nodeId ? Mission.getNode(this, nodeId) : undefined
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
      forces: [MissionForce.DEFAULT_FORCES[0]],
    }
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
    let children: TPrototype[] = []
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
     * @param cursor The current prototype being processed.
     * @param cursorStructure The structure of the current prototype being processed.
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

  /**
   * Gets a force from the mission by its ID.
   * @param mission The mission to get the force from.
   * @param forceId The ID of the force to get.
   * @returns The force with the given ID, or undefined if no force is found.
   */
  public static getForce<TMission extends TCommonMissionJson | TCommonMission>(
    mission: TMission,
    forceId: string,
  ): TMission['forces'][0] | undefined {
    return mission.forces.find((force) => force._id === forceId)
  }

  /**
   * Gets a node from the mission by its ID.
   * @param mission The mission to get the node from.
   * @param nodeId The ID of the node to get.
   * @returns The node with the given ID, or undefined if no node is found.
   */
  public static getNode<TMission extends TCommonMissionJson | TCommonMission>(
    mission: TMission,
    nodeId: string,
  ): TMission['forces'][0]['nodes'][0] | undefined {
    for (let force of mission.forces) {
      let node = force.nodes.find((node) => node._id === nodeId)
      if (node) return node
    }
    return undefined
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
  targetEnv: TCommonTargetEnv
  target: TCommonTarget
  effect: TCommonEffect
}

/**
 * Interface of the abstract `Mission` class.
 * @note Any public, non-static properties and functions of the `Mission`
 * class must first be defined here for them to be accessible to other
 * mission-related classes.
 */
export interface TCommonMission {
  /**
   * All nodes that exist in the mission.
   */
  get nodes(): TCommonMissionNode[]
  /**
   * All actions that exist in the mission.
   */
  get actions(): Map<string, TCommonMissionAction>
  /**
   * All effects that exist in the mission.
   */
  get effects(): TCommonEffect[]
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
  /**
   * Gets a node from the mission by its ID.
   */
  getNode: (nodeId: TCommonMissionNode['_id']) => TCommonMissionNode | undefined
}

/**
 * Extracts the mission type from the mission types.
 * @param T The mission types.
 * @returns The mission type.
 */
export type TMission<T extends TCommonMissionTypes> = T['mission']

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
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
}

/**
 * Base options for Mission.toJson.
 */
export type TMissionJsonBaseOptions = {
  /**
   * Whether or not to include the ID in the JSON.
   * @default false
   */
  includeId?: boolean
}

/**
 * Options for Mission.toJson with `exportType` set to 'standard'.
 */
export type TMissionJsonStandardOptions = TMissionJsonBaseOptions & {
  /**
   * Standard export of the mission.
   */
  exportType: 'standard'
}

/**
 * Options for Mission.toJson with `exportType` set to 'session-limited'.
 */
export type TMissionJsonSessionLimitedOptions = TMissionJsonBaseOptions & {
  /**
   * An export of a mission to be used in a session.
   * This export will not include force or prototype
   * data.
   */
  exportType: 'session-limited'
}

/**
 * Options for Mission.toJson with `exportType` set to 'session-participant'.
 */
export type TMissionJsonSessionParticipantOptions = TMissionJsonBaseOptions & {
  /**
   * An export of a mission to be used in a session.
   * This export will only include the data available
   * to a participant participating in the force with
   * the ID passed.
   */
  exportType: 'session-participant'
  /**
   * The ID of the force to include in the export.
   */
  forceId: TCommonMissionForce['_id']
}

/**
 * Options for Mission.toJson with `exportType` set to 'session-observer'.
 */
export type TMissionJsonSessionObserverOptions = TMissionJsonBaseOptions & {
  /**
   * An export of a mission to be used in a session.
   * This export will include all data.
   */
  exportType: 'session-observer'
}

/**
 * Options for Mission.toJSON.
 */
export type TMissionJsonOptions =
  | TMissionJsonStandardOptions
  | TMissionJsonSessionLimitedOptions
  | TMissionJsonSessionParticipantOptions
  | TMissionJsonSessionObserverOptions

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
