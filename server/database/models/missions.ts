import { TCommonMissionJson } from 'metis/missions'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import { TCommonExternalEffectJson } from 'metis/missions/effects/external'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TCommonMissionNodeJson, TMissionNodeJson } from 'metis/missions/nodes'
import MetisDatabase from 'metis/server/database'
import SanitizedHTML from 'metis/server/database/schema-types/html'
import ServerTargetEnvironment from 'metis/server/target-environments'
import ServerTarget from 'metis/server/target-environments/targets'
import { TTargetArg } from 'metis/target-environments/targets'
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
  let parentStructure: TCommonMissionJson['nodeStructure'] =
    mission.nodeStructure
  let correspondingNodeStructureKeys: TMissionNodeJson['structureKey'][] = []
  let results: { error?: Error } = {}

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

  // Check for error.
  if (results.error) {
    return next(results.error)
  }

  // Validate node structure.
  results = validateNodeStructure()

  // Check for error.
  if (results.error) {
    return next(results.error)
  }

  return next()
}

/**
 * Validates the initial resources for a mission.
 * @param initialResources The initial resources to validate.
 */
const validate_missions_initialResources = (
  initialResources: TCommonMissionJson['initialResources'],
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
  // todo: Add type.
  color: any, // TCommonMissionForceJson['color'],
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
  effects: TCommonExternalEffectJson[],
): void => {
  // Loop through each effect.
  effects.forEach((effect) => {
    // Get the target.
    let target = ServerTarget.getTargetJson(effect.targetId as string)

    // Ensure the target exists.
    if (!target) {
      throw new Error(
        `Error in mission:\nThe effect's ("${effect.name}") target ID ("${effect.targetId}") was not found in any of the target-environments.`,
      )
    }

    // Get the target environment.
    let targetEnvironment = ServerTargetEnvironment.getJson(target.targetEnvId)

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

    // Initialize the valid keys.
    let validKeys: string[] = []
    // Add all of the keys from the target arguments.
    target.args.forEach((arg: TTargetArg) => {
      // Add to the valid keys.
      validKeys.push(arg._id)
    })
    // Grab the keys from the effect.
    let keys = Object.keys(effect.args)
    // Loop through the keys.
    for (let key of keys) {
      // Ensure all of the keys are valid.
      if (!validKeys.includes(key)) {
        // Throw an error if the key is not valid.
        throw new Error(
          `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") doesn't exist in the target's ("${target.name}") arguments.`,
        )
      }

      // Ensure all of the arguments are of the correct type.
      let arg = target.args.find((arg: TTargetArg) => arg._id === key)
      // Get the value.
      let value = effect.args[key]
      // Ensure the value is of the correct type.
      if (
        arg &&
        (arg.type === 'string' ||
          arg.type === 'large-string' ||
          arg.type === 'dropdown') &&
        typeof value !== 'string'
      ) {
        throw new Error(
          `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is of the wrong type. Expected type: "string."`,
        )
      } else if (arg && arg.type === 'number' && typeof value !== 'number') {
        throw new Error(
          `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is of the wrong type. Expected type: "number."`,
        )
      } else if (arg && arg.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(
          `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is of the wrong type. Expected type: "boolean."`,
        )
      }

      // If the argument is a dropdown, ensure the value one of the options.
      // Ensure the argument is a dropdown.
      if (arg && arg.type === 'dropdown') {
        // Get the option.
        let option = arg.options.find((option) => option._id === value)
        // Ensure the option exists.
        if (!option) {
          throw new Error(
            `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is not one of the options in the target's ("${target.name}") arguments.`,
          )
        }
      }
    }

    // Ensure all of the required arguments are present based on dependencies.
    for (let arg of target.args) {
      // Ensure the argument is required.
      if (arg.required) {
        // Ensure the argument is present.
        if (!(arg._id in effect.args)) {
          // Ensure the argument has no dependencies.
          if (!arg.dependencies || arg.dependencies.length === 0) {
            throw new Error(
              `Error in mission:\nThe required argument ("${arg.name}") within the effect ("${effect.name}") is missing.`,
            )
          }
          // Ensure all of the dependencies are present and not in a default state.
          for (let dependency of arg.dependencies) {
            if (
              dependency in effect.args &&
              effect.args[dependency] !== '' &&
              effect.args[dependency] !== '<p><br></p>' &&
              effect.args[dependency] !== false &&
              effect.args[dependency] !== null &&
              effect.args[dependency] !== undefined
            ) {
              throw new Error(
                `Error in mission:\nThe required argument ("${arg.name}") within the effect ("${effect.name}") is missing.`,
              )
            }
          }
        }
      }
    }
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
    initialResources: {
      type: Number,
      required: true,
      validate: validate_missions_initialResources,
    },
    deleted: { type: Boolean, required: true, default: false },
    nodeStructure: {
      type: {},
      required: true,
    },
    forces: {
      type: [
        {
          name: { type: String, required: true },
          color: {
            type: String,
            required: true,
            validate: validate_force_color,
          },
          nodes: {
            type: [
              {
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
  validate_missions(this, next)
})

// Called before an update is made
// to the database.
MissionSchema.pre('update', function (next) {
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
