import { TCommonSession } from 'metis/sessions'
import { TCommonSessionMember } from 'metis/sessions/members'
import { TCommonTargetEnv } from 'metis/target-environments'
import { TCommonTarget } from 'metis/target-environments/targets'
import { TCommonUser } from 'metis/users'
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
import { TCommonOutput } from './forces/output'
import { TCommonMissionNode, TNode } from './nodes'
import MissionPrototype, {
  TCommonMissionPrototype,
  TCommonMissionPrototypeJson,
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
  public versionNumber: number

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
    this.versionNumber =
      data.versionNumber ?? Mission.DEFAULT_PROPERTIES.versionNumber
    this.seed = data.seed ?? Mission.DEFAULT_PROPERTIES.seed
    this.prototypes = []
    this.forces = []
    this.root = this.initializeRoot()

    // Parse options.
    let { populateTargets = false } = options

    // Import node structure into the mission.
    this.importStructure(
      data.structure ?? Mission.DEFAULT_PROPERTIES.structure,
      data.prototypes ?? Mission.DEFAULT_PROPERTIES.prototypes,
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
      versionNumber: this.versionNumber,
      seed: this.seed,
      structure: {},
      forces: [],
      prototypes: [],
    }

    // Include the ID if the option is set.
    if (includeId) json._id = this._id

    // Handle the export based on the export type
    // passed in the options.
    switch (options.exportType) {
      case 'standard':
        json.structure = Mission.determineStructure(this.root)
        json.forces = this.forces.map((force) => force.toJson())
        json.prototypes = this.prototypes.map((prototype) => prototype.toJson())
        break
      case 'session-force-specific':
        // Get the force to include in the export.
        let force = this.forces.find((force) => force._id === options.forceId)

        // If the force is found, include it in the export.
        if (force) {
          json.forces = [
            force.toJson({
              revealedOnly: true,
              includeSessionData: true,
              userId: options.userId,
            }),
          ]
          // Set the structure to revealed structure of the force.
          json.structure = force.revealedStructure
          // Set the prototypes to the revealed prototypes of the force.
          json.prototypes = force.revealedPrototypes.map((prototype) =>
            prototype.toJson(),
          )
        }
        // todo: Log a warning if the force is not found.
        break
      case 'session-complete':
        // Include all data.
        json.structure = Mission.determineStructure(this.root)
        json.forces = this.forces.map((force) =>
          force.toJson({
            includeSessionData: true,
            userId: options.userId,
          }),
        )
        json.prototypes = this.prototypes.map((prototype) => prototype.toJson())
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
   * @param structure The raw node structure to import.
   */
  protected importStructure(
    structure: AnyObject,
    prototypeData: TCommonMissionPrototypeJson[],
  ): void {
    try {
      /**
       * Recursively spawns prototypes from the node structure.
       */
      const spawnPrototypes = (cursor: AnyObject = structure) => {
        for (let key of Object.keys(cursor)) {
          // Get the child structure.
          let childStructure: AnyObject = cursor[key]
          // Find the prototype data for the current key.
          let prototypeDatum = prototypeData.find(
            ({ structureKey }) => structureKey === key,
          )
          // Create a prototype from the prototype data.
          this.importPrototype(prototypeDatum)
          // Spawn this prototype's children.
          spawnPrototypes(childStructure)
        }
      }

      // Spawn prototypes from the node structure.
      spawnPrototypes()

      // Create a prototype map to pass to the mapRelationships function.
      let prototypeMap = new Map<string, TPrototype<T>>()

      // Add prototypes to the prototype map.
      for (let prototype of this.prototypes) {
        prototypeMap.set(prototype.structureKey, prototype)
      }

      // Map relationships between prototypes.
      Mission.mapRelationships(prototypeMap, structure, this.root)

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
   * Creates a prototype from the data passed and adds it to the mission's
   * prototype list.
   * @param data The prototype data from which to create the prototype.
   * @param options The options for creating the prototype.
   * @returns The imported prototype.
   */
  protected abstract importPrototype(
    data?: Partial<TCommonMissionPrototypeJson>,
    options?: TMissionPrototypeOptions<TPrototype<T>>,
  ): TPrototype<T>

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
    prototypeId: TPrototype<T>['_id'] | undefined,
  ): TPrototype<T> | undefined {
    if (prototypeId === this.root._id) return this.root
    else return this.prototypes.find(({ _id }) => _id === prototypeId)
  }

  // Implemented
  public getForce(
    forceId: TForce<T>['_id'] | null | undefined,
  ): TForce<T> | undefined {
    let color = '#000000'
    return Mission.getForce(this, forceId)
  }

  // Implemented
  public getNode(nodeId: TNode<T>['_id']): TNode<T> | undefined {
    return nodeId ? Mission.getNode(this, nodeId) : undefined
  }

  /**
   * The maximum length allowed for a mission's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

  /**
   * The maximum number of forces allowed in a mission.
   */
  public static readonly MAX_FORCE_COUNT: number = 8

  /**
   * The color white.
   */
  public static readonly WHITE: string = '#ffffff'

  /**
   * The color red.
   */
  public static readonly RED: string = '#fd6b72'

  /**
   * The color orange.
   */
  public static readonly ORANGE: string = '#ff9c50'

  /**
   * The color brown.
   */
  public static readonly BROWN: string = '#b79769'

  /**
   * The color yellow.
   */
  public static readonly YELLOW: string = '#ffdb67'

  /**
   * The color green.
   */
  public static readonly GREEN: string = '#7ed321'

  /**
   * The color blue.
   */
  public static readonly BLUE: string = '#52b1ff'

  /**
   * The color purple.
   */
  public static readonly PURPLE: string = '#bc6fec'

  /**
   * The color magenta.
   */
  public static readonly MAGENTA: string = '#ff6dce'

  /**
   * Options when setting the color of nodes.
   */
  public static readonly COLOR_OPTIONS: string[] = [
    Mission.WHITE,
    Mission.RED,
    Mission.ORANGE,
    Mission.BROWN,
    Mission.YELLOW,
    Mission.GREEN,
    Mission.BLUE,
    Mission.PURPLE,
    Mission.MAGENTA,
  ]

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionJson> {
    return {
      _id: generateHash(),
      name: 'New Mission',
      versionNumber: 1,
      seed: generateHash(),
      structure: {},
      forces: [MissionForce.DEFAULT_FORCES[0]],
      prototypes: [MissionPrototype.DEFAULT_PROPERTIES],
    }
  }

  /**
   * Maps relationships between prototypes passed based on the structure passed, recursively.
   * @param prototypes The prototypes to map.
   * @param structure The node structure from which to map the relationships.
   * @param rootPrototype The root prototype of the structure. This root prototype should not be defined in the prototype map, nor in the node structure.
   */
  protected static mapRelationships = <
    TPrototype extends TCommonMissionPrototype,
  >(
    prototypes: Map<string, TPrototype>,
    structure: AnyObject,
    rootPrototype: TPrototype,
  ) => {
    let children: TPrototype[] = []
    let childrenKeyValuePairs: Array<[string, AnyObject]> =
      Object.entries(structure)

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
   * @param root The root prototype from which to determine the structure.
   * @returns The raw structure.
   */
  protected static determineStructure(
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
          cursorStructure[child.structureKey] = operation(child)
        } else {
          cursorStructure[child.structureKey] = {}
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
    forceId: string | null | undefined,
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

  /**
   * Gets a prototype from the mission by its ID.
   * @param mission The mission to get the prototype from.
   * @param prototypeId The ID of the prototype to get.
   * @returns The prototype with the given ID, or undefined if no prototype is found.
   */
  public static getPrototype<
    TMission extends TCommonMissionJson | TCommonMission,
  >(
    mission: TMission,
    prototypeId: string | undefined,
  ): TMission['prototypes'][0] | undefined {
    return prototypeId
      ? mission.prototypes.find(({ _id }) => _id === prototypeId)
      : undefined
  }
}

/* ------------------------------ MISSION TYPES ------------------------------ */

/**
 * Common types for Mission objects.
 * @note Used as a generic argument for all base,
 * mission-related classes.
 */
export type TCommonMissionTypes = {
  session: TCommonSession
  member: TCommonSessionMember
  user: TCommonUser
  mission: TCommonMission
  force: TCommonMissionForce
  output: TCommonOutput
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
   * The version number of the mission.
   */
  versionNumber: number
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
    prototypeId: TCommonMissionPrototype['_id'] | undefined,
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
   * The version number of the mission.
   */
  versionNumber: number
  /**
   * The seed for the mission. Pre-determines outcomes.
   */
  seed: string
  /**
   * The tree structure used to determine the relationships and positions of the nodes in the mission.
   */
  structure: AnyObject
  /**
   * The forces in the mission.
   */
  forces: TCommonMissionForceJson[]
  /**
   * The prototype nodes for the mission.
   */
  prototypes: TCommonMissionPrototypeJson[]
}

/**
 * Options for creating a Mission object.
 */
export type TMissionOptions = {
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
 * Options for Mission.toJson with `exportType` set to 'session-force-specific'.
 */
export type TMissionJsonSessionForceSpecificOptions =
  TMissionJsonBaseOptions & {
    /**
     * An export of a mission to be used in a session.
     * This export will only include the data available
     * to a participant participating in the force with
     * the ID passed.
     */
    exportType: 'session-force-specific'
    /**
     * The ID of the force to include in the export.
     */
    forceId: TCommonMissionForce['_id']
    /**
     * The user's ID to include in the export.
     */
    userId: TCommonUser['_id']
  }

/**
 * Options for Mission.toJson with `exportType` set to 'session-complete'.
 */
export type TMissionJsonSessionCompleteOptions = TMissionJsonBaseOptions & {
  /**
   * An export of a mission to be used in a session.
   * This export will include all data.
   */
  exportType: 'session-complete'
  /**
   * The user's ID to include in the export.
   */
  userId: TCommonUser['_id']
}

/**
 * Options for Mission.toJSON.
 */
export type TMissionJsonOptions =
  | TMissionJsonStandardOptions
  | TMissionJsonSessionLimitedOptions
  | TMissionJsonSessionForceSpecificOptions
  | TMissionJsonSessionCompleteOptions

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
