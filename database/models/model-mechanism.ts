import mongoose, { Schema } from 'mongoose'
import { MechanismStateSchema } from './model-mechanism-state'

let ObjectId = mongoose.Types.ObjectId

const STATE_DATA_MIN_LENGTH = 1

// Validator for mechanismState
const validate_mechanisms_mechanismStates = (states: Array<any>): boolean => {
  let minLengthReached: boolean = states.length >= STATE_DATA_MIN_LENGTH

  return minLengthReached
}

export const MechanismSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  mechanismID: { type: String, required: true, unique: true },
  assetID: {
    type: String,
    ref: 'Asset.assetID',
    required: true,
    unique: true,
  },
  name: { type: String, required: true, unique: true },
  states: {
    type: [MechanismStateSchema],
    required: true,
    validate: validate_mechanisms_mechanismStates,
  },
})

const MechanismModel: any = mongoose.model('Mechanism', MechanismSchema)

export default MechanismModel
