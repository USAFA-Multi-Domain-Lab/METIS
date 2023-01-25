import mongoose, { Schema } from 'mongoose'
import { ERROR_BAD_DATA } from '../database'

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
  let validColors: Array<string> = [
    'default',
    'green',
    'pink',
    'yellow',
    'blue',
    'purple',
    'red',
    'brown',
    'orange',
  ]
  let isValidColor: boolean = validColors.includes(color)

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

/* -- SCHEMA -- */

export const MissionSchema: Schema = new Schema(
  {
    _id: { type: ObjectId, required: false, auto: true },
    missionID: { type: ObjectId, required: true, unique: true, auto: true },
    name: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    live: { type: Boolean, required: true },
    seed: { type: ObjectId, required: true, auto: true },
    initialResources: {
      type: Number,
      required: true,
      validate: validate_missions_initialResources,
    },
    deleted: { type: Boolean, required: true, default: false },
    // ! ADD VALIDATOR
    nodeStructure: { type: {}, required: true },
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
          preExecutionText: { type: String, required: false, default: '' },
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
                description: { type: String, required: true },
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
                postExecutionSuccessText: { type: String, required: true },
                postExecutionFailureText: { type: String, required: true },
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
    strict: true,
    minimize: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id
      },
    },
  },
)

/* -- FILTERS -- */

const enforceUniqueIDs = (mission: any, next: any): void => {
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
            `Duplicate actionID (${action.actionID}) used in node (${nodeDatum.nodeID}).`,
          )
          error.name = ERROR_BAD_DATA
          next(error)
        }
      }
    } else {
      let error: Error = new Error(
        `Duplicate nodeID used in mission: ${nodeDatum.nodeID}`,
      )
      error.name = ERROR_BAD_DATA
      next(error)
    }
  }

  next()
}

const filterOutUnusedIDs = (missions: any): void => {
  let mission: any

  if (missions instanceof Array) {
    for (let mission of missions) {
      return filterOutUnusedIDs(mission)
    }
    return
  } else {
    mission = missions._doc
  }

  delete mission._id

  if (mission.nodeData instanceof Array) {
    for (let node of mission.nodeData) {
      node = node._doc
      delete node._id

      if (node.actions instanceof Array) {
        for (let action of node.actions) {
          action = action._doc
          delete action._id
        }
      }
    }
  }
}

MissionSchema.pre('save', function (next) {
  enforceUniqueIDs(this, next)
})
MissionSchema.pre('update', function (next) {
  enforceUniqueIDs(this, next)
})
MissionSchema.post(/^find/, function (docs) {
  filterOutUnusedIDs(docs)
})

const MissionModel: any = mongoose.model('Mission', MissionSchema)

export default MissionModel
