import { TCommonMissionJson } from 'metis/missions'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import { TCommonEffectJson } from 'metis/missions/effects'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TCommonMissionNodeJson, TMissionNodeJson } from 'metis/missions/nodes'
import MetisDatabase from 'metis/server/database'
import SanitizedHTML from 'metis/server/database/schema-types/html'
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

  let existingIds: AnyObject = {}

  // todo: Implement this.

  // const _idCheckerAlgorithm = (cursor = mission) => {
  //   if (cursor instanceof Object) {
  //     if (cursor._id && cursor._id in existingIds) {
  //       results.error = new Error(
  //         `Error in mission:\nDuplicate _id used (${cursor._id}).`,
  //       )
  //       results.error.name = MetisDatabase.ERROR_BAD_DATA
  //       return
  //     } else {
  //       existingIds[cursor._id] = true
  //     }
  //     for (let value of Object.values(cursor)) {
  //       _idCheckerAlgorithm(value)
  //     }
  //   }
  // }
  // _idCheckerAlgorithm()

  // todo: Implement this.
  //   let input = '777666777666'
  //   let objectId = new ObjectId('777666777666')
  //   let output = objectId.toString()
  //
  //   if (input !== ouput) {
  //     throw new Error('ObjectId is not working')
  // }

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
  effects: TCommonEffectJson[],
): void => {
  // Loop through each effect.
  effects.forEach((effect) => {
    // Get the target.
    let target = ServerTarget.getTarget(effect.targetId as string)

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
            `Error in mission:\nThe argument's ("${key}") value ("${value}") within the effect ("${effect.name}") is not a valid option in the effect's target ("${target.name}").`,
          )
        }
      }

      // If the argument is a string, ensure the value matches the pattern.
      if (arg && arg.type === 'string' && arg.pattern) {
        let isValid = arg.pattern.test(value)
        if (isValid === false) {
          throw new Error(
            `Error in mission:\nThe argument's ("${key}") value ("${value}") within the effect ("${effect.name}") is invalid.`,
          )
        }
      }

      // Ensure the force argument has the correct type.
      if (arg && arg.type === 'force') {
        if (typeof value !== 'object') {
          throw new Error(
            `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is of the wrong type. Expected type: "object."`,
          )
        }

        // Ensure the force argument has the correct keys.
        if (
          !(ForceArg.FORCE_ID_KEY in value) ||
          !(ForceArg.FORCE_NAME_KEY in value)
        ) {
          throw new Error(
            `Error in mission:\nThe argument's value, within the effect "${
              effect.name
            }", is missing required properties.\nArgument sent: ${key}: ${JSON.stringify(
              value,
            )}`,
          )
        }
      }

      // Ensure the node argument has the correct type.
      if (arg && arg.type === 'node') {
        if (typeof value !== 'object') {
          throw new Error(
            `Error in mission:\nThe argument ("${key}") within the effect ("${effect.name}") is of the wrong type. Expected type: "object."`,
          )
        }

        // Ensure the node argument has the correct keys.
        if (
          !(NodeArg.NODE_ID_KEY in value) ||
          !(NodeArg.NODE_NAME_KEY in value)
        ) {
          throw new Error(
            `Error in mission:\nThe argument's value, within the effect "${
              effect.name
            }", is missing required properties.\nArgument sent: { ${key}: ${JSON.stringify(
              value,
            )} }`,
          )
        }
      }
    }

    // Ensure all of the required arguments are present if all their dependencies are met.
    for (let arg of target.args) {
      // If the argument is required and it is not present...
      if (arg.required && !(arg._id in effect.args)) {
        // If all of the dependencies are met, throw an error.
        if (target.allDependenciesMet(arg.dependencies, effect.args)) {
          throw new Error(
            `Error in mission:\nThe required argument ("${arg.name}") within the effect ("${effect.name}") is missing.`,
          )
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
                _id: { type: String, unique: true },
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
