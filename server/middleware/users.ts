import { Request, Response, NextFunction } from 'express-serve-static-core'
import MetisSession from '../sessions'
import UserPermission, { TUserPermissionID } from 'metis/users/permissions'

// interface ILoginOptions {
//   permittedRoles?: Array<TUserRole>
// }

// // middleware that requires the user to be logged in
// export const requireLogin =
//   (
//     options: ILoginOptions = {
//       permittedRoles: ['student', 'instructor', 'admin'],
//     },
//   ) =>
//   (request: Request, response: Response, next: NextFunction): void => {
//     let session: MetisSession | undefined = MetisSession.get(
//       request.session.userID,
//     )

//     if (
//       session !== undefined &&
//       options.permittedRoles !== undefined &&
//       options.permittedRoles.includes(session.user.role)
//     ) {
//       response.locals.session = session
//       response.locals.user = session.user
//       next()
//     } else {
//       response.sendStatus(401)
//     }
//   }

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

export const hasAuthorization =
  (requiredPermissions: TUserPermissionID[]) =>
  (request: Request, response: Response, next: NextFunction): void => {
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userID,
    )

    if (session) {
      let roleHasRequiredPermissions: boolean = false
      let userHasSpecificPermissions: boolean = false
      let { permissions: rolePermissions } = session.user.role
      let { expressPermissions } = session.user

      // Check if the user has the required
      // permissions.
      roleHasRequiredPermissions = UserPermission.hasPermissions(
        rolePermissions,
        requiredPermissions,
      )
      // Check to see if the user has been
      // given specific permissions that
      // override their role permissions.
      userHasSpecificPermissions = UserPermission.hasPermissions(
        expressPermissions,
        requiredPermissions,
      )

      if (roleHasRequiredPermissions || userHasSpecificPermissions) {
        response.locals.session = session
        response.locals.user = session?.user
        next()
      } else {
        response.sendStatus(401)
      }
    } else {
      response.sendStatus(401)
    }
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

/**
 * Validates the user in session and ensures they have the correct permissions to
 * create or update another user.
 */
export const validateUserRoles = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  // Current session
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )
  // User being created or updated
  let { user } = request.body

  // If the user is an instructor, they can only create students.
  if (session?.user.role.id === 'instructor' && user.role.id !== 'student') {
    response.sendStatus(403)
  }
  // If the user is an admin, they can only create instructors,
  // students, or admins.
  else if (
    session?.user.role.id === 'admin' &&
    user.role.id !== 'instructor' &&
    user.role.id !== 'student' &&
    user.role.id !== 'admin'
  ) {
    response.sendStatus(403)
  }
  // If the user is a student, they cannot create any users.
  else if (session?.user.role.id === 'student') {
    response.sendStatus(403)
  }
  // If the user is not logged in, then they do not have a
  // session and thus they are not authorized to create
  // or update any users.
  else if (session === undefined) {
    response.sendStatus(403)
  } else {
    next()
  }
}

export default {
  // requireLogin,
  hasAuthorization,
  validateUserRoles,
}
