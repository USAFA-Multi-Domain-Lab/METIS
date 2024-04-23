import mongoose, { Schema } from 'mongoose'

export const InfoSchema: Schema = new Schema(
  {
    schemaBuildNumber: { type: Number, required: true },
  },
  {
    strict: 'throw',
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
