import { ServerEmittedError } from 'metis/connect/errors'
import { TMetisWsMiddleware } from '.'
import ServerLogin from '../logins'

/**
 * Middleware that authenticates the user attempting
 * to connect to the WS server.
 */
const authMiddleware: TMetisWsMiddleware = (metis, socket, next) => {
  const { 'disconnect-existing': disconnectExisting } = socket.request.headers
  let { session } = socket.request
  let result: ServerEmittedError | undefined
  let login = ServerLogin.get(session.userId)

  // If the user has a login registered,
  // set the result to an error.
  if (!login) {
    result = new ServerEmittedError(ServerEmittedError.CODE_UNAUTHENTICATED)
  }
  // If the login information already contains a client,
  // and the 'disconnect-existing' header is not included,
  // set the result to an error.
  else if (login.client !== null && !disconnectExisting) {
    result = new ServerEmittedError(ServerEmittedError.CODE_DUPLICATE_CLIENT)
  }

  // Pass the result to the next middleware.
  next(result)
}

export default authMiddleware
