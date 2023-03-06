import mongoose, { Schema } from 'mongoose'
import { ERROR_BAD_DATA } from '../database'
import { MechanismSchema } from './model-mechanism'

let ObjectId = mongoose.Types.ObjectId

const MECHANISM_DATA_MIN_LENGTH = 1

/* -- SCHEMA VALIDATORS -- */

// Validator for assets
const validate_assets = (asset: any, next: any): void => {
  let results: { error?: Error }

  // This will ensure that all mechanisms
  // have IDs unique to the asset, and
  // that all mechanism-state IDs are
  // unique to the mechanism they are assigned to.
  const ensureUniqueIDs = (): { error?: Error } => {
    let mechanismIDs: Array<string> = []

    for (let mechanism of asset.mechanisms) {
      if (!mechanismIDs.includes(mechanism.mechanismID)) {
        mechanismIDs.push(mechanism.mechanismID)

        let mechanismStateIDs: Array<string> = []

        for (let mechanismState of mechanism.states) {
          if (!mechanismStateIDs.includes(mechanismState.mechanismStateID)) {
            mechanismStateIDs.push(mechanismState.mechanismStateID)
          } else {
            let error: Error = new Error(
              `Error in mechanism.states:\nDuplicate mechanismStateID (${mechanismState.mechanismStateID}) used in mechanism (${mechanism.mechanismID}).`,
            )
            error.name = ERROR_BAD_DATA
            return { error }
          }
        }
      } else {
        let error: Error = new Error(
          `Error in asset.mechanisms:\nDuplicate mechanismID (${mechanism.mechanismID}) used in asset (${asset.assetID}).`,
        )
        error.name = ERROR_BAD_DATA
        return { error }
      }
    }
    return {}
  }

  // Ensure unique IDs
  results = ensureUniqueIDs()

  // Check for error.
  if (results.error) {
    return next(results.error)
  }

  return next()
}

// Validator for mechanism
const validate_assets_mechanisms = (mechanisms: Array<any>): boolean => {
  let minLengthReached: boolean = mechanisms.length >= MECHANISM_DATA_MIN_LENGTH

  return minLengthReached
}

export const AssetSchema: Schema = new Schema({
  _id: { type: ObjectId, required: false, auto: true },
  assetID: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  mechanisms: {
    type: [MechanismSchema],
    required: true,
    validate: validate_assets_mechanisms,
  },
})

/* -- FILTERS -- */

const filterOutUnusedIDs = (assets: any): void => {
  let asset: any

  if (assets instanceof Array) {
    for (let asset of assets) {
      return filterOutUnusedIDs(asset)
    }
    return
  } else {
    asset = assets._doc
  }

  delete asset._id

  if (asset.mechanisms instanceof Array) {
    for (let mechanism of asset.mechanisms) {
      mechanism = mechanism._doc
      delete mechanism._id

      if (mechanism.states instanceof Array) {
        for (let mechanismState of mechanism.states) {
          mechanismState = mechanismState._doc
          delete mechanismState._id
        }
      }
    }
  }
}

AssetSchema.pre('save', function (next) {
  validate_assets(this, next)
})
AssetSchema.pre('update', function (next) {
  validate_assets(this, next)
})
AssetSchema.post(/^find/, function (docs) {
  filterOutUnusedIDs(docs)
})

const AssetModel: any = mongoose.model('Asset', AssetSchema)

export default AssetModel
