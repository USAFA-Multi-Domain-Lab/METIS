import { ServerEmittedError } from 'metis/connect/errors'
import { TMetisWsMiddleware } from '..'
import ClientConnection from '../clients'

/**
 * Middleware that authenticates the user attempting
 * to connect to the WS server.
 */
const rateLimitMiddleware: TMetisWsMiddleware = (metis, socket, next) => {
  // Track the number of messages per second.
  const messagesPerSecond: Map<string, number> = new Map()
  // Track which users have exceeded the message rate limit.
  const messageRateLimitExceeded: Map<string, boolean> = new Map()
  // Track the time of the last message.
  const messageTimestamps: Map<string, number> = new Map()
  // Track when the user has exceeded the message rate limit.
  const messageRateLimitExceededTimestamps: Map<string, number> = new Map()
  // Set the maximum number of messages per second.
  const maxMessagesPerSecond = metis.wsRateLimit
  // Set the message rate limit cooldown.
  const messageRateLimitCooldown = 15000 /*ms*/

  // Set the message rate limit.
  socket.on('message', () => {
    let userId = socket.request.session.userId

    // If there is no user ID, throw an error,
    // disconnect, and return.
    if (!userId) {
      ClientConnection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_UNAUTHENTICATED),
        socket,
      )
      return socket.disconnect()
    }

    // Track the number of messages per second.
    let count: number = messagesPerSecond.get(userId) ?? 0
    messagesPerSecond.set(userId, count + 1)

    // Check if the user has exceeded the message rate limit.
    let hasExceededRateLimit: boolean =
      messageRateLimitExceeded.get(userId) ?? false
    messageRateLimitExceeded.set(userId, hasExceededRateLimit)

    // Track the time of the last message.
    let lastMessageTimestamp: number = messageTimestamps.get(userId) ?? 0
    messageTimestamps.set(userId, Date.now())

    // Track the time of the message rate limit exceedance.
    let messageRateLimitExceededTimestamp: number =
      messageRateLimitExceededTimestamps.get(userId) ?? 0
    messageRateLimitExceededTimestamps.set(
      userId,
      messageRateLimitExceededTimestamp,
    )

    // If the user has not sent a message in the last
    // second and has not exceeded the message rate limit,
    // reset the counter.
    if (Date.now() - lastMessageTimestamp > 1000 && !hasExceededRateLimit) {
      messagesPerSecond.set(userId, 0)
    }

    // If the message counter exceeds the max amount,
    // send an error message and don't reset until the
    // cooldown period has passed.
    if (count > maxMessagesPerSecond && !hasExceededRateLimit) {
      // Set the user as having exceeded the message rate limit.
      messageRateLimitExceeded.set(userId, true)

      // Track the time of the message rate limit exceedance.
      messageRateLimitExceededTimestamps.set(userId, Date.now())

      // Send an error to the client.
      ClientConnection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MESSAGE_RATE_LIMIT),
        socket,
      )
    }
    // Or, if the user has exceeded the message rate limit,
    // send an error message.
    else if (hasExceededRateLimit) {
      // Send an error to the client.
      ClientConnection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MESSAGE_RATE_LIMIT),
        socket,
      )

      // Reset the messages per second counter
      // and the message rate limit after the cooldown period.
      if (
        Date.now() - messageRateLimitExceededTimestamp >
        messageRateLimitCooldown
      ) {
        messagesPerSecond.set(userId, 0)
        messageRateLimitExceeded.set(userId, false)
      }
    }
  })

  next()
}

export default rateLimitMiddleware
