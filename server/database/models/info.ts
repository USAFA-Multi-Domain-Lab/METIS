import { model } from 'mongoose'
import { InfoSchema } from './classes'
import type { TInfo, TInfoModel } from './types'

const Schema = new InfoSchema(
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

/* -- MODEL -- */
const InfoModel = model<TInfo, TInfoModel>('Info', Schema)
export default InfoModel
