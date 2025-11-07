import type { TUserJson } from '@shared/users/User'
import type { TUserPermissionId } from '@shared/users/UserPermission'
import type { NextFunction, Request, Response } from 'express-serve-static-core'
import { UserModel } from '../database/models/users'
import { ServerLogin } from '../logins/ServerLogin'
import type { ServerSessionMember } from '../sessions/ServerSessionMember'
import { SessionServer } from '../sessions/SessionServer'

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
    let session: SessionServer | undefined = SessionServer.get(
      login?.metisSessionId,
    )
    let sessionMember: ServerSessionMember | undefined =
      session?.getMemberByUserId(login?.userId)

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
    if (authentication === 'in-session' && (!session || !sessionMember)) {
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
      response.locals.session = session
      response.locals.sessionMember = sessionMember
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
  let operation = request.method.toLowerCase()

  // If no login information is found, return 401.
  if (!login) {
    response.sendStatus(401)
    return
  }

  // Helper function to check user authorization
  const checkUserAuth = (userAccessId: string | undefined): boolean => {
    let adminAuth: TUserPermissionId = 'users_write'
    let studentAuth: TUserPermissionId = 'users_write_students'

    if (operation === 'get') {
      adminAuth = 'users_read'
      studentAuth = 'users_read_students'
    }

    if (login!.user.isAuthorized(adminAuth) && userAccessId !== undefined) {
      return true
    }

    if (login!.user.isAuthorized(studentAuth) && userAccessId === 'student') {
      return true
    }

    return false
  }

  // Handle request body (could be single user or array of users)
  let users: TUserJson[] = Array.isArray(request.body)
    ? request.body
    : [request.body]
  let userIds: string[] = []

  // Collect user IDs from params, query, or request body
  if (request.params._id) userIds.push(request.params._id)
  if (request.query._id) userIds.push(request.query._id as string)

  // Extract IDs from users in body if they exist
  users.forEach((user) => {
    if (user._id) userIds.push(user._id)
  })

  // Filter out undefined/empty users
  users = users.filter((user) => user && Object.keys(user).length > 0)

  // If no users or user IDs are provided, return 400
  if (users.length === 0 && userIds.length === 0) {
    response.sendStatus(400)
    return
  }

  // Check authorization for users in request body
  for (const user of users) {
    if (!checkUserAuth(user.accessId)) {
      response.sendStatus(403)
      return
    }
  }

  // Check authorization for users identified by ID
  for (const userId of userIds) {
    const userDoc = await UserModel.findById(userId).exec()

    if (!userDoc) {
      response.sendStatus(404)
      return
    }

    if (!checkUserAuth(userDoc.accessId)) {
      response.sendStatus(403)
      return
    }
  }

  // All checks passed, call next middleware
  return next()
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
  const login = ServerLogin.get(request.session.userId)

  // If no login information is found, return 401.
  if (!login || !login.user || !login.userId) {
    response.sendStatus(401)
    return
  }

  return next()
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
