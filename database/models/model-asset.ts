import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

// Validator for assets
const validate_assets = (): void => {}

// Validator for asset.mechanisms
const validate_assets_mechanisms = (): void => {}

export const AssetSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  assetID: { type: ObjectId, required: true, unique: true, auto: true },
  name: { type: String, required: true },
  mechanisms: [
    {
      _id: { type: ObjectId, required: false, auto: true },
      mechanismID: { type: String, required: true, unique: true },
      states: { type: [String], required: true },
      selectedState: { type: String, required: true },
    },
  ],
})

const AssetModel: any = mongoose.model('Asset', AssetSchema)

export default AssetModel
