import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

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
          nodeID: { type: String, required: true, unique: true, auto: true },
          name: { type: String, required: true },
          color: { type: String, required: true },
          preExecutionText: { type: String, required: true },
          executable: { type: Boolean, required: true },
          device: { type: Boolean, required: true },
          actions: {
            type: [
              {
                _id: { type: ObjectId, required: false, auto: true },
                actionID: {
                  type: String,
                  required: true,
                  unique: true,
                  auto: true,
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
    },
  },
  {
    _id: false,
    strict: false,
    minimize: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id
      },
    },
  },
)

const MissionModel: any = mongoose.model('Mission', MissionSchema)

export default MissionModel
