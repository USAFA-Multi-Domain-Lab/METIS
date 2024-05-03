import { NextFunction, Request, Response } from 'express-serve-static-core'
import { TCommonUserJson } from 'metis/users'
import { TUserPermissionId } from 'metis/users/permissions'
import UserModel from '../database/models/users'
import GameServer from '../games'
import MetisSession from '../sessions'

/**
 * Middleware used to enforce authorization for a given route.
 * @param authentication The level of authentication required to access the route.
 * @param permissions The permissions required to access the route.
 */
export const auth =
  ({ authentication = 'session', permissions = [] }: TAuthOptions) =>
  (request: Request, response: Response, next: NextFunction): void => {
    // Gather details.
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userId,
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
    if (authentication === 'in-game' && !session.gameId) {
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
      response.locals.game = GameServer.get(session.gameId!)
    }

    // Call next middleware.
    next()
  }

/**
 * Middleware used to enforce that the user in session can only manage other users
 * if they have the correct permissions.
 */
export const restrictUserManagement = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  // Gather details.
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userId,
  )

  // If there is no session, return 401.
  if (!session) {
    response.sendStatus(401)
    return
  }

  // Grab the user and user ID from the request.
  let user: TCommonUserJson = request.body.user
  let userId: TCommonUserJson['_id'] = request.params._id ?? request.query._id

  // If the user and user ID are undefined, return 400.
  if (user === undefined && userId === undefined) {
    response.sendStatus(400)
    return
  }

  // If the user is defined...
  if (user !== undefined) {
    // ...and the user trying to create, or update, another user has the
    // highest level of authorization ("users_write") and the user being
    // created or updated has a role, call next middleware.
    if (session.user.isAuthorized('users_write') && user.roleId !== undefined) {
      // Call next middleware.
      return next()
    }
    // Or, if the user trying to create, or update, another user has the
    // the authorization to create, or update, students and the user being
    // created or updated is a student, call next middleware.
    else if (
      session.user.isAuthorized('users_write_students') &&
      user.roleId === 'student'
    ) {
      // Call next middleware.
      return next()
    }
    // Otherwise, return 403.
    else {
      response.sendStatus(403)
      return
    }
  }

  // If the user ID is defined...
  if (userId !== undefined) {
    // ...find the user.
    let user = await UserModel.findOne({ _id: userId })

    // If the user is not found, return 404.
    if (!user) {
      response.sendStatus(404)
      return
    }

    // If the user trying to delete another user has the highest level of
    // authorization ("users_write") and the user being deleted has a role,
    // call next middleware.
    if (session.user.isAuthorized('users_write') && user.roleId !== undefined) {
      // Call next middleware.
      return next()
    }
    // Or, if the user trying to delete another user has the authorization
    // to delete students and the user being deleted is a student, call next
    // middleware.
    else if (
      session.user.isAuthorized('users_write_students') &&
      user.roleId === 'student'
    ) {
      // Call next middleware.
      return next()
    }
    // Otherwise, return 403.
    else {
      response.sendStatus(403)
      return
    }
  }
}

/**
 * Middleware used to enforce that a user can only reset their own password.
 */
export const restrictPasswordReset = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  // Gather details.
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userId,
  )

  // If there is no session, return 401.
  if (!session) {
    response.sendStatus(401)
    return
  }

  // Grab the user ID from the request.
  let userId: TCommonUserJson['_id'] = request.body._id

  // If the user ID is undefined, return 400.
  if (userId === undefined) {
    response.sendStatus(400)
    return
  }
  // Otherwise, if the user ID is defined...
  else {
    // Call the next middleware if the user is trying to reset their own password.
    if (session.user._id === userId) {
      return next()
    }
    // Otherwise, return 403.
    else {
      response.sendStatus(403)
      return
    }
  }
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
  permissions?: TUserPermissionId[]
}

export default { auth, restrictUserManagement, restrictPasswordReset }
