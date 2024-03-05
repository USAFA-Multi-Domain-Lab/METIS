import { NextFunction, Request, Response } from 'express-serve-static-core'
import { TUserPermissionID } from 'metis/users/permissions'
import GameServer from '../games'
import MetisSession from '../sessions'

/**
 * Express middleware requiring that the user in the session be connected to the web socket server.
 * @note This does everything requireLogin does in the process, as being logged in is a prerequisite to having a connection.
 * @note `response.locals` is populated with `session` and `client`.
 * @param {Request} request An express request object.
 * @param {Response} response An express response object.
 * @param next {NextFunction} An express next function.
 */
export const requireConnection = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  if (session !== undefined && session.hasClientConnection) {
    response.locals.session = session
    response.locals.client = session.client
    next()
  } else {
    response.sendStatus(403)
  }
}

/**
 * Express middleware requiring that the user in the session to be joined into a game.
 * @note This does everything requireConnection does in the process, as having a connection is a
 * prerequisite to joining a game.
 * @note response.locals is populated with `session`, `client`, and `game`.
 * @param {Request} request An express request object.
 * @param {Response} response An express response object.
 * @param next {NextFunction} An express next function.
 */
export const requireInGame = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  if (session !== undefined && session.gameID !== null) {
    // Get the game.
    let game = GameServer.get(session.gameID)

    // If the game is not found, throw a server
    // error.
    if (game === undefined) {
      response.sendStatus(500)
    }

    // Update locals.
    response.locals.session = session
    response.locals.user = session.user
    response.locals.game = game
    next()
  } else {
    response.sendStatus(403)
  }
}

/**
 * Middleware used to enforce authorization for a given route.
 * @param options The options for requiring authorization for a route.
 */
export const auth =
  ({ authentication = 'session', permissions = [] }: TAuthOptions) =>
  (request: Request, response: Response, next: NextFunction): void => {
    // Gather details.
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userID,
    )

    // If there is no session, return 401.
    if (!session) {
      response.sendStatus(401)
      return
    }
    // If a ws connection is required and none is
    // established, then return 401.
    if (authentication === 'ws-connection' && !session.hasClientConnection) {
      response.sendStatus(401)
      return
    }
    // If the being in game is required and the user
    // is not in a game, return 401.
    if (authentication === 'in-game' && !session.gameID) {
      response.sendStatus(401)
      return
    }

    // If user doesn't pass authorization requirements, return 403.
    if (!session.user.isAuthorized(permissions)) {
      response.sendStatus(403)
      return
    }

    // Store the session and the user in the
    // response locals.
    response.locals.session = session
    response.locals.user = session.user

    // If authentication is 'ws-connection',
    // store the client in the response locals.
    if (authentication === 'ws-connection') {
      response.locals.client = session.client
    }
    // If authentication is 'in-game', store the game
    // in the response locals.
    if (authentication === 'in-game') {
      response.locals.game = GameServer.get(session.gameID!)
    }

    // Call next middleware.
    next()
  }

/**
 * Options for requiring authorization for a route with a session required.
 */
export type TAuthOptions = {
  /**
   * The level of authentication required to access the route.
   * @default 'session'
   */
  authentication?: 'session' | 'ws-connection' | 'in-game'
  /**
   * The permissions required to access the route.
   * @default []
   */
  permissions?: TUserPermissionID[]
}

export default {
  authorized: auth,
}
