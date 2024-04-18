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
import ServerUser from 'metis/server/users'
import { auth } from '../../middleware/users'

const routerMap = (router: expressWs.Router, done: () => void) => {
  // -- GET | /api/v1/games/ --
  // This will retrieve all publicly accessible games.
  router.get('/', auth({}), (request: Request, response: Response) => {
    // Define an array to store the games.
    let games: TGameBasicJson[] = []
    let user: ServerUser = response.locals.user
    let hasAccess: boolean = user.isAuthorized(['games_write'])

    // Loop through all games and add the public games
    // to the array.
    for (let game of GameServer.getAll()) {
      if (game.config.accessibility === 'public' || hasAccess) {
        games.push(
          game.toBasicJson({
            includeSensitiveData: user.isAuthorized(['games_write']),
          }),
        )
      }
    }

    // Return the response as JSON.
    return response.json(games)
  })

  // -- POST | /api/v1/games/launch/ --
  // This will create a new game for a user
  // to execute a mission.
  router.post(
    '/launch/',
    auth({ permissions: ['games_write', 'missions_read'] }),
    defineRequests(
      {
        body: {
          missionId: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          accessibility: RequestBodyFilters.STRING_LITERAL<
            TGameConfig['accessibility']
          >(['public', 'id-required', 'invite-only']),
          autoAssign: RequestBodyFilters.BOOLEAN,
          infiniteResources: RequestBodyFilters.BOOLEAN,
          effectsEnabled: RequestBodyFilters.BOOLEAN,
        },
      },
    ),
    (request: Request, response: Response) => {
      // Get data from the request body.
      let missionId: string = request.body.missionId
      let gameConfig: TGameConfig = {
        accessibility: request.body.accessibility,
        autoAssign: request.body.autoAssign,
        infiniteResources: request.body.infiniteResources,
        effectsEnabled: request.body.effectsEnabled,
      }
      // Query for mission.
      MissionModel.findOne({ missionId })
        .lean()
        .exec(async (error: Error, missionData: TCommonMissionJson) => {
          // Handle errors.
          if (error !== null) {
            databaseLogger.error(
              `Failed to retrieve mission with ID "${missionId}".`,
            )
            databaseLogger.error(error)
            return response.sendStatus(500)
          }
          // Handle mission not found.
          else if (missionData === null) {
            return response.sendStatus(404)
          }

          try {
            // Create mission.
            let mission: ServerMission = new ServerMission(missionData)
            // Launch the game.
            let game: GameServer = GameServer.launch(mission, gameConfig)
            // Return the ID of the newly launched game
            // as JSON.
            return response.json({ gameId: game.gameId })
          } catch (error: any) {
            gameLogger.error('Failed to launch game.')
            gameLogger.error(error)
            return response.sendStatus(500)
          }
        })
    },
  )

  // -- PUT | /api/v1/games/:gameId/start/
  // This will start a game.
  router.put(
    '/:gameId/start/',
    auth({ permissions: ['games_write'] }),
    (request: Request, response: Response) => {
      let gameId: string = request.params.gameId
      let game: GameServer | undefined = GameServer.get(gameId)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }
      // If the game state is not 'unstarted', return
      // 409 conflict.
      if (game.state !== 'unstarted') {
        return response.sendStatus(409)
      }

      // Start the game.
      game.state = 'started'

      // Return response.
      return response.sendStatus(200)
    },
  )

  // -- PUT | /api/v1/games/:gameId/config/
  // This will update the config of a game.
  router.put(
    '/:gameId/config/',
    auth({ permissions: ['games_write'] }),
    defineRequests(
      {},
      {
        body: {
          accessibility: RequestBodyFilters.STRING_LITERAL<
            TGameConfig['accessibility']
          >(['public', 'id-required', 'invite-only']),
          autoAssign: RequestBodyFilters.BOOLEAN,
          infiniteResources: RequestBodyFilters.BOOLEAN,
          effectsEnabled: RequestBodyFilters.BOOLEAN,
        },
      },
    ),
    (request: Request, response: Response) => {
      // Get data from the request body.
      let gameConfigUpdate: Partial<TGameConfig> = {
        accessibility: request.body.accessibility,
        autoAssign: request.body.autoAssign,
        infiniteResources: request.body.infiniteResources,
        effectsEnabled: request.body.effectsEnabled,
      }
      // Get game.
      let gameId: string = request.params.gameId
      let game: GameServer | undefined = GameServer.get(gameId)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }
      // If the game state is not 'unstarted', return
      // 409 conflict.
      if (game.state !== 'unstarted') {
        return response.sendStatus(409)
      }

      // Update game configuration.
      game.updateConfig(gameConfigUpdate)

      // Return response.
      return response.sendStatus(200)
    },
  )

  // -- PUT | /api/v1/games/:gameId/end/
  // This will end a game.
  router.put(
    '/:gameId/end/',
    auth({ permissions: ['games_write'] }),
    (request: Request, response: Response) => {
      let gameId: string = request.params.gameId
      let game: GameServer | undefined = GameServer.get(gameId)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }
      // If the game state is not 'started', return
      // 409 conflict.
      if (game.state !== 'started') {
        return response.sendStatus(409)
      }

      // End the game.
      game.state = 'ended'

      // For now, destroy the game until we have a
      // reason to keep ended games in memory.
      game.destroy()

      // Return response.
      return response.sendStatus(200)
    },
  )

  // -- PUT | /api/v1/games/:gameId/kick/:participantId/ --
  // This will kick a participant from a game.
  router.put(
    '/:gameId/kick/:participantId/',
    auth({ permissions: ['games_write'] }),
    (request: Request, response: Response) => {
      let gameId: string = request.params.gameId
      let participantId: string = request.params.participantId
      let game: GameServer | undefined = GameServer.get(gameId)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }

      try {
        // Kick participant.
        game.kick(participantId)
        // Return response.
        return response.sendStatus(200)
      } catch (code: any) {
        // If the participant could not be kicked, return
        // the error code.
        return response.sendStatus(code)
      }
    },
  )

  // -- PUT | /api/v1/games/:gameId/ban/:participantId/ --
  // This will ban a participant from a game.
  router.put(
    '/:gameId/ban/:participantId/',
    auth({ permissions: ['games_write'] }),
    (request: Request, response: Response) => {
      let gameId: string = request.params.gameId
      let participantId: string = request.params.participantId
      let game: GameServer | undefined = GameServer.get(gameId)

      // Send 404 if game could not be found.
      if (game === undefined) {
        return response.sendStatus(404)
      }

      try {
        // Ban participant.
        game.ban(participantId)
        // Return response.
        return response.sendStatus(200)
      } catch (code: any) {
        // If the participant could not be banned, return
        // the error code.
        return response.sendStatus(code)
      }
    },
  )

  // -- DELETE | /api/v1/games/:gameId/ --
  // This will delete a game.
  router.delete(
    '/:gameId/',
    auth({ permissions: ['games_write'] }),
    (request: Request, response: Response) => {
      let gameId: string = request.params.gameId
      let game: GameServer | undefined = GameServer.get(gameId)

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
