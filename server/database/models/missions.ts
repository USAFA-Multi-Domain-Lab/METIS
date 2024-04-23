import { TCommonMissionJson } from 'metis/missions'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import { TCommonMissionNodeJson, TMissionNodeJson } from 'metis/missions/nodes'
import MetisDatabase from 'metis/server/database'
import SanitizedHTML from 'metis/server/database/schema-types/html'
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
  let parentNodeStructure: TCommonMissionJson['nodeStructure'] =
    mission.nodeStructure
  let nodeData: TCommonMissionJson['nodeData'] = mission.nodeData
  let nodeDataStructureKeys: TMissionNodeJson['structureKey'][] = nodeData.map(
    (node) => node.structureKey,
  )
  let correspondingNodeStructureKeys: TMissionNodeJson['structureKey'][] = []
  let results: { error?: Error } = {}

  // This will ensure that all nodes
  // have IDs unique to the mission,
  // and that all action IDs are unique
  // to the node they are assigned to.
  const ensureUniqueIds = (): { error?: Error } => {
    let nodeIds: string[] = []

    for (let nodeDatum of mission.nodeData) {
      if (!nodeIds.includes(nodeDatum._id)) {
        nodeIds.push(nodeDatum._id)

        let actionIds: string[] = []

        for (let action of nodeDatum.actions) {
          if (!actionIds.includes(action._id)) {
            actionIds.push(action._id)
          } else {
            let error: Error = new Error(
              `Error in nodeData:\nDuplicate action ID (${action._id}) used in node (${nodeDatum._id}).`,
            )
            error.name = MetisDatabase.ERROR_BAD_DATA
            return { error }
          }
        }
      } else {
        let error: Error = new Error(
          `Error in nodeData:\nDuplicate node ID used (${nodeDatum._id}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
    }
    return {}
  }

  // This will ensure the node structure
  // is valid.
  const validateNodeStructure = (
    nodeStructure: any = parentNodeStructure,
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
      if (!nodeDataStructureKeys.includes(key)) {
        let error: Error = new Error(
          `Error in mission:\n"${key}" was referenced in nodeStructure, but it was not found in the nodeData.`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      if (correspondingNodeStructureKeys.includes(key)) {
        let error: Error = new Error(
          `Error in nodeStructure:\nDuplicate nodeId used (${key}).`,
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

  // Ensure unique IDs
  results = ensureUniqueIds()

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

  // If the number of IDs in the nodeData
  // is different than the number in the
  // node structure, than the bad ID is
  // found and an error is created for it.
  if (nodeDataStructureKeys.length !== correspondingNodeStructureKeys.length) {
    for (let nodeStructureKey of nodeDataStructureKeys) {
      if (!correspondingNodeStructureKeys.includes(nodeStructureKey)) {
        let error: Error = new Error(
          `Error in mission:\n"${nodeStructureKey}" was referenced in nodeData, but it was not found in the nodeStructure.`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return next(error)
      }
    }
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
 * @param nodeData The nodeData to validate.
 */
const validate_missions_nodeData = (
  nodeData: TCommonMissionJson['nodeData'],
): boolean => {
  let minLengthReached: boolean = nodeData.length >= NODE_DATA_MIN_LENGTH
  let minLengthOfActionsReached: boolean = true

  for (let nodeDatum of nodeData) {
    if (nodeDatum.executable && nodeDatum.actions.length < ACTIONS_MIN_LENGTH) {
      minLengthOfActionsReached = false
      break
    }
  }

  return minLengthReached && minLengthOfActionsReached
}

/**
 * Validates the color for a mission node.
 * @param color The color to validate.
 */
const validate_missions_nodeData_color = (
  color: TCommonMissionNodeJson['color'],
): boolean => {
  let colorExpression: RegExp = /^#([a-f0-9]{6})$/
  let isValidColor: boolean = colorExpression.test(color)

  return isValidColor
}

/**
 * Validates the depth padding for a mission node.
 * @param depthPadding The depth padding to validate.
 */
const validate_mission_nodeData_depthPadding = (
  depthPadding: TCommonMissionNodeJson['depthPadding'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(depthPadding)

  return nonNegativeInteger
}

/**
 * Validates the process time for a mission node action.
 * @param processTime The process time to validate.
 */
const validate_mission_nodeData_actions_processTime = (
  processTime: TCommonMissionActionJson['processTime'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(processTime)
  let lessThanMax: boolean = processTime <= PROCESS_TIME_MAX

  return nonNegativeInteger && lessThanMax
}

/**
 * Validates the success chance for a mission node action.
 * @param successChance The success chance to validate.
 */
const validate_mission_nodeData_actions_successChance = (
  successChance: TCommonMissionActionJson['successChance'],
): boolean => {
  let betweenZeroAndOne: boolean = successChance >= 0 && successChance <= 1

  return betweenZeroAndOne
}

/**
 * Validates the resource cost for a mission node action.
 * @param resourceCost The resource cost to validate.
 */
const validate_mission_nodeData_actions_resourceCost = (
  resourceCost: TCommonMissionActionJson['resourceCost'],
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(resourceCost)

  return nonNegativeInteger
}

/* -- SCHEMA -- */

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
    nodeData: {
      type: [
        {
          structureKey: { type: String, required: true },
          name: { type: String, required: true },
          color: {
            type: String,
            required: true,
            validate: validate_missions_nodeData_color,
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
            validate: validate_mission_nodeData_depthPadding,
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
                  validate: validate_mission_nodeData_actions_processTime,
                },
                successChance: {
                  type: Number,
                  required: true,
                  validate: validate_mission_nodeData_actions_successChance,
                },
                resourceCost: {
                  type: Number,
                  required: true,
                  validate: validate_mission_nodeData_actions_resourceCost,
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
                      description: { type: SanitizedHTML, required: true },
                      targetEnvironmentVersion: {
                        type: String,
                        required: true,
                      },
                      targetId: { type: String, required: true },
                      args: { type: Object, required: true },
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
      validate: validate_missions_nodeData,
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
