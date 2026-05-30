import { MetisComponent, type TMetisBaseComponents } from '../../MetisComponent'
import type { TMember } from '../members/SessionMember'
import type { ChatChannel } from './ChatChannel'

/**
 * A chat message sent within a session channel.
 */
export abstract class ChatMessage<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The channel this message was sent in.
   */
  public readonly channel: ChatChannel<T>

  /**
   * The ID of the channel this message belongs to.
   */
  public readonly channelId: string

  /**
   * The ID of the session this message belongs to.
   */
  public readonly sessionId: string

  /**
   * The ID of the member who sent the message.
   */
  public readonly senderId: string

  /**
   * The session member who sent this message, or `null` if they have left the session.
   */
  public get sender(): TMember<T> | null {
    return (
      this.channel.session.members.find((m) => m._id === this.senderId) ?? null
    )
  }

  /**
   * The username of the member who sent the message.
   */
  public readonly senderUsername: string

  /**
   * The force ID of the member who sent the message, if assigned.
   */
  public readonly senderForceId: string | null

  /**
   * The HTML content of the message.
   */
  public readonly message: string

  /**
   * Unix timestamp (ms) at which the message was created.
   */
  public readonly timestamp: number

  /**
   * The timestamp formatted as HH:MM.
   */
  public get timestampFormatted(): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(this.timestamp)
  }

  /**
   * @param channel The channel this message was sent in.
   * @param data The JSON data from which to construct the message.
   */
  public constructor(channel: ChatChannel<T>, data: TChatMessageJson) {
    super(data._id, data.senderUsername, false)

    this.channel = channel
    this.channelId = data.channelId
    this.sessionId = data.sessionId
    this.senderId = data.senderId
    this.senderUsername = data.senderUsername
    this.senderForceId = data.senderForceId
    this.message = data.message
    this.timestamp = data.timestamp
  }

  /**
   * Converts the message to its JSON representation.
   * @returns The JSON representation of the message.
   */
  public toJson(): TChatMessageJson {
    return {
      _id: this._id,
      channelId: this.channelId,
      sessionId: this.sessionId,
      senderId: this.senderId,
      senderUsername: this.senderUsername,
      senderForceId: this.senderForceId,
      message: this.message,
      timestamp: this.timestamp,
    }
  }

  /**
   * The maximum number of characters allowed in a chat message (measured
   * against the serialised HTML string, which is what the server validates).
   */
  public static readonly MAX_CHARS = 2000
}

/**
 * JSON representation of a chat message sent in a session channel.
 */
export type TChatMessageJson = {
  /**
   * The unique ID of the message.
   */
  _id: string
  /**
   * The ID of the channel this message belongs to.
   */
  channelId: string
  /**
   * The ID of the session this message belongs to.
   */
  sessionId: string
  /**
   * The ID of the member who sent the message.
   */
  senderId: string
  /**
   * The username of the member who sent the message.
   */
  senderUsername: string
  /**
   * The force ID of the member who sent the message, if assigned.
   */
  senderForceId: string | null
  /**
   * The HTML content of the message.
   */
  message: string
  /**
   * Unix timestamp (ms) at which the message was created.
   */
  timestamp: number
}
