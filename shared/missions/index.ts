import { v4 as generateHash } from 'uuid'
import { MetisComponent, TCreateJsonType, TMetisBaseComponents } from '..'
import context from '../context'
import { DateToolbox } from '../toolbox/dates'
import { AnyObject } from '../toolbox/objects'
import User, { TCreatedByJson } from '../users'
import { TAction, TMissionActionJson } from './actions'
import { TExecution } from './actions/executions'
import MissionComponent, { TMissionComponentDefect } from './component'
import { TEffect, TEffectJson } from './effects'
import { TMissionFileJson } from './files'
import {
  MissionForce,
  TForce,
  TMissionForceJson,
  TMissionForceSaveJson,
} from './forces'
import { TNode } from './nodes'
import MissionPrototype, {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
  TPrototype,
} from './nodes/prototypes'

/**
 * This represents a mission for a student to complete.
 */
export default abstract class Mission<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, Mission<T>> {
  /**
   * The mission associated with the component.
   * @note This is only used to properly implement `TMissionComponent`.
   * Technically, this field just references `this`.
   */
  public get mission(): this {
    return this
  }

  /**
   * All nodes that exist in the mission.
   */
  public get nodes(): TNode<T>[] {
    return this.forces.flatMap((force) => force.nodes)
  }

  /**
   * All actions that exist in the mission.
   */
  public get actions(): Map<string, TAction<T>> {
    let actions = new Map<string, TAction<T>>()

    for (let node of this.nodes) {
      for (let action of node.actions.values()) {
        actions.set(action._id, action)
      }
    }

    return actions
  }

  /**
   * All effects that exist in the mission.
   */
  public get effects(): TEffect<T>[] {
    return Array.from(this.actions.values()).flatMap((action) => action.effects)
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [this]
  }

  // Implemented
  public get defects(): TMissionComponentDefect[] {
    return Mission.consolidateDefects(
      ...this.prototypes,
      ...this.forces,
      ...this.files,
    )
  }

  /**
   * The file name to use to store an export for the mission.
   */
  public get fileName(): string {
    return Mission.determineFileName(this.name)
  }

  /**
   * The version number of the mission.
   */
  public versionNumber: number

  /**
   * The seed for the mission. Pre-determines outcomes.
   */
  public seed: string

  /**
   * A label given to resources that defines the currency used in the mission.
   */
  public resourceLabel: string

  /**
   * The date/time the mission was created.
   */
  public createdAt: Date | null

  /**
   * The date/time the mission was last updated.
   */
  public updatedAt: Date | null

  /**
   * The date/time the mission was last launched.
   */
  public launchedAt: Date | null

  /**
   * The user who created the mission.
   */
  public createdBy: T['user'] | null

  /**
   * The username of the user who created the mission.
   * @note This is needed in the event that the user
   * has been deleted, yet the mission still exists. The
   * username will then be displayed in the UI for the mission.
   */
  public createdByUsername: string | null

  /**
   * Prototype nodes for the mission, representing the mission's node
   * structure outside of any forces.
   */
  public prototypes: TPrototype<T>[]

  /**
   * Forces in the mission, representing different implementation of nodes
   * from their corresponding prototypes.
   */
  public forces: TForce<T>[]

  /**
   * Files attached to the mission that will be used
   * during gameplay.
   */
  public files: T['missionFile'][]

  /**
   * The root prototype of the mission.
   */
  public root: TPrototype<T>

  /**
   * The structure of the mission, representing the relationships between
   * the prototypes in the mission.
   */
  public get structure(): AnyObject {
    return Mission.determineStructure(this.root)
  }

  protected constructor(
    _id: string,
    name: string,
    versionNumber: number,
    seed: string,
    resourceLabel: string,
    createdAt: Date | null,
    updatedAt: Date | null,
    launchedAt: Date | null,
    createdBy: User | null,
    createdByUsername: string | null,
    structure: AnyObject,
    prototypeData: TMissionPrototypeJson[],
    forceData: TMissionForceJson[],
    fileData: TMissionFileJson[],
  ) {
    super(_id, name, false)

    this.versionNumber = versionNumber
    this.seed = seed
    this.resourceLabel = resourceLabel
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.launchedAt = launchedAt
    this.createdBy = createdBy
    this.createdByUsername = createdByUsername

    this.prototypes = []
    this.forces = []
    this.files = []
    this.root = this.initializeRoot()

    this.importStructure(structure, prototypeData)
    this.importForces(forceData)
    this.importFiles(fileData)
  }

  /**
   * @param component The component in question.
   * @returns Whether the given component is a part of
   * this mission.
   */
  public has(component: MissionComponent<T, Mission<T>>): boolean {
    return component.mission._id === this._id
  }

  /**
   * Converts the mission to JSON.
   * @param options The options for converting the mission to JSON.
   * @returns the JSON for the mission.
   */
  public toJson(options: TMissionJsonOptions = {}): TMissionJson {
    let {
      idExposure = true,
      forceExposure = Mission.DEFAULT_FORCE_EXPOSURE,
      fileExposure = Mission.DEFAULT_FILE_EXPOSURE,
    } = options
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
      createdBy: null,
      createdByUsername: null,
      structure: {},
      forces: [],
      files: [],
      prototypes: [],
      effects: [],
    }

    /**
     * @param forceId An ID of a force.
     * @returns The force with the given ID.
     * @throws An error if the force with the given ID is not found.
     */
    const determineForce = (forceId: TForce<T>['_id']) => {
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
    const addForces = (force?: TForce<T>) => {
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
    const addStructuralData = (force?: TForce<T>) => {
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

    /**
     * Adds files to the JSON based on the parameters passed.
     * @param force If passed, only the files that are accessible
     * to the given force will be added to the JSON.
     */
    const addFiles = (force?: TForce<T>) => {
      let filesToAdd: T['missionFile'][] = []

      // Filter files based on the force passed,
      // if one is passed.
      if (force) {
        filesToAdd = this.files.filter((file) => file.hasAccess(force))
      } else {
        filesToAdd = this.files
      }

      json.files = filesToAdd.map((file) => file.toJson())
    }

    // Add createdBy and createdByUsername to the JSON,
    // if not null.
    if (this.createdBy) json.createdBy = this.createdBy.toCreatedByJson()
    if (this.createdByUsername) json.createdByUsername = this.createdByUsername

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
      default:
        break
    }

    // Expose files in the JSON.
    switch (fileExposure.expose) {
      case 'all':
        addFiles()
        break
      case 'accessible':
        force = determineForce(fileExposure.forceId)
        addFiles(force)
        break
      case 'none':
      default:
        break
    }

    // Return the result.
    return json
  }

  /**
   * Returns the mission as a JSON object that can be saved
   * to the database.
   * @param options Passed to {@link Mission.toJson}.
   * @returns The JSON object representing the mission.
   */
  public toSaveJson(options: TMissionJsonOptions = {}): TMissionSaveJson {
    let json: TMissionJson = this.toJson(options)

    if (!json.createdBy || !json.createdByUsername) {
      throw new Error('Mission must have a creator to be saved.')
    }

    return {
      ...json,
      createdBy: json.createdBy,
      createdByUsername: json.createdByUsername,
    }
  }

  /**
   * Generates a new key for the force.
   * @returns The new key for the force.
   */
  public generateForceKey(): string {
    // Initialize
    let newKey: number = 0

    for (let force of this.forces) {
      let forceKey: number = Number(force.localKey)
      // If the force has a local key, and it is greater than the current
      // new key, set the new key to the force's local key.
      if (forceKey > newKey) newKey = Math.max(newKey, forceKey)
    }

    // Increment the new key by 1 and return it as a string.
    newKey++
    return String(newKey)
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
    prototypeData: TMissionPrototypeJson[],
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
    data?: Partial<TMissionPrototypeJson>,
    options?: TMissionPrototypeOptions<TPrototype<T>>,
  ): TPrototype<T>

  /**
   * Imports the force data into MissionForce objects and
   * stores it in the array of forces.
   * @param data The force data to parse.
   * @returns The parsed force data.
   */
  protected abstract importForces(data: TMissionForceSaveJson[]): void

  /**
   * Imports the file data into the mission.
   * @param data The file data to parse.
   */
  protected abstract importFiles(data: TMissionFileJson[]): void

  /**
   * @param prototypeId The ID of the prototype to get.
   * @returns The prototype with the given ID, or undefined
   * if no prototype is found.
   */
  public getPrototype(
    prototypeId: TPrototype<T>['_id'] | undefined,
  ): TPrototype<T> | undefined {
    if (prototypeId === this.root._id) return this.root
    else return this.prototypes.find(({ _id }) => _id === prototypeId)
  }

  /**
   * @param forceId The ID of the force to get.
   * @returns The force with the given ID, or undefined
   * if no force is found.
   */
  public getForceById(
    forceId: TForce<T>['_id'] | null | undefined,
  ): TForce<T> | undefined {
    return Mission.getForceById(this, forceId)
  }

  /**
   * @param forceKey The local key of the force to get.
   * @returns The force with the given local key, or undefined
   * if no force is found.
   */
  public getForceByLocalKey(
    forceKey: TForce<T>['localKey'] | null | undefined,
  ): TForce<T> | undefined {
    return Mission.getForceByLocalKey(this, forceKey)
  }

  /**
   * @param nodeId The ID of the node to get.
   * @returns The node with the given ID, or undefined
   * if no node is found.
   */
  public getNodeById(
    nodeId: MetisComponent['_id'] | null | undefined,
  ): TNode<T> | undefined {
    return Mission.getNodeById(this, nodeId)
  }

  /**
   * @param forceKey The local key of the force that the node belongs to.
   * @param nodeKey The local key of the node to get.
   * @returns The node with the given local key, or undefined
   * if no node is found.
   */
  public getNodeByLocalKey(
    forceKey: TForce<T>['localKey'] | null | undefined,
    nodeKey: TNode<T>['localKey'] | null | undefined,
  ): TNode<T> | undefined {
    return Mission.getNodeByLocalKey(this, forceKey, nodeKey)
  }

  /**
   * @param actionId The ID of the action to get.
   * @returns The action with the given ID, or undefined
   * if the action is not found.
   */
  public getActionById(
    actionId: MetisComponent['_id'] | null | undefined,
  ): TAction<T> | TMissionActionJson | undefined {
    return Mission.getActionById(this, actionId)
  }

  /**
   * @param forceKey The local key of the force that the action belongs to.
   * @param nodeKey The local key of the node that the action belongs to.
   * @param actionKey The local key of the action to get.
   * @returns The action with the given local key, or undefined
   * if the action is not found.
   */
  public getActionByLocalKey(
    forceKey: TForce<T>['localKey'] | null | undefined,
    nodeKey: TNode<T>['localKey'] | null | undefined,
    actionKey: TAction<T>['localKey'] | null | undefined,
  ): TAction<T> | TMissionActionJson | undefined {
    return Mission.getActionByLocalKey(this, forceKey, nodeKey, actionKey)
  }

  /**
   * @param fileId The ID of the file to get.
   * @returns The file with the given ID, or undefined
   * if the file is not found.
   */
  public getFileById(
    fileId: string | null | undefined,
  ): T['missionFile'] | undefined {
    return this.files.find((file) => file._id === fileId)
  }

  /**
   * @param executionId The ID of the execution to get.
   * @returns The execution with the given ID, or undefined
   * if the execution is not found.
   */
  public getExecution(
    executionId: MetisComponent['_id'],
  ): TExecution<T> | undefined {
    for (let node of this.nodes.values()) {
      let execution = node.getExecution(executionId)
      if (execution) return execution
    }
    return undefined
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
   * The default file exposure options when exporting
   * a mission with the `toJson` method.
   */
  public static get DEFAULT_FILE_EXPOSURE(): TFileExposure {
    return {
      expose: 'all',
    }
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionDefaultJson> {
    return {
      _id: generateHash(),
      name: 'New Mission',
      versionNumber: 1,
      seed: generateHash(),
      resourceLabel: 'Resources',
      createdAt: null,
      updatedAt: null,
      launchedAt: null,
      createdBy: null,
      createdByUsername: null,
      structure: {},
      forces: [MissionForce.DEFAULT_FORCES[0]],
      prototypes: [MissionPrototype.DEFAULT_PROPERTIES],
      files: [],
      effects: [],
    }
  }

  /**
   * Determines the file name to use for the export
   * of the given name for a mission.
   * @param name The name of the mission.
   * @returns The file name to use for the export.
   */
  public static determineFileName(name: string): string {
    return `${name}_${DateToolbox.fileName}.metis.zip`.replace(
      /[^a-zA-Z0-9À-ÖØ-öø-ÿ._-]/g,
      '-',
    )
  }

  /**
   * Maps relationships between prototypes passed based on the structure passed, recursively.
   * @param prototypes The prototypes to map.
   * @param structure The node structure from which to map the relationships.
   * @param rootPrototype The root prototype of the structure. This root prototype should not be defined in the prototype map, nor in the node structure.
   */
  protected static mapRelationships = <TPrototype extends MissionPrototype>(
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
  protected static determineStructure(root: MissionPrototype): AnyObject {
    /**
     * The recursive algorithm used to determine the structure.
     * @param cursor The current prototype being processed.
     * @param cursorStructure The structure of the current prototype being processed.
     */
    const operation = (
      cursor: MissionPrototype = root,
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
  public static getForceById<TMission extends TMissionJson | Mission>(
    mission: TMission,
    forceId: string | null | undefined,
  ): TMission['forces'][0] | undefined {
    return mission.forces.find((force) => force._id === forceId)
  }

  /**
   * Gets a force from the mission by its local key.
   * @param mission The mission to get the force from.
   * @param forceKey The local key of the force to get.
   * @returns The force with the given local key, or undefined if no force is found.
   */
  public static getForceByLocalKey<TMission extends TMissionJson | Mission>(
    mission: TMission,
    forceKey: string | null | undefined,
  ): TMission['forces'][0] | undefined {
    return mission.forces.find((force) => force.localKey === forceKey)
  }

  /**
   * Gets a node from the mission by its ID.
   * @param mission The mission to get the node from.
   * @param nodeId The ID of the node to get.
   * @returns The node with the given ID, or undefined if no node is found.
   */
  public static getNodeById<TMission extends TMissionJson | Mission>(
    mission: TMission,
    nodeId: string | null | undefined,
  ): TMission['forces'][0]['nodes'][0] | undefined {
    for (let force of mission.forces) {
      let node = force.nodes.find((node) => node._id === nodeId)
      if (node) return node
      continue
    }
    return undefined
  }

  /**
   * Gets a node from the mission by its local key.
   * @param mission The mission to get the node from.
   * @param forceKey The local key of the force that the node belongs to.
   * @param nodeKey The local key of the node to get.
   * @returns The node with the given local key, or undefined if no node is found.
   */
  public static getNodeByLocalKey<TMission extends TMissionJson | Mission>(
    mission: TMission,
    forceKey: string | null | undefined,
    nodeKey: string | null | undefined,
  ): TMission['forces'][0]['nodes'][0] | undefined {
    let force = mission.forces.find((force) => force.localKey === forceKey)
    if (!force) return undefined
    return force.nodes.find((node) => node.localKey === nodeKey)
  }

  /**
   * Gets a prototype from the mission by its ID.
   * @param mission The mission to get the prototype from.
   * @param prototypeId The ID of the prototype to get.
   * @returns The prototype with the given ID, or undefined if no prototype is found.
   */
  public static getPrototype<
    TMission extends TMissionJson | TMissionSaveJson | Mission,
  >(
    mission: TMission,
    prototypeId: string | undefined,
  ): TMission['prototypes'][0] | undefined {
    return mission.prototypes.find(({ _id }) => _id === prototypeId)
  }

  /**
   * Gets an action from the mission by its ID.
   * @param mission The mission to get the action from.
   * @param actionId The ID of the action to get.
   * @returns The action with the given ID, or undefined if no action is found.
   */
  public static getActionById<
    TMission extends TMissionJson | Mission,
    TAction extends TMetisBaseComponents['action'],
  >(
    mission: TMission,
    actionId: string | null | undefined,
  ): TAction | TMissionActionJson | undefined {
    if (!actionId) return undefined

    for (let force of mission.forces) {
      for (let node of force.nodes) {
        let action = Array.isArray(node.actions)
          ? node.actions.find((action) => action._id === actionId)
          : node.actions.get(actionId)
        if (action) return action
        continue
      }
    }

    return undefined
  }

  /**
   * Gets an action from the mission by its local key.
   * @param mission The mission to get the action from.
   * @param forceKey The local key of the force that the action belongs to.
   * @param nodeKey The local key of the node that the action belongs to.
   * @param actionKey The local key of the action to get.
   * @returns The action with the given local key, or undefined if no action is found.
   */
  public static getActionByLocalKey<
    TMission extends TMissionJson | Mission,
    TAction extends TMetisBaseComponents['action'],
  >(
    mission: TMission,
    forceKey: string | null | undefined,
    nodeKey: string | null | undefined,
    actionKey: string | null | undefined,
  ): TAction | TMissionActionJson | undefined {
    if (!forceKey || !nodeKey || !actionKey) return undefined

    let force = mission.forces.find((force) => force.localKey === forceKey)
    if (!force) return undefined

    let node = force.nodes.find((node) => node.localKey === nodeKey)
    if (!node) return undefined

    const { actions } = node
    let action = undefined

    if (Array.isArray(actions)) {
      action = actions.find((a) => a.localKey === actionKey)
    } else if (actions instanceof Map) {
      let actionsArray = Array.from(actions.values())
      action = actionsArray.find((a) => a.localKey === actionKey)
    }

    return action
  }
}

/* ------------------------------ MISSION TYPES ------------------------------ */

/**
 * Type registry for base mission component classes.
 */
export type TBaseMissionComponents = Pick<
  TMetisBaseComponents,
  | 'mission'
  | 'prototype'
  | 'missionFile'
  | 'force'
  | 'output'
  | 'node'
  | 'action'
  | 'effect'
>

/**
 * Extracts the mission type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The mission type.
 */
export type TMission<T extends TMetisBaseComponents> = T['mission']

/**
 * JSON representation of a `Mission` object.
 */
export type TMissionJson = TCreateJsonType<
  Mission,
  'name' | 'versionNumber' | 'seed' | 'resourceLabel',
  {
    _id?: string
    createdAt: string | null
    updatedAt: string | null
    launchedAt: string | null
    createdBy: TCreatedByJson | string | null
    createdByUsername: string | null
    forces: TMissionForceJson[]
    prototypes: TMissionPrototypeJson[]
    structure: AnyObject
    files: TMissionFileJson[]
    effects: TEffectJson[]
  }
>

/**
 * JSON representation of the default values for a
 * Mission object.
 */
export interface TMissionDefaultJson extends TMissionJson {
  createdAt: null
  updatedAt: null
  launchedAt: null
  createdBy: null
  createdByUsername: null
}

/**
 * JSON data for a mission that is known to exist
 * in the METIS database.
 */
export interface TMissionExistingJson extends TMissionJson {
  // Require values that are no longer optional
  // post save.
  _id: string
  createdAt: string
  updatedAt: string
  createdBy: TCreatedByJson | string
  createdByUsername: string
}

/**
 * JSON data for a mission that is known to exist
 * in the METIS database, but does not include
 * any force, prototype, or file data.
 */
export type TMissionShallowExistingJson = Omit<
  TMissionExistingJson,
  'forces' | 'prototypes' | 'files' | 'structure'
>

/**
 * Session-agnostic JSON representation of a Mission object
 * which can be saved to a database.
 */
export type TMissionSaveJson = Omit<TMissionJson, 'forces'> & {
  createdBy: TCreatedByJson | string
  createdByUsername: string
  forces: TMissionForceSaveJson[]
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
  /**
   * The exposure of the files within the mission.
   * @default { expose: 'all' }
   */
  fileExposure?: TFileExposure
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
  | { expose: 'user-specific'; userId: User['_id'] }
  | { expose: 'none' }

/**
 * Options for `TMissionJsonOptions.forceExposure`.
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
  | { expose: 'force-with-all-nodes'; forceId: string }
  | { expose: 'force-with-revealed-nodes'; forceId: string }
  | { expose: 'none' }

/**
 * Options for `TMissionJsonOptions.fileExposure`.
 * @option 'all'
 * All files are exposed.
 * @option 'accessible'
 * Only the files that are accessible to the given force
 * are exposed.
 * @option 'none'
 * No files are exposed.
 */
export type TFileExposure =
  | { expose: 'all' }
  | { expose: 'accessible'; forceId: string }
  | { expose: 'none' }

/**
 * Defines the type for the `path` property
 * of a mission component.
 */
export type TMissionComponentPath<
  T extends TMetisBaseComponents,
  Self extends MissionComponent<T, Self>,
> = [...MissionComponent<any, any>[], Self]
