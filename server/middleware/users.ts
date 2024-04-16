import { NextFunction, Request, Response } from 'express-serve-static-core'
import { TUserPermissionID } from 'metis/users/permissions'
import GameServer from '../games'
import MetisSession from '../sessions'

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

export default auth
