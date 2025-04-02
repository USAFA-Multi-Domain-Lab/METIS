import DOMPurify from 'isomorphic-dompurify'
import Mission, { TMissionSaveJson } from 'metis/missions'
import { TMissionActionJson } from 'metis/missions/actions'
import Effect from 'metis/missions/effects'
import { TMissionForceSaveJson } from 'metis/missions/forces'
import { TMissionNodeJson } from 'metis/missions/nodes'
import { TMissionPrototypeJson } from 'metis/missions/nodes/prototypes'
import MetisDatabase from 'metis/server/database'
import { databaseLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerEffect from 'metis/server/missions/effects'
import ServerMissionForce from 'metis/server/missions/forces'
import ServerMissionNode from 'metis/server/missions/nodes'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetArg } from 'metis/target-environments/args'
import DropdownArg from 'metis/target-environments/args/dropdown-arg'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import StringToolbox, { HEX_COLOR_REGEX } from 'metis/toolbox/strings'
import mongoose, {
  DefaultSchemaOptions,
  HydratedDocument,
  Model,
  model,
  ProjectionType,
  Query,
  QueryOptions,
  Schema,
} from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

/* -- CONSTANTS -- */
const NODE_DATA_MIN_LENGTH = 1
const ACTIONS_MIN_LENGTH = 1
const PROCESS_TIME_MAX = 3600 /*seconds*/ * 1000

/* -- FUNCTIONS -- */

/**
 * Transforms the mission document to JSON.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns The JSON representation of a `Mission` document.
 */
const toJson = (doc: TMissionDoc, ret: TMissionSaveJson, options: any) => {
  return {
    ...ret,
    _id: doc.id,
  }
}

/**
 * Modifies the query to hide deleted missions and remove unneeded properties.
 * @param query The query to modify.
 */
const queryForApiResponse = (query: TPreMissionQuery): void => {
  // Get projection.
  let projection = query.projection()

  // Create if does not exist.
  if (projection === undefined) {
    projection = {}
  }

  // Check if the projection is empty.
  let projectionKeys = Object.keys(projection)

  // If the projection is empty, create a default projection.
  if (projectionKeys.length === 0) {
    projection = {
      deleted: 0,
      __v: 0,
    }
  }

  // Set projection.
  query.projection(projection)
  // Hide deleted missions.
  query.where({ deleted: false })
}

/* -- SCHEMA VALIDATION HELPERS -- */

/**
 * Global validator for integers.
 * @param value The value to validate.
 */
const isInteger = (value: number): boolean => Math.floor(value) === value

/**
 * Global validator for non-negative integers.
 * @param value The value to validate.
 */
const isNonNegativeInteger = (value: number): boolean => {
  let isNonNegative: boolean = value >= 0

  return isInteger(value) && isNonNegative
}

/* -- SCHEMA STATIC FUNCTIONS -- */

/**
 * Finds a single document by its `_id` field. Then, if the
 * document is found, modifies the document with the given
 * updates using the `save` method.
 * @param _id The _id of the document to find.
 * @param projection The projection to use when finding the document.
 * @param options The options to use when finding the document.
 * @param updates The updates to apply to the document.
 * @resolves The modified document.
 * @rejects An error if the document is not found or is deleted.
 * @note This method uses the `findById` method internally followed by the `save` method (if the document is found).
 * @note This method will trigger the `pre('save')` middleware which validates the mission.
 */
const findByIdAndModify = (
  _id: any,
  projection?: ProjectionType<TMission> | null,
  options?: QueryOptions<TMission> | null,
  updates?: Partial<TMissionSaveJson> | null,
): Promise<TMissionDoc | null> => {
  return new Promise<TMissionDoc | null>(async (resolve, reject) => {
    try {
      // Find the mission document.
      let missionDoc = await MissionModel.findById(
        _id,
        projection,
        options,
      ).exec()

      // If the mission is not found, then resolve with null.
      if (!missionDoc) return resolve(missionDoc)

      // Extract the updated properties.
      let { _id: missionId, ...rest } = updates ?? {}
      // Update every property besides the _id.
      Object.assign(missionDoc, { ...rest })
      // Save the changes.
      missionDoc = await missionDoc.save()

      // Otherwise, resolve with the mission document.
      return resolve(missionDoc)
    } catch (error: any) {
      // Reject the promise with the error.
      return reject(error)
    }
  })
}

/* -- SCHEMA VALIDATORS -- */

/**
 * Validates all of the effects within the mission.
 * @param missionJson The mission JSON to validate.
 */
const validateMissionEffects = (
  missionJson: TMissionSaveJson,
): { error?: Error } => {
  // Object to store results.
  let results: { error?: Error } = {}

  try {
    // Create a new server mission.
    let mission: ServerMission = new ServerMission(missionJson)

    // Loop through each force.
    for (let force of mission.forces) {
      // Loop through each node.
      for (let node of force.nodes) {
        // Loop through each action.
        for (let action of node.actions.values()) {
          // Loop through each effect.
          for (let effect of action.effects) {
            // Get the target.
            let target = effect.target

            // Ensure the target exists.
            if (!target) {
              throw new Error(
                `The effect ({ _id: "${effect._id}", name: "${effect.name}" }) does not have a target. ` +
                  `This is likely because the target doesn't exist within any of the target environments stored in the registry.`,
              )
            }

            // Ensure the target environment exists.
            if (!effect.environment) {
              throw new Error(
                `The effect ({ _id: "${effect._id}", name: "${effect.name}" }) does not have a target environment. ` +
                  `This is likely because the target environment doesn't exist in the target-environment registry.`,
              )
            }

            // Check to see if the target environment version is current.
            let targetEnvironment = ServerTargetEnvironment.REGISTRY.get(
              effect.environment._id,
            )
            if (
              targetEnvironment?.version !== effect.targetEnvironmentVersion
            ) {
              let errorMessage = `The effect's ({ _id: "${effect._id}", name: "${effect.name}" }) target environment version is out-of-date. Current version: "${targetEnvironment?.version}".`
              databaseLogger.warn(errorMessage)
            }

            // Grab the argument IDs from the effect.
            let effectArgIds = Object.keys(effect.args)
            // Loop through the argument IDs.
            for (let effectArgId of effectArgIds) {
              // Find the argument.
              let arg = target.args.find(
                (arg: TTargetArg) => arg._id === effectArgId,
              )

              // Ensure the argument exists.
              if (!arg) {
                throw new Error(
                  `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) doesn't exist in the target's ({ _id: "${target._id}", name: "${target.name}" }) arguments.`,
                )
              }

              // Get the value.
              const value = effect.args[effectArgId]

              if (arg.type === 'dropdown') {
                if (!DropdownArg.OPTION_VALUE_TYPES.includes(typeof value)) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "string", "number", "boolean", "object", or "undefined."`,
                  )
                }

                // Ensure the option exists.
                let option = arg.options.find(
                  (option) => option.value === value,
                )
                if (!option) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is not a valid option in the effect's target ({ _id: "${target._id}", name: "${target.name}" }).`,
                  )
                }
              }

              if (arg.type === 'string') {
                if (typeof value !== 'string') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "string."`,
                  )
                }

                // Ensure the string-argument passes the custom validation.
                let isValid = arg.pattern ? arg.pattern.test(value) : true
                if (!isValid) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is invalid.`,
                  )
                }
              }

              if (arg.type === 'large-string') {
                if (typeof value !== 'string') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "string."`,
                  )
                }
              }

              if (arg.type === 'force') {
                if (typeof value !== 'object') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "object."`,
                  )
                }

                // Ensure the force argument has the correct keys.
                if (
                  !(ForceArg.FORCE_ID_KEY in value) ||
                  !(ForceArg.FORCE_NAME_KEY in value)
                ) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${JSON.stringify(
                      value,
                    )}") within the effect ({ _id: "${effect._id}", name: "${
                      effect.name
                    }" }) that has missing properties that are required.`,
                  )
                }
              }

              if (arg.type === 'node') {
                if (typeof value !== 'object') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "object."`,
                  )
                }

                // Ensure the node argument has the correct keys.
                if (
                  !(ForceArg.FORCE_ID_KEY in value) ||
                  !(ForceArg.FORCE_NAME_KEY in value) ||
                  !(NodeArg.NODE_ID_KEY in value) ||
                  !(NodeArg.NODE_NAME_KEY in value)
                ) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${JSON.stringify(
                      value,
                    )}") within the effect ({ _id: "${effect._id}", name: "${
                      effect.name
                    }" }) that has missing properties that are required.`,
                  )
                }
              }

              if (arg.type === 'number') {
                if (typeof value !== 'number') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "number."`,
                  )
                }

                if (arg.integersOnly && !isInteger(value)) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is not an integer.`,
                  )
                }
              }

              if (arg.type === 'boolean') {
                if (typeof value !== 'boolean') {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "boolean."`,
                  )
                }
              }
            }

            // Check to see if there are any missing arguments.
            let missingArg = effect.checkForMissingArg()
            // Ensure all of the required arguments are present in the effect.
            if (missingArg) {
              throw new Error(
                `The required argument ({ _id: "${missingArg._id}", name: "${missingArg.name}" }) within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is missing.`,
              )
            }
          }
        }
      }
    }

    // Return the results.
    return results
  } catch (error: any) {
    results.error = new Error(`Error in mission:\n${error.message}`)
    results.error.name = MetisDatabase.ERROR_BAD_DATA
    return results
  }
}

/**
 * This will ensure the mission has between one and eight forces and that each prototype
 * in the mission has a corresponding node within each force.
 * @param missionJson The mission JSON to validate.
 * @param structureKeys The structure keys to validate.
 * @returns An error if any of the validation checks fail.
 */
const validateMissionForces = (
  missionJson: TMissionSaveJson,
  structureKeys: TMissionPrototypeJson['structureKey'][],
): { error?: Error } => {
  // Object to store results.
  let results: { error?: Error } = {}

  // Ensure correct number of forces exist
  // the mission.
  if (missionJson.forces.length < 1) {
    results.error = new Error(
      `Error in mission:\nMission must have at least one force.`,
    )
    results.error.name = MetisDatabase.ERROR_BAD_DATA
    return results
  }
  if (missionJson.forces.length > 8) {
    results.error = new Error(
      `Error in mission:\nMission can have no more than eight forces.`,
    )
    results.error.name = MetisDatabase.ERROR_BAD_DATA
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
        results.error = new Error(
          `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" does not exist in the mission's prototypes.`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return results
      }

      // Ensure the node has a unique prototype.
      if (prototypesRetrieved.includes(prototype._id)) {
        results.error = new Error(
          `Error in mission:\nPrototype ID "${prototypeId}" for "${node.name}" in "${force.name}" has already been used for another node.`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return results
      }

      // Ensure the prototype has the correct structure key.
      if (!structureKeys.includes(prototype.structureKey)) {
        results.error = new Error(
          `Error in mission:\nStructure key "${prototype.structureKey}" is missing from "${force.name}".`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
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
      results.error = new Error(
        `Error in mission:\nPrototype Node with ID "${missingPrototype?._id}" is missing from "${force.name}".`,
      )
      results.error.name = MetisDatabase.ERROR_BAD_DATA
      return results
    }
  }

  return results
}

/**
 * Validates the mission document.
 * @param missionJson The mission JSON to validate.
 * @param next The next function to call.
 */
const validate_missions = (missionJson: TMissionSaveJson, next: any): void => {
  // Get the initial structure.
  let initStructure: TMissionSaveJson['structure'] = missionJson.structure
  // Array to store the structure keys.
  let structureKeys: TMissionPrototypeJson['structureKey'][] = []
  // Object to store results.
  let results: { error?: Error } = {}
  // Object to store existing _id's.
  let existingIds: AnyObject = {}

  // This will ensure the node structure
  // is valid.
  const _validateStructure = (
    currentStructure: any = initStructure,
    rootKey: string = 'ROOT',
  ): { error?: Error } => {
    // If the current structure isn't an object...
    if (!(currentStructure instanceof Object)) {
      let error: Error = new Error(
        `Error in the mission's structure:\n"${rootKey}" is set to ${currentStructure}, which is not an object.`,
      )
      error.name = MetisDatabase.ERROR_BAD_DATA
      return { error }
    }

    // Loop through the current structure.
    for (let [key, value] of Object.entries(currentStructure)) {
      // If the key is already in the structureKeys,
      // then return an error.
      if (structureKeys.includes(key)) {
        let error: Error = new Error(
          `Error in the mission's structure:\nDuplicate structureKey used (${key}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      // Otherwise, add the key to the structureKeys.
      else {
        structureKeys.push(key)
      }

      // Go deeper into the structure.
      let results: { error?: Error } = _validateStructure(value, key)

      // Check for any errors.
      if (results.error) {
        return results
      }
    }

    // Return an empty object if no errors are found.
    return {}
  }

  // Algorithm to check for duplicate _id's.
  const _idCheckerAlgorithm = (
    cursor: AnyObject | AnyObject[] = missionJson,
  ): { error?: Error } => {
    // If the cursor is an object, not an array, and not an ObjectId...
    if (
      cursor instanceof Object &&
      !Array.isArray(cursor) &&
      !(cursor instanceof ObjectId)
    ) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        let error = new Error(
          `Error in mission:\nDuplicate _id used (${cursor._id}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      // Or, if the cursor is a Mission and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof Mission &&
        !mongoose.isObjectIdOrHexString(cursor._id)
      ) {
        // ...then set the error and return.
        let error = new Error(
          `Error in mission:\nInvalid _id used (${cursor._id}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      // Otherwise, add the _id to the existingIds object.
      else if (cursor._id) {
        existingIds[cursor._id] = true
      }

      // Check the object's values for duplicate _id's.
      for (let value of Object.values(cursor)) {
        let results = _idCheckerAlgorithm(value)
        if (results.error) return results
      }
    }
    // Otherwise, if the cursor is an array...
    else if (Array.isArray(cursor)) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        let results = _idCheckerAlgorithm(value)
        if (results.error) return results
      }
    }

    // Return an empty object.
    return {}
  }

  // Check for duplicate _id's.
  results = _idCheckerAlgorithm()
  // Check for error.
  if (results.error) return next(results.error)

  // Validate node structure.
  results = _validateStructure()
  // Check for error.
  if (results.error) return next(results.error)

  // Validate the mission forces.
  results = validateMissionForces(missionJson, structureKeys)
  // Check for error.
  if (results.error) return next(results.error)

  // Validate the mission effects.
  results = validateMissionEffects(missionJson)
  // Check for error.
  if (results.error) return next(results.error)
}

/**
 * Validates the depth padding for a prototype node.
 * @param depthPadding The depth padding to validate.
 */
const validate_mission_prototypes_depthPadding = (
  depthPadding: TMissionPrototypeJson['depthPadding'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(depthPadding)

  return nonNegativeInteger
}

/**
 * Validates the initial resources for a mission.
 * @param initialResources The initial resources to validate.
 */
const validate_missions_forces_initialResources = (
  initialResources: TMissionForceSaveJson['initialResources'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(initialResources)

  return nonNegativeInteger
}

/**
 * Validates the nodeData for a mission.
 * @param nodes The nodeData to validate.
 */
const validate_missions_forces_nodes = (
  nodes: TMissionForceSaveJson['nodes'],
): boolean => {
  let minLengthReached: boolean = nodes.length >= NODE_DATA_MIN_LENGTH
  let minLengthOfActionsReached: boolean = true

  for (let node of nodes) {
    if (node.executable && node.actions.length < ACTIONS_MIN_LENGTH) {
      minLengthOfActionsReached = false
      break
    }
  }

  return minLengthReached && minLengthOfActionsReached
}

/**
 * Validates the color for a force.
 */
const validate_force_color = (
  color: TMissionForceSaveJson['color'],
): boolean => {
  let isValidColor: boolean = HEX_COLOR_REGEX.test(color)

  return isValidColor
}

/**
 * Validates the color for a mission-node.
 * @param color The color to validate.
 */
const validate_missions_forces_nodes_color = (
  color: TMissionNodeJson['color'],
): boolean => {
  let isValidColor: boolean = HEX_COLOR_REGEX.test(color)

  return isValidColor
}

/**
 * Validates the process time for a mission-action.
 * @param processTime The process time to validate.
 */
const validate_mission_forces_nodes_actions_processTime = (
  processTime: TMissionActionJson['processTime'],
): boolean => {
  let processTimeRegexRegExp = /^[0-9+-]+[.]?[0-9]{0,6}$/
  let isValidNumber: boolean = processTimeRegexRegExp.test(
    processTime.toString(),
  )
  let lessThanMax: boolean = processTime <= PROCESS_TIME_MAX

  return isValidNumber && lessThanMax
}

/**
 * Validates the success chance for a mission-action.
 * @param successChance The success chance to validate.
 */
const validate_mission_forces_nodes_actions_successChance = (
  successChance: TMissionActionJson['successChance'],
): boolean => {
  let betweenZeroAndOne: boolean = successChance >= 0 && successChance <= 1

  return betweenZeroAndOne
}

/**
 * Validates the resource cost for a mission-action.
 * @param resourceCost The resource cost to validate.
 */
const validate_mission_forces_nodes_actions_resourceCost = (
  resourceCost: TMissionActionJson['resourceCost'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(resourceCost)

  return nonNegativeInteger
}

/**
 * Validates the access ID of a user.
 * @param accessId The access ID to validate.
 */
const validate_mission_forces_nodes_actions_effects_trigger = (
  value: string,
): boolean => {
  return Effect.isValidTrigger(value)
}

/* -- SCHEMA SETTERS -- */

/**
 * Sanitizes HTML.
 * @param html The HTML to sanitize.
 * @returns The sanitized HTML.
 */
const sanitizeHtml = (html: string): string => {
  try {
    let sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a',
        'br',
        'p',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'code',
        'pre',
        'hr',
        'blockquote',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        's',
        'del',
        'strike',
      ],
      ALLOWED_ATTR: ['href', 'rel', 'target', 'class'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
    })

    return sanitizedHTML
  } catch (error: any) {
    databaseLogger.error('Error sanitizing HTML.\n', error)
    throw new Error('Error sanitizing HTML.')
  }
}

/* -- SCHEMA -- */

/**
 * The schema for a mission in the database.
 */
export const MissionSchema = new Schema<
  TMission,
  TMissionModel,
  TMissionMethods,
  {},
  TMissionVirtuals,
  TMissionStaticMethods,
  DefaultSchemaOptions,
  TMissionDoc
>(
  {
    name: {
      type: String,
      required: true,
      maxLength: ServerMission.MAX_NAME_LENGTH,
    },
    versionNumber: { type: Number, required: true },
    seed: {
      type: String,
      required: true,
      default: StringToolbox.generateRandomId,
    },
    resourceLabel: {
      type: String,
      required: true,
      default: 'Resources',
      maxlength: ServerMission.MAX_RESOURCE_LABEL_LENGTH,
    },
    launchedAt: { type: Date, default: null },
    deleted: { type: Boolean, required: true, default: false },
    structure: {
      type: {},
      required: true,
    },
    prototypes: {
      type: [
        {
          _id: { type: String, required: true },
          structureKey: { type: String, required: true },
          depthPadding: {
            type: Number,
            required: true,
            validate: validate_mission_prototypes_depthPadding,
          },
        },
      ],
      required: true,
    },
    forces: {
      type: [
        {
          _id: { type: String, required: true },
          introMessage: {
            type: String,
            required: true,
            set: sanitizeHtml,
          },
          name: {
            type: String,
            required: true,
            maxLength: ServerMissionForce.MAX_NAME_LENGTH,
          },
          color: {
            type: String,
            required: true,
            validate: validate_force_color,
          },
          initialResources: {
            type: Number,
            required: true,
            validate: validate_missions_forces_initialResources,
          },
          revealAllNodes: {
            type: Boolean,
            required: true,
          },
          nodes: {
            type: [
              {
                _id: { type: String, required: true },
                prototypeId: { type: String, required: true },
                name: {
                  type: String,
                  required: true,
                  maxLength: ServerMissionNode.MAX_NAME_LENGTH,
                },
                color: {
                  type: String,
                  required: true,
                  validate: validate_missions_forces_nodes_color,
                },
                description: {
                  type: String,
                  required: false,
                  default: '',
                  set: sanitizeHtml,
                },
                preExecutionText: {
                  type: String,
                  required: false,
                  default: '',
                  set: sanitizeHtml,
                },
                executable: { type: Boolean, required: true },
                device: { type: Boolean, required: true },
                actions: {
                  type: [
                    {
                      _id: { type: String, required: true },
                      name: {
                        type: String,
                        required: true,
                        maxLength: ServerMissionAction.MAX_NAME_LENGTH,
                      },
                      description: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      processTime: {
                        type: Number,
                        required: true,
                        validate:
                          validate_mission_forces_nodes_actions_processTime,
                      },
                      processTimeHidden: {
                        type: Boolean,
                        required: true,
                      },
                      successChance: {
                        type: Number,
                        required: true,
                        validate:
                          validate_mission_forces_nodes_actions_successChance,
                      },
                      successChanceHidden: {
                        type: Boolean,
                        required: true,
                      },
                      resourceCost: {
                        type: Number,
                        required: true,
                        validate:
                          validate_mission_forces_nodes_actions_resourceCost,
                      },
                      resourceCostHidden: {
                        type: Boolean,
                        required: true,
                      },
                      opensNode: {
                        type: Boolean,
                        required: true,
                      },
                      opensNodeHidden: {
                        type: Boolean,
                        required: true,
                      },
                      postExecutionSuccessText: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      postExecutionFailureText: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      effects: {
                        //! Effect validation takes places in the pre-save hook.
                        type: [
                          {
                            _id: { type: String, required: true },
                            targetId: {
                              type: String,
                              required: true,
                            },
                            environmentId: {
                              type: String,
                              required: true,
                            },
                            targetEnvironmentVersion: {
                              type: String,
                              required: true,
                            },
                            name: {
                              type: String,
                              required: true,
                              maxLength: ServerEffect.MAX_NAME_LENGTH,
                            },
                            trigger: {
                              type: String,
                              required: true,
                              validate:
                                validate_mission_forces_nodes_actions_effects_trigger,
                            },
                            description: {
                              type: String,
                              required: false,
                              default: '',
                              set: sanitizeHtml,
                            },
                            args: {
                              type: Object,
                              required: true,
                            },
                          },
                        ],
                        required: true,
                      },
                    },
                  ],
                  required: true,
                },
              },
            ],
            required: true,
            validate: validate_missions_forces_nodes,
          },
        },
      ],
      required: true,
    },
    files: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FileReference',
        required: true,
      },
    ],
  },
  {
    strict: 'throw',
    minimize: false,
    toJSON: {
      transform: toJson,
    },
    toObject: {
      transform: toJson,
    },
    statics: {
      findByIdAndModify,
    },
    timestamps: true,
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Called before a save is made to the database.
MissionSchema.pre<TMissionDoc>('save', function (next) {
  let mission: TMissionSaveJson = this.toJSON()
  validate_missions(mission, next)
  return next()
})

// Called before a find or update is made to the database.
MissionSchema.pre<TPreMissionQuery>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    // Modify the query.
    queryForApiResponse(this)
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
MissionSchema.post<TPostMissionQuery>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  function (missionData: TMissionDoc | TMissionDoc[]) {
    // If the mission is null, then return.
    if (!missionData) return

    // Convert the mission data to an array if it isn't already.
    missionData = !Array.isArray(missionData) ? [missionData] : missionData

    // Transform the ObjectIds to strings.
    for (let missionDatum of missionData) {
      missionDatum._id = missionDatum.id
    }
  },
)

// Called after a save is made to the database.
MissionSchema.post<TMissionDoc>('save', function () {
  // Remove unneeded properties.
  this.set('__v', undefined)
  this.set('deleted', undefined)
})

/* -- SCHEMA TYPES -- */

/**
 * Represents a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TMission = TMissionSaveJson & {
  /**
   * Determines if the mission is deleted.
   */
  deleted: boolean
}

/**
 * Represents the methods available for a `MissionModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
type TMissionMethods = {}

/**
 * Represents the static methods available for a `MissionModel`.
 * @see https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
type TMissionStaticMethods = {
  /**
   * Finds a single document by its `_id` field. Then, if the
   * document is found, modifies the document with the given
   * updates using the `save` method.
   * @param _id The _id of the document to find.
   * @param projection The projection to use when finding the document.
   * @param options The options to use when finding the document.
   * @param updates The updates to apply to the document.
   * @resolves The modified document.
   * @rejects An error if the document is not found or is deleted.
   * @note This method uses the `findById` method internally followed by the `save` method (if the document is found).
   * @note This method will trigger the `pre('save')` middleware which validates the mission.
   */
  findByIdAndModify(
    _id: any,
    projection?: ProjectionType<TMission> | null,
    options?: QueryOptions<TMission> | null,
    updates?: Partial<TMissionSaveJson> | null,
  ): Promise<TMissionDoc | null>
}

/**
 * Represents a mongoose model for a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TMissionModel = Model<TMission, {}, TMissionMethods> &
  TMissionStaticMethods

/**
 * Represents a mongoose document for a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
type TMissionDoc = HydratedDocument<TMission, TMissionMethods, TMissionVirtuals>

/**
 * Represents the virtual properties for a mission in the database.
 * @see https://mongoosejs.com/docs/tutorials/virtuals.html
 */
type TMissionVirtuals = {}

/* -- QUERY TYPES -- */

/**
 * The type for a pre-query middleware for a `MissionModel`.
 */
type TPreMissionQuery = Query<TMission, TMission>

/**
 * The type for a post-query middleware for a `MissionModel`.
 */
type TPostMissionQuery = Query<TMissionDoc, TMissionDoc>

/* -- MODEL -- */

/**
 * The mongoose model for a mission in the database.
 */
const MissionModel = model<TMission, TMissionModel>('Mission', MissionSchema)
export default MissionModel
