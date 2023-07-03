import { Request, Response, NextFunction } from 'express-serve-static-core'
import { AnyObject } from './modules/toolbox/objects'

interface ILoginOptions {
  permittedRoles?: string[]
}

// This is the list of user roles.
export const userRoles: AnyObject = {
  Student: 'student',
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
  if (
    request.session.user !== undefined &&
    options.permittedRoles &&
    options.permittedRoles.includes(request.session.user.role)
  ) {
    next()
  } else {
    response.sendStatus(401)
  }
}

// This will return whether there is
// a user in the session.
export function hasPermittedRole(
  request: Request,
  options: ILoginOptions = {
    permittedRoles: [userRoles.Admin],
  },
): boolean {
  if (
    request.session.user !== undefined &&
    options.permittedRoles &&
    options.permittedRoles.includes(request.session.user.role)
  ) {
    return true
  } else {
    return false
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

export default {
  requireLogin,
  isLoggedIn: hasPermittedRole,
}
