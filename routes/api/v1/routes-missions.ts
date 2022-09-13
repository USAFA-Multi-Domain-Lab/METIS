//npm imports
import express from 'express'
import missionModel from '../../../database/models/model-mission'

//fields
const router = express.Router()

// -- GET | / --
// This will return the mission.
router.get('/', (request, response) => {
  missionModel
    .findOne({ name: 'Incredible Mission' })
    .exec((error: Error, mission: any) => {
      if (error !== null || mission === null) {
        return response.sendStatus(500)
      } else {
        return response.json({ mission })
      }
    })
})

module.exports = router
