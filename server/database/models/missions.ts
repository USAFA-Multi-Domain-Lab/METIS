import Mission, { TCommonMissionJson } from 'metis/missions'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TCommonMissionNodeJson, TMissionNodeJson } from 'metis/missions/nodes'
import MetisDatabase from 'metis/server/database'
import SanitizedHTML from 'metis/server/database/schema-types/html'
import ServerEffect from 'metis/server/missions/effects'
import ServerTargetEnvironment from 'metis/server/target-environments'
import ServerTarget from 'metis/server/target-environments/targets'
import { TTargetArg } from 'metis/target-environments/args'
import ForceArg from 'metis/target-environments/args/force-arg'
import NodeArg from 'metis/target-environments/args/node-arg'
import { AnyObject } from 'metis/toolbox/objects'
import { HEX_COLOR_REGEX } from 'metis/toolbox/strings'
import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

const NODE_DATA_MIN_LENGTH = 1
const ACTIONS_MIN_LENGTH = 1
const PROCESS_TIME_MAX = 3600 /*seconds*/ * 1000

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
 * Validates the mission data.
 * @param mission The mission data to validate.
 * @param next The next function to call.
 */
const validate_missions = (mission: any, next: any): void => {
  // Get the parent structure.
  let parentStructure: TCommonMissionJson['nodeStructure'] =
    mission.nodeStructure
  // Array to store the structure keys.
  let correspondingNodeStructureKeys: TMissionNodeJson['structureKey'][] = []
  // Object to store results.
  let results: { error?: Error } = {}
  // Object to store existing _id's.
  let existingIds: AnyObject = {}

  // This will ensure the node structure
  // is valid.
  const validateNodeStructure = (
    nodeStructure: any = parentStructure,
    parentKey: string = 'ROOT',
  ): { error?: Error } => {
    if (!(nodeStructure instanceof Object)) {
      let error: Error = new Error(
        `Error in nodeStructure:\n"${parentKey}" is set to ${nodeStructure}, which is not an object.`,
      )
      error.name = MetisDatabase.ERROR_BAD_DATA
      return { error }
    }

    for (let [key, value] of Object.entries(nodeStructure)) {
      if (correspondingNodeStructureKeys.includes(key)) {
        let error: Error = new Error(
          `Error in nodeStructure:\nDuplicate structureKey used (${key}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      } else {
        correspondingNodeStructureKeys.push(key)
      }

      let results: { error?: Error } = validateNodeStructure(value, key)

      if (results.error) {
        return results
      }
    }

    return {}
  }

  // Algorithm to check for duplicate _id's.
  const _idCheckerAlgorithm = (cursor = mission) => {
    // If the cursor has a _doc property and its an object...
    if (cursor._doc !== undefined && cursor._doc instanceof Object) {
      // ...then set the cursor to the _doc property.
      cursor = cursor._doc
    }
    // If the cursor is an object, but not an ObjectId...
    if (cursor instanceof Object && !(cursor instanceof ObjectId)) {
      // ...and it has an _id property and the _id already exists...
      if (cursor._id && cursor._id in existingIds) {
        // ...then set the error and return.
        results.error = new Error(
          `Error in mission:\nDuplicate _id used (${cursor._id}).`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return
      }
      // Or, if the cursor is a Mission and the _id isn't a valid ObjectId...
      else if (
        cursor instanceof Mission &&
        !mongoose.isValidObjectId(cursor._id)
      ) {
        // ...then set the error and return.
        results.error = new Error(
          `Error in mission:\nInvalid _id used (${cursor._id}).`,
        )
        results.error.name = MetisDatabase.ERROR_BAD_DATA
        return
      }
      // Otherwise, add the _id to the existingIds object.
      else {
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
  }

  // This will ensure the mission has between
  // one and eight forces and that each prototype
  // in the mission has a corresponding node within
  // each force.
  const validateMissionForces = () => {
    if (mission.forces.length < 1) {
      results.error = new Error(
        `Error in mission:\nMission must have at least one force.`,
      )
      results.error.name = MetisDatabase.ERROR_BAD_DATA
      return
    }
    if (mission.forces.length > 8) {
      results.error = new Error(
        `Error in mission:\nMission can have no more than eight forces.`,
      )
      results.error.name = MetisDatabase.ERROR_BAD_DATA
      return
    }
  }

  // Check for duplicate _id's.
  _idCheckerAlgorithm()

  // Check for error.
  if (results.error) return next(results.error)

  // Validate node structure.
  results = validateNodeStructure()

  // Check for error.
  if (results.error) return next(results.error)

  // Validate the mission forces.
  validateMissionForces()

  // Check for error.
  if (results.error) return next(results.error)

  return next()
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
 * Validates the depth padding for a mission-node.
 * @param depthPadding The depth padding to validate.
 */
const validate_mission_forces_nodes_depthPadding = (
  depthPadding: TCommonMissionNodeJson['depthPadding'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(depthPadding)

  return nonNegativeInteger
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

/**
 * Validates the effects for a mission-action.
 * @param effects The effects to validate.
 */
const validate_mission_forces_nodes_actions_effects = (
  effects: TCommonMissionActionJson['effects'],
): void => {
  // Loop through each effect.
  effects.forEach((effect) => {
    // Get the target.
    let target = ServerTarget.getTarget(effect.targetId)

    // Ensure the target exists.
    if (!target) {
      throw new Error(
        `Error in mission:\nThe effect's ("${effect.name}") target ID ("${effect.targetId}") was not found in any of the target-environments.`,
      )
    }

    // Get the target environment.
    let targetEnvironment = ServerTargetEnvironment.getJson(
      target.targetEnvironment._id,
    )

    // Ensure the target environment exists.
    if (!targetEnvironment) {
      throw new Error(
        `Error in mission:\nThe target environment for the target ("${target.name}") was not found in the target-environment registry.`,
      )
    }

    // Ensure the target environment version is correct.
    if (targetEnvironment.version !== effect.targetEnvironmentVersion) {
      throw new Error(
        `Error in mission:\nThe target environment version (${effect.targetEnvironmentVersion}) within the effect ("${effect.name}") does not match target environment version (${targetEnvironment.version}) for the target environment (${targetEnvironment.name}).`,
      )
    }

    // Grab the argument IDs from the effect.
    let effectArgIds = Object.keys(effect.args)
    // Loop through the argument IDs.
    for (let effectArgId of effectArgIds) {
      // Find the argument.
      let arg = target.args.find((arg: TTargetArg) => arg._id === effectArgId)

      // Ensure the argument exists.
      if (!arg) {
        throw new Error(
          `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) doesn't exist in the target's ({ _id: "${target._id}", name: "${target.name}" }) arguments.`,
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
          `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "string."`,
        )
      } else if (arg && arg.type === 'number' && typeof value !== 'number') {
        throw new Error(
          `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "number."`,
        )
      } else if (arg && arg.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(
          `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "boolean."`,
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
            `Error in mission:\nThe argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is not a valid option in the effect's target ({ _id: "${target._id}", name: "${target.name}" }).`,
          )
        }
      }

      // If the argument is a string, ensure the value matches the pattern.
      if (arg.type === 'string' && arg.pattern) {
        let isValid = arg.pattern.test(value)
        if (isValid === false) {
          throw new Error(
            `Error in mission:\nThe argument with ID ("${effectArgId}") has a value ("${value}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) that is invalid.`,
          )
        }
      }

      // Ensure the force argument has the correct type.
      if (arg.type === 'force') {
        if (typeof value !== 'object') {
          throw new Error(
            `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "object."`,
          )
        }

        // Ensure the force argument has the correct keys.
        if (
          !(ForceArg.FORCE_ID_KEY in value) ||
          !(ForceArg.FORCE_NAME_KEY in value)
        ) {
          throw new Error(
            `Error in mission:\nThe argument with ID ("${effectArgId}") has a value ("${JSON.stringify(
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
            `Error in mission:\nThe argument with ID ("${effectArgId}") within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is of the wrong type. Expected type: "object."`,
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
            `Error in mission:\nThe argument with ID ("${effectArgId}") has a value ("${JSON.stringify(
              value,
            )}") within the effect ({ _id: "${effect._id}", name: "${
              effect.name
            }" }) that has missing properties that are required.`,
          )
        }
      }
    }

    // Check to see if there are any missing arguments.
    let missingArg = ServerEffect.checkForMissingArg(target, effect.args)
    // Ensure all of the required arguments are present in the effect.
    if (missingArg) {
      throw new Error(
        `Error in mission:\nThe required argument ({ _id: "${missingArg._id}", name: "${missingArg.name}" }) within the effect ({ _id: "${effect._id}", name: "${effect.name}" }) is missing.`,
      )
    }
  })
}

/**
 * Sanitizes the effects' arguments for a mission-action.
 * @param mission The mission with all the actions and their effects.
 */
const sanitize_mission_forces_nodes_actions_effects_args = (
  mission: any,
): void => {
  // Loop through each force.
  mission.forces.forEach((force: any) => {
    // Loop through each node.
    force.nodes.forEach((node: any) => {
      // Loop through each action.
      node.actions.forEach((action: any) => {
        // Loop through each effect.
        action.effects.forEach((effect: any) => {
          // Get the target.
          let target = ServerTarget.getTarget(effect.targetId)

          // Ensure the target exists.
          if (!target) {
            throw new Error(
              `Error in mission:\nThe effect's ("${effect.name}") target ID ("${effect.targetId}") was not found in any of the target-environments.`,
            )
          }

          // Sanitize the arguments.
          effect.args = ServerEffect.sanitizeArgs(target, effect.args)
        })
      })
    })
  })
}

/* -- SCHEMA -- */

/**
 * The schema for a mission in the database.
 */
export const MissionSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    introMessage: { type: SanitizedHTML, required: true },
    versionNumber: { type: Number, required: true },
    seed: { type: ObjectId, required: true, auto: true },
    deleted: { type: Boolean, required: true, default: false },
    nodeStructure: {
      type: {},
      required: true,
    },
    forces: {
      type: [
        {
          _id: { type: String, required: true },
          name: { type: String, required: true },
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
                structureKey: { type: String, required: true },
                name: { type: String, required: true },
                color: {
                  type: String,
                  required: true,
                  validate: validate_missions_forces_nodes_color,
                },
                description: { type: SanitizedHTML, required: true },
                preExecutionText: {
                  type: SanitizedHTML,
                  required: false,
                  default: '',
                },
                depthPadding: {
                  type: Number,
                  required: true,
                  validate: validate_mission_forces_nodes_depthPadding,
                },
                executable: { type: Boolean, required: true },
                device: { type: Boolean, required: true },
                actions: {
                  type: [
                    {
                      _id: { type: String, required: true },
                      name: { type: String, required: true },
                      description: { type: SanitizedHTML, required: true },
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
                        type: SanitizedHTML,
                        required: true,
                      },
                      postExecutionFailureText: {
                        type: SanitizedHTML,
                        required: true,
                      },
                      effects: {
                        type: [
                          {
                            _id: { type: String, required: true },
                            name: { type: String, required: true },
                            description: {
                              type: SanitizedHTML,
                              required: true,
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
                        validate: validate_mission_forces_nodes_actions_effects,
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
  },
)

/* -- SCHEMA METHODS -- */

// Called before a save is made
// to the database.
MissionSchema.pre('save', function (next) {
  sanitize_mission_forces_nodes_actions_effects_args(this)
  validate_missions(this, next)
})

// Called before an update is made
// to the database.
MissionSchema.pre('update', function (next) {
  sanitize_mission_forces_nodes_actions_effects_args(this)
  validate_missions(this, next)
})

/* -- SCHEMA PLUGINS -- */

MissionSchema.plugin((schema) => {
  // This is responsible for removing
  // excess properties from the mission
  // data that should be hidden from the
  // API and for hiding deleted missions.
  schema.query.queryForApiResponse = function (
    findFunctionName: 'find' | 'findOne',
  ) {
    // Get projection.
    let projection = this.projection()

    // Create if does not exist.
    if (projection === undefined) {
      projection = {}
    }

    // Remove all unneeded properties.
    if (!('deleted' in projection)) {
      projection['deleted'] = 0
    }
    if (!('__v' in projection)) {
      projection['__v'] = 0
    }

    // Set projection.
    this.projection(projection)
    // Hide deleted missions.
    this.where({ deleted: false })

    // Calls the appropriate find function.
    switch (findFunctionName) {
      case 'find':
        return this.find()
      case 'findOne':
        return this.findOne()
    }
  }
})

/* -- MODEL -- */

const MissionModel: any = mongoose.model('Mission', MissionSchema)
export default MissionModel
