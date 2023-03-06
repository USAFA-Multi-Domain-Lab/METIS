import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

export const MechanismStateSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  mechanismStateID: { type: String, required: true, unique: true },
  mechanismID: {
    type: String,
    ref: 'Mechanism.mechanismID',
    required: true,
  },
  name: { type: String, required: true, unique: true },
})

const MechanismStateModel: any = mongoose.model(
  'MechanismState',
  MechanismStateSchema,
)

export default MechanismStateModel
