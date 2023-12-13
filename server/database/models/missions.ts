import mongoose, { Schema } from 'mongoose'
import MetisDatabase from 'metis/server/database'
import SanitizedHTML from 'metis/server/database/schema-types/html'
import { TCommonEffectJson } from 'metis/missions/actions/effects'

let ObjectId = mongoose.Types.ObjectId

const NODE_DATA_MIN_LENGTH = 1
const ACTIONS_MIN_LENGTH = 1
const PROCESS_TIME_MAX = 3600 /*seconds*/ * 1000

/* -- SCHEMA VALIDATION HELPERS -- */

// Global validator for non-negative integers.
const isNonNegativeInteger = (value: number): boolean => {
  let isInteger: boolean = Math.floor(value) === value
  let isNonNegative: boolean = value >= 0

  return isInteger && isNonNegative
}

/* -- SCHEMA VALIDATORS -- */

// Validator for missions.
const validate_missions = (mission: any, next: any): void => {
  let parentNodeStructure: any = mission.nodeStructure
  let nodeData: Array<any> = mission.nodeData
  let nodeDataIDs: Array<string> = nodeData.map((node) => node.nodeID)
  let correspondingNodeStructureIDs: Array<string> = []
  let results: { error?: Error } = {}

  // This will ensure that all nodes
  // have IDs unique to the mission,
  // and that all action IDs are unique
  // to the node they are assigned to.
  const ensureUniqueIDs = (): { error?: Error } => {
    let nodeIDs: Array<string> = []

    for (let nodeDatum of mission.nodeData) {
      if (!nodeIDs.includes(nodeDatum.nodeID)) {
        nodeIDs.push(nodeDatum.nodeID)

        let actionIDs: Array<string> = []

        for (let action of nodeDatum.actions) {
          if (!actionIDs.includes(action.actionID)) {
            actionIDs.push(action.actionID)
          } else {
            let error: Error = new Error(
              `Error in nodeData:\nDuplicate actionID (${action.actionID}) used in node (${nodeDatum.nodeID}).`,
            )
            error.name = MetisDatabase.ERROR_BAD_DATA
            return { error }
          }
        }
      } else {
        let error: Error = new Error(
          `Error in nodeData:\nDuplicate nodeID used (${nodeDatum.nodeID}).`,
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
      if (!nodeDataIDs.includes(key)) {
        let error: Error = new Error(
          `Error in mission:\n"${key}" was referenced in nodeStructure, but it was not found in the nodeData.`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      }
      if (correspondingNodeStructureIDs.includes(key)) {
        let error: Error = new Error(
          `Error in nodeStructure:\nDuplicate nodeID used (${key}).`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return { error }
      } else {
        correspondingNodeStructureIDs.push(key)
      }

      let results: { error?: Error } = validateNodeStructure(value, key)

      if (results.error) {
        return results
      }
    }

    return {}
  }

  // Ensure unique IDs
  results = ensureUniqueIDs()

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
  if (nodeDataIDs.length !== correspondingNodeStructureIDs.length) {
    for (let nodeID of nodeDataIDs) {
      if (!correspondingNodeStructureIDs.includes(nodeID)) {
        let error: Error = new Error(
          `Error in mission:\n"${nodeID}" was referenced in nodeData, but it was not found in the nodeStructure.`,
        )
        error.name = MetisDatabase.ERROR_BAD_DATA
        return next(error)
      }
    }
  }

  return next()
}

// Validator for missions.initialResources.
const validate_missions_initialResources = (
  initialResources: number,
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(initialResources)

  return nonNegativeInteger
}

// Validator for missions.nodeData.
const validate_missions_nodeData = (nodeData: Array<any>): boolean => {
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

// Validator for missions.nodeData.color.
const validate_missions_nodeData_color = (color: string): boolean => {
  let colorExpression: RegExp = /^#([a-f0-9]{6})$/
  let isValidColor: boolean = colorExpression.test(color)

  return isValidColor
}

// Validator for missions.nodeData.depthPadding.
const validate_mission_nodeData_depthPadding = (
  depthPadding: number,
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(depthPadding)

  return nonNegativeInteger
}

// Validator for missions.nodeData.actions.processTime
const validate_mission_nodeData_actions_processTime = (
  processTime: number,
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(processTime)
  let lessThanMax: boolean = processTime <= PROCESS_TIME_MAX

  return nonNegativeInteger && lessThanMax
}

// Validator for missions.nodeData.actions.successChance
const validate_mission_nodeData_actions_successChance = (
  successChance: number,
): boolean => {
  let betweenZeroAndOne: boolean = successChance >= 0 && successChance <= 1

  return betweenZeroAndOne
}

// Validator for missions.nodeData.actions.resourceCost
const validate_mission_nodeData_actions_resourceCost = (
  resourceCost: number,
): boolean => {
  let nonNegativeInteger: boolean = isNonNegativeInteger(resourceCost)

  return nonNegativeInteger
}

/**
 * Validator for targetEnvironment.effects.
 * @param {TCommonEffectJson[]} effects The effects to validate.
 * @returns {boolean} Whether the effects are valid.
 */
const validate_mission_nodeData_actions_effects = (
  effects: TCommonEffectJson[],
): boolean => {
  // todo: implement validation
  return true
}

/* -- SCHEMA -- */

export const MissionSchema: Schema = new Schema(
  {
    _id: { type: ObjectId, required: false, auto: true },
    missionID: { type: ObjectId, required: true, unique: true, auto: true },
    name: { type: String, required: true },
    introMessage: { type: SanitizedHTML, required: true },
    versionNumber: { type: Number, required: true },
    live: { type: Boolean, required: true, default: false },
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
          _id: { type: ObjectId, required: false, auto: true },
          nodeID: { type: String, required: true },
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
                _id: { type: ObjectId, required: false, auto: true },
                actionID: {
                  type: String,
                  required: true,
                },
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
                // todo: remove scripts (deprecated)
                scripts: {
                  type: [
                    {
                      label: { type: String, required: true },
                      description: { type: String, required: true },
                      scriptName: { type: String, required: true },
                      originalPath: { type: String, required: true },
                      args: { type: Object, required: true },
                    },
                  ],
                  required: true,
                },
                effects: {
                  type: [
                    {
                      id: { type: String, required: true },
                      name: { type: String, required: true },
                      description: { type: String, required: true },
                      targetId: { type: String, required: true },
                      args: {
                        entityName: { type: String, required: true },
                        requestPath: { type: String, required: true },
                        requestMethod: { type: String, required: true },
                        requestData: { type: Object, required: true },
                      },
                    },
                  ],
                  required: true,
                  validate: validate_mission_nodeData_actions_effects,
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
    _id: false,
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
    if (!('_id' in projection)) {
      projection['_id'] = 0
    }
    if (!('__v' in projection)) {
      projection['__v'] = 0
    }
    if (!('nodeData' in projection) && !('nodeData._id' in projection)) {
      projection['nodeData._id'] = 0
    }
    if (
      !('nodeData' in projection) &&
      !('nodeData.actions' in projection) &&
      !('nodeData.actions._id' in projection)
    ) {
      projection['nodeData.actions._id'] = 0
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
