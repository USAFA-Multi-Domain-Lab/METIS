import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

const missionSchema: Schema = new Schema(
  {
    _id: { type: ObjectId, required: false, auto: true },
    missionID: { type: ObjectId, required: true, unique: true, auto: true },
    name: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    seed: { type: ObjectId, required: true, auto: true },
    initialResources: { type: Number, required: true },
    nodeStructure: { type: {}, required: true },
    nodeData: { type: [], required: true },
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

const missionModel: any = mongoose.model('Mission', missionSchema)

export default missionModel
