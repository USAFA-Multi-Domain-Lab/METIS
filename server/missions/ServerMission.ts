import { generateValidationError } from '@server/database/validation'
import type { ServerTarget } from '@server/target-environments/ServerTarget'
import type { TTargetEnvExposedMission } from '@server/target-environments/TargetEnvContext'
import { ServerUser } from '@server/users/ServerUser'
import { NumberToolbox } from '@shared/toolbox/numbers/NumberToolbox'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import type { CallbackWithoutResultAndOptionalError } from 'mongoose'
import mongoose from 'mongoose'
import type { PRNG } from 'seedrandom'
import seedrandom from 'seedrandom'
import type {
  TEffectJson,
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
  TEffectTrigger,
} from '../../shared/missions/effects/Effect'
import type { TMissionFileJson } from '../../shared/missions/files/MissionFile'
import type { TMissionForceSaveJson } from '../../shared/missions/forces/MissionForce'
import type { TMissionSaveJson } from '../../shared/missions/Mission'
import { Mission } from '../../shared/missions/Mission'
import type {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from '../../shared/missions/nodes/MissionPrototype'
import { DateToolbox } from '../../shared/toolbox/dates/DateToolbox'
import { StringToolbox } from '../../shared/toolbox/strings/StringToolbox'
import { databaseLogger } from '../logging'
import { ServerEffect } from './effects/ServerEffect'
import { ServerMissionFile } from './files/ServerMissionFile'
import { ServerMissionForce } from './forces/ServerMissionForce'
import { ServerMissionPrototype } from './nodes/ServerMissionPrototype'

const ObjectId = mongoose.Types.ObjectId

/**
 * Class for managing missions on the server.
 */
export class ServerMission extends Mission<TMetisServerComponents> {
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

  // Implemented
  protected importEffects(data: TEffectSessionTriggeredJson[]): void {
    let effects = data.map((datum) =>
      ServerEffect.fromSessionTriggeredJson(datum, this),
    )
    this.effects.push(...effects)
  }

  // Implemented
  public createEffect(
    target: ServerTarget,
    trigger: TEffectSessionTriggered,
  ): ServerEffect<'sessionTriggeredEffect'> {
    let effect = ServerEffect.createBlankSessionEffect(target, this, trigger)
    this.effects.push(effect)
    return effect
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
   * Creates a new {@see ServerMission} from the given JSON data,
   * which is formatted to be saved to the database.
   * @param json The JSON data from which to create the mission.
   */
  public static fromSaveJson(json: TMissionSaveJson): ServerMission {
    // Create a Serveruser object for the creator
    // of the mission, if there is one.
    let createdBy: ServerUser

    // Parse reference data.
    if (typeof json.createdBy === 'object') {
      createdBy = ServerUser.fromCreatedByJson(json.createdBy)
    } else {
      createdBy = ServerUser.createUnpopulated(
        json.createdBy,
        json.createdByUsername,
      )
    }

    // Create a new mission.
    let mission: ServerMission = new ServerMission(
      json._id || StringToolbox.generateRandomId(),
      json.name,
      json.versionNumber,
      json.seed,
      json.resourceLabel,
      DateToolbox.fromNullableISOString(json.createdAt),
      DateToolbox.fromNullableISOString(json.updatedAt),
      DateToolbox.fromNullableISOString(json.launchedAt),
      createdBy,
      json.createdByUsername,
      json.structure,
      json.prototypes,
      json.forces,
      json.files,
      json.effects,
    )

    // Return the mission.
    return mission
  }

  /**
   * Validates the forces of the mission.
   * @param forces The forces to validate.
   * @returns True if the forces are valid, false otherwise.
   */
  public static validateForces(forces: TMissionSaveJson['forces']): void {
    let forceKeys: TMissionForceSaveJson['localKey'][] = []

    for (const force of forces) {
      // Check for valid initial resources.
      const nonNegativeInteger = NumberToolbox.isNonNegativeInteger(
        force.initialResources,
      )
      if (!nonNegativeInteger) {
        throw generateValidationError(
          `The initial resources must be a positive integer for the force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }

      // Check for valid color.
      const isValidColor = StringToolbox.HEX_COLOR_REGEX.test(force.color)
      if (!isValidColor) {
        throw generateValidationError(
          `The color "${force.color}" is not a valid hex color for the force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }

      // Check for duplicate local keys.
      if (forceKeys.includes(force.localKey)) {
        throw generateValidationError(
          `Duplicate local key "${force.localKey}" found for force "{ _id: ${force._id}, name: ${force.name} }".`,
        )
      }
      forceKeys.push(force.localKey)
    }
  }

  /**
   * Validates the prototypes of the mission.
   * @param prototypes The prototypes to validate.
   * @returns True if the prototypes are valid, false otherwise.
   */
  public static validatePrototypes(
    prototypes: TMissionSaveJson['prototypes'],
  ): void {
    for (const prototype of prototypes) {
      const nonNegativeInteger = NumberToolbox.isNonNegativeInteger(
        prototype.depthPadding,
      )
      if (!nonNegativeInteger) {
        throw generateValidationError(
          `The depth padding must be a positive integer for the prototype "{ _id: ${prototype._id} }".`,
        )
      }
    }
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
      let error = generateValidationError(
        `Error in the mission's structure:\n"${rootKey}" is set to ${currentStructure}, which is not an object.`,
      )
      return { error }
    }

    // Loop through the current structure.
    for (let [key, value] of Object.entries(currentStructure)) {
      // If the key is already in the structureKeys,
      // then return an error.
      if (structureKeys.includes(key)) {
        let error = generateValidationError(
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
    cursor: TAnyObject | TAnyObject[],
    existingIds: TAnyObject = {},
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
        let error = generateValidationError(
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
        let error = generateValidationError(
          `Error in mission:\nInvalid _id used (${cursor._id}).`,
        )
        return { error }
      }
      // Otherwise, add the _id to the existingIds object.
      else if (cursor._id) {
        existingIds[cursor._id] = true
      }

      // Check the object's values for duplicate _id's.
      for (let [key, value] of Object.entries(cursor)) {
        // Skip the createdBy key, as it is a foreign
        // reference, which could possibly be referenced
        // twice, resulting in a duplicate _id in the mission.
        // In this case, the duplicate _id is acceptable.
        if (key === 'createdBy') continue
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
   * Logs all defects found in a mission to the
   * database logger.
   * @param missionJson The JSON of the mission
   * in question.
   */
  private static logDefects = (missionJson: TMissionSaveJson): void => {
    let mission = ServerMission.fromSaveJson(missionJson)

    for (let defect of mission.defects) {
      databaseLogger.warn(defect.message)
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
      results.error = generateValidationError(
        `Error in mission:\nMission must have at least one force.`,
      )
      return results
    }
    if (missionJson.forces.length > 8) {
      results.error = generateValidationError(
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
          results.error = generateValidationError(
            `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" does not exist in the mission's prototypes.`,
          )
          return results
        }

        // Ensure the node has a unique prototype.
        if (prototypesRetrieved.includes(prototype._id)) {
          results.error = generateValidationError(
            `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" has already been used for another node.`,
          )
          return results
        }

        // Ensure the prototype has the correct structure key.
        if (!structureKeys.includes(prototype.structureKey)) {
          results.error = generateValidationError(
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
        results.error = generateValidationError(
          `Error in mission:\nPrototype Node with ID "${missingPrototype?._id}" is missing from "${force.name}".`,
        )
        return results
      }
    }

    return results
  }

  /**
   * Validates the alias of a file in a mission.
   * @param files The value to validate.
   * @param forces The forces in the mission, used to compare
   * the initial access assignments of files and ensure that the
   * force IDs used are not null-pointers.
   * @returns True if valid, false otherwise.
   */
  private static validateMissionFiles = (
    files: TMissionSaveJson['files'],
  ): TMissionValidationResults => {
    // Object to store results.
    let results: TMissionValidationResults = {}

    for (const file of files) {
      if (typeof file.alias !== 'string' && file.alias !== null) {
        results.error = generateValidationError(
          `Error in mission:\nAlias is neither a string or null for file with ID "${file._id}".`,
        )
        return results
      }
    }

    return results
  }

  /**
   * Creates a validator function for effects in a mission.
   * @param validTriggers The triggers valid for this particular
   * validator. This is important because different places in the
   * mission schema permit different triggers.
   * @returns The validator function to pass to the schema.
   */
  public static createEffectsValidator = (validTriggers: TEffectTrigger[]) => {
    return (effects: TEffectJson[]): void => {
      let effectKeys: TEffectJson['localKey'][] = []

      for (const effect of effects) {
        const validTrigger = validTriggers.includes(effect.trigger)

        if (!validTrigger) {
          throw generateValidationError(
            `The effect "{ _id: ${effect._id}, name: ${effect.name} }" has an invalid trigger "${effect.trigger}".`,
          )
        }

        // Check for duplicate local keys.
        if (effectKeys.includes(effect.localKey)) {
          throw generateValidationError(
            `The effect "{ _id: ${effect._id}, name: ${effect.name} }" has a duplicate local key "${effect.localKey}".`,
          )
        }
        effectKeys.push(effect.localKey)
      }
    }
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

    // Log any defects found in the mission
    // to the database logger.
    this.logDefects(missionJson)
  }
}

/* -- TYPES -- */

/**
 * Type registry for server mission component classes.
 */
export type TServerMissionComponents = Pick<
  TMetisServerComponents,
  | 'mission'
  | 'force'
  | 'output'
  | 'prototype'
  | 'node'
  | 'action'
  | 'sessionTriggeredEffect'
  | 'executionTriggeredEffect'
>

/**
 * Possible mission validation results.
 */
export type TMissionValidationResults = {
  /**
   * The error that was found during validation.
   */
  error?: Error
  /**
   * The structure keys that were found during validation.
   */
  structureKeys?: TMissionPrototypeJson['structureKey'][]
}
