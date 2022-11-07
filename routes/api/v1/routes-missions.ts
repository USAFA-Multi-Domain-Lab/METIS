//npm imports
import express from 'express'
import Mission from '../../../database/models/model-mission'

//fields
const router = express.Router()

// -- POST | /api/v1/missions/ --

// This will create a new mission.
router.post('/', (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let mission: any = body.mission

    if (typeof mission === 'object' && 'name' in body) {
      let name: any = body.name

      new Mission({
        name,
        nodeStructure: {},
        nodeData: [],
      })
    } else {
      return response.sendStatus(400)
    }
  } else {
    return response.sendStatus(400)
  }
})

// -- GET | /api/v1/missions/ --
// This will return all of the missions.
router.get('/', (request, response) => {
  let idValue = request.query.missionID

  if (idValue === undefined) {
    Mission.find({})
      .select('-nodeStructure -nodeData')
      .exec((error: Error, missions: any) => {
        if (error !== null || missions === null) {
          console.error(error)
          return response.sendStatus(500)
        } else {
          return response.json({ missions })
        }
      })
  } else {
    Mission.findOne({ missionID: idValue }).exec(
      (error: Error, mission: any) => {
        console.log(mission)

        if (error !== null) {
          console.error(error)
          return response.sendStatus(500)
        } else if (mission === null) {
          return response.sendStatus(404)
        } else {
          return response.json({ mission })
        }
      },
    )
  }
})

// -- PUT | /api/v1/missions/ --
// This will update the mission.
router.put('/', (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let mission: any = body.mission

    if (typeof mission === 'object' && 'missionID' in mission) {
      let missionID: string = mission.missionID
      delete mission.missionID

      Mission.updateOne({ missionID }, mission, (error: any) => {
        if (error !== null) {
          return response.sendStatus(500)
        } else {
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

// -- DELETE | /api/v1/missions/ --
// This will delete a mission.
router.delete('/', (request, response) => {
  let body: any = request.body

  if ('missionID' in body) {
    let missionID: any = body.missionID

    if (typeof missionID === 'string') {
      Mission.deleteOne({ missionID }, (error: any) => {
        if (error !== null) {
          return response.sendStatus(500)
        } else {
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
