import { Request } from 'express'
import expressWs from 'express-ws'
import ClientConnection from 'metis/server/connect/clients'
import { TMetisRouterMap } from 'metis/server/http/router'
import MetisSession from 'metis/server/sessions'
import { WebSocket } from 'ws'
import GameServer from '../games'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  // Route for establishing a web socket connection
  // used for user and game session syncing between
  // the server and the client.
  router.ws('/', (socket: WebSocket, request: Request) => {
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userId,
    )

    // If no session between the client and the
    // server exists, close the connection.
    if (session === undefined) {
      return socket.close()
    }

    // Parse disconnectExisting query.
    let disconnectExisting: boolean =
      request.query.disconnectExisting === 'true'

    // Create a client connection object
    // with the socket and session.
    let connection = new ClientConnection(socket, session, {
      disconnectExisting,
    })

    // If the session indicates that the user is
    // currently in a game, find the game and update
    // the connection for that participant.
    if (session.gameId !== null) {
      // Get the game.
      let game = GameServer.get(session.gameId)

      // If the game exists, update the connection.
      if (game !== undefined) {
        game.handleConnectionChange(connection)
      }
    }
  })

  done()
}

export default routerMap
