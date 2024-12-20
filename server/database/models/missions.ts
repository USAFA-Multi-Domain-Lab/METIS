import DOMPurify from 'isomorphic-dompurify'
import Mission, { TCommonMissionJson } from 'metis/missions'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TCommonMissionNodeJson } from 'metis/missions/nodes'
import { TCommonMissionPrototypeJson } from 'metis/missions/nodes/prototypes'
import MetisDatabase from 'metis/server/database'
import { databaseLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerEffect from 'metis/server/missions/effects'
import ServerMissionForce from 'metis/server/missions/forces'
import ServerMissionNode from 'metis/server/missions/nodes'
import ServerTargetEnvironment from 'metis/server/target-environments'
import { TTargetArg } from 'metis/target-environments/args'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import StringToolbox, { HEX_COLOR_REGEX } from 'metis/toolbox/strings'
import mongoose, {
  Document,
  Error,
  Model,
  model,
  Query,
  Schema,
} from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

const NODE_DATA_MIN_LENGTH = 1
const ACTIONS_MIN_LENGTH = 1
const PROCESS_TIME_MAX = 3600 /*seconds*/ * 1000

/* -- FUNCTIONS -- */

/**
 * Transforms the ObjectId to a string.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns
 */
const transformObjectIdToString = (
  doc: TMissionDoc,
  ret: TCommonMissionJson,
  options: any,
) => {
  if (ret._id) ret._id = ret._id.toString()
  return ret
}

/**
 * Modifies the query to hide deleted missions and remove unneeded properties.
 * @param query The query to modify.
 */
const queryForApiResponse = (
  query: Query<TMissionSchema, TMissionModel>,
): void => {
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
 * Global validator for non-negative integers.
 * @param value The value to validate.
 */
const isNonNegativeInteger = (value: number): boolean => {
  let isInteger: boolean = Math.floor(value) === value
  let isNonNegative: boolean = value >= 0

  return isInteger && isNonNegative
}

/* -- SCHEMA VALIDATORS -- */

/**
 * Validates all of the effects within the mission.
 * @param missionJson The mission JSON to validate.
 */
const validateMissionEffects = (
  missionJson: TCommonMissionJson,
): { error?: Error } => {
  // Object to store results.
  let results: { error?: Error } = {}

  try {
    // Create a new server mission.
    let mission: ServerMission = new ServerMission(missionJson, {
      populateTargets: true,
    })

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
            if (!effect.targetEnvironment) {
              throw new Error(
                `The effect ({ _id: "${effect._id}", name: "${effect.name}" }) does not have a target environment. ` +
                  `This is likely because the target environment doesn't exist in the target-environment registry.`,
              )
            }

            // Check to see if the target environment version is current.
            let targetEnvironment = ServerTargetEnvironment.getJson(
              effect.targetEnvironment._id,
            )
            if (
              targetEnvironment?.version !== effect.targetEnvironmentVersion
            ) {
              let errorMessage = `The effect's ({ _id: "${effect._id}", name: "${effect.name}" }) target environment version is out-of-date. Current version: "${targetEnvironment?.version}".`
              databaseLogger.error(errorMessage)
              console.error(errorMessage)
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
              let value = effect.args[effectArgId]
              // Ensure the value is of the correct type.
              if (
                (arg.type === 'string' ||
                  arg.type === 'large-string' ||
                  arg.type === 'dropdown') &&
                typeof value !== 'string'
              ) {
                throw new Error(
                  `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "string."`,
                )
              } else if (
                arg &&
                arg.type === 'number' &&
                typeof value !== 'number'
              ) {
                throw new Error(
                  `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "number."`,
                )
              } else if (
                arg &&
                arg.type === 'boolean' &&
                typeof value !== 'boolean'
              ) {
                throw new Error(
                  `The argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "boolean."`,
                )
              }

              // If the argument is a dropdown, ensure the value one of the options.
              // Ensure the argument is a dropdown.
              if (arg.type === 'dropdown') {
                // Get the option.
                let option = arg.options.find((option) => option._id === value)
                // Ensure the option exists.
                if (!option) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is not a valid option in the effect's target ({ _id: "${target._id}", name: "${target.name}" }).`,
                  )
                }
              }

              // If the argument is a string, ensure the value matches the pattern.
              if (arg.type === 'string' && arg.pattern) {
                let isValid = arg.pattern.test(value)
                if (isValid === false) {
                  throw new Error(
                    `The argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is invalid.`,
                  )
                }
              }

              // Ensure the force argument has the correct type.
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

              // Ensure the node argument has the correct type.
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
 * @returns An error if any of the validation checks fail.
 */
const validateMissionForces = (
  missionJson: TCommonMissionJson,
  structureKeys: TCommonMissionPrototypeJson['structureKey'][],
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
    let prototypesRetrieved: TCommonMissionPrototypeJson['_id'][] = []

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
        (prototype) => !prototypesRetrieved.includes(prototype._id),
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
 * @param missionDoc The mission document to validate.
 * @param next The next function to call.
 */
const validate_missions = (missionDoc: TMissionDoc, next: any): void => {
  // Convert the mission to JSON.
  let missionJson: TCommonMissionJson = missionDoc.toJSON()
  // Get the initial structure.
  let initStructure: TCommonMissionJson['structure'] = missionJson.structure
  // Array to store the structure keys.
  let structureKeys: TCommonMissionPrototypeJson['structureKey'][] = []
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
    if (!(currentStructure instanceof Object)) {
      let error: Error = new Error(
        `Error in the mission's structure:\n"${rootKey}" is set to ${currentStructure}, which is not an object.`,
      )
      error.name = MetisDatabase.ERROR_BAD_DATA
      return { error }
    }

    for (let [key, value] of Object.entries(currentStructure)) {
      if (structureKeys.includes(key)) {
        let error: Error = new Error(
          `Error in the mission's structure:\nDuplicate structureKey used (${key}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      } else {
        structureKeys.push(key)
      }

      let results: { error?: Error } = _validateStructure(value, key)

      if (results.error) {
        return results
      }
    }

    return {}
  }

  // Algorithm to check for duplicate _id's.
  const _idCheckerAlgorithm = (cursor = missionJson): { error?: Error } => {
    // If the cursor is an object, but not an ObjectId...
    if (cursor instanceof Object && !(cursor instanceof ObjectId)) {
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
        _idCheckerAlgorithm(value)
      }
    }
    // Otherwise, if the cursor is an array...
    else if (cursor instanceof Array) {
      // ...then check each value in the array for duplicate _id's.
      for (let value of cursor) {
        _idCheckerAlgorithm(value)
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
  depthPadding: TCommonMissionPrototypeJson['depthPadding'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(depthPadding)

  return nonNegativeInteger
}

/**
 * Validates the initial resources for a mission.
 * @param initialResources The initial resources to validate.
 */
const validate_missions_forces_initialResources = (
  initialResources: TCommonMissionForceJson['initialResources'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(initialResources)

  return nonNegativeInteger
}

/**
 * Validates the nodeData for a mission.
 * @param nodes The nodeData to validate.
 */
const validate_missions_forces_nodes = (
  nodes: TCommonMissionForceJson['nodes'],
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
  color: TCommonMissionForceJson['color'],
): boolean => {
  let isValidColor: boolean = HEX_COLOR_REGEX.test(color)

  return isValidColor
}

/**
 * Validates the color for a mission-node.
 * @param color The color to validate.
 */
const validate_missions_forces_nodes_color = (
  color: TCommonMissionNodeJson['color'],
): boolean => {
  let isValidColor: boolean = HEX_COLOR_REGEX.test(color)

  return isValidColor
}

/**
 * Validates the process time for a mission-action.
 * @param processTime The process time to validate.
 */
const validate_mission_forces_nodes_actions_processTime = (
  processTime: TCommonMissionActionJson['processTime'],
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
  successChance: TCommonMissionActionJson['successChance'],
): boolean => {
  let betweenZeroAndOne: boolean = successChance >= 0 && successChance <= 1

  return betweenZeroAndOne
}

/**
 * Validates the resource cost for a mission-action.
 * @param resourceCost The resource cost to validate.
 */
const validate_mission_forces_nodes_actions_resourceCost = (
  resourceCost: TCommonMissionActionJson['resourceCost'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(resourceCost)

  return nonNegativeInteger
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
      ALLOWED_TAGS: ['a', 'br', 'p', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'rel', 'target'],
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
export const MissionSchema: Schema = new Schema<
  TMissionSchema,
  TMissionModel,
  TMissionMethods
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
                      successChance: {
                        type: Number,
                        required: true,
                        validate:
                          validate_mission_forces_nodes_actions_successChance,
                      },
                      resourceCost: {
                        type: Number,
                        required: true,
                        validate:
                          validate_mission_forces_nodes_actions_resourceCost,
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
                        // Effect validation takes places in the pre-save hook.
                        type: [
                          {
                            _id: { type: String, required: true },
                            name: {
                              type: String,
                              required: true,
                              maxLength: ServerEffect.MAX_NAME_LENGTH,
                            },
                            description: {
                              type: String,
                              required: false,
                              default: '',
                              set: sanitizeHtml,
                            },
                            targetEnvironmentVersion: {
                              type: String,
                              required: true,
                            },
                            targetId: {
                              type: String,
                              required: true,
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
  },
  {
    strict: 'throw',
    minimize: false,
    toJSON: {
      transform: transformObjectIdToString,
    },
    toObject: {
      transform: transformObjectIdToString,
    },
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Called before a save is made to the database.
MissionSchema.pre<TMissionDoc>('save', async function (next) {
  validate_missions(this, next)
  return next()
})

// Called before a find or update is made to the database.
MissionSchema.pre<Query<TMissionSchema, TMissionModel>>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    // Modify the query.
    queryForApiResponse(this)
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
MissionSchema.post<Query<TMissionSchema, TMissionModel>>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  function (missionData: TMissionSchema | TMissionSchema[]) {
    // If the mission is null, then return.
    if (!missionData) return

    // If the mission data is an array...
    if (Array.isArray(missionData)) {
      // Loop through each mission and transform any ObjectIds to a strings.
      for (let missionDatum of missionData) {
        // If the mission data is null, then continue.
        if (!missionDatum) continue

        // Otherwise, transform the ObjectIds to strings.
        missionDatum._id = missionDatum._id?.toString()
        missionDatum.seed = missionDatum.seed.toString()
      }
    }
    // Otherwise...
    else {
      // If the mission data is null, then return.
      if (!missionData) return

      // Otherwise, transform the ObjectIds to strings.
      missionData._id = missionData._id?.toString()
      missionData.seed = missionData.seed.toString()
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
 */
type TMissionSchema = TCommonMissionJson & {
  /**
   * Determines if the mission is deleted.
   */
  deleted: boolean
}

/**
 * Represents the methods available for a `MissionModel`.
 */
type TMissionMethods = {}

/**
 * Represents the static methods available for a `MissionModel`.
 */
type TMissionStaticMethods = {}

/**
 * Represents a mongoose model for a mission in the database.
 */
type TMissionModel = Model<TMissionSchema, {}, TMissionMethods> &
  TMissionStaticMethods

/**
 * Represents a mongoose document for a mission in the database.
 */
type TMissionDoc = Document<any, any, TMissionSchema>

/* -- MODEL -- */

/**
 * The mongoose model for a mission in the database.
 */
const MissionModel = model<TMissionSchema, TMissionModel>(
  'Mission',
  MissionSchema,
)
export default MissionModel
