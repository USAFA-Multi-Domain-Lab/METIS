//npm imports
import express from 'express'
import { ERROR_BAD_DATA } from '../../../database/database'
import Mission from '../../../database/models/model-mission'
import { databaseLogger } from '../../../modules/logging'
import { isLoggedIn, requireLogin } from '../../../user'

//fields
const router = express.Router()

// -- POST | /api/v1/missions/ --

// This will create a new mission.
router.post('/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let missionData: any = body.mission
    if (
      'name' in missionData &&
      'versionNumber' in missionData &&
      'live' in missionData &&
      'initialResources' in missionData &&
      'nodeStructure' in missionData &&
      'nodeData' in missionData
    ) {
      let name: any = missionData.name
      let versionNumber: any = missionData.versionNumber
      let live: any = missionData.live
      let initialResources: any = missionData.initialResources
      let nodeStructure: any = missionData.nodeStructure
      let nodeData: any = missionData.nodeData

      let mission = new Mission({
        name,
        versionNumber,
        live,
        initialResources,
        nodeStructure,
        nodeData,
      })

      mission.save((error: Error) => {
        if (error) {
          databaseLogger.error('Failed to create mission:')
          databaseLogger.error(error)

          if (error.name === ERROR_BAD_DATA) {
            return response.sendStatus(400)
          } else {
            return response.sendStatus(500)
          }
        } else {
          databaseLogger.info(`New mission created named "${name}".`)
          return response.json({ mission })
        }
      })
    }
  } else {
    return response.sendStatus(400)
  }
})

// -- GET | /api/v1/missions/ --
// This will return all of the missions.
router.get('/', (request, response) => {
  let missionID = request.query.missionID

  if (missionID === undefined) {
    let queries: any = {}

    if (!isLoggedIn(request)) {
      queries.live = true
    }

    Mission.find({ ...queries })
      .select('-nodeStructure -nodeData')
      .exec((error: Error, missions: any) => {
        if (error !== null || missions === null) {
          databaseLogger.error('Failed to retrieve missions.')
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else {
          databaseLogger.info('All missions retrieved.')
          return response.json({ missions })
        }
      })
  } else {
    Mission.findOne({ missionID }).exec((error: Error, mission: any) => {
      if (error !== null) {
        databaseLogger.error(
          `Failed to retrieve mission with ID "${missionID}".`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else if (mission === null) {
        return response.sendStatus(404)
      } else if (!mission.live && !isLoggedIn(request)) {
        return response.sendStatus(401)
      } else {
        databaseLogger.info(`Mission with ID "${missionID}" retrieved.`)
        return response.json({ mission })
      }
    })
  }
})

// -- PUT | /api/v1/missions/ --
// This will update the mission.
router.put('/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let mission: any = body.mission

    if (typeof mission === 'object' && 'missionID' in mission) {
      let missionID: string = mission.missionID
      delete mission.missionID

      Mission.updateOne({ missionID }, mission, (error: any) => {
        if (error !== null) {
          databaseLogger.error(
            `Failed to update mission with the ID "${missionID}".`,
          )
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else {
          databaseLogger.info(`Updated mission with the ID "${missionID}".`)
          return response.sendStatus(200)
        }
      })
    } else {
      return response.sendStatus(400)
    }
  } else {
    return response.sendStatus(400)
  }
})

// -- PUT | /api/v1/missions/copy/ --
// This will copy a mission.
router.put('/copy/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('originalID' in body && 'copyName' in body) {
    let originalID: string = body.originalID
    let copyName: string = body.copyName

    Mission.findOne({ missionID: originalID }, (error: any, mission: any) => {
      if (error !== null) {
        databaseLogger.error(
          `Failed to copy mission with the original ID "${originalID}":`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else if (mission === null) {
        return response.sendStatus(404)
      } else {
        let copy = new Mission({
          name: copyName,
          versionNumber: mission.versionNumber,
          live: mission.live,
          initialResources: mission.initialResources,
          nodeStructure: mission.nodeStructure,
          nodeData: mission.nodeData,
        })

        copy.save((error: Error) => {
          if (error) {
            databaseLogger.error(
              `Failed to copy mission with the original ID "${originalID}":`,
            )
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else {
            databaseLogger.info(
              `Copied mission with the original ID "${originalID}".`,
            )
            return response.json({ copy })
          }
        })
      }
    })
  } else {
    return response.sendStatus(400)
  }
})

// -- DELETE | /api/v1/missions/ --
// This will delete a mission.
router.delete('/', requireLogin, (request, response) => {
  let query: any = request.query

  if ('missionID' in query) {
    let missionID: any = query.missionID

    if (typeof missionID === 'string') {
      Mission.deleteOne({ missionID }, (error: any) => {
        if (error !== null) {
          databaseLogger.error('Failed to delete mission:')
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else {
          databaseLogger.info(`Deleted mission with the ID "${missionID}".`)
          return response.sendStatus(200)
        }
      })
    } else {
      return response.sendStatus(400)
    }
  } else {
    return response.sendStatus(400)
  }
})

module.exports = router
