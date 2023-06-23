import { Request, Response, NextFunction } from 'express-serve-static-core'

// middleware that requires the user to be logged in
export const requireLogin = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (request.session.userID !== undefined) {
    next()
  } else {
    response.sendStatus(401)
  }
}

// This will return whether there is
// a user in the session.
export function isLoggedInAsAdmin(request: Request): boolean {
  return request.session.userID === 'admin'
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
  isLoggedIn: isLoggedInAsAdmin,
}
