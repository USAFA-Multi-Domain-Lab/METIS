import { Request, Response } from 'express-serve-static-core'
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
  /* ---------------------------- CREATE ---------------------------- */

  /**
   * This will launch a game for a user to execute
   * a mission.
   * @returns The ID of the newly launched game in JSON format.
   */
  const launchGame = (request: Request, response: Response) => {
    // Get data from the request body.
    let missionId: string = request.body.missionId
    let gameConfig: TGameConfig = {
      accessibility: request.body.accessibility,
      autoAssign: request.body.autoAssign,
      infiniteResources: request.body.infiniteResources,
      effectsEnabled: request.body.effectsEnabled,
    }
    // Query for mission.
    MissionModel.findOne({ _id: missionId })
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
          return response.json({ gameId: game._id })
        } catch (error: any) {
          gameLogger.error('Failed to launch game.')
          gameLogger.error(error)
          return response.sendStatus(500)
        }
      })
  }

  /* ---------------------------- READ ------------------------------ */

  /**
   * This will retrieve all publicly accessible games.
   * @returns All publicly accessible games in JSON format.
   */
  const getGames = (request: Request, response: Response) => {
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
  }

  /* ---------------------------- UPDATE ---------------------------- */

  /**
   * This will start a game.
   * @returns HTTP status code.
   */
  const startGame = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let game: GameServer | undefined = GameServer.get(_id)

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
  }

  /**
   * This will update the configuration of a game.
   * @returns HTTP status code.
   */
  const updateGameConfig = (request: Request, response: Response) => {
    // Get data from the request body.
    let gameConfigUpdate: Partial<TGameConfig> = {
      accessibility: request.body.accessibility,
      autoAssign: request.body.autoAssign,
      infiniteResources: request.body.infiniteResources,
      effectsEnabled: request.body.effectsEnabled,
    }
    // Get game.
    let _id: string = request.params._id
    let game: GameServer | undefined = GameServer.get(_id)

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
  }

  /**
   * This will end a game.
   * @returns HTTP status code.
   */
  const endGame = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let game: GameServer | undefined = GameServer.get(_id)

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
  }

  /**
   * This will kick a participant from a game.
   * @returns HTTP status code.
   */
  const kickParticipant = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let participantId: string = request.params.participantId
    let game: GameServer | undefined = GameServer.get(_id)

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
  }

  /**
   * This will ban a participant from a game.
   * @returns HTTP status code.
   */
  const banParticipant = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let participantId: string = request.params.participantId
    let game: GameServer | undefined = GameServer.get(_id)

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
  }

  /* ---------------------------- DELETE ---------------------------- */

  /**
   * This will delete a game.
   * @returns HTTP status code.
   */
  const deleteGame = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let game: GameServer | undefined = GameServer.get(_id)

    // Send 404 if game could not be found.
    if (game === undefined) {
      return response.sendStatus(404)
    }

    // Destroy game and return response.
    game.destroy()
    return response.sendStatus(200)
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/games/ --
  router.get('/', auth({}), getGames)

  // -- POST | /api/v1/games/launch/ --
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
    launchGame,
  )

  // -- PUT | /api/v1/games/:_id/start/
  router.put('/:_id/start/', auth({ permissions: ['games_write'] }), startGame)

  // -- PUT | /api/v1/games/:_id/config/
  router.put(
    '/:_id/config/',
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
    updateGameConfig,
  )

  // -- PUT | /api/v1/games/:_id/end/
  router.put('/:_id/end/', auth({ permissions: ['games_write'] }), endGame)

  // -- PUT | /api/v1/games/:_id/kick/:participantId/ --
  router.put(
    '/:_id/kick/:participantId/',
    auth({ permissions: ['games_write'] }),
    kickParticipant,
  )

  // -- PUT | /api/v1/games/:_id/ban/:participantId/ --
  router.put(
    '/:_id/ban/:participantId/',
    auth({ permissions: ['games_write'] }),
    banParticipant,
  )

  // -- DELETE | /api/v1/games/:_id/ --
  router.delete('/:_id/', auth({ permissions: ['games_write'] }), deleteGame)

  done()
}

export default routerMap
