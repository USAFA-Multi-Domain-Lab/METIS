import mongoose, { Schema } from 'mongoose'
import { ERROR_BAD_DATA } from '../database'

let ObjectId = mongoose.Types.ObjectId

const NODE_DATA_MIN_LENGTH = 1
const ACTIONS_MIN_LENGTH = 1

/* -- SCHEMA VALIDATORS -- */

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

/* -- SCHEMA -- */

export const MissionSchema: Schema = new Schema(
  {
    _id: { type: ObjectId, required: false, auto: true },
    missionID: { type: ObjectId, required: true, unique: true, auto: true },
    name: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    live: { type: Boolean, required: true },
    seed: { type: ObjectId, required: true, auto: true },
    initialResources: { type: Number, required: true },
    nodeStructure: { type: {}, required: true },
    nodeData: {
      type: [
        {
          _id: { type: ObjectId, required: false, auto: true },
          nodeID: { type: String, required: true },
          name: { type: String, required: true },
          color: { type: String, required: true },
          preExecutionText: { type: String, required: false, default: '' },
          depthPadding: { type: Number, required: true },
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
                processTime: { type: Number, required: true },
                successChance: { type: Number, required: true },
                resourceCost: { type: Number, required: true },
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

MissionSchema.pre('update', function (next) {
  enforceUniqueIDs(this, next)
})
MissionSchema.pre('save', function (next) {
  enforceUniqueIDs(this, next)
})

const MissionModel: any = mongoose.model('Mission', MissionSchema)

export default MissionModel
