import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

// Validator for mechanismState
const validate_mechanismState = (): void => {}

export const MechanismStateSchema: Schema = new Schema({
  type: {
    _id: { type: ObjectId, required: false, auto: true },
    mechnismStateID: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
  },
})

const MechanismStateModel: any = mongoose.model(
  'MechanismState',
  MechanismStateSchema,
)

export default MechanismStateModel
