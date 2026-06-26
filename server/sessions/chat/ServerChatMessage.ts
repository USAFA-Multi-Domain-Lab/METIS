import type { TChatMessageJson } from '@shared/sessions/chat/ChatMessage'
import { ChatMessage } from '@shared/sessions/chat/ChatMessage'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { ServerSessionMember } from '../ServerSessionMember'
import type { SessionServer } from '../SessionServer'
import type { ServerChatChannel } from './ServerChatChannel'

/**
 * A chat message sent in a session channel, stored in memory on the server.
 */
export class ServerChatMessage extends ChatMessage<TMetisServerComponents> {
  /**
   * @param channel The channel this message was sent in.
   * @param data The JSON data from which to construct the message.
   */
  public constructor(channel: ServerChatChannel, data: TChatMessageJson) {
    super(channel, data)
  }

  /**
   * Generates a new chat message from a member's submission.
   * @param channel The channel the message is being sent in.
   * @param session The session the message belongs to.
   * @param member The member sending the message.
   * @param html The HTML content of the message.
   * @returns The generated `ServerChatMessage`.
   */
  public static generate(
    channel: ServerChatChannel,
    session: SessionServer,
    member: ServerSessionMember,
    html: string,
  ): ServerChatMessage {
    return new ServerChatMessage(channel, {
      _id: StringToolbox.generateRandomId(),
      channelId: channel._id,
      sessionId: session._id,
      senderId: member._id,
      senderUsername: member.username,
      senderForceId: member.assignedForceId,
      message: html,
      timestamp: Date.now(),
    })
  }
}
