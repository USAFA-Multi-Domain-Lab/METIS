import express, { Request, Response } from 'express'
import { WebSocket } from 'ws'
import { expressLogger } from '../modules/logging'
import MetisSession from '../session/session'
import ClientConnection from '../modules/client-connect'

// Create router.
const router = express.Router()

// Route for establishing a web socket connection
// used for user and game session syncing between
// the server and the client.
router.ws('/connect', (socket: WebSocket, request: Request) => {
  let session: MetisSession | undefined = MetisSession.get(
    request.session.sessionID,
  )

  // If no session between the client and the
  // server exists, close the connection.
  if (session === undefined) {
    return socket.close()
  }

  // Create a client connection object
  // with the socket and session.
  let client: ClientConnection = new ClientConnection(socket, session)

  //   /**
  //    * Serializes and sends a JSON object to the client.
  //    * @param {any} data The JSON object to send.
  //    */
  //   function send(data: any) {
  //     client.send(JSON.stringify(data))
  //   }
  //
  //   // Echo a message back to the requester.
  //   client.on('message', (message: string) => {
  //     try {
  //       let json = JSON.parse(message)
  //
  //       console.log(json)
  //     } catch (error: any) {
  //       expressLogger.error('Error parsing JSON message from client:')
  //       expressLogger.error(error)
  //     }
  //   })
  //
  //   // Notify of close.
  //   client.on('close', () => {
  //     console.log('Client disconnected.')
  //   })
})

// Export router.
module.exports = router
