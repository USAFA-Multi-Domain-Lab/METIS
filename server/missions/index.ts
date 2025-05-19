import Mission, { TMissionJson, TMissionSaveJson } from 'metis/missions'
import { TMissionFileJson } from 'metis/missions/files'
import { TMissionForceSaveJson } from 'metis/missions/forces'
import {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from 'metis/missions/nodes/prototypes'
import NumberToolbox from 'metis/toolbox/numbers'
import { HEX_COLOR_REGEX } from 'metis/toolbox/strings'
import mongoose, {
  AnyObject,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose'
import seedrandom, { PRNG } from 'seedrandom'
import MetisDatabase from '../database'
import { TMetisServerComponents } from '../index'
import { databaseLogger } from '../logging'
import { TTargetEnvExposedMission } from '../target-environments/context'
import ServerMissionFile from './files'
import ServerMissionForce from './forces'
import ServerMissionPrototype from './nodes/prototypes'

const ObjectId = mongoose.Types.ObjectId

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<TMetisServerComponents> {
  /**
   * The RNG used to generate random numbers for the mission.
   */
  protected _rng: PRNG | undefined
  /**
   * The RNG used to generate random numbers for the mission.
   */
  public get rng(): PRNG {
    // Initialize RNG if not done already. This
    // cannot be done in the constructor due to
    // this value being needed in the super call.
    if (this._rng === undefined) {
      this._rng = seedrandom(`${this.seed}`)
    }
    return this._rng
  }

  /**
   * @param data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data:
      | Partial<TMissionJson>
      | Partial<TMissionSaveJson> = ServerMission.DEFAULT_PROPERTIES,
  ) {
    // Initialize base properties.
    super(data)
  }

  // Implemented
  protected initializeRoot(): ServerMissionPrototype {
    return new ServerMissionPrototype(this, { _id: 'ROOT' })
  }

  // Implemented
  public importPrototype(
    data: Partial<TMissionPrototypeJson> = ServerMissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<ServerMissionPrototype> = {},
  ): ServerMissionPrototype {
    let root: ServerMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (root === null) {
      throw new Error('Cannot spawn prototype: Mission has no root prototype.')
    }

    // Create new prototype.
    let prototype: ServerMissionPrototype = new ServerMissionPrototype(
      this,
      data,
      options,
    )

    // Set the parent prototype to the root
    // prototype.
    prototype.parent = root
    // Add the prototype to the root prototype's
    // children.
    root.children.push(prototype)
    // Add the prototype to the prototype list.
    this.prototypes.push(prototype)

    // Return the prototype.
    return prototype
  }

  // Implemented
  protected importForces(data: TMissionForceSaveJson[]): void {
    let forces = data.map((datum) => new ServerMissionForce(this, datum))
    this.forces.push(...forces)
  }

  // Implemented
  protected importFiles(data: TMissionFileJson[]): void {
    let files: ServerMissionFile[] = data.map((datum) =>
      ServerMissionFile.fromJson(datum, this),
    )
    this.files.push(...files)
  }

  /**
   * Extracts the necessary properties from the mission to be used as a reference
   * in a target environment.
   * @returns The mission's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvExposedMission {
    return {
      _id: this._id,
      name: this.name,
      forces: this.forces.map((force) => force.toTargetEnvContext()),
      nodes: this.nodes.map((node) => node.toTargetEnvContext()),
    }
  }

  /**
   * Validates the forces of the mission.
   * @param forces The forces to validate.
   * @returns True if the forces are valid, false otherwise.
   */
  public static validateForces(forces: TMissionSaveJson['forces']): boolean {
    let forceKeys: TMissionForceSaveJson['localKey'][] = []

    for (const force of forces) {
      // Check for valid initial resources.
      const nonNegativeInteger = NumberToolbox.isNonNegativeInteger(
        force.initialResources,
      )
      if (!nonNegativeInteger) {
        throw MetisDatabase.generateValidationError(
          `The initial resources must be a positive integer for the force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }

      // Check for valid color.
      const isValidColor = HEX_COLOR_REGEX.test(force.color)
      if (!isValidColor) {
        throw MetisDatabase.generateValidationError(
          `The color "${force.color}" is not a valid hex color for the force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }

      // Check for duplicate local keys.
      if (forceKeys.includes(force.localKey)) {
        throw MetisDatabase.generateValidationError(
          `Duplicate local key "${force.localKey}" found for force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }
      forceKeys.push(force.localKey)
    }

    return true
  }

  /**
   * Validates the prototypes of the mission.
   * @param prototypes The prototypes to validate.
   * @returns True if the prototypes are valid, false otherwise.
   */
  public static validatePrototypes(
    prototypes: TMissionSaveJson['prototypes'],
  ): boolean {
    for (const prototype of prototypes) {
      const nonNegativeInteger = NumberToolbox.isNonNegativeInteger(
        prototype.depthPadding,
      )
      if (!nonNegativeInteger) {
        throw MetisDatabase.generateValidationError(
          `The depth padding must be a positive integer for the prototype "{ _id: ${prototype._id} }".`,
        )
      }
    }

    return true
  }

  /**
   * Algorithm to validate the mission's prototype structure tree.
   * @param currentStructure The current structure to validate.
   * @param rootKey The key of the current structure.
   * @param structureKeys The keys that are found in the structure.
   * @returns Any errors that are found and/or the structure keys that were found.
   */
  private static validateStructure = (
    currentStructure: any,
    rootKey: string = 'ROOT',
    structureKeys: TMissionPrototypeJson['structureKey'][] = [],
  ): TMissionValidationResults => {
    // If the current structure isn't an object...
    if (!(currentStructure instanceof Object)) {
      let error = MetisDatabase.generateValidationError(
        `Error in the mission's structure:\n"${rootKey}" is set to ${currentStructure}, which is not an object.`,
      )
      return { error }
    }

    // Loop through the current structure.
    for (let [key, value] of Object.entries(currentStructure)) {
      // If the key is already in the structureKeys,
      // then return an error.
      if (structureKeys.includes(key)) {
        let error = MetisDatabase.generateValidationError(
          `Error in the mission's structure:\nDuplicate structureKey used (${key}).`,
        )
        return { error }
      }
      // Otherwise, add the key to the structureKeys.
      else {
        structureKeys.push(key)
      }

      // Go deeper into the structure.
      let results: { error?: Error } = this.validateStructure(
        value,
        key,
        structureKeys,
      )

      // Check for any errors.
      if (results.error) {
        return results
      }
    }

    // Return the structureKeys if there are no errors.
    return {
      structureKeys,
    }
  }

  /**
   * Algorithm to check for duplicate _id's in the mission.
   * @param cursor The current object to check.
   * @param existingIds The existing _id's that have been found.
   * @returns Any errors that are found.
   */
  private static idCheckerAlgorithm = (
    cursor: AnyObject | AnyObject[],
    existingIds: AnyObject = {},
  ): TMissionValidationResults => {
    // If the cursor is an object, not an array, and not an ObjectId...
    if (
      cursor instanceof Object &&
      !Array.isArray(cursor) &&
      !(cursor instanceof ObjectId)
    ) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        let error = MetisDatabase.generateValidationError(
          `Error in mission:\nDuplicate _id used (${cursor._id}).`,
        )
        return { error }
      }
      // Or, if the cursor is a Mission and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof Mission &&
        !mongoose.isObjectIdOrHexString(cursor._id)
      ) {
        // ...then set the error and return.
        let error = MetisDatabase.generateValidationError(
          `Error in mission:\nInvalid _id used (${cursor._id}).`,
        )
        return { error }
      }
      // Otherwise, add the _id to the existingIds object.
      else if (cursor._id) {
        existingIds[cursor._id] = true
      }

      // Check the object's values for duplicate _id's.
      for (let value of Object.values(cursor)) {
        let results = this.idCheckerAlgorithm(value, existingIds)
        if (results.error) return results
      }
    }
    // Otherwise, if the cursor is an array...
    else if (Array.isArray(cursor)) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        let results = this.idCheckerAlgorithm(value, existingIds)
        if (results.error) return results
      }
    }

    // Return an empty object.
    return {}
  }

  /**
   * Validates all of the effects within the mission.
   * @param missionJson The mission JSON to validate.
   */
  private static validateMissionEffects = (
    missionJson: TMissionSaveJson,
  ): void => {
    try {
      let mission = new ServerMission(missionJson)

      for (let effect of mission.effects) {
        if (effect.defective) {
          throw new Error(effect.defectiveMessage)
        }
      }
    } catch (error: any) {
      databaseLogger.warn(error.message)
    }
  }

  /**
   * This will ensure the mission has between one and eight forces and that each prototype
   * in the mission has a corresponding node within each force.
   * @param missionJson The mission JSON to validate.
   * @param structureKeys The structure keys to validate.
   * @returns An error if any of the validation checks fail.
   */
  private static validateMissionForces = (
    missionJson: TMissionSaveJson,
    structureKeys: TMissionPrototypeJson['structureKey'][],
  ): TMissionValidationResults => {
    // Object to store results.
    let results: TMissionValidationResults = {}

    // Ensure correct number of forces exist
    // the mission.
    if (missionJson.forces.length < 1) {
      results.error = MetisDatabase.generateValidationError(
        `Error in mission:\nMission must have at least one force.`,
      )
      return results
    }
    if (missionJson.forces.length > 8) {
      results.error = MetisDatabase.generateValidationError(
        `Error in mission:\nMission can have no more than eight forces.`,
      )
      return results
    }

    // Loop through each force.
    for (let force of missionJson.forces) {
      // Used to ensure each node has a corresponding prototype.
      let prototypesRetrieved: TMissionPrototypeJson['_id'][] = []

      // Loop through nodes.
      for (let node of force.nodes) {
        // Get the prototype node's ID.
        let prototypeId = node.prototypeId
        // Get the prototype.
        let prototype = Mission.getPrototype(missionJson, prototypeId)

        // Ensure the prototype ID exists.
        if (!prototype) {
          results.error = MetisDatabase.generateValidationError(
            `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" does not exist in the mission's prototypes.`,
          )
          return results
        }

        // Ensure the node has a unique prototype.
        if (prototypesRetrieved.includes(prototype._id)) {
          results.error = MetisDatabase.generateValidationError(
            `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" has already been used for another node.`,
          )
          return results
        }

        // Ensure the prototype has the correct structure key.
        if (!structureKeys.includes(prototype.structureKey)) {
          results.error = MetisDatabase.generateValidationError(
            `Error in mission:\nStructure key "${prototype.structureKey}" is missing from "${force.name}".`,
          )
          return results
        }

        // Add the prototype to the array.
        prototypesRetrieved.push(prototype._id)
      }

      // Ensure all prototype nodes are present.
      let isMissingPrototype: boolean =
        prototypesRetrieved.length !== missionJson.prototypes.length

      // If a prototype node is missing from the force...
      if (isMissingPrototype) {
        // ...then find the missing prototype node.
        let prototypes = missionJson.prototypes
        let missingPrototype = prototypes.find(
          ({ _id }) => !prototypesRetrieved.includes(_id),
        )

        // Send the error.
        results.error = MetisDatabase.generateValidationError(
          `Error in mission:\nPrototype Node with ID "${missingPrototype?._id}" is missing from "${force.name}".`,
        )
        return results
      }
    }

    return results
  }

  /**
   * Validates the alias of a file in a mission.
   * @param value The value to validate.
   * @returns True if valid, false otherwise.
   */
  private static validateMissionFiles = (
    files: TMissionSaveJson['files'],
  ): TMissionValidationResults => {
    // Object to store results.
    let results: TMissionValidationResults = {}

    for (const file of files) {
      if (typeof file.alias !== 'string' && file.alias !== null) {
        results.error = MetisDatabase.generateValidationError(
          `Error in mission:\nAlias is neither a string or null for file with ID "${file._id}".`,
        )
        return results
      }
    }

    return results
  }

  /**
   * Validates the mission data.
   * @param missionJson The mission data to validate.
   * @param next The callback to call with the results.
   */
  public static validate(
    missionJson: TMissionSaveJson,
    next: CallbackWithoutResultAndOptionalError,
  ): void {
    // Get the initial structure.
    let initStructure: TMissionSaveJson['structure'] = missionJson.structure
    // Array to store the structure keys.
    let structureKeys: TMissionPrototypeJson['structureKey'][] = []
    // Object to store results.
    let results: TMissionValidationResults = {}

    // Check for duplicate _id's.
    results = this.idCheckerAlgorithm(missionJson)
    // Check for error.
    if (results.error) return next(results.error)

    // Validate node structure.
    results = this.validateStructure(initStructure)
    // Check for error.
    if (results.error) return next(results.error)
    // Check for structure keys.
    if (results.structureKeys) structureKeys = results.structureKeys

    // Validate the mission forces.
    results = this.validateMissionForces(missionJson, structureKeys)
    // Check for error.
    if (results.error) return next(results.error)

    // Validate the mission files.
    results = this.validateMissionFiles(missionJson.files)
    // Check for error.
    if (results.error) return next(results.error)

    // Validate the mission effects.
    this.validateMissionEffects(missionJson)
  }
}
/* ------------------------------ SERVER MISSION TYPES ------------------------------ */

/**
 * Type registry for server mission component classes.
 */
export type TServerMissionComponents = Pick<
  TMetisServerComponents,
  'mission' | 'force' | 'output' | 'prototype' | 'node' | 'action' | 'effect'
>

/**
 * Possible mission validation results.
 */
type TMissionValidationResults = {
  /**
   * The error that was found during validation.
   */
  error?: Error
  /**
   * The structure keys that were found during validation.
   */
  structureKeys?: TMissionPrototypeJson['structureKey'][]
}
