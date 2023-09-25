import { Request, Response, NextFunction } from 'express-serve-static-core'
import MetisSession from '../sessions'
import { TUserRole } from 'metis/users'
import GameServer from '../games'

interface ILoginOptions {
  permittedRoles?: Array<TUserRole>
}

// middleware that requires the user to be logged in
export const requireLogin =
  (
    options: ILoginOptions = {
      permittedRoles: ['student', 'instructor', 'admin'],
    },
  ) =>
  (request: Request, response: Response, next: NextFunction): void => {
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userID,
    )

    if (
      session !== undefined &&
      options.permittedRoles !== undefined &&
      options.permittedRoles.includes(session.user.role)
    ) {
      response.locals.session = session
      response.locals.user = session.user
      next()
    } else {
      response.sendStatus(401)
    }
  }

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

// This will return whether there is
// a user in the session.
export function hasPermittedRole(
  request: Request,
  permittedRoles: Array<TUserRole>,
): boolean {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  return session !== undefined && permittedRoles.includes(session.user.role)
}

// middleware that requires the user to be logged in
// export const requireAdminLogin = (
//   request: Request,
//   response: Response,
//   next: NextFunction,
// ): void => {
//   if (
//     request.session.userID !== undefined &&
//     request.session.type !== undefined &&
//     request.session.type === 'state-admin'
//   ) {
//     next()
//   } else {
//     response.status(401)
//     response.sendStatus(response.statusCode)
//   }
// }

export default {
  requireLogin,
  hasPermittedRole,
}
