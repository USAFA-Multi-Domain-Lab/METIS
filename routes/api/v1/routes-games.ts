import express, { Request, Response } from 'express'
import {
  hasPermittedRole,
  requireInGame,
  requireLogin,
  userRoles,
} from '../../../user'
import MissionModel from '../../../database/models/model-mission'
import { databaseLogger, expressLogger } from '../../../modules/logging'
import { Mission } from '../../../src/modules/missions'
import { Game } from '../../../src/modules/games'
import MetisSession from '../../../session/session'

const router = express.Router()

// -- POST | /api/v1/games/launch/ --
// This will create a new game for a user
// to execute a mission.
router.post(
  '/launch/',
  requireLogin,
  (request: Request, response: Response) => {
    // Get data from the request body.
    let missionID: string = request.body.missionID

    // Query for the mission with the given ID.
    MissionModel.findOne({ missionID }, (error: any, missionData: any) => {
      // Handles errors.
      if (error !== null) {
        databaseLogger.error(
          `Failed to retrieve mission with the ID "${missionID}".`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      }
      // Handle mission not found.
      else if (missionData === null) {
        return response.sendStatus(404)
      }
      // Handle mission not live.
      else if (!missionData.live) {
        response.statusMessage = 'Mission is not live.'
        return response.sendStatus(401)
      }
      // Handles successful query.
      else {
        MissionModel.findOne({ missionID })
          .lean()
          .exec((error: Error, missionData: any) => {
            if (error !== null) {
              databaseLogger.error(
                `Failed to retrieve mission with ID "${missionID}".`,
              )
              databaseLogger.error(error)
              return response.sendStatus(500)
            } else if (missionData === null) {
              return response.sendStatus(404)
            } else if (
              !missionData.live &&
              !hasPermittedRole(request, {
                permittedRoles: [userRoles.Instructor, userRoles.Admin],
              })
            ) {
              return response.sendStatus(401)
            }

            // Create a mission object from the
            // request data.
            let mission: Mission = Mission.fromJSON(missionData)

            try {
              // Launch the game.
              Game.launch(mission).then((game: Game) => {
                // Grab the session.
                let session: MetisSession | undefined = MetisSession.get(
                  request.session.sessionID,
                )

                // Verify the session was found.
                if (session === undefined) {
                  expressLogger.error(
                    `Session with sessionID "${request.session.sessionID}" not found.`,
                  )
                  return response.sendStatus(401)
                }

                // Have the user in the session join
                // the game.
                session.joinGame(game).then(() => {
                  return response.json(game.toJSON())
                })
              })
            } catch (error: any) {
              expressLogger.error('Failed to launch game.')
              expressLogger.error(error)
              return response.sendStatus(500)
            }
          })
      }
    })
  },
)

// -- POST | /api/v1/games/quit/ --
// This will quit a currently joined game.
router.post(
  '/quit/',
  requireLogin,
  requireInGame,
  (request: Request, response: Response) => {
    // Grab the session
    let session: MetisSession | undefined = MetisSession.get(
      request.session.sessionID,
    )

    // Verify the session was found.
    if (session === undefined) {
      expressLogger.error(
        `Session with sessionID "${request.session.sessionID}" not found.`,
      )
      return response.sendStatus(500)
    }

    // Verify the session has a game.
    if (session.game === undefined) {
      expressLogger.error(
        `Session with sessionID "${request.session.sessionID}" does not have a game.`,
      )
      return response.sendStatus(500)
    }

    // Grab the game.
    let game: Game = session.game

    // Quit the game.
    game.quit(session.user.userID).then(
      () => {
        if (session !== undefined) {
          session.quitGame()
        }
        return response.sendStatus(200)
      },
      (error: Error) => {
        console.error('Failed to quit game.')
        console.error(error)
        return response.sendStatus(500)
      },
    )
  },
)

module.exports = router
