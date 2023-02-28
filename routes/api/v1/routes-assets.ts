//npm imports
import express from 'express'
import AssetModel from '../../../database/models/model-asset'
import { databaseLogger } from '../../../modules/logging'
import { isLoggedIn, requireLogin } from '../../../user'

//fields
const router = express.Router()

// -- GET | /api/v1/assets/ --
// This will return all of the assets.
router.get('/', requireLogin, (request, response) => {
  let assetID = request.query.assetID

  if (assetID === undefined) {
    let queries: any = {}

    AssetModel.find({ ...queries }).exec((error: Error, assets: any) => {
      if (error !== null || assets !== null) {
        databaseLogger.error('Failed to retrieve assets.')
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else {
        databaseLogger.info('All assets retrieved.')
        return response.json({ assets })
      }
    })
  } else {
    AssetModel.findOne({ assetID }).exec((error: Error, asset: any) => {
      if (error !== null) {
        databaseLogger.error(`Failed to retrieve asset with ID "${assetID}."`)
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else if (asset === null) {
        return response.sendStatus(404)
      } else if (!isLoggedIn(request)) {
        return response.sendStatus(401)
      } else {
        databaseLogger.info(`Asset with ID "${assetID}" retrieved.`)
        return response.json({ asset })
      }
    })
  }
})
