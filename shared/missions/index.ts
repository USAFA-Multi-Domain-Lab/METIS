import { TCommonSession } from 'metis/sessions'
import { TCommonSessionMember } from 'metis/sessions/members'
import { TCommonTargetEnv } from 'metis/target-environments'
import { TCommonTarget } from 'metis/target-environments/targets'
import { TCommonUser } from 'metis/users'
import { v4 as generateHash } from 'uuid'
import context from '../context'
import { DateToolbox } from '../toolbox/dates'
import { AnyObject } from '../toolbox/objects'
import { TAction, TCommonMissionAction } from './actions'
import { TCommonActionExecution } from './actions/executions'
import IActionOutcome from './actions/outcomes'
import { TCommonEffect, TEffect } from './effects'
import {
  MissionForce,
  TCommonMissionForce,
  TCommonMissionForceJson,
  TForce,
  TMissionForceJson,
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
  public get fileName(): string {
    return Mission.determineFileName(this.name)
  }

  // Implemented
  public versionNumber: number

  // Implemented
  public prototypes: TPrototype<T>[]

  // Implemented
  public forces: TForce<T>[]

  // Implemented
  public seed: string

  // Implemented
  public resourceLabel: string

  // Implemented
  public createdAt: Date | null

  // Implemented
  public updatedAt: Date | null

  // Implemented
  public launchedAt: Date | null

  // Implemented
  public root: TPrototype<T>

  // Implemented
  public get structure(): AnyObject {
    return Mission.determineStructure(this.root)
  }

  /**
   * @param data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data: Partial<TMissionJson> = Mission.DEFAULT_PROPERTIES,
    options: TMissionOptions = {},
  ) {
    this._id = data._id ?? Mission.DEFAULT_PROPERTIES._id
    this.name = data.name ?? Mission.DEFAULT_PROPERTIES.name
    this.versionNumber =
      data.versionNumber ?? Mission.DEFAULT_PROPERTIES.versionNumber
    this.seed = data.seed ?? Mission.DEFAULT_PROPERTIES.seed
    this.resourceLabel =
      data.resourceLabel ?? Mission.DEFAULT_PROPERTIES.resourceLabel
    this.createdAt = DateToolbox.fromNullableISOString(
      data.createdAt ?? Mission.DEFAULT_PROPERTIES.createdAt,
    )
    this.updatedAt = DateToolbox.fromNullableISOString(
      data.updatedAt ?? Mission.DEFAULT_PROPERTIES.updatedAt,
    )
    this.launchedAt = DateToolbox.fromNullableISOString(
      data.launchedAt ?? Mission.DEFAULT_PROPERTIES.launchedAt,
    )
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
  public toJson(options: TMissionJsonOptions = {}): TMissionJson {
    let { idExposure = true, forceExposure = Mission.DEFAULT_FORCE_EXPOSURE } =
      options
    let force: TForce<T> | undefined
    // Predefine limited JSON.
    let json: TMissionJson = {
      name: this.name,
      versionNumber: this.versionNumber,
      seed: this.seed,
      resourceLabel: this.resourceLabel,
      createdAt: DateToolbox.toNullableISOString(this.createdAt),
      updatedAt: DateToolbox.toNullableISOString(this.updatedAt),
      launchedAt: DateToolbox.toNullableISOString(this.launchedAt),
      structure: {},
      forces: [],
      prototypes: [],
    }

    /**
     * @param forceId An ID of a force.
     * @returns The force with the given ID.
     * @throws An error if the force with the given ID is not found.
     */
    const determineForce = (forceId: TCommonMissionForce['_id']) => {
      force = this.forces.find(({ _id }) => _id === forceId)
      if (!force) {
        throw Error(
          `Invalid force ID "${forceId}" passed during mission export.`,
        )
      }
      return force
    }

    /**
     * Adds forces to the JSON based on the parameters passed.
     * @param force If included, only this force will be added to the JSON,
     * otherwise all forces will be added.
     */
    const addForces = (force?: TCommonMissionForce) => {
      if (force) json.forces.push(force.toJson(options))
      else json.forces = this.forces.map((force) => force.toJson(options))
    }

    /**
     * Adds structural data to the JSON, including the
     * structure and the prototypes, based on the
     * parameters passed.
     * @param force If passed, only the revealed structure
     * and revealed prototypes of this force will be added
     * to the JSON.
     */
    const addStructuralData = (force?: TCommonMissionForce) => {
      if (force) {
        json.structure = force.revealedStructure
        json.prototypes = force.revealedPrototypes.map((prototype) =>
          prototype.toJson(options),
        )
      } else {
        json.structure = this.structure
        json.prototypes = this.prototypes.map((prototype) =>
          prototype.toJson(options),
        )
      }
    }

    // Expose the ID if the option is set.
    if (idExposure) json._id = this._id

    // Expose relevant forces in the JSON.
    switch (forceExposure.expose) {
      case 'all':
        addForces()
        addStructuralData()
        break
      case 'force-with-all-nodes':
        force = determineForce(forceExposure.forceId)
        addForces(force)
        addStructuralData()
        break
      case 'force-with-revealed-nodes':
        force = determineForce(forceExposure.forceId)
        addForces(force)
        addStructuralData(force)
        break
      case 'none':
        break
    }

    // Return the result.
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
   * The maximum length allowed for a mission resource
   * label.
   */
  public static readonly MAX_RESOURCE_LABEL_LENGTH: number = 16

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
   * The default session data exposure options when
   * exporting a mission with the `toJson` method.
   */
  public static get DEFAULT_SESSION_DATA_EXPOSURE(): TSessionDataExposure {
    return {
      expose: 'none',
    }
  }

  /**
   * The default force exposure options when exporting
   * a mission with the `toJson` method.
   */
  public static get DEFAULT_FORCE_EXPOSURE(): TForceExposure {
    return {
      expose: 'all',
    }
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionJson> {
    return {
      _id: generateHash(),
      name: 'New Mission',
      versionNumber: 1,
      seed: generateHash(),
      resourceLabel: 'Resources',
      createdAt: null,
      updatedAt: null,
      launchedAt: null,
      structure: {},
      forces: [MissionForce.DEFAULT_FORCES[0]],
      prototypes: [MissionPrototype.DEFAULT_PROPERTIES],
    }
  }

  /**
   * Determines the file name to use for the export
   * of the given name for a mission.
   * @param name The name of the mission.
   * @returns The file name to use for the export.
   */
  public static determineFileName(name: string): string {
    return `${name}.metis`.replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ._-]/g, '-')
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
  public static getForce<TMission extends TMissionJson | TCommonMission>(
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
  public static getNode<TMission extends TMissionJson | TCommonMission>(
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
  public static getPrototype<TMission extends TMissionJson | TCommonMission>(
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
  execution: TCommonActionExecution
  outcome: IActionOutcome
  targetEnv: TCommonTargetEnv
  target: TCommonTarget
  effect: TCommonEffect
}

/**
 * One of the types outlined in `TCommonMissionTypes`.
 */
export type TCommonMissionType = TCommonMissionTypes[keyof TCommonMissionTypes]

/**
 * Creates a JSON representation type from a common mission type.
 * @param T The common mission type (TCommonMission, TCommonMissionNode, etc.).
 * @param TDirect The keys of T to translate directly to the JSON as the exact same type (string -> string, number -> number).
 * @param TIndirect The keys of T to translate to the JSON as a different type (string -> string[], number -> string).
 * @returns The JSON representation type.
 */
export type TCreateMissionJsonType<
  T extends TCommonMissionType,
  TDirect extends keyof T,
  TIndirect extends { [k in keyof T]?: any } = {},
> = {
  [k in TDirect]: T[k]
} & {
  [k in keyof TIndirect]: TIndirect[k]
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
   * The file name to use to store an export for the mission.
   */
  get fileName(): string
  /**
   * The version number of the mission.
   */
  versionNumber: number
  /**
   * The seed for the mission. Pre-determines outcomes.
   */
  seed: string
  /**
   * A label given to resources that defines the currency used in the mission.
   */
  resourceLabel: string
  /**
   * The date/time the mission was created.
   */
  createdAt: Date | null
  /**
   * The date/time the mission was last updated.
   */
  updatedAt: Date | null
  /**
   * The date/time the mission was last launched.
   */
  launchedAt: Date | null
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
   * The structure of the mission, representing the relationships between
   * the prototypes in the mission.
   */
  structure: AnyObject
  /**
   * Converts the mission to JSON.
   * @param options The options for converting the mission to JSON.
   * @returns the JSON for the mission.
   */
  toJson: (options?: TMissionJsonOptions) => TMissionJson
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
 * JSON representation of a `Mission` object.
 */
export type TMissionJson = TCreateMissionJsonType<
  TCommonMission,
  'name' | 'versionNumber' | 'seed' | 'resourceLabel' | 'structure',
  {
    _id?: string
    createdAt: string | null
    updatedAt: string | null
    launchedAt: string | null
    forces: TMissionForceJson[]
    prototypes: TCommonMissionPrototypeJson[]
  }
>

/**
 * Plain non-session-specific JSON representation of a `Mission` object.
 */
export type TCommonMissionJson = Omit<TMissionJson, 'forces'> & {
  forces: TCommonMissionForceJson[]
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

export type TMissionJsonOptions = {
  /**
   * Whether or not to expose the mission ID in the JSON.
   * @default true
   */
  idExposure?: boolean
  /**
   * Whether or not to expose session-specific data in the
   * export.
   * @default { expose: 'none' }
   */
  sessionDataExposure?: TSessionDataExposure
  /**
   * The exposure of the forces within the mission.
   * @default { expose: 'all' }
   */
  forceExposure?: TForceExposure
}

/**
 * Options for `TMissionJsonOptions.sessionDataExposure`.
 * @option 'all'
 * All session data is exposed.
 * @option 'user-specific'
 * Only session data relevant to the user is exposed.
 * @option 'none'
 * No session data is exposed.
 */
export type TSessionDataExposure =
  | { expose: 'all' }
  | { expose: 'user-specific'; userId: TCommonUser['_id'] }
  | { expose: 'none' }

/**
 * @option 'all'
 * All forces are exposed, along with all nodes.
 * @option 'force-with-all-nodes'
 * Only the force with the given ID is exposed,
 * along with all nodes.
 * @option 'force-with-revealed-nodes'
 * Only the force with the given ID is exposed,
 * along with any revealed nodes, only.
 * @option 'none'
 * No forces are exposed.
 */
export type TForceExposure =
  | { expose: 'all' }
  | { expose: 'force-with-all-nodes'; forceId: TCommonMissionForce['_id'] }
  | { expose: 'force-with-revealed-nodes'; forceId: TCommonMissionForce['_id'] }
  | { expose: 'none' }
