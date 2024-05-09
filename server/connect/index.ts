import { Request } from 'express'
import expressWs from 'express-ws'
import { ServerEmittedError } from 'metis/connect/errors'
import ClientConnection from 'metis/server/connect/clients'
import { TMetisRouterMap } from 'metis/server/http/router'
import MetisSession from 'metis/server/sessions'
import { WebSocket } from 'ws'
import { server } from '..'
import GameServer from '../games'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  /* ---------------------------- CONSTANTS --------------------------------- */

  // Track the number of messages per second.
  const messagesPerSecond: Map<MetisSession['userId'], number> = new Map()
  // Track which users have exceeded the message rate limit.
  const messageRateLimitExceeded: Map<MetisSession['userId'], boolean> =
    new Map()
  // Track the time of the last message.
  const messageTimestamps: Map<MetisSession['userId'], number> = new Map()
  // Track when the user has exceeded the message rate limit.
  const messageRateLimitExceededTimestamps: Map<
    MetisSession['userId'],
    number
  > = new Map()
  // Set the maximum number of messages per second.
  const maxMessagesPerSecond = server.wsRateLimit
  // Set the message rate limit cooldown.
  const messageRateLimitCooldown = 15000 /*ms*/

  /* ---------------------------- CONNECTIONS ---------------------------- */

  /**
   * Establishes a web socket connection used for user and game session
   * syncing between the server and the client.
   * @param socket The web socket connection.
   * @param request The request that initiated the connection.
   */
  const establishSocketConnection = (socket: WebSocket, request: Request) => {
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

    // Set the message rate limit.
    socket.on('message', () => {
      // If no session between the client and the
      // server exists, close the connection.
      if (session === undefined) {
        return socket.close()
      }

      // Track the number of messages per second.
      let count: number = messagesPerSecond.get(session.userId) ?? 0
      messagesPerSecond.set(session.userId, count + 1)

      // Check if the user has exceeded the message rate limit.
      let hasExceededRateLimit: boolean =
        messageRateLimitExceeded.get(session.userId) ?? false
      messageRateLimitExceeded.set(session.userId, hasExceededRateLimit)

      // Track the time of the last message.
      let lastMessageTimestamp: number =
        messageTimestamps.get(session.userId) ?? 0
      messageTimestamps.set(session.userId, Date.now())

      // Track the time of the message rate limit exceedance.
      let messageRateLimitExceededTimestamp: number =
        messageRateLimitExceededTimestamps.get(session.userId) ?? 0
      messageRateLimitExceededTimestamps.set(
        session.userId,
        messageRateLimitExceededTimestamp,
      )

      // If the user has not sent a message in the last
      // second and has not exceeded the message rate limit,
      // reset the counter.
      if (Date.now() - lastMessageTimestamp > 1000 && !hasExceededRateLimit) {
        messagesPerSecond.set(session.userId, 0)
      }

      // If the message counter exceeds the max amount,
      // send an error message and don't reset until the
      // cooldown period has passed.
      if (count > maxMessagesPerSecond && !hasExceededRateLimit) {
        // Set the user as having exceeded the message rate limit.
        messageRateLimitExceeded.set(session.userId, true)

        // Track the time of the message rate limit exceedance.
        messageRateLimitExceededTimestamps.set(session.userId, Date.now())

        // Send an error to the client.
        let error = JSON.stringify({
          method: 'error',
          code: ServerEmittedError.CODE_MESSAGE_RATE_LIMIT,
          message: 'Message rate limit exceeded. Please try again later.',
        })
        socket.send(error)
      }
      // Or, if the user has exceeded the message rate limit,
      // send an error message.
      else if (hasExceededRateLimit) {
        // Send an error to the client.
        let error = JSON.stringify({
          method: 'error',
          code: ServerEmittedError.CODE_MESSAGE_RATE_LIMIT,
          message: 'Message rate limit exceeded. Please try again later.',
        })
        socket.send(error)

        // Reset the messages per second counter
        // and the message rate limit after the cooldown period.
        if (
          Date.now() - messageRateLimitExceededTimestamp >
          messageRateLimitCooldown
        ) {
          messagesPerSecond.set(session.userId, 0)
          messageRateLimitExceeded.set(session.userId, false)
        }
      }
    })
  }

  /* ---------------------------- ROUTES --------------------------------- */

  // -- WEB SOCKET CONNECTION --
  router.ws('/', establishSocketConnection)

  done()
}

export default routerMap
