import mongoose, { Schema } from 'mongoose'
import MechanismModel from './model-mechanism'

let ObjectId = mongoose.Types.ObjectId

/* -- SCHEMA VALIDATORS -- */

// Validator for assets
const validate_assets = (): void => {}

export const AssetSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  assetID: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  mechanisms: {
    type: [MechanismModel],
    required: true,
  },
})

const AssetModel: any = mongoose.model('Asset', AssetSchema)

export default AssetModel
