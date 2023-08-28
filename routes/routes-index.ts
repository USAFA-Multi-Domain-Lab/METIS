import express, { Request } from 'express'
import { WebSocket } from 'ws'
import MetisSession from '../session/session'
import ClientConnection from '../src/modules/connect/client-connect'

// Create router.
const router = express.Router()

// Route for establishing a web socket connection
// used for user and game session syncing between
// the server and the client.
router.ws('/connect', (socket: WebSocket, request: Request) => {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  // If no session between the client and the
  // server exists, close the connection.
  if (session === undefined) {
    return socket.close()
  }

  // Parse disconnectExisting query.
  let disconnectExisting: boolean = request.query.disconnectExisting === 'true'

  // Create a client connection object
  // with the socket and session.
  let client = new ClientConnection(socket, session, { disconnectExisting })
})

// Export router.
module.exports = router
