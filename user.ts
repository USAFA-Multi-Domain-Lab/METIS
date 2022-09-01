import { NextFunction } from 'express'
import { Request, Response } from 'express-serve-static-core'

// middleware that requires the user to be logged in
export const requireLogin = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (request.session.userID !== undefined) {
    next()
  } else {
    response.status(401)
    response.sendStatus(response.statusCode)
  }
}

// middleware that requires the user to be logged in
export const requireAdminLogin = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (
    request.session.userID !== undefined &&
    request.session.type !== undefined &&
    request.session.type === 'state-admin'
  ) {
    next()
  } else {
    response.status(401)
    response.sendStatus(response.statusCode)
  }
}
