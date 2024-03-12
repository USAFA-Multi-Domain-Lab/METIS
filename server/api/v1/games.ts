import { Request, Response } from 'express'
import expressWs from 'express-ws'
import { TGameBasicJson } from 'metis/games'
import { TCommonMissionJson } from 'metis/missions'
import MissionModel from 'metis/server/database/models/missions'
import GameServer from 'metis/server/games'
import { databaseLogger, gameLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import MetisSession from 'metis/server/sessions'
import { auth } from '../../middleware/users'

const routerMap = (router: expressWs.Router, done: () => void) => {
  // -- GET | /api/v1/games/ --
  // This will retrieve all publicly accessible games.
  router.get('/', auth({}), (request: Request, response: Response) => {
    let games: TGameBasicJson[] = GameServer.getAll().map((game) =>
      game.toBasicJson(),
    )
    return response.json(games)
  })

  // -- POST | /api/v1/games/launch/ --
  // This will create a new game for a user
  // to execute a mission.
  router.post('/launch/', auth({}), (request: Request, response: Response) => {
    // Get data from the request body.
    let missionID: string = request.body.missionID
    // Grab the session.
    let session: MetisSession = response.locals.session

    // Query for mission.
    MissionModel.findOne({ missionID })
      .lean()
      .exec(async (error: Error, missionData: TCommonMissionJson) => {
        // Handle errors.
        if (error !== null) {
          databaseLogger.error(
            `Failed to retrieve mission with ID "${missionID}".`,
          )
          databaseLogger.error(error)
          return response.sendStatus(500)
        }
        // Handle mission not found.
        else if (missionData === null) {
          return response.sendStatus(404)
        }
        // Handle mission not live.
        else if (
          !missionData.live &&
          !session?.user.isAuthorized(['READ', 'WRITE', 'DELETE'])
        ) {
          return response.sendStatus(401)
        }

        try {
          // Create mission.
          let mission: ServerMission = new ServerMission(missionData)
          // Launch the game.
          let game: GameServer = GameServer.launch(mission, {})
          // Return the ID of the newly launched game
          // as JSON.
          return response.json({ gameID: game.gameID })
        } catch (error: any) {
          gameLogger.error('Failed to launch game.')
          gameLogger.error(error)
          return response.sendStatus(500)
        }
      })
  })

  // -- DELETE | /api/v1/games/:gameID/ --
  // This will delete a game.
  router.delete(
    '/:gameID/',
    auth({}),
    (request: Request, response: Response) => {
      let gameID: string = request.params.gameID
      let game: GameServer | undefined = GameServer.get(gameID)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }

      // Destroy game and return response.
      game.destroy()
      return response.sendStatus(200)
    },
  )

  done()
}

export default routerMap
