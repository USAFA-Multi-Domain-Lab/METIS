import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

export const InfoSchema: Schema = new Schema(
  {
    _id: { type: ObjectId, required: false, auto: true },
    infoID: { type: String, required: true },
    schemaBuildNumber: { type: Number, required: true },
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

const InfoModel: any = mongoose.model('Info', InfoSchema)

export default InfoModel
