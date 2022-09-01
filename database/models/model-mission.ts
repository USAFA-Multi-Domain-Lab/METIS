import mongoose, { Schema, Model } from 'mongoose'

const missionSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    nodes: { type: {}, required: true },
  },
  { strict: false },
)

const missionModel: any = mongoose.model('Mission', missionSchema)

export default missionModel
