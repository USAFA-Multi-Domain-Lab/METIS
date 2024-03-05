import { Request, Response } from 'express'
import expressWs from 'express-ws'
import { TMissionJson } from 'metis/missions'
import ClientConnection from 'metis/server/connect/clients'
import MissionModel from 'metis/server/database/models/missions'
import GameServer from 'metis/server/games'
import { databaseLogger, gameLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import MetisSession from 'metis/server/sessions'
import {
  authorized,
  requireConnection,
  requireInGame,
} from '../../middleware/users'

const routerMap = (router: expressWs.Router, done: () => void) => {
  // -- GET | /api/v1/games/ --
  // Returns the current game data for the game
  // in the session.
  router.get('/', requireConnection, (request, response) => {
    // Get the client and the session.
    let client: ClientConnection = response.locals.client
    let session: MetisSession = response.locals.session

    // If the session is not in a game, forbidden.
    if (session.gameID === null) {
      return response.sendStatus(403)
    }

    // Get the game.
    let game: GameServer | undefined = GameServer.get(session.gameID)

    // If undefined, return server error.
    if (game === undefined) {
      return response.sendStatus(500)
    }

    // Return the game as JSON.
    return response.json(game.toJson())
  })

  // -- POST | /api/v1/games/launch/ --
  // This will create a new game for a user
  // to execute a mission.
  router.post(
    '/launch/',
    authorized([]),
    (request: Request, response: Response) => {
      // Get data from the request body.
      let missionID: string = request.body.missionID
      // Grab the session.
      let session: MetisSession = response.locals.session

      // Query for mission.
      MissionModel.findOne({ missionID })
        .lean()
        .exec(async (error: Error, missionData: TMissionJson) => {
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
            let game: GameServer = GameServer.launch(mission)
            // Return the ID of the newly launched game
            // as JSON.
            return response.json({ gameID: game.gameID })
          } catch (error: any) {
            gameLogger.error('Failed to launch game.')
            gameLogger.error(error)
            return response.sendStatus(500)
          }
        })
    },
  )

  // -- PUT | /api/v1/games/join/ --
  // This will join an existing game.
  router.put('/join/', requireConnection, (request, response) => {
    // Get data from the request body.
    let { gameID } = request.body

    // Get the client connection.
    let client: ClientConnection = response.locals.client

    // Get the game.
    let game: GameServer | undefined = GameServer.get(gameID)

    // If undefined, return not found.
    if (game === undefined) {
      return response.sendStatus(404)
    }

    // Join the game.
    game.join(client)

    // Return the game as JSON.
    return response.json(game.toJson())
  })

  // // -- POST | /api/v1/games/quit/ --
  // // This will quit a currently joined game.
  router.delete(
    '/quit/',
    requireInGame,
    (request: Request, response: Response) => {
      // Grab the session, user, and game.
      let session: MetisSession = response.locals.session
      let game: GameServer = response.locals.game

      // Quit the game.
      game.quit(session.userID)

      // Return 200
      return response.sendStatus(200)
    },
  )

  done()
}

export default routerMap
