import mongoose, { Schema, Model } from 'mongoose'

const missionSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    versionNumber: { type: Number, required: true },
    nodeStructure: { type: {}, required: true },
    nodeData: { type: {}, required: true },
  },
  { strict: false },
)

const missionModel: any = mongoose.model('Mission', missionSchema)

export default missionModel
