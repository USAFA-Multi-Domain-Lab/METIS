import { Request, Response } from 'express'
import expressWs from 'express-ws'
import { TGameBasicJson, TGameConfig } from 'metis/games'
import { TCommonMissionJson } from 'metis/missions'
import MissionModel from 'metis/server/database/models/missions'
import GameServer from 'metis/server/games'
import { databaseLogger, gameLogger } from 'metis/server/logging'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
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
  router.post(
    '/launch/',
    auth({ permissions: ['WRITE'] }),
    defineRequests(
      {
        body: {
          missionID: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          accessibility: RequestBodyFilters.STRING_LITERAL<
            NonNullable<TGameConfig['accessibility']>
          >(['public', 'id-required', 'invite-only']),
          autoAssign: RequestBodyFilters.BOOLEAN,
          infiniteResources: RequestBodyFilters.BOOLEAN,
          effectsEnabled: RequestBodyFilters.BOOLEAN,
        },
      },
    ),
    (request: Request, response: Response) => {
      // Get data from the request body.
      let missionID: string = request.body.missionID
      let gameConfig: TGameConfig = {
        accessibility: request.body.accessibility,
        autoAssign: request.body.autoAssign,
        infiniteResources: request.body.infiniteResources,
        effectsEnabled: request.body.effectsEnabled,
      }
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
            let game: GameServer = GameServer.launch(mission, gameConfig)
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

  // -- PUT | /api/v1/games/:gameID/start/
  // This will start a game.
  router.put(
    '/:gameID/start/',
    auth({ permissions: ['WRITE'] }),
    (request: Request, response: Response) => {
      let gameID: string = request.params.gameID
      let game: GameServer | undefined = GameServer.get(gameID)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }
      // If the game state is not 'unstarted', return
      // 409 conflict.
      if (game.state !== 'unstarted') {
        return response.sendStatus(409)
      }

      // Start the game and return response.
      game.state = 'started'
      return response.sendStatus(200)
    },
  )

  // -- PUT | /api/v1/games/:gameID/end/
  // This will end a game.
  router.put(
    '/:gameID/end/',
    auth({ permissions: ['WRITE'] }),
    (request: Request, response: Response) => {
      let gameID: string = request.params.gameID
      let game: GameServer | undefined = GameServer.get(gameID)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }
      // If the game state is not 'started', return
      // 409 conflict.
      if (game.state !== 'started') {
        return response.sendStatus(409)
      }

      // End the game and return response.
      game.state = 'ended'
      return response.sendStatus(200)
    },
  )

  // -- DELETE | /api/v1/games/:gameID/ --
  // This will delete a game.
  router.delete(
    '/:gameID/',
    auth({ permissions: ['WRITE'] }),
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
