import mongoose, { Schema } from 'mongoose'
import MechanismStateModel from './model-mechanism-state'

let ObjectId = mongoose.Types.ObjectId

// Validator for mechanism
const validate_mechanism = (): void => {}

export const MechanismSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  mechanismID: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  states: { type: [MechanismStateModel], required: true },
})

const MechanismModel: any = mongoose.model('Mechanism', MechanismSchema)

export default MechanismModel
