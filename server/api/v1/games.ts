import { Request, Response } from 'express'
import expressWs from 'express-ws'
import { authorized, requireConnection } from '../../middleware/users'
import MissionModel from 'metis/server/database/models/missions'
import { databaseLogger, gameLogger } from 'metis/server/logging'
import GameServer from 'metis/server/games'
import ClientConnection from 'metis/server/connect/clients'
import { IMissionJson } from 'metis/missions'
import ServerMission from 'metis/server/missions'
import MetisSession from 'metis/server/sessions'

const routerMap = (router: expressWs.Router, done: () => void) => {
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
        .exec(async (error: Error, missionData: IMissionJson) => {
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
            let gameID = await GameServer.launch(mission)
            return response.json({ gameID })
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

    // Get the session.
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
  // router.post(
  //   '/quit/',
  //   requireLogin,
  //   requireInGame,
  //   (request: Request, response: Response) => {
  //     // Grab the session, user, and game.
  //     let session: MetisSession = response.locals.session
  //     let user: User = response.locals.user
  //     let game: Game = response.locals.game
  //
  //     // Quit the game.
  //     game.quit(user.userID).then(
  //       () => {
  //         session.quitGame()
  //         return response.sendStatus(200)
  //       },
  //       (error: AxiosError) => {
  //         gameLogger.error('Failed to quit game.')
  //         gameLogger.error(error)
  //         return response.sendStatus(
  //           error.status !== undefined ? error.status : 500,
  //         )
  //       },
  //     )
  //   },
  // )
  //
  // // -- POST | /api/v1/games/open/ --
  // // This will open a node, revealing the
  // // child nodes.
  // router.post(
  //   '/open/',
  //   requireLogin,
  //   requireInGame,
  //   (request: Request, response: Response) => {
  //     // Grab the game and nodeID from the
  //     // request.
  //     let game: Game = response.locals.game
  //     let nodeID: string = request.body.nodeID
  //
  //     // Open the node.
  //     game.open(nodeID).then(
  //       () => response.sendStatus(200),
  //       (error: AxiosError) => {
  //         gameLogger.error('Failed to open node.')
  //         gameLogger.error(error)
  //         return response.sendStatus(
  //           error.status !== undefined ? error.status : 500,
  //         )
  //       },
  //     )
  //   },
  // )
  //
  // // -- POST | /api/v1/games/execute/ --
  // // This will execute an action on a node.
  // router.post(
  //   '/execute/',
  //   requireLogin,
  //   requireInGame,
  //   (request: Request, response: Response) => {
  //     // Grab the game and actionID from
  //     // the request.
  //     let game: Game = response.locals.game
  //     let actionID: string = request.body.actionID
  //
  //     // Execute the action.
  //     game.execute(actionID).then(
  //       () => response.sendStatus(200),
  //       (error: AxiosError) => {
  //         gameLogger.error('Failed to execute action.')
  //         gameLogger.error(error)
  //         return response.sendStatus(
  //           error.status !== undefined ? error.status : 500,
  //         )
  //       },
  //     )
  //   },
  // )

  done()
}

export default routerMap
