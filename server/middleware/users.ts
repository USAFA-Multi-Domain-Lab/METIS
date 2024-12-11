import { NextFunction, Request, Response } from 'express-serve-static-core'
import { TCommonUserJson } from 'metis/users'
import { TUserPermissionId } from 'metis/users/permissions'
import UserModel from '../database/models/users'
import ServerLogin from '../logins'
import SessionServer from '../sessions'

/**
 * Middleware used to enforce authorization for a given route.
 * @param authentication The level of authentication required to access the route, default is 'login'.
 * @param permissions The permissions required to access the route, default is an empty array.
 */
export const auth =
  ({ authentication = 'login', permissions = [] }: TAuthOptions) =>
  (request: Request, response: Response, next: NextFunction): void => {
    // Gather details.
    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    // If no login information is returned, return 401.
    if (!login) {
      response.sendStatus(401)
      return
    }
    // If a ws connection is required and none is
    // established, then return 401.
    if (authentication === 'ws-connection' && !login.hasClientConnection) {
      response.sendStatus(401)
      return
    }
    // If the being in session is required and the user
    // is not in a session, return 401.
    if (authentication === 'in-session' && !login.sessionId) {
      response.sendStatus(401)
      return
    }

    // If user doesn't pass authorization requirements, return 403.
    if (!login.user.isAuthorized(permissions)) {
      response.sendStatus(403)
      return
    }

    // Store the login and the user in the
    // response locals.
    response.locals.login = login
    response.locals.user = login.user

    // If authentication is 'ws-connection',
    // store the client in the response locals.
    if (authentication === 'ws-connection') {
      response.locals.client = login.client
    }
    // If authentication is 'in-session', store the session
    // in the response locals.
    if (authentication === 'in-session') {
      response.locals.session = SessionServer.get(login.sessionId!)
    }

    // Call next middleware.
    next()
  }

/**
 * Middleware used to enforce that the logged in user can only manage other users
 * if they have the correct permissions.
 */
export const restrictUserManagement = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  // Gather details.
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

  // If no login information is found, return 401.
  if (!login) {
    response.sendStatus(401)
    return
  }

  // Grab the user and user ID from the request.
  let user: TCommonUserJson = request.body
  let userId: TCommonUserJson['_id'] = request.params._id ?? request.query._id
  // Check if the user is defined.
  let userIsDefined: boolean = Object.keys(user).length > 0

  // If the user and user ID are undefined, return 400.
  if (userIsDefined === false && userId === undefined) {
    response.sendStatus(400)
    return
  }

  // If the user is defined...
  if (userIsDefined) {
    // ...and the user trying to create, or update, another user has the
    // highest level of authorization ("users_write") and the user being
    // created or updated has an access level, call next middleware.
    if (login.user.isAuthorized('users_write') && user.accessId !== undefined) {
      // Call next middleware.
      return next()
    }
    // Or, if the user trying to create, or update, another user has the
    // the authorization to create, or update, students and the user being
    // created or updated is a student, call next middleware.
    else if (
      login.user.isAuthorized('users_write_students') &&
      user.accessId === 'student'
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
    let userDoc = await UserModel.findById(userId).exec()

    // If the user is not found, return 404.
    if (!userDoc) {
      response.sendStatus(404)
      return
    }

    // If the user trying to delete another user has the highest level of
    // authorization ("users_write") and the user being deleted has an
    // access level, call next middleware.
    if (
      login.user.isAuthorized('users_write') &&
      userDoc.accessId !== undefined
    ) {
      // Call next middleware.
      return next()
    }
    // Or, if the user trying to delete another user has the authorization
    // to delete students and the user being deleted is a student, call next
    // middleware.
    else if (
      login.user.isAuthorized('users_write_students') &&
      userDoc.accessId === 'student'
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
  let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

  // If no login information is found, return 401.
  if (!login) {
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
    if (login.user._id === userId) {
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
 * Options for a route that requires authentication.
 */
export type TAuthOptions = {
  /**
   * The level of authentication required to access the route.
   * @default 'login'
   */
  authentication?: 'login' | 'ws-connection' | 'in-session'
  /**
   * The permissions required to access the route.
   * @default []
   */
  permissions?: TUserPermissionId[]
}

export default { auth, restrictUserManagement, restrictPasswordReset }
