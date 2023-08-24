import { Request, Response, NextFunction } from 'express-serve-static-core'
import { AnyObject } from './modules/toolbox/objects'
import MetisSession from './session/session'

interface ILoginOptions {
  permittedRoles?: string[]
}

// This is the list of user roles.
export const userRoles: AnyObject = {
  Student: 'student',
  Instructor: 'instructor',
  Admin: 'admin',
}

// middleware that requires the user to be logged in
export const requireLogin = (
  request: Request,
  response: Response,
  next: NextFunction,
  options: ILoginOptions = {
    permittedRoles: [userRoles.Admin],
  },
): void => {
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
//
// /**
//  * Express middleware requiring that the user in the session to be joined into a game.
//  * @param {Request} request An express request object.
//  * @param {Response} response An express response object.
//  * @param next {NextFunction} An express next function.
//  */
// export const requireInGame = (
//   request: Request,
//   response: Response,
//   next: NextFunction,
// ): void => {
//   let session: MetisSession | undefined = MetisSession.get(
//     request.session.userID,
//   )
//
//   if (
//     session !== undefined &&
//     session.game !== undefined &&
//     session.game.isJoined(session.user)
//   ) {
//     response.locals.session = session
//     response.locals.user = session.user
//     response.locals.game = session.game
//     next()
//   } else {
//     response.sendStatus(403)
//   }
// }

// This will return whether there is
// a user in the session.
export function hasPermittedRole(
  request: Request,
  options: ILoginOptions = {
    permittedRoles: [userRoles.Admin],
  },
): boolean {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  return (
    session !== undefined &&
    options.permittedRoles !== undefined &&
    options.permittedRoles.includes(session.user.role)
  )
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
  isLoggedIn: hasPermittedRole,
}
